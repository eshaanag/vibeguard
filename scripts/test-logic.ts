import { runScan } from "../src/lib/scanner";
import * as path from "path";

async function testLogicScan() {
    const targetDir = path.join(process.cwd(), "test-repo");
    console.log(`Running scan on: ${targetDir}`);

    try {
        const { findings, scannerUsed } = await runScan(targetDir);
        console.log(`Scanner Used: ${scannerUsed}`);
        console.log(`Total Findings: ${findings.length}`);

        const logicFindings = findings.filter(f => f.ruleId.includes('-') || f.ruleId === 'plaintext-password');
        console.log(`Logic Findings (${logicFindings.length}):`);
        logicFindings.forEach(f => {
            console.log(`- [${f.severity}] ${f.ruleId} in ${f.file}`);
            console.log(`  Snippet: ${f.snippet}`);
        });
    } catch (e) {
        console.error("Scan failed:", e);
    }
}

testLogicScan();
