# VibeGuard Prototype

VibeGuard is a minimal, ultra-fast security scanner that identifies secrets (API keys, tokens, passwords) in your GitHub repositories or ZIP uploads. It runs entirely locally on your machine, ensuring your code never leaves your environment.

## Features
- **URL & ZIP Support**: Input any public GitHub URL or upload a ZIP file.
- **Dual Pipeline**: Uses `Gitleaks` as primary scanner with a high-speed `Node.js Regex` fallback.
- **Risk Scoring**: Automatically calculates a risk score (0-100) based on finding severity.
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

## Demo Script
Refer to [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a guided 3-minute presentation.

## Fallback Plan
If you encounter network or environment issues:
- View the pre-generated report: [http://localhost:3000/demo-fallback.html](http://localhost:3000/demo-fallback.html)
- Load sample JSON: `public/sample-report.json`

## Safety Disclaimer
This is a prototype. Always verify findings manually. Scanned data is stored in `tmp/` and wiped after each session.
