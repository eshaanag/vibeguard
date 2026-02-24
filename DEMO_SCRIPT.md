# VibeGuard Demo Script (3-5 Minutes)

## 0:00 - Introduction (The Hook)
"Hi, we're building VibeGuard. Developers often accidentally commit secrets—API keys, AWS tokens, database passwords. Current tools are either too slow or send your code to the cloud. VibeGuard is different: it's a localized, lightning-fast security gate that keeps your 'vibe' and your secrets secure."

## 0:45 - The Interface (The "Wow" Factor)
"This is our dashboard. Simple, dark-mode, and focused. We accept any public GitHub URL or a direct ZIP upload if you're working on something sensitive."

## 1:30 - Live Scan (The Pipeline)
"Let's scan a test repo. [Paste URL: https://github.com/gitleaks/gitleaks]. Notice the loading state. Under the hood, we clone the repo to an ephemeral `tmp/` folder, run Gitleaks, and fall back to our own custom Node regex engine if Gitleaks isn't installed. We calculate a risk score based on high-impact secrets."

## 2:30 - Results & Scoring (The Insight)
"Our score is [Result]. We prioritize findings: High Risk like Private Keys get 60 points; Medium like Slack hooks get 20. Each finding shows the exact file, line number, and a 'Fix Hint'—a one-liner to help the dev resolve it immediately."

## 3:15 - Privacy & Conclusion
"Once the scan is done, the `tmp/` folder is wiped. Your code stays on your machine. VibeGuard: Fast, Local, Secure. Questions?"

---

# Q&A Cheat Sheet (Judge Questions)

**1. What happens if the internet goes out during the demo?**
"The prototype is built with a fallback. We have a pre-generated JSON report and a static dashboard ready at `/demo-fallback.html` to prove the scanning logic and UI integration works even offline."

**2. Why use a regex fallback?**
"Gitleaks is the industry standard, but it requires a Go environment. Our Node regex scanner ensures VibeGuard works out-of-the-box on any machine with just Node.js installed, making it highly portable for quick developer audits."

**3. Is it safe to clone large repos?**
"We use `--depth 1` during the git clone to only fetch the latest snapshot, saving bandwidth and disk space. We also have an automatic cleanup block in our API route that deletes the temp folder even if the scan fails."

**4. How does the risk score work?**
"It's a weighted sum: `60*High + 20*Medium + 5*Low`, capped at 100. It provides an immediate 'gut check' for security posture rather than just listing 500 line items."

**5. Can this be integrated into CI/CD?**
"Absolutely. Our `/api/scan` endpoint returns standard JSON, which can be easily consumed by GitHub Actions or GitLab CI to fail a build if secrets are detected."

**6. What types of secrets do you detect?**
"Everything from AWS keys and GitHub PATs to Slack webhooks and private RSA keys. Our regex engine is easily extensible with new patterns."
