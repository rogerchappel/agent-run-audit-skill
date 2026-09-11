# Changelog

## [Unreleased]

- Reject trailing arguments passed to the help and version commands.
- Add release-readiness checks for package metadata, pack contents, and CI verification.
- Retire the end-of-life Node.js 20 floor: CI verifies Node.js 22 and 24, `engines` requires `>=22`, and the README support statement matches.
## 0.1.0

- Initial local-first transcript audit CLI and reusable agent skill.
- Added structured audit output for commands, files, URLs, blockers, and side-effect risks.
- Added fixture-backed tests and release-candidate documentation.
