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
            model: "gemini-3.1-pro-preview",
            systemInstruction: systemPrompt
        });

        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 45000)
            )
        ]) as any;

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

    try {
        const response = await generateAIResponse(prompt, SYSTEM_PROMPT);
        return response;
    } catch (error) {
        console.error("Summary generation failed:", error);
        return 'Failed to generate AI summary.';
    }
}
