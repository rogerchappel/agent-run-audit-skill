# Output Contract

## audit.json

```json
{
  "schemaVersion": "0.1.0",
  "source": "fixtures/success.md",
  "summary": {
    "commandCount": 2,
    "pathCount": 2,
    "urlCount": 1,
    "blockerCount": 0,
    "todoCount": 0,
    "verificationCount": 2,
    "riskCount": 3
  },
  "commands": ["npm test"],
  "paths": ["src/index.js"],
  "urls": ["https://github.com/rogerchappel/example/pull/1"],
  "blockers": [],
  "todos": [],
  "verification": ["Verification passed: npm test reported 6 passing tests."],
  "sideEffects": [
    {
      "type": "filesystem",
      "level": "medium"
    }
  ],
  "classification": "ready-for-handoff"
}
```

## Classifications

- `ready-for-handoff`: affirmative verification evidence exists and no blockers or high-risk external-account side effects were found.
- `missing-verification`: no affirmative verification evidence was detected. Statements that a check was not run or verification was not performed do not count as evidence.
- `needs-review`: high-risk external-account side effects were detected.
- `blocked`: affirmative blocker or failure language was detected. Explicitly negated or resolved errors do not create blockers.

The `check` command succeeds only for `ready-for-handoff`; every other classification exits nonzero.
