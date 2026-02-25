# VibeGuard Prototype

VibeGuard is a minimal, ultra-fast security scanner that identifies secrets (API keys, tokens, passwords) in your GitHub repositories or ZIP uploads. It runs entirely locally on your machine, ensuring your code never leaves your environment.

## Features
- **AI Remediation**: Powered by Gemini Pro, providing explanations, fix steps, and secure code.
- **URL & ZIP Support**: Input any public GitHub URL or upload a ZIP file.
- **Dual Pipeline**: Uses `Gitleaks` as primary scanner with a high-speed `Node.js Regex` fallback.
- **Risk Scoring & AI Summary**: Weighted risk score + Gemini-powered executive summary.
- **Interactive Dashboard**: Modern UI with real-time feedback and remediation hints.
- **Privacy First**: All scans run locally; ephemeral directories are deleted immediately.

## Quick Start (macOS, Linux, Windows)

### Prerequisites
- Node.js (v18+)
- Git
- (Optional) [Gitleaks](https://github.com/gitleaks/gitleaks) for enhanced scanning.

### Installation & Run

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Open the Dashboard**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Demo Mode**
   The prototype includes `DEMO_MODE=true` in `.env.local` which prefers cached AI responses for instant demonstration.

## Demo Script
Refer to [DEMO_SCRIPT_AI.md](./DEMO_SCRIPT_AI.md) for the AI-powered presentation script.

## Fallback Plan
If you encounter network or environment issues:
- View the pre-generated report: [http://localhost:3000/demo-fallback.html](http://localhost:3000/demo-fallback.html)
- Load sample JSON: `public/sample-report.json`

## Safety Disclaimer
This is a prototype. Always verify findings manually. Scanned data is stored in `tmp/` and wiped after each session.
