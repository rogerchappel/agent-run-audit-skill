# agent-run-audit-skill

`agent-run-audit-skill` turns local agent transcripts into compact audit reports. It extracts commands, files, URLs, blockers, TODOs, verification evidence, and side-effect risks without executing anything from the transcript.

## Quickstart

Node.js 20.0.0 or newer is supported. CI runs the complete release gate on the
declared minimum version and on Node.js 22.

```bash
npm install
npm run smoke
node bin/agent-run-audit.js audit fixtures/success.md --out .audit
```

Outputs:

- `audit.json`: structured audit data.
- `audit.md`: human-readable handoff summary.

Markdown reports normalize transcript- and path-derived line breaks to spaces
and escape Markdown punctuation. Evidence remains readable in its intended
field or list item without being able to introduce headings, links, or sibling
list items. The JSON report retains the original extracted values.

## Commands

```bash
agent-run-audit audit ./transcript.md --out .audit
agent-run-audit summarize .audit/audit.json
agent-run-audit check .audit/audit.json
```

Each command accepts exactly the paths and options shown above. `audit` may
omit `--out` to use `.audit`; unknown or duplicate flags, a missing `--out`
value, and extra positional arguments are usage errors.

`check` succeeds only for runs classified as `ready-for-handoff`. Blocked,
high-risk, and missing-verification runs exit nonzero.

File extraction recognizes directory-qualified paths and standalone filenames
with common repository extensions (for example, `README.md`, `package.json`,
and `index.js`). The extension allowlist is deliberately narrow: uncommon
extensions and extensionless filenames without a directory may be omitted to
avoid treating ordinary dotted prose as files. URL contents are excluded from
path results, and sentence punctuation immediately after a path is not part of
that path; URLs continue to be reported separately.

Blocker detection is intentionally conservative and line-oriented. Active blocker
keywords such as `blocked`, `failed`, `error`, and `cannot` are reported, while
explicitly successful summaries in count-first or count-last form (`0 failed` or
`failed: 0`), natural zero-failure statements (`No tests failed`, `There were
no test failures`, or `completed without errors`), resolved history
(`Previously failed, now fixed`), and `No blockers` statements are ignored.
These zero-failure statements also count as affirmative verification. Nonzero
counts, mixed statements that retain a current failure, and ambiguous history
remain blockers unless they include an explicit resolution.

Verification detection likewise requires affirmative evidence. Statements such
as `Verification was not performed`, `The release check was not run`, and `npm
test was not successful` are classified as missing verification instead of
successful handoff evidence. Negating a positive outcome word (`not passed`,
`not passing`, `not succeeded`, or `not successful`) never counts as evidence.
Prospective, planned, or conditional statements such as `npm test will be run
after review` are also not completed evidence. A bare command (`npm test`) or
a mention of a recommended command only proves that the command was named, not
that it ran successfully. Report an observed result, for example `npm test
passed`, before expecting `check` to approve the audit.

When a transcript contains multiple outcomes, their order resolves recency.
An explicit later failure or statement that verification was not run clears
earlier success evidence. A later observed success after historical failure
becomes the current verification evidence. Prospective statements remain
neutral: they neither prove success nor erase an already observed result.
Command and side-effect extraction also ignores explicit non-execution, such
as `npm install was not run`, `No files were created`, or `No network request
was made`. When one line contains multiple explicit outcomes, the last outcome
on that line wins, matching transcript order.

External-account detection is also line-oriented. Affirmative references to
Slack and common account services are high-risk. Generic sending and posting
language is high-risk only when the clause also names an external destination,
such as an email, message, webhook, channel, customer, or external account;
explicitly local destinations such as a local file or stdout are not. A clause
that explicitly negates the activity (for example, `No Slack message was sent`)
is also ignored. Indirect or unusually phrased activity or negation may still
require manual review.

## Examples

Audit a cron transcript:

```bash
node bin/agent-run-audit.js audit ./run.md --out .audit
node bin/agent-run-audit.js check .audit/audit.json
```


## Verification

Run the local quality gates before opening a pull request:

```sh
npm run lint
npm test
npm run smoke
```

`npm run lint` is an alias for the repository static check so contributors can use the common npm workflow without guessing the project-specific command.

## Limitations

- V1 uses heuristic extraction rather than a full shell parser.
- It audits local transcript files only.
- It does not prove that a claimed command actually ran unless the transcript contains that evidence.
- Side effects require observed-activity language (for example, “ran,” “pushed,”
  or “sent”). References, recommendations, prospective commands, URLs, and
  explicitly negated activity are retained as transcript evidence but do not
  count as observed side effects.

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
