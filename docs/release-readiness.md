# Release Readiness

Use this checklist before publishing, tagging, or asking reviewers to trust the package surface.

## Package Surface

- Package: `agent-run-audit-skill`
- Repository: `https://github.com/rogerchappel/agent-run-audit-skill`
- Pack contents are constrained by the `files` allowlist in `package.json`.

## CLI Surface

- `agent-run-audit` -> `./bin/agent-run-audit.js`

## Verification Commands

- `npm run check`: `node scripts/validate.js`
- `npm run test`: `node --test`
- `npm run smoke`: `bash scripts/smoke.sh`
- `npm run package:smoke`: `npm pack --dry-run`
- `npm run release:check`: `npm run check && npm test && npm run smoke && npm run package:smoke`

Run `npm run release:check` before opening a release PR. Record any skipped command and the reason in the PR body.

## Reviewer Notes

- Compare README examples with the current CLI bins or module exports.
- Inspect `npm pack --dry-run` output for generated logs, caches, or private fixtures.
- Confirm CI exercises the same release check path used locally.
