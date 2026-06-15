# agent-run-audit-skill

`agent-run-audit-skill` turns local agent transcripts into compact audit reports. It extracts commands, files, URLs, blockers, TODOs, verification evidence, and side-effect risks without executing anything from the transcript.

## Quickstart

```bash
npm install
npm run smoke
node bin/agent-run-audit.js audit fixtures/success.md --out .audit
```

Outputs:

- `audit.json`: structured audit data.
- `audit.md`: human-readable handoff summary.

## Commands

```bash
agent-run-audit audit ./transcript.md --out .audit
agent-run-audit summarize .audit/audit.json
agent-run-audit check .audit/audit.json
```

`check` fails for blocked runs and high-risk external-account activity.

## Examples

Audit a cron transcript:

```bash
node bin/agent-run-audit.js audit ./run.md --out .audit
node bin/agent-run-audit.js check .audit/audit.json
```

## Limitations

- V1 uses heuristic extraction rather than a full shell parser.
- It audits local transcript files only.
- It does not prove that a claimed command actually ran unless the transcript contains that evidence.

## Safety Notes

The CLI reads one transcript file and writes to the selected output directory. It does not execute transcript commands, mutate repositories, call GitHub, send notifications, or contact external services.

## Release Readiness

Run the local release gate before opening or publishing a release:

```sh
npm test
npm run check
npm run smoke
npm run package:smoke
npm run release:check
```

## Release Verification

Before publishing or tagging a release, run the same verification path used by CI:

- `npm run release:check`
- `npm run package:smoke`

See `docs/release-readiness.md` for the package surface, CLI bins, and reviewer checklist.
