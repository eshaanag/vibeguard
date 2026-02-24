import { execSync } from 'child_process';
import fs from 'fs';
import { scanDirectory, Finding } from './regexScanner';
import { parseGitleaks } from './parser';

export async function runScan(targetDir: string): Promise<{ findings: Finding[], scannerUsed: string }> {
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
                const findings = parseGitleaks(fs.readFileSync(reportPath, 'utf-8'));
                return { findings, scannerUsed: 'Gitleaks' };
            }
        } catch (e) {
            console.error('Gitleaks execution failed, falling back to regex scanner:', e);
        }
    }

    // Fallback to internal regex scanner
    const findings = scanDirectory(targetDir, targetDir);
    return { findings, scannerUsed: 'VibeGuard Regex (Fallback)' };
}
