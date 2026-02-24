import { Finding } from './regexScanner';

export function parseGitleaks(jsonOutput: string): Finding[] {
    try {
        const rawFindings = JSON.parse(jsonOutput);
        return rawFindings.map((f: any) => ({
            file: f.File,
            line: f.StartLine,
            snippet: f.Match.trim().substring(0, 100),
            ruleId: f.RuleID,
            severity: mapSeverity(f.RuleID),
            fixHint: getFixHint(f.RuleID)
        }));
    } catch (e) {
        console.error('Error parsing gitleaks output:', e);
        return [];
    }
}

function mapSeverity(ruleId: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const high = ['private-key', 'aws', 'password', 'passwd', 'token'];
    const medium = ['slack', 'webhook', 'api-key'];

    const lowerId = ruleId.toLowerCase();
    if (high.some(h => lowerId.includes(h))) return 'HIGH';
    if (medium.some(m => lowerId.includes(m))) return 'MEDIUM';
    return 'LOW';
}

function getFixHint(ruleId: string): string {
    if (ruleId.includes('private-key')) return 'Remove private keys and rotate credentials.';
    if (ruleId.includes('aws')) return 'Revoke AWS keys and use IAM roles.';
    if (ruleId.includes('password')) return 'Remove hardcoded passwords and use a secret manager.';
    return 'Review this finding and move it to a secure environment variable.';
}
