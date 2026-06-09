#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { auditTranscript, renderAuditMarkdown } from "../src/index.js";

const [command, ...args] = process.argv.slice(2);

try {
  await main(command, args);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

async function main(command, args) {
  if (!command || command === "--help" || command === "help") {
    printHelp();
    return;
  }

  if (command === "audit") {
    const input = args[0];
    const out = valueAfter(args, "--out") ?? ".audit";
    if (!input) throw new Error("Usage: agent-run-audit audit <transcript> --out .audit");
    await auditTranscript(input, out);
    return;
  }

  if (command === "summarize") {
    const auditPath = args[0];
    if (!auditPath) throw new Error("Usage: agent-run-audit summarize <audit.json>");
    console.log(renderAuditMarkdown(JSON.parse(await readFile(auditPath, "utf8"))));
    return;
  }

  if (command === "check") {
    const auditPath = args[0];
    if (!auditPath) throw new Error("Usage: agent-run-audit check <audit.json>");
    const audit = JSON.parse(await readFile(auditPath, "utf8"));
    if (audit.classification === "blocked" || audit.classification === "needs-review") {
      throw new Error(`Audit requires attention: ${audit.classification}`);
    }
    console.log(`Audit check passed: ${audit.classification}`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function printHelp() {
  console.log(`agent-run-audit

Usage:
  agent-run-audit audit <transcript> --out .audit
  agent-run-audit summarize .audit/audit.json
  agent-run-audit check .audit/audit.json
`);
}
