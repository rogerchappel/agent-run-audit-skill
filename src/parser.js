import { readFile } from "node:fs/promises";

export async function parseTranscript(file) {
  const raw = await readFile(file, "utf8");
  const lines = normalizeLines(raw);
  return {
    source: file,
    lines,
    commands: extractCommands(lines),
    paths: extractPaths(lines),
    urls: extractUrls(lines),
    blockers: extractBlockers(lines),
    todos: extractMatching(lines, /\b(todo|follow[- ]?up|next step|remaining)\b/i),
    verification: extractMatching(lines, /\b(npm test|npm run|pytest|cargo test|passed|verification|smoke|check)\b/i)
  };
}

function normalizeLines(raw) {
  return raw
    .split(/\r?\n/)
    .flatMap((line) => line.trim() ? [line.trim()] : []);
}

function extractCommands(lines) {
  const commands = [];
  for (const line of lines) {
    const fenced = line.match(/^\$?\s*(npm|node|git|gh|pytest|cargo|bash|pnpm|yarn|bun)\b.+/);
    const inline = [...line.matchAll(/`([^`]*(?:npm|node|git|gh|pytest|cargo|bash|pnpm|yarn|bun)\s+[^`]*)`/g)];
    if (fenced) commands.push(cleanCommand(fenced[0]));
    for (const match of inline) commands.push(cleanCommand(match[1]));
  }
  return unique(commands);
}

function extractPaths(lines) {
  const pathWithDirectory = /(?:\.{0,2}\/)?[\w.-]+(?:\/[\w.@-]+)+/g;
  const standaloneFile = /\b[\w@-]+\.(?:cjs|css|go|html|java|js|json|jsx|kt|md|mjs|py|rb|rs|scss|sh|swift|toml|ts|tsx|yaml|yml)\b/gi;
  const matches = lines.flatMap((line) => {
    const pathText = line.replace(/https?:\/\/\S+/g, (url) => " ".repeat(url.length));
    const directoryMatches = [...pathText.matchAll(pathWithDirectory)];
    const standaloneMatches = [...pathText.matchAll(standaloneFile)].filter((candidate) =>
      !directoryMatches.some((directory) =>
        candidate.index >= directory.index && candidate.index < directory.index + directory[0].length
      )
    );

    return [...directoryMatches, ...standaloneMatches]
      .sort((left, right) => left.index - right.index)
      .map((match) => match[0].replace(/[.,;:!?]+$/, ""));
  });
  return unique(matches);
}

function extractUrls(lines) {
  return unique(lines.flatMap((line) => [...line.matchAll(/https?:\/\/\S+/g)].map((match) => match[0].replace(/[),.]$/, ""))));
}

function extractBlockers(lines) {
  const blockerPattern = /\b(blocked|blockers?|failed|error|cannot|can't)\b/i;
  return lines.filter((line) => {
    const activeText = line
      .replace(/\bno\s+(?:known\s+)?blockers?\b/gi, "")
      .replace(/\b0\s+(?:tests?\s+)?failed\b/gi, "")
      .replace(/\bfailed\s*:?\s*0\b/gi, "")
      .replace(/\bpreviously\s+failed\b(?:\s*[,;:—-]\s*)?(?:but\s+)?now\s+(?:fixed|resolved|passing)\b/gi, "");
    return blockerPattern.test(activeText);
  });
}

function extractMatching(lines, pattern) {
  return lines.filter((line) => pattern.test(line));
}

function cleanCommand(command) {
  return command.replace(/^\$+\s*/, "").trim();
}

function unique(values) {
  return [...new Set(values)].filter(Boolean);
}
