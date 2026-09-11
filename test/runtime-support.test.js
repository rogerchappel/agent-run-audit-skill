import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

// Accept both the block form ("- 22" lines) and the inline form ([22, 24]) so a
// future reformat does not silently disable the guard.
const block = workflow.match(/node-version:\s*\n((?:[ \t]*-[ \t]*[\d.]+[ \t]*\n?)+)/);
const inline = workflow.match(/node-version:[ \t]*\[([^\]]+)\]/);
const rawEntries = (block?.[1] ?? inline?.[1] ?? "")
  .replace(/-/g, " ")
  .split(/\s+/)
  .filter((entry) => entry.length > 0)
  .map((entry) => Number(entry.split(".")[0]));

const enginesFloor = Number((packageJson.engines?.node ?? "").match(/^>=(\d+)$/)?.[1]);

test("CI exercises the release gate on a matrix of in-support Node.js runtimes", () => {
  assert.ok(rawEntries.length >= 2, "ci.yml must keep a matrix of at least two Node.js runtimes");
  assert.ok(
    rawEntries.every((major) => Number.isInteger(major) && major >= 22),
    "every CI matrix runtime must be Node.js 22 or newer; end-of-life lines (18, 20) must not gate releases"
  );
  assert.match(
    workflow,
    /node-version:\s*\$\{\{\s*matrix\.node-version\s*\}\}/,
    "setup-node must consume the matrix version"
  );
  assert.match(workflow, /npm run release:check/, "CI must run the complete release gate");
});

test("engines floor matches the lowest CI-verified runtime", () => {
  assert.ok(
    Number.isInteger(enginesFloor),
    "package.json engines.node must declare an explicit >=<major> floor"
  );
  assert.equal(Math.min(...rawEntries), enginesFloor, "CI must verify the declared engines floor");
});

test("README repeats the CI-verified runtime floor without stale minimums", () => {
  assert.match(
    readme,
    new RegExp(`Node\\.js ${enginesFloor} or newer is supported`),
    "README must state support starting at the CI-verified floor"
  );
  assert.ok(
    readme.includes(`Node.js ${Math.max(...rawEntries)}`),
    "README must name the upper runtime CI verifies"
  );
  assert.doesNotMatch(readme, /Node\.js 20\.0\.0/, "README must not keep the retired Node 20 floor");
});
