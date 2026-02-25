export interface AIRemediation {
    explanation: string;
    fixSteps: string;
    secureCode: string;
    confidence: number;
}

export function parseAIResponse(text: string): any {
    try {
        // Attempt to extract JSON if the response is wrapped in backticks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Failed to parse AI response:", text);
        return null;
    }
}
