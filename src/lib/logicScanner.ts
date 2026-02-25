import fs from "fs"
import path from "path"

const rules = require("./security-rules/logic-rules.json")

export function runLogicScanner(targetDir: string) {
    let findings: any[] = []

    function walk(dir: string) {
        const files = fs.readdirSync(dir)
        for (const file of files) {
            const fullPath = path.join(dir, file)
            const stat = fs.statSync(fullPath)
            if (stat.isDirectory()) {
                walk(fullPath)
            } else {
                const content = fs.readFileSync(fullPath, "utf8")
                for (const rule of rules) {
                    const regex = new RegExp(rule.pattern, "gi")
                    if (regex.test(content)) {
                        findings.push({
                            file: fullPath,
                            ruleId: rule.id,
                            severity: rule.severity,
                            snippet: content.match(regex)?.[0] || ""
                        })
                    }
                }
            }
        }
    }

    walk(targetDir)
    return findings
}
