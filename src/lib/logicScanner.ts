import fs from "fs"
import path from "path"

const rules = require("./security-rules/logic-rules.json")

const IGNORE_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    "tmp",
    "dist",
    "build",
    ".cache",
    "coverage"
])

export function runLogicScanner(targetDir: string) {

    let findings: any[] = []

    function walk(dir: string) {

        const files = fs.readdirSync(dir)

        for (const file of files) {

            const fullPath = path.join(dir, file)

            const stat = fs.statSync(fullPath)

            // Ignore directories
            if (stat.isDirectory()) {

                if (IGNORE_DIRS.has(file)) {
                    continue
                }

                walk(fullPath)

            }

            else {

                let content = ""

                try {

                    content = fs.readFileSync(fullPath, "utf8")

                } catch {

                    continue

                }

                for (const rule of rules) {

                    const regex = new RegExp(rule.pattern, "gi")

                    const match = content.match(regex)

                    if (match) {

                        findings.push({

                            file: fullPath,

                            ruleId: rule.id,

                            severity: rule.severity,

                            snippet: match[0]

                        })

                    }

                }

            }

        }

    }

    walk(targetDir)

    return findings

}