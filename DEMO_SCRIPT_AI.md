# VibeGuard AI Demo Script (3-5 Minutes)

## 0:00 - Introduction
"We previously showed you VibeGuard: the fast, local security scanner. But detection is only half the battle. Today, we're unveiling **VibeGuard AI**—autonomous remediation powered by Gemini."

## 0:45 - The Highlight (AI Summary)
"Look at this. Beyond just listing files, we now provide an **Executive Risk Summary**. Using Gemini, we analyze the *context* of the leaks across the entire repo to give security teams a high-level verdict instantly."

## 1:30 - Deep Dive (AI Remediation)
"Let's look at this AWS leak. Traditional scanners give you a generic hint. VibeGuard AI gives you a full breakdown:
- **Plain-English Explanation**: Why is this actually a risk?
- **Actionable Fix Steps**: Exact numbered instructions to rotate and secure.
- **Secure Implementation**: A drop-in code example showing how to use environment variables correctly."

## 2:15 - Efficiency (Caching & Demo Mode)
"Security shouldn't be slow. We've implemented a local caching layer. This means if we've seen this snippet before, the remediation is instant. For this demo, we're running in `DEMO_MODE`, showcasing how fast an AI-augmented workflow can be."

## 3:00 - Privacy & Closing
"Crucially, we only send the *finding metadata* to Gemini—never your entire source code. Your secrets stay private; your security gets smarter. VibeGuard AI: Detect, Explain, Remediate. Questions?"

---

# AI Cheat Sheet (New Questions)

**1. Does Gemini see my whole codebase?**
"No. We only send the specific line and snippet containing the leak to Gemini. This keeps the performance high and protects the rest of your intellectual property."

**2. How do you handle hallucination?**
"We use a highly structured system prompt to force Gemini into a strict JSON schema. We also include a 'Confidence Score' for each remediation. If the confidence is too low or the AI fails, we gracefully fall back to our hardcoded security hints."

**3. What happens if the API is down?**
"The system is built to fail-safe. If the Gemini API call exceeds 10 seconds or fails, the 'AI Power' section simply doesn't appear, and the user still gets the standard VibeGuard scan results. Our demo fallback also has pre-generated AI responses ready."
