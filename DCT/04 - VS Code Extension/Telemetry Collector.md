---
tags: [extension]
---

# Telemetry Collector

`extension/src/telemetry/collector.ts` — turns VS Code events into a structured `TelemetryData` record per window (default 30 s).

## TelemetryData shape

```ts
interface TelemetryData {
  wpm: number;
  keystrokes: number;
  commands_executed: number;
  active_file: string | null;
  languages_used: Record<string, number>;
  code_snippet: string | null;
  git_branch: string | null;
  timestamp: string;        // ISO 8601 UTC
  // also: errors_encountered, errors_fixed, idle_seconds, copy_paste_count
}
```

> The server-side wire DTO is [[06 - Data Models/DTO - Telemetry Raw|TelemetryIngestDTO]] — same shape plus `extension_id`, `machine_id`, `sync_type`, `diff_payload`, `workspace_snapshot_url`. The Sender adds those.

## Event taps

| Event | Counter affected |
|:------|:-----------------|
| `onDidChangeTextDocument` | `keystrokes += changes` ; `charCount += sum(text.length)` |
| `onDidExecuteCommand` (private — proxy via command wrapping) | `commands_executed += 1` |
| `onDidChangeActiveTextEditor` | update `active_file` ; bump `languages_used[langId]` |
| `onDidChangeTextDocument` no events for N seconds | `idle_seconds += N` |
| Clipboard hooks | `copy_paste_count += 1` |
| Git extension API (`vscode.scm`) | `git_branch` |

## `collect()` logic

```ts
collect(): TelemetryData {
  const durationMin = (Date.now() - this.windowStart) / 60000;
  const wpm = Math.min(200, (this.charCount / 5) / Math.max(durationMin, 1/60));
  const editor = vscode.window.activeTextEditor;
  const active_file = editor?.document.uri.fsPath ?? null;
  const code_snippet = editor ? this.extractSnippet(editor) : null;
  const git_branch = this.git.currentBranch();
  const data: TelemetryData = {
    wpm, keystrokes: this.keystrokes,
    commands_executed: this.commands,
    active_file,
    languages_used: { ...this.langs },
    code_snippet,
    git_branch,
    timestamp: new Date().toISOString(),
  };
  this.reset();
  return data;
}

private extractSnippet(editor: vscode.TextEditor): string {
  const pos = editor.selection.active.line;
  const start = Math.max(0, pos - 10);
  const end = Math.min(editor.document.lineCount, pos + 10);
  return editor.document.getText(new vscode.Range(start, 0, end, 0));
}

private reset() {
  this.windowStart = Date.now();
  this.keystrokes = 0;
  this.charCount = 0;
  this.commands = 0;
  this.langs = {};
}
```

## WPM normalization

- Raw WPM = (charCount / 5) / minutes
- Cap at **200** — anything above is presumed bot/paste activity
- The server-side anomaly detector then checks **jitter** (human typing has variance — bots are constant)

## Snippet privacy

- Snippets are **+/- 10 lines around the cursor**, not the whole file
- Snippets are sent only if the doc is **not in a `.env`/secret pattern** (must be added — see [[13 - Yet to Implement/Extension - Secret Filter]])
- Snippets are size-capped (4 KB) before sending

## Known gaps

- **No secret scanner** before send — risk of leaking API keys in snippets. **P0**.
- **No file-pattern allowlist** — `.env`, `.pem`, `.key` should never be sampled.
- **Commands tap is fragile** — VS Code doesn't expose `onDidExecuteCommand` officially. Use command wrapping for known commands.
- **Git branch via private SCM API** — may break across VS Code versions. Pin a min engine.
