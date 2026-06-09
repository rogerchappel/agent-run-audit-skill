import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { auditTranscript, classifySideEffects, parseTranscript } from "../src/index.js";

test("extracts commands, paths, URLs, and verification", async () => {
  const parsed = await parseTranscript("fixtures/success.md");
  assert.ok(parsed.commands.includes("npm test"));
  assert.ok(parsed.paths.includes("src/index.js"));
  assert.ok(parsed.urls.includes("https://github.com/rogerchappel/example/pull/1"));
  assert.ok(parsed.verification.some((line) => line.includes("passed")));
});

test("classifies blocked runs", async () => {
  const out = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    const audit = await auditTranscript("fixtures/blocked.md", out);
    assert.equal(audit.classification, "blocked");
    assert.equal(audit.summary.blockerCount, 1);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test("classifies external account side effects", async () => {
  const parsed = await parseTranscript("fixtures/external.md");
  const risks = classifySideEffects(parsed);
  assert.ok(risks.some((risk) => risk.type === "external-account" && risk.level === "high"));
});

test("writes audit JSON and Markdown", async () => {
  const out = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    const audit = await auditTranscript("fixtures/success.md", out);
    assert.equal(audit.classification, "ready-for-handoff");
    assert.match(await readFile(path.join(out, "audit.md"), "utf8"), /Agent Run Audit/);
    assert.match(await readFile(path.join(out, "audit.json"), "utf8"), /ready-for-handoff/);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
