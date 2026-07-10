#!/usr/bin/env bash
set -euo pipefail

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

node bin/agent-run-audit.js --help > "$tmp/help.txt"
node bin/agent-run-audit.js audit fixtures/success.md --out "$tmp/audit"
test -f "$tmp/audit/audit.json"
test -f "$tmp/audit/audit.md"
node bin/agent-run-audit.js summarize "$tmp/audit/audit.json" > "$tmp/summary.md"
node bin/agent-run-audit.js check "$tmp/audit/audit.json"

echo "agent-run-audit-skill smoke passed"
