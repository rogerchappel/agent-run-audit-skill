# Release Candidate Notes

## 0.1.0

- Transcript parser for Markdown, text, and JSONL.
- Command, path, URL, blocker, TODO, and verification extraction.
- Side-effect classification for filesystem, network, GitHub, package, and external-account signals.
- JSON and Markdown report output.

## Verification

```bash
npm test
npm run check
npm run smoke
```

## PR Review Focus

- Confirm `check` fails on blocked or high-risk audits.
- Confirm transcript commands are extracted but never executed.
- Confirm the Markdown report is concise enough for handoff use.
