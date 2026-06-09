# Release candidate: agent-run-audit-skill initial public build

## Summary

- Adds a local-first transcript audit CLI and reusable skill.
- Extracts commands, paths, URLs, blockers, TODOs, verification evidence, and side-effect risks.
- Emits `audit.json` and `audit.md`.
- Documents approval boundaries for agent self-audits and handoffs.

## Verification

- `npm test`
- `npm run check`
- `npm run smoke`

## Classification

`ship` for initial OSS release candidate.
