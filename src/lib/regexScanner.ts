import fs from 'fs';
import path from 'path';

export interface Finding {
    file: string;
    line: number;
    snippet: string;
    ruleId: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    fixHint: string;
}

const PATTERNS = [
    {
        ruleId: 'generic-secret',
        regex: /(api[_-]?key|secret|password|passwd|token)\s*[:=]\s*["']?([\w-]{8,})["']?/gi,
        severity: 'HIGH' as const,
        fixHint: 'Do not hardcode secrets. Use environment variables or a secret manager.'
    },
    {
        ruleId: 'private-key',
        regex: /-----BEGIN (RSA|EC|PGP|OPENSSH) PRIVATE KEY-----/g,
        severity: 'HIGH' as const,
        fixHint: 'Remove private keys from the codebase immediately.'
    },
    {
        ruleId: 'aws-access-key',
        regex: /AKIA[0-9A-Z]{16}/g,
        severity: 'HIGH' as const,
        fixHint: 'Inactivate this AWS Access Key and rotate your credentials.'
    },
    {
        ruleId: 'github-pat',
        regex: /ghp_[a-zA-Z0-9]{36}/g,
        severity: 'HIGH' as const,
        fixHint: 'Revoke this GitHub Personal Access Token and generate a new one.'
    },
    {
        ruleId: 'slack-webhook',
        regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Z0-9]+/g,
        severity: 'MEDIUM' as const,
        fixHint: 'Revoke this Slack webhook and use a more secure integration method.'
    }
];

export function scanDirectory(dir: string, baseDir: string): Finding[] {
    const findings: Finding[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativePath = path.relative(baseDir, fullPath);

        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== '.git' && file !== 'node_modules') {
                findings.push(...scanDirectory(fullPath, baseDir));
            }
            continue;
        }

        // Skip binary files or large files for the demo's sake
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const lineContent = lines[i];
            for (const pattern of PATTERNS) {
                // Reset regex lastIndex because of 'g' flag
                pattern.regex.lastIndex = 0;
                let match;
                while ((match = pattern.regex.exec(lineContent)) !== null) {
                    findings.push({
                        file: relativePath,
                        line: i + 1,
                        snippet: lineContent.trim().substring(0, 100),
                        ruleId: pattern.ruleId,
                        severity: pattern.severity,
                        fixHint: pattern.fixHint
                    });
                }
            }
        }
    }

    return findings;
}
