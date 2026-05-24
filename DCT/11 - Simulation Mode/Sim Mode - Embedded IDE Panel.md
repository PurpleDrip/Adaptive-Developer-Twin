---
tags: [simulation-mode, ux]
---

# Sim Mode — Embedded IDE Panel

## Why Monaco

Monaco is the editor VS Code itself uses. Embedding it gives Sim Mode the visual authenticity of the real product — and viewers recognize it instantly.

Alternatives considered:

- CodeMirror 6 — lighter, but less "VS-Code-shaped" visually. Use if bundle size is critical.
- Plain `<textarea>` — kills the demo magic. Don't.

## Setup

```ts
import * as monaco from "monaco-editor";

const editor = monaco.editor.create(container, {
  value: "",                       // Demo Driver fills this
  language: "python",              // changes per step
  theme: "vs-dark",                // align with sim chrome
  fontSize: 14,
  lineNumbers: "on",
  minimap: { enabled: true },      // for visual richness
  scrollBeyondLastLine: false,
  automaticLayout: true,
  readOnly: false,                 // we type into it programmatically
});

editor.updateOptions({
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
});
```

## Programmatic typing

The Demo Driver inserts text **one chunk at a time** to mimic real typing:

```ts
async function typeAt(editor, text, wpm = 80) {
  const chunks = text.match(/.{1,5}/gs) || [];   // 5-char bursts
  const msPerChunk = (60_000 / (wpm * 5)) * 5;   // wpm → ms per 5-char chunk
  for (const c of chunks) {
    const pos = editor.getPosition();
    editor.executeEdits("driver", [{
      range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
      text: c,
    }]);
    editor.setPosition({ lineNumber: pos.lineNumber, column: pos.column + c.length });
    await sleep(msPerChunk + jitter(20));
  }
}
```

**Jitter** (±20 ms per chunk) makes the typing feel human — a subtle but important detail. A monotonic typer reads as "machine."

## Per-keystroke ping

After each chunk:

```ts
async function emitPing() {
  const snippet = editor.getModel().getValueInRange(getCursorWindow(editor, 10));
  const lang = editor.getModel().getLanguageId();
  await api.post("/telemetry/ingest", {
    extension_id: "sim-alice",
    machine_id: "sim-machine-001",
    sync_type: "DELTA",
    wpm: currentWpm(),
    keystrokes: charsThisWindow,
    commands_executed: 0,
    idle_seconds: 0,
    active_file: currentFile(),
    languages_used: { [lang]: secondsThisWindow },
    code_snippet: snippet,
    timestamp: new Date().toISOString(),
  });
}
```

`getCursorWindow(editor, 10)` returns the ±10 lines around the cursor — the same shape the real extension sends.

## Visual cues

- A **small ●** appears in the top-right of the IDE panel each time a ping leaves (fades in 100 ms, fades out 600 ms)
- Cursor blinks
- A subtle 1 px "live" badge at the top: `● live · alice@sim`

## Switching files mid-demo

```ts
const FILES = [
  { name: "app/routers/users.py", lang: "python", content: "..." },
  { name: "components/Header.tsx", lang: "typescript", content: "..." },
];

function loadFile(idx: number) {
  const f = FILES[idx];
  const model = monaco.editor.createModel(f.content, f.lang);
  editor.setModel(model);
  currentFile.value = f.name;
}
```

A step can begin with "load file" then "type into it" — supporting the narration "now Alice switches to a TS file…"

## Anti-flicker

When the Demo Driver runs in autoplay, all timing comes from a single requestAnimationFrame-driven scheduler. Mixing `setTimeout` with `setInterval` causes drift visible to the audience.

## Tracked

- [[13 - Yet to Implement/Simulation - Embedded IDE Panel]]
- [[13 - Yet to Implement/Simulation - Demo Driver Engine]]
