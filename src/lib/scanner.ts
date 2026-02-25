import { execSync } from 'child_process';
import fs from 'fs';
import { scanDirectory, Finding } from './regexScanner';
import { parseGitleaks } from './parser';
import { generateAIResponse } from './ai/geminiClient';
import { FINDING_PROMPT_TEMPLATE, SYSTEM_PROMPT } from './ai/prompts';
import { parseAIResponse } from './ai/parser';
import { getCacheKey, loadCache, saveToCache } from './ai/cache';
import { runLogicScanner } from "./logicScanner";
import { runSemgrep } from "./semgrepRunner";

export async function runScan(targetDir: string): Promise<{ findings: Finding[], scannerUsed: string }> {
    const findings: Finding[] = [];
    const scannersUsed: string[] = [];

    let gitleaksAvailable = false;
    try {
        execSync('gitleaks version', { stdio: 'ignore' });
        gitleaksAvailable = true;
    } catch (e) {
        gitleaksAvailable = false;
    }

    if (gitleaksAvailable) {
        const reportPath = `${targetDir}/gitleaks-report.json`;
        try {
            // Run gitleaks detect. --exit-code 0 ensures it doesn't throw even if findings are found.
            execSync(`gitleaks detect --source ${targetDir} --report-format json --report-path ${reportPath} --no-git --exit-code 0`, { stdio: 'inherit' });
            if (fs.existsSync(reportPath)) {
                const gitleaksFindings = parseGitleaks(fs.readFileSync(reportPath, 'utf-8'));
                findings.push(...gitleaksFindings);
                scannersUsed.push('Gitleaks');
            }
        } catch (e) {
            console.error('Gitleaks execution failed:', e);
        }
    }

    // Always run internal scanners for logic and specific patterns
    // Fallback to internal regex scanner if Gitleaks didn't run or as a supplement
    const regexFindings = scanDirectory(targetDir, targetDir);
    const logicFindings = runLogicScanner(targetDir);
    const semgrepFindings = runSemgrep(targetDir);

    findings.push(...regexFindings, ...logicFindings, ...semgrepFindings);
    scannersUsed.push('VibeGuard (Regex + Logic + Semgrep)');

    return {
        findings,
        scannerUsed: scannersUsed.join(' + ')
    };
}


export async function enrichFindingsWithAI(findings: Finding[]): Promise<Finding[]> {
    const cache = loadCache();
    const limitedFindings = findings.slice(0, 10); // Limit to top 10 for performance

    // Process findings through AI remediation sequentially to avoid rate limits
    const enriched: Finding[] = [];
    for (const finding of limitedFindings) {
        const cacheKey = getCacheKey(finding.file, finding.snippet);

        if (cache[cacheKey] && process.env.DEMO_MODE === 'true') {
            console.log(`Using cached AI remediation for ${finding.file}`);
            enriched.push({ ...finding, ...cache[cacheKey] });
            continue;
        }

        try {
            // Standardize path for prompt
            const displayFile = finding.file.split('/repo/').pop() || finding.file;

            const prompt = FINDING_PROMPT_TEMPLATE
                .replace('{{file}}', displayFile)
                .replace('{{line}}', finding.line.toString())
                .replace('{{ruleId}}', finding.ruleId)
                .replace('{{snippet}}', finding.snippet);

            const aiText = await generateAIResponse(prompt, SYSTEM_PROMPT);
            const aiData = parseAIResponse(aiText);

            if (aiData) {
                saveToCache(cacheKey, aiData);
                enriched.push({ ...finding, ...aiData });
                continue;
            }
        } catch (error) {
            console.error(`AI enrichment failed for ${finding.file}:`, error);
        }

        enriched.push(finding); // Fallback to original finding if AI fails
    }

    return enriched;
}
