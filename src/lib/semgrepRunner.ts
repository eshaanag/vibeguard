import { execSync } from "child_process"
import path from "path"
import fs from "fs"

export function runSemgrep(targetDir: string) {
    try {
        const configPath = path.join(process.cwd(), 'src/lib/security-rules/semgrep.yml');

        // Check if semgrep is installed
        try {
            execSync('semgrep --version', { stdio: 'ignore' });
        } catch (e) {
            console.warn("Semgrep not found. Skipping AST-based logic scan.");
            return [];
        }

        const output = execSync(
            `semgrep --config ${configPath} ${targetDir} --json`,
            { encoding: 'utf8' }
        )

        const result = JSON.parse(output);
        return result.results.map((r: any) => ({
            file: r.path,
            ruleId: r.check_id,
            severity: r.extra.severity === 'ERROR' ? 'HIGH' : 'MEDIUM',
            snippet: r.extra.lines,
            line: r.start.line
        }));
    } catch (error) {
        console.error("Semgrep execution failed:", error);
        return [];
    }
}
