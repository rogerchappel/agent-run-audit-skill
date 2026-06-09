export function classifySideEffects(parsed) {
  const commandText = parsed.commands.join("\n").toLowerCase();
  const lineText = parsed.lines.join("\n").toLowerCase();
  const risks = [];

  addRisk(risks, "filesystem", /apply_patch|rm\s|mv\s|write|edited|created|deleted/.test(commandText + lineText));
  addRisk(risks, "network", /curl|wget|fetch|http|https|npm install|pnpm add|yarn add/.test(commandText + lineText));
  addRisk(risks, "github", /\bgh\s|github|pull request|push|branch protection/.test(commandText + lineText));
  addRisk(risks, "package", /npm install|npm test|npm run|pnpm|yarn|bun/.test(commandText + lineText));
  addRisk(risks, "external-account", /slack|gmail|salesforce|hubspot|stripe|send|post(ed)? to/.test(commandText + lineText));

  return risks;
}

function addRisk(risks, type, present) {
  if (present) risks.push({ type, level: type === "external-account" ? "high" : "medium" });
}
