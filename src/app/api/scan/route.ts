import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { runScan, enrichFindingsWithAI } from '@/lib/scanner';
import { calculateRiskScore } from '@/lib/scorer';
import { generateSummary } from '@/lib/ai/geminiClient';
import { parseAIResponse } from '@/lib/ai/parser';

export async function POST(req: NextRequest) {
    const scanId = uuidv4();
    const tmpDir = path.join(process.cwd(), 'tmp', scanId);
    const repoDir = path.join(tmpDir, 'repo');

    try {
        // Ensure tmp directory exists
        if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'tmp'));
        }
        fs.mkdirSync(tmpDir);

        const formData = await req.formData();
        const repoUrl = formData.get('repoUrl') as string;
        const zipFile = formData.get('file') as File;

        let repoName = 'unknown-repo';

        if (repoUrl) {
            console.log(`Cloning ${repoUrl}...`);
            execSync(`git clone --depth 1 ${repoUrl} ${repoDir}`, { stdio: 'inherit' });
            repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
        } else if (zipFile) {
            console.log(`Extracting ZIP file...`);
            const buffer = Buffer.from(await zipFile.arrayBuffer());
            const zip = new AdmZip(buffer);
            fs.mkdirSync(repoDir);
            zip.extractAllTo(repoDir, true);
            repoName = zipFile.name.replace('.zip', '');
        } else {
            return NextResponse.json({ error: 'Missing repoUrl or file upload' }, { status: 400 });
        }

        // Run the scan
        const { findings, scannerUsed } = await runScan(repoDir);
        const riskData = calculateRiskScore(findings);

        // Enrich with AI Remediation
        const enrichedFindings = await enrichFindingsWithAI(findings);

        // Generate AI Executive Summary
        const aiSummaryRaw = await generateSummary(repoName, enrichedFindings);
        const aiSummaryParsed = parseAIResponse(aiSummaryRaw);
        const aiSummary = aiSummaryParsed?.summary || aiSummaryRaw;

        return NextResponse.json({
            repoName,
            scanId,
            scannerUsed,
            ...riskData,
            findings: enrichedFindings,
            logicFindingsCount: enrichedFindings.filter(f => f.ruleId.includes('-') || f.ruleId === 'plaintext-password').length,
            aiSummary,
            scannedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    } finally {
        // Cleanup: Remove tmp directory after scan
        try {
            if (fs.existsSync(tmpDir)) {
                fs.rmSync(tmpDir, { recursive: true, force: true });
                console.log(`Cleaned up ${tmpDir}`);
            }
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }
    }
}
