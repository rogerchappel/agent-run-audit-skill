# PRD: agent-run-audit-skill

## Status

Initial release candidate.

## Problem

Long agent transcripts are difficult to review. Maintainers need a compact audit artifact that identifies actions, commands, files, verification, blockers, and risky side effects without trusting a prose summary alone.

## Goals

- Parse local Markdown, text, and JSONL transcripts.
- Extract commands, file paths, URLs, verification statements, blockers, TODOs, and approval-sensitive activity.
- Classify side effects without executing transcript commands.
- Emit `audit.json` and `audit.md`.
- Provide a reusable skill workflow for handoffs and prompt regression review.

## Non-Goals

- Reading SaaS logs directly.
- Sending notifications.
- Executing commands from transcripts.
- Mutating audited repositories.
- Scoring human productivity.
