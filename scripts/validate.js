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
if (pkg.repository?.url !== "git+https://github.com/rogerchappel/agent-run-audit-skill.git") {
  throw new Error("package.json must declare the GitHub repository URL");
}
if (pkg.bugs?.url !== "https://github.com/rogerchappel/agent-run-audit-skill/issues") {
  throw new Error("package.json must declare the GitHub issues URL");
}

const packedRequired = ["bin", "src", "docs", "fixtures", "README.md", "LICENSE", "SKILL.md"];
for (const entry of packedRequired) {
  if (!pkg.files?.includes(entry)) {
    throw new Error(`package.json files must include ${entry}`);
  }
}

console.log("agent-run-audit-skill validation passed");
