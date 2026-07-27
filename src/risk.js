export function classifySideEffects(parsed) {
  const commandText = parsed.commands.join("\n").toLowerCase();
  const lineText = parsed.lines.join("\n").toLowerCase();
  const risks = [];

  addRisk(risks, "filesystem", /apply_patch|rm\s|mv\s|write|edited|created|deleted/.test(commandText + lineText));
  addRisk(risks, "network", /curl|wget|fetch|http|https|npm install|pnpm add|yarn add/.test(commandText + lineText));
  addRisk(risks, "github", /\bgh\s|github|pull request|push|branch protection/.test(commandText + lineText));
  addRisk(risks, "package", /npm install|npm test|npm run|pnpm|yarn|bun/.test(commandText + lineText));
  addRisk(risks, "external-account", hasExternalAccountActivity(parsed.commands, parsed.lines));

  return risks;
}

function hasExternalAccountActivity(commands, lines) {
  const activity = /\b(?:slack|gmail|salesforce|hubspot|stripe|send|sent|sending|post(?:ed|ing)?\s+to)\b/i;
  const explicitNegation = /(?:\b(?:no|never|without)\b.*\b(?:slack|gmail|salesforce|hubspot|stripe|send|sent|sending|post(?:ed|ing)?|external account)\b)|(?:\b(?:slack|gmail|salesforce|hubspot|stripe|send|sent|sending|post(?:ed|ing)?|external account)\b.*\b(?:was|were|is|are|did|does|has|have)\s+not\b)/i;
  const clauses = [...commands, ...lines].flatMap((line) => line.split(/[.;]/));
  return clauses.some((clause) => activity.test(clause) && !explicitNegation.test(clause));
}

function addRisk(risks, type, present) {
  if (present) risks.push({ type, level: type === "external-account" ? "high" : "medium" });
}
