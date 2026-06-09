import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseTranscript } from "./parser.js";
import { classifySideEffects } from "./risk.js";

export async function auditTranscript(input, outDir) {
  const parsed = await parseTranscript(input);
  const audit = buildAudit(parsed);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "audit.json"), `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(path.join(outDir, "audit.md"), renderAuditMarkdown(audit), "utf8");
  return audit;
}

export function buildAudit(parsed) {
  const risks = classifySideEffects(parsed);
  return {
    schemaVersion: "0.1.0",
    source: parsed.source,
    summary: {
      commandCount: parsed.commands.length,
      pathCount: parsed.paths.length,
      urlCount: parsed.urls.length,
      blockerCount: parsed.blockers.length,
      todoCount: parsed.todos.length,
      verificationCount: parsed.verification.length,
      riskCount: risks.length
    },
    commands: parsed.commands,
    paths: parsed.paths,
    urls: parsed.urls,
    blockers: parsed.blockers,
    todos: parsed.todos,
    verification: parsed.verification,
    sideEffects: risks,
    classification: classifyRun(parsed, risks)
  };
}

export function classifyRun(parsed, risks) {
  if (parsed.blockers.length) return "blocked";
  if (risks.some((risk) => risk.level === "high")) return "needs-review";
  if (!parsed.verification.length) return "missing-verification";
  return "ready-for-handoff";
}

export function renderAuditMarkdown(audit) {
  return [
    "# Agent Run Audit",
    "",
    `Source: ${audit.source}`,
    `Classification: ${audit.classification}`,
    "",
    "## Summary",
    "",
    ...Object.entries(audit.summary).map(([key, value]) => `- ${key}: ${value}`),
    "",
    renderList("Commands", audit.commands),
    renderList("Verification", audit.verification),
    renderList("Blockers", audit.blockers),
    renderList("TODOs", audit.todos),
    renderList("Paths", audit.paths),
    renderList("URLs", audit.urls),
    renderList("Side Effects", audit.sideEffects.map((risk) => `${risk.type}: ${risk.level}`))
  ].join("\n");
}

function renderList(title, values) {
  return [`## ${title}`, "", ...(values.length ? values.map((value) => `- ${value}`) : ["None detected."]), ""].join("\n");
}
