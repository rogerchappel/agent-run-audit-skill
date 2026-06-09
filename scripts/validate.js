import { access, readFile } from "node:fs/promises";

const required = [
  "README.md",
  "SKILL.md",
  "docs/PRD.md",
  "docs/TASKS.md",
  "docs/ORCHESTRATION.md",
  "docs/RELEASE_CANDIDATE.md",
  "bin/agent-run-audit.js",
  "src/index.js",
  "test/audit.test.js"
];

for (const file of required) {
  await access(file);
}

const pkg = JSON.parse(await readFile("package.json", "utf8"));
if (!pkg.bin?.["agent-run-audit"]) throw new Error("package.json must expose agent-run-audit bin");

console.log("agent-run-audit-skill validation passed");
