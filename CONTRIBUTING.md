# Contributing

Small, focused pull requests are easiest to review.

Before opening a PR, run:

```sh
npm test
npm run check
npm run smoke
npm run package:smoke
npm run release:check
```

Update README or docs when CLI behavior, audit output fields, risk classification, or release expectations change. Keep fixtures synthetic and avoid committing real private transcripts.
