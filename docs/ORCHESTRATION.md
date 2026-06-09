# Orchestration

Use this skill after a long agent run, cron automation, release-prep workflow, or prompt regression test.

1. Save the transcript or tool log locally.
2. Run `agent-run-audit audit <transcript> --out .audit`.
3. Review `audit.md` before posting a final handoff.
4. Use `agent-run-audit check .audit/audit.json` to fail on unresolved blockers or high-risk side effects.

## Boundaries

The CLI reads transcript files and writes audit artifacts. It does not execute commands, call external services, mutate repos, publish reports, or send notifications.
