import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("classifies plural blocker headings without flagging resolved blockers", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  const transcript = path.join(tmp, "transcript.md");
  try {
    await writeFile(transcript, "Blockers: production credentials are unavailable.\nVerification passed.\n");
    const blocked = await auditTranscript(transcript, path.join(tmp, "blocked-audit"));
    assert.equal(blocked.classification, "blocked");
    assert.equal(blocked.summary.blockerCount, 1);

    const check = spawnSync("node", ["bin/agent-run-audit.js", "check", path.join(tmp, "blocked-audit", "audit.json")]);
    assert.notEqual(check.status, 0);

    await writeFile(transcript, "No blockers remain.\nVerification passed.\n");
    const ready = await auditTranscript(transcript, path.join(tmp, "ready-audit"));
    assert.equal(ready.classification, "ready-for-handoff");
    assert.equal(ready.summary.blockerCount, 0);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("classifies external account side effects", async () => {
  const parsed = await parseTranscript("fixtures/external.md");
  const risks = classifySideEffects(parsed);
  assert.ok(risks.some((risk) => risk.type === "external-account" && risk.level === "high"));
});

test("cli help documents audit, summarize, and check commands", () => {
  const output = execFileSync("node", ["bin/agent-run-audit.js", "--help"], { encoding: "utf8" });
  assert.match(output, /Usage:/);
  assert.match(output, /agent-run-audit audit/);
  assert.match(output, /agent-run-audit summarize/);
  assert.match(output, /agent-run-audit check/);
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
