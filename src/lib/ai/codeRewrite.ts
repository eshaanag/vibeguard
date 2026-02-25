import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Initialized inside functions to ensure process.env is ready

const CACHE_FILE = path.join(process.cwd(), 'tmp', 'rewrite-cache.json');

function loadRewriteCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveToRewriteCache(key: string, data: any) {
    const cache = loadRewriteCache();
    cache[key] = data;
    if (!fs.existsSync(path.dirname(CACHE_FILE))) {
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function generateSecureRewrite(finding: any) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
        const err = "GEMINI_API_KEY is not defined in environment variables.";
        fs.appendFileSync(path.join(process.cwd(), 'tmp', 'gemini-errors.log'), `[${new Date().toISOString()}] ${err}\n`);
        return fallbackRewrite(finding);
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    const cacheKey = `${finding.file}:${finding.line}:${finding.snippet}`;
    const cache = loadRewriteCache();

    if (cache[cacheKey] && process.env.DEMO_MODE === 'true') {
        return cache[cacheKey];
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-3.1-pro-preview",
    });

    const prompt = `
You are a senior secure software engineer.
Provide a direct, point-wise solution to fix this security vulnerability.

Vulnerable Code Snippet:
${finding.snippet}

Rule Violated:
${finding.ruleId}

Requirements:
- Provide point-wise suggestions on how to fix it.
- Give a direct solution.
- Use bullet points (no paragraphs).
- Be concise and technical.
- If applicable, include the secure version of the code in the points.

Return your response in exactly this format:

SOLUTION:
- [Point 1]
- [Point 2]
- etc.
`;

    try {
        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 45000)
            )
        ]) as any;

        const responseText = result.response.text();

        // Simple parsing
        const solutionMatch = responseText.match(/SOLUTION:\s*([\s\S]*)/);

        const data = {
            secureRewrite: "", // Keeping this empty as we move to point-wise solutions
            rewriteExplanation: solutionMatch ? solutionMatch[1].trim() : "Failed to generate solution points."
        };

        saveToRewriteCache(cacheKey, data);
        return data;

    } catch (error: any) {
        const errorLog = `[${new Date().toISOString()}] Solution generation failed: ${error.message}\nStack: ${error.stack}\n`;
        fs.appendFileSync(path.join(process.cwd(), 'tmp', 'gemini-errors.log'), errorLog);
        console.error("Solution generation failed:", error);
        return fallbackRewrite(finding);
    }
}

function fallbackRewrite(finding: any) {
    if (finding.ruleId.includes("api-key") || finding.snippet.includes("KEY")) {
        return {
            secureRewrite: "",
            rewriteExplanation: "- Remove the hardcoded API key from the source code.\n- Store the key in an environment variable or a secure secret manager.\n- Reference the key using process.env.API_KEY.\n- Add .env to your .gitignore to prevent accidental commits."
        };
    }

    return {
        secureRewrite: "",
        rewriteExplanation: "- Conduct a manual security review of this code segment.\n- Follow the fix hints provided in the vulnerability report.\n- Consult internal security guidelines for safe handling of this resource."
    };
}
