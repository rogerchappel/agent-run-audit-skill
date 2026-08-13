#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import pkg from "../package.json" with { type: "json" };
import { auditTranscript, renderAuditMarkdown } from "../src/index.js";

const [command, ...args] = process.argv.slice(2);

try {
  await main(command, args);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

async function main(command, args) {
  if (command === "--version" || command === "version") {
    console.log(pkg.version);
    return;
  }

  if (!command || command === "--help" || command === "help") {
    printHelp();
    return;
  }

  if (command === "audit") {
    const { positional: [input], options } = parseArgs(command, args, ["--out"]);
    const out = options.get("--out") ?? ".audit";
    await auditTranscript(input, out);
    return;
  }

  if (command === "summarize") {
    const { positional: [auditPath] } = parseArgs(command, args);
    console.log(renderAuditMarkdown(JSON.parse(await readFile(auditPath, "utf8"))));
    return;
  }

  if (command === "check") {
    const { positional: [auditPath] } = parseArgs(command, args);
    const audit = JSON.parse(await readFile(auditPath, "utf8"));
    if (audit.classification !== "ready-for-handoff") {
      throw new Error(`Audit requires attention: ${audit.classification}`);
    }
    console.log(`Audit check passed: ${audit.classification}`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseArgs(command, args, allowedFlags = []) {
  const usage = commandUsage(command);
  const positional = [];
  const options = new Map();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("-")) {
      positional.push(argument);
      continue;
    }
    if (!allowedFlags.includes(argument)) throw new Error(`Unknown option: ${argument}\n${usage}`);
    if (options.has(argument)) throw new Error(`Duplicate option: ${argument}\n${usage}`);
    const value = args[index + 1];
    if (!value || value.startsWith("-")) throw new Error(`Missing value for ${argument}\n${usage}`);
    options.set(argument, value);
    index += 1;
  }

  if (positional.length !== 1) throw new Error(`Expected exactly one input path\n${usage}`);
  return { positional, options };
}

function commandUsage(command) {
  if (command === "audit") return "Usage: agent-run-audit audit <transcript> [--out <directory>]";
  return `Usage: agent-run-audit ${command} <audit.json>`;
}

function printHelp() {
  console.log(`agent-run-audit

Usage:
  agent-run-audit audit <transcript> [--out <directory>]
  agent-run-audit summarize <audit.json>
  agent-run-audit check <audit.json>
  agent-run-audit --version
`);
}
