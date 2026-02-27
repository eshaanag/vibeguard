import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { Finding } from "../regexScanner";
import { SUMMARY_PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompts";

// Initialized inside functions

export async function generateAIResponse(prompt: string, systemPrompt: string = "") {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
        const err = "GEMINI_API_KEY is not defined in environment variables.";
        fs.appendFileSync(path.join(process.cwd(), 'tmp', 'gemini-errors.log'), `[${new Date().toISOString()}] ${err}\n`);
        throw new Error(err);
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: systemPrompt
        });

        const logFile = path.join(process.cwd(), 'tmp', 'gemini-errors.log');
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] Starting Gemini request (${model.model.split('/').pop()})...\n`);

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 90000)
            )
        ]) as any;

        fs.appendFileSync(logFile, `[${new Date().toISOString()}] Gemini request completed.\n`);

        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error: any) {
        const errorLog = `[${new Date().toISOString()}] Gemini API error: ${error.message}\nStack: ${error.stack}\n`;
        fs.appendFileSync(path.join(process.cwd(), 'tmp', 'gemini-errors.log'), errorLog);
        console.error("Gemini API error:", error);
        throw error;
    }
}

export async function generateSummary(repoName: string, findings: Finding[]) {
    const findingsList = findings.map(f => `- ${f.file}: ${f.ruleId} (${f.severity})`).join('\n');
    const prompt = SUMMARY_PROMPT_TEMPLATE
        .replace('{{repoName}}', repoName)
        .replace('{{findingsList}}', findingsList);

    const summarySystemPrompt = "You are a senior security researcher. Provide a short executive summary of vulnerability findings in JSON format with a single key 'summary'. Be extremely concise.";

    try {
        const response = await generateAIResponse(prompt, summarySystemPrompt);
        return response;
    } catch (error) {
        console.error("Summary generation failed:", error);
        return 'Failed to generate AI summary.';
    }
}
