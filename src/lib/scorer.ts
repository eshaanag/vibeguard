import { Finding } from './regexScanner';

export function calculateRiskScore(findings: Finding[]) {
    const highCount = findings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
    const lowCount = findings.filter(f => f.severity === 'LOW').length;

    const score = Math.min(100, 70 * highCount + 30 * mediumCount + 5 * lowCount);

    let label = 'LOW';
    let color = 'text-green-500';

    if (score >= 70) {
        label = 'CRITICAL';
        color = 'text-red-600';
    } else if (score >= 40) {
        label = 'HIGH';
        color = 'text-red-500';
    } else if (score >= 20) {
        label = 'MEDIUM';
        color = 'text-orange-500';
    }

    return {
        score,
        label,
        color,
        summary: {
            high: highCount,
            medium: mediumCount,
            low: lowCount
        }
    };
}
