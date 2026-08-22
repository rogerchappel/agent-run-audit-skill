export function classifySideEffects(parsed) {
  const clauses = [...parsed.commands, ...parsed.lines].flatMap((line) => line.split(/[.;]/));
  const risks = [];

  addRisk(risks, "filesystem", hasAffirmativeActivity(clauses, /apply_patch|\brm\s|\bmv\s|\bwrite|\bedited|\bcreated|\bdeleted/i));
  addRisk(risks, "network", hasAffirmativeActivity(clauses, /\bcurl\b|\bwget\b|\bfetch\b|https?:|npm install|pnpm add|yarn add/i));
  addRisk(risks, "github", hasAffirmativeActivity(clauses, /\bgh\s|github|pull request|\bpush|branch protection/i));
  addRisk(risks, "package", hasAffirmativeActivity(clauses, /npm install|npm test|npm run|\bpnpm\b|\byarn\b|\bbun\b/i));
  addRisk(risks, "external-account", hasExternalAccountActivity(parsed.commands, parsed.lines));

  return risks;
}

function hasAffirmativeActivity(clauses, pattern) {
  return clauses.some((clause) => pattern.test(clause) && !isExplicitlyNegated(clause));
}

function isExplicitlyNegated(clause) {
  return /^\s*(?:no|none|neither|never|without)\b/i.test(clause)
    || /\b(?:was|were|is|are|has|have|had|did|does)\s+not\s+(?:\w+\s+){0,2}(?:run|executed|performed|made|created|written|edited|deleted|installed|fetched|pushed)\b/i.test(clause);
}

function hasExternalAccountActivity(commands, lines) {
  const accountService = /\b(?:slack|gmail|salesforce|hubspot|stripe)\b/i;
  const transfer = /\b(?:send|sent|sending|post|posted|posting)\b/i;
  const externalDestination = /\b(?:e-?mail|message|notification|webhook|channel|customer|client|user|external (?:account|service))s?\b/i;
  const explicitNegation = /(?:\b(?:no|never|without)\b.*\b(?:slack|gmail|salesforce|hubspot|stripe|send|sent|sending|post(?:ed|ing)?|external account)\b)|(?:\b(?:slack|gmail|salesforce|hubspot|stripe|send|sent|sending|post(?:ed|ing)?|external account)\b.*\b(?:was|were|is|are|did|does|has|have)\s+not\b)/i;
  const clauses = [...commands, ...lines].flatMap((line) => line.split(/[.;]/));
  return clauses.some((clause) => {
    const activity = accountService.test(clause) || (transfer.test(clause) && externalDestination.test(clause));
    return activity && !explicitNegation.test(clause);
  });
}

function addRisk(risks, type, present) {
  if (present) risks.push({ type, level: type === "external-account" ? "high" : "medium" });
}
