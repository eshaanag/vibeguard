import { NextRequest, NextResponse } from "next/server";
import { generateSecureRewrite } from "@/lib/ai/codeRewrite";

export async function POST(req: NextRequest) {
    try {
        const finding = await req.json();
        if (!finding) {
            return NextResponse.json({ error: "Missing finding data" }, { status: 400 });
        }

        const rewriteResult = await generateSecureRewrite(finding);
        return NextResponse.json(rewriteResult);
    } catch (error: any) {
        console.error("Rewrite API error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
