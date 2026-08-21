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

test("does not count explicitly non-executed checks as verification", async () => {
  const parsed = await parseTranscript("fixtures/negated-verification.md");
  assert.deepEqual(parsed.verification, []);
});

test("does not count negated positive outcomes as verification", async () => {
  const parsed = await parseTranscript("fixtures/negated-outcome-verification.md");
  assert.deepEqual(parsed.verification, []);
});

test("does not count prospective checks as completed verification", async () => {
  const parsed = await parseTranscript("fixtures/prospective-verification.md");
  assert.deepEqual(parsed.verification, []);
});

test("retains affirmative completed verification evidence", async () => {
  const success = await parseTranscript("fixtures/success.md");
  assert.equal(success.verification.length, 1);
  assert.ok(success.verification.includes("Verification passed: npm test reported 6 passing tests."));

  const outcomes = await parseTranscript("fixtures/affirmative-outcome-verification.md");
  assert.equal(outcomes.verification.length, 4);
});

test("uses the latest explicit verification outcome", async () => {
  for (const fixture of ["historical-pass-current-not-run.md", "historical-pass-current-failure.md"]) {
    const parsed = await parseTranscript(`fixtures/${fixture}`);
    assert.deepEqual(parsed.verification, [], fixture);
  }

  const recovered = await parseTranscript("fixtures/historical-failure-current-pass.md");
  assert.deepEqual(recovered.verification, ["npm test passed for the current change."]);
});

test("does not count a bare command or command mention as completed verification", async () => {
  for (const fixture of ["command-only-verification.md", "command-mentioned-verification.md"]) {
    const parsed = await parseTranscript(`fixtures/${fixture}`);
    assert.deepEqual(parsed.verification, [], fixture);
  }
});

test("extracts punctuated paths without URL-derived substrings", async () => {
  const parsed = await parseTranscript("fixtures/punctuated-paths.md");
  assert.deepEqual(parsed.paths, [
    "src/index.js",
    "docs/README.md",
    "test/audit.test.js",
    "package.json"
  ]);
  assert.deepEqual(parsed.urls, ["https://github.com/rogerchappel/example/pull/1"]);
});

test("extracts standalone repository filenames without treating prose as paths", async () => {
  const parsed = await parseTranscript("fixtures/standalone-files.md");
  assert.deepEqual(parsed.paths, ["README.md", "package.json"]);

  const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    const audit = await auditTranscript("fixtures/standalone-files.md", tmp);
    assert.equal(audit.summary.pathCount, 2);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
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

test("classifies prospective-only verification as missing", async () => {
  const out = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    const audit = await auditTranscript("fixtures/prospective-verification.md", out);
    assert.equal(audit.classification, "missing-verification");
    assert.equal(audit.summary.verificationCount, 0);
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

test("does not treat zero-failure summaries as blockers", async () => {
  for (const fixture of ["zero-failures.md", "zero-failures-count-last.md", "affirmative-zero-failures.md"]) {
    const parsed = await parseTranscript(`fixtures/${fixture}`);
    assert.deepEqual(parsed.blockers, [], fixture);
  }
});

test("uses affirmative zero-failure statements as successful verification", async () => {
  const parsed = await parseTranscript("fixtures/affirmative-zero-failures.md");
  assert.deepEqual(parsed.verification, [
    "No tests failed.",
    "There were no test failures.",
    "None of the smoke checks failed.",
    "The validation completed without errors."
  ]);
});

test("does not treat explicitly resolved historical failures as blockers", async () => {
  const parsed = await parseTranscript("fixtures/resolved-failure.md");
  assert.deepEqual(parsed.blockers, []);
});

test("retains nonzero failures and active errors as blockers", async () => {
  const failed = await parseTranscript("fixtures/active-failure.md");
  assert.deepEqual(failed.blockers, ["npm test: 9 passed, 1 failed."]);

  const errored = await parseTranscript("fixtures/active-error.md");
  assert.deepEqual(errored.blockers, ["Error: release artifact is missing."]);

  const mixed = await parseTranscript("fixtures/zero-failure-with-active-failure.md");
  assert.deepEqual(mixed.blockers, ["No unit tests failed, but the integration check failed."]);
});

test("ignores negated and resolved errors while retaining successful verification", async () => {
  for (const fixture of ["negated-error.md", "resolved-error.md"]) {
    const parsed = await parseTranscript(`fixtures/${fixture}`);
    assert.deepEqual(parsed.blockers, [], fixture);
    assert.equal(parsed.verification.length, 1, fixture);
  }
});

test("cli check accepts successful and resolved fixtures but rejects active failures", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    for (const fixture of ["zero-failures.md", "zero-failures-count-last.md", "affirmative-zero-failures.md", "resolved-failure.md", "negated-error.md", "resolved-error.md", "affirmative-outcome-verification.md", "historical-failure-current-pass.md"]) {
      const out = path.join(tmp, fixture);
      execFileSync("node", ["bin/agent-run-audit.js", "audit", `fixtures/${fixture}`, "--out", out]);
      const check = spawnSync("node", ["bin/agent-run-audit.js", "check", path.join(out, "audit.json")]);
      assert.equal(check.status, 0, `${fixture} should pass CLI check`);
    }

    for (const fixture of ["active-failure.md", "active-error.md", "zero-failure-with-active-failure.md", "negated-verification.md", "negated-outcome-verification.md", "prospective-verification.md", "command-only-verification.md", "command-mentioned-verification.md", "historical-pass-current-not-run.md", "historical-pass-current-failure.md"]) {
      const out = path.join(tmp, fixture);
      execFileSync("node", ["bin/agent-run-audit.js", "audit", `fixtures/${fixture}`, "--out", out]);
      const check = spawnSync("node", ["bin/agent-run-audit.js", "check", path.join(out, "audit.json")]);
      assert.notEqual(check.status, 0, `${fixture} should fail CLI check`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("classifies external account side effects", async () => {
  for (const fixture of ["external.md", "external-affirmative.md"]) {
    const parsed = await parseTranscript(`fixtures/${fixture}`);
    const risks = classifySideEffects(parsed);
    assert.ok(
      risks.some((risk) => risk.type === "external-account" && risk.level === "high"),
      `${fixture} should identify external-account activity`
    );
  }
});

test("ignores sends to explicitly local destinations", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    const audit = await auditTranscript("fixtures/external-local-destination.md", tmp);
    assert.equal(audit.sideEffects.some((risk) => risk.type === "external-account"), false);
    assert.equal(audit.classification, "ready-for-handoff");

    const check = spawnSync("node", ["bin/agent-run-audit.js", "check", path.join(tmp, "audit.json")]);
    assert.equal(check.status, 0);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("ignores explicitly negated external-account activity", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    const audit = await auditTranscript("fixtures/external-negated.md", tmp);
    assert.equal(audit.sideEffects.some((risk) => risk.type === "external-account"), false);
    assert.equal(audit.classification, "ready-for-handoff");

    const check = spawnSync("node", ["bin/agent-run-audit.js", "check", path.join(tmp, "audit.json")]);
    assert.equal(check.status, 0);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("cli check rejects affirmative external-account activity", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "agent-run-audit-"));
  try {
    const audit = await auditTranscript("fixtures/external.md", tmp);
    assert.ok(audit.sideEffects.some((risk) => risk.type === "external-account" && risk.level === "high"));

    const check = spawnSync("node", ["bin/agent-run-audit.js", "check", path.join(tmp, "audit.json")]);
    assert.notEqual(check.status, 0);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("cli help documents audit, summarize, and check commands", () => {
  const output = execFileSync("node", ["bin/agent-run-audit.js", "--help"], { encoding: "utf8" });
  assert.match(output, /Usage:/);
  assert.match(output, /agent-run-audit audit/);
  assert.match(output, /agent-run-audit summarize/);
  assert.match(output, /agent-run-audit check/);
});

test("cli rejects malformed arguments with command usage", () => {
  const cases = [
    ["audit", "fixtures/success.md", "--out"],
    ["audit", "fixtures/success.md", "--unknown", "value"],
    ["audit", "fixtures/success.md", "--out", ".audit-one", "--out", ".audit-two"],
    ["audit", "fixtures/success.md", "extra.md"],
    ["summarize", ".audit/audit.json", "--unknown"],
    ["summarize", ".audit/audit.json", "extra.json"],
    ["check", ".audit/audit.json", "--unknown"],
    ["check", ".audit/audit.json", "extra.json"]
  ];

  for (const args of cases) {
    const result = spawnSync("node", ["bin/agent-run-audit.js", ...args], { encoding: "utf8" });
    assert.notEqual(result.status, 0, args.join(" "));
    assert.match(result.stderr, new RegExp(`Usage: agent-run-audit ${args[0]}`), args.join(" "));
  }
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
