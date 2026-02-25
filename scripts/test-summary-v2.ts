import { generateSummary } from "../src/lib/ai/geminiClient";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testSummary() {
    const findings: any[] = [
        { file: "index.js", ruleId: "hardcoded-api-key", severity: "HIGH" },
        { file: "server.js", ruleId: "insecure-auth", severity: "MEDIUM" }
    ];

    try {
        console.log("Testing AI Summary (90s timeout)...");
        const start = Date.now();
        const response = await generateSummary("vibeguard-test", findings);
        console.log(`✅ Summary Response (${Date.now() - start}ms):`, response);
    } catch (e: any) {
        console.error("❌ Summary Failed:", e.message);
    }
}

testSummary();
