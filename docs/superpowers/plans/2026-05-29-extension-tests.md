# Extension Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit, integration, and E2E test coverage to the VS Code extension across all telemetry modules (collector, buffer, sender, snapshotter, scanner).

**Architecture:** Unit and integration tests use Mocha + Chai + Sinon with a stub VS Code API (`mock-vscode.ts`). E2E uses `@vscode/test-electron` to spin up a headless VS Code instance with the extension loaded. Tests live in `extension/test/` mirroring the source structure.

**Tech Stack:** Mocha, Chai, Sinon, `@vscode/test-electron` (already in devDependencies)

---

## File Map

```
extension/
├── .mocharc.json                         ← Mocha config for unit/integration
├── test/
│   ├── runTest.ts                        ← E2E test runner entry
│   ├── fixtures/
│   │   ├── mock-vscode.ts               ← VS Code API stubs
│   │   └── sample-events.ts             ← Synthetic telemetry data
│   ├── unit/
│   │   ├── scanner.test.ts              ← Secret redaction unit tests
│   │   ├── buffer.test.ts               ← Offline buffer unit tests
│   │   └── sender.test.ts               ← Sender retry logic unit tests
│   ├── integration/
│   │   └── pipeline.test.ts             ← collector → buffer → sender pipeline
│   └── e2e/
│       └── extension.test.ts            ← Headless VS Code E2E
```

---

## Task 1: Test Infrastructure Setup

**Files:**
- Create: `extension/.mocharc.json`
- Create: `extension/test/fixtures/mock-vscode.ts`
- Create: `extension/test/fixtures/sample-events.ts`
- Modify: `extension/package.json` (add test scripts)

- [ ] **Step 1: Add mocha config**

Create `extension/.mocharc.json`:

```json
{
  "require": ["ts-node/register"],
  "spec": "test/unit/**/*.test.ts",
  "timeout": 10000,
  "reporter": "spec"
}
```

- [ ] **Step 2: Install ts-node for running TypeScript tests directly**

```bash
cd extension
npm install --save-dev ts-node chai @types/chai sinon @types/sinon
```

Expected: packages install without error.

- [ ] **Step 3: Create mock-vscode.ts**

Create `extension/test/fixtures/mock-vscode.ts`:

```typescript
/**
 * Minimal VS Code API stub for unit tests.
 * Only stubs the surface area actually used by the extension modules.
 */

export const workspace = {
  getConfiguration: (_section?: string) => ({
    get: <T>(key: string, defaultValue?: T): T => {
      const defaults: Record<string, unknown> = {
        'gatewayUrl': 'http://localhost:8000',
        'extensionId': '',
      };
      return (defaults[key] ?? defaultValue) as T;
    },
  }),
  workspaceFolders: [{ uri: { fsPath: '/tmp/test-workspace' } }],
};

export const window = {
  showWarningMessage: (_msg: string) => Promise.resolve(undefined),
  showErrorMessage: (_msg: string) => Promise.resolve(undefined),
  showInformationMessage: (_msg: string) => Promise.resolve(undefined),
  createStatusBarItem: () => ({
    text: '',
    show: () => {},
    hide: () => {},
    dispose: () => {},
  }),
};

export const env = {
  machineId: 'test-machine-id-abc123',
};

export const StatusBarAlignment = { Left: 1, Right: 2 };

export const Uri = {
  file: (p: string) => ({ fsPath: p }),
};

export class ExtensionContext {
  globalStorageUri = { fsPath: '/tmp/adt-test-storage' };
  secrets = {
    get: async (_key: string): Promise<string | undefined> => 'ADT-TESTID12',
    store: async (_key: string, _value: string): Promise<void> => {},
    delete: async (_key: string): Promise<void> => {},
  };
  globalState = {
    get: <T>(_key: string): T | undefined => undefined,
    update: async (_key: string, _value: unknown): Promise<void> => {},
  };
  subscriptions: { dispose(): void }[] = [];
}
```

- [ ] **Step 4: Create sample-events.ts**

Create `extension/test/fixtures/sample-events.ts`:

```typescript
/** Synthetic telemetry payloads for use across tests. */

export const NORMAL_TELEMETRY_PAYLOAD = {
  extension_id: 'ADT-TESTID12',
  machine_id: 'test-machine-id',
  native_hwid: 'native-hwid-test',
  sync_type: 'delta',
  wpm: 52.3,
  keystrokes: 1240,
  commands_executed: 18,
  errors_encountered: 3,
  idle_seconds: 45.0,
  copy_paste_count: 5,
  session_duration: 1800,
  timestamp: new Date().toISOString(),
};

export const BOT_TELEMETRY_PAYLOAD = {
  ...NORMAL_TELEMETRY_PAYLOAD,
  wpm: 300.0,
  keystrokes: 50000,
  idle_seconds: 0,
};

export const SECRET_CONTAINING_SNIPPET = `
const apiKey = "sk-proj-abc123xyz456def789ghi012jkl345mno678";
const awsKey = "AKIAIOSFODNN7EXAMPLE";
const password = "password=MySecret123";
`;

export const CLEAN_SNIPPET = `
function add(a: number, b: number): number {
  return a + b;
}
`;
```

- [ ] **Step 5: Update package.json scripts**

In `extension/package.json`, update the `scripts` section:

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js",
    "test:unit": "mocha --require ts-node/register 'test/unit/**/*.test.ts' --timeout 10000",
    "test:integration": "mocha --require ts-node/register 'test/integration/**/*.test.ts' --timeout 30000",
    "test:e2e": "node ./out/test/runTest.js",
    "package": "npm run compile && npx @vscode/vsce package --allow-missing-repository --out ../releases/",
    "package:pre": "npm run compile && npx @vscode/vsce package --pre-release --allow-missing-repository --out ../releases/"
  }
}
```

- [ ] **Step 6: Commit infrastructure**

```bash
cd ..
git add extension/.mocharc.json extension/test/fixtures/ extension/package.json
git commit -m "test(extension): add test infrastructure, mock-vscode, and sample fixtures"
```

---

## Task 2: Scanner Unit Tests

**Files:**
- Create: `extension/test/unit/scanner.test.ts`

- [ ] **Step 1: Write failing tests first**

Create `extension/test/unit/scanner.test.ts`:

```typescript
import { strict as assert } from 'assert';
import { scanForSecrets, containsSecret } from '../../src/secrets/scanner';
import { SECRET_CONTAINING_SNIPPET, CLEAN_SNIPPET } from '../fixtures/sample-events';

describe('scanForSecrets', () => {
  it('redacts OpenAI-style API keys (sk-proj-...)', () => {
    const input = 'const key = "sk-proj-abc123xyz456def789ghi012";';
    const result = scanForSecrets(input);
    assert.ok(!result.includes('sk-proj-'), 'raw key should be redacted');
    assert.ok(result.includes('<<REDACTED:'), 'should contain redaction marker');
  });

  it('redacts AWS access keys (AKIA...)', () => {
    const input = 'aws_access_key = "AKIAIOSFODNN7EXAMPLE"';
    const result = scanForSecrets(input);
    assert.ok(!result.includes('AKIAIOSFODNN7EXAMPLE'));
    assert.ok(result.includes('<<REDACTED:AWS_ACCESS_KEY>>'));
  });

  it('redacts password assignments', () => {
    const input = 'password = "MyVerySecret123"';
    const result = scanForSecrets(input);
    assert.ok(!result.includes('MyVerySecret123'));
  });

  it('redacts MongoDB connection strings', () => {
    const input = 'const uri = "mongodb+srv://user:pass@cluster.mongodb.net/db"';
    const result = scanForSecrets(input);
    assert.ok(!result.includes('user:pass@'));
    assert.ok(result.includes('<<REDACTED:MONGO_URI>>'));
  });

  it('does not modify clean code snippets', () => {
    const result = scanForSecrets(CLEAN_SNIPPET);
    // Clean code should not be redacted (may still trigger HIGH_ENTROPY on long strings)
    assert.ok(!result.includes('<<REDACTED:AWS_ACCESS_KEY>>'));
    assert.ok(!result.includes('<<REDACTED:GITHUB_PAT>>'));
    assert.ok(!result.includes('<<REDACTED:PASSWORD>>'));
  });

  it('redacts all secrets in a multi-secret snippet', () => {
    const result = scanForSecrets(SECRET_CONTAINING_SNIPPET);
    assert.ok(!result.includes('sk-proj-abc123'));
    assert.ok(!result.includes('AKIAIOSFODNN7EXAMPLE'));
    assert.ok(!result.includes('MySecret123'));
  });

  it('returns original string when no secrets present', () => {
    const clean = 'const x = 42; function hello() { return "world"; }';
    const result = scanForSecrets(clean);
    assert.strictEqual(result, clean);
  });

  it('handles empty string without throwing', () => {
    assert.doesNotThrow(() => scanForSecrets(''));
    assert.strictEqual(scanForSecrets(''), '');
  });
});

describe('containsSecret', () => {
  it('returns true for text with AWS key', () => {
    assert.strictEqual(containsSecret('AKIAIOSFODNN7EXAMPLE rest of text'), true);
  });

  it('returns false for clean text', () => {
    assert.strictEqual(containsSecret('const x = 42;'), false);
  });

  it('returns false for empty string', () => {
    assert.strictEqual(containsSecret(''), false);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd extension
npm run test:unit -- --spec 'test/unit/scanner.test.ts'
```

Expected: All tests PASS. If any FAIL, that's a real bug in the scanner — document it.

- [ ] **Step 3: Commit**

```bash
cd ..
git add extension/test/unit/scanner.test.ts
git commit -m "test(extension): unit tests for secret scanner"
```

---

## Task 3: Buffer Unit Tests

**Files:**
- Create: `extension/test/unit/buffer.test.ts`

- [ ] **Step 1: Write buffer tests**

Create `extension/test/unit/buffer.test.ts`:

```typescript
import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TelemetryBuffer, BufferedPayload } from '../../src/telemetry/buffer';
import { ExtensionContext } from '../fixtures/mock-vscode';

function makeTempContext(): ExtensionContext & { globalStorageUri: { fsPath: string } } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-buf-test-'));
  const ctx = new ExtensionContext();
  ctx.globalStorageUri = { fsPath: tmpDir };
  return ctx;
}

describe('TelemetryBuffer', () => {
  let ctx: ExtensionContext;
  let buffer: TelemetryBuffer;

  beforeEach(() => {
    ctx = makeTempContext() as any;
    buffer = new TelemetryBuffer(ctx as any);
  });

  afterEach(() => {
    // Cleanup temp dir
    try {
      const dir = (ctx as any).globalStorageUri.fsPath;
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  });

  it('starts empty', () => {
    assert.strictEqual(buffer.size, 0);
    assert.strictEqual(buffer.isEmpty(), true);
  });

  it('push increases size', () => {
    buffer.push({ event: 'test' });
    assert.strictEqual(buffer.size, 1);
    assert.strictEqual(buffer.isEmpty(), false);
  });

  it('shift pops in FIFO order', () => {
    buffer.push({ id: 1 });
    buffer.push({ id: 2 });
    const first = buffer.shift();
    assert.deepStrictEqual(first, { id: 1 });
    assert.strictEqual(buffer.size, 1);
  });

  it('shift on empty returns undefined', () => {
    assert.strictEqual(buffer.shift(), undefined);
  });

  it('clear empties the buffer', () => {
    buffer.push({ event: 'a' });
    buffer.push({ event: 'b' });
    buffer.clear();
    assert.strictEqual(buffer.size, 0);
    assert.strictEqual(buffer.isEmpty(), true);
  });

  it('evicts oldest entries when over MAX_ENTRIES (1000)', () => {
    for (let i = 0; i < 1005; i++) {
      buffer.push({ seq: i });
    }
    // Should be capped at 1000
    assert.strictEqual(buffer.size, 1000);
    // Oldest 5 should be gone — first entry should now be seq:5
    const first = buffer.shift();
    assert.deepStrictEqual(first, { seq: 5 });
  });

  it('persists to disk and reloads on re-instantiation', () => {
    buffer.push({ persisted: true });
    // Create a new buffer instance pointing at same storage dir — should reload
    const buffer2 = new TelemetryBuffer(ctx as any);
    assert.strictEqual(buffer2.size, 1);
    const entry = buffer2.shift();
    assert.deepStrictEqual(entry, { persisted: true });
  });

  it('replay sends all payloads and returns count', async () => {
    buffer.push({ seq: 1 });
    buffer.push({ seq: 2 });

    const sent: BufferedPayload[] = [];
    const count = await buffer.replay(async (p) => { sent.push(p); });
    assert.strictEqual(count, 2);
    assert.deepStrictEqual(sent, [{ seq: 1 }, { seq: 2 }]);
    assert.strictEqual(buffer.size, 0);
  });

  it('replay stops and re-queues on send failure', async () => {
    buffer.push({ seq: 1 });
    buffer.push({ seq: 2 });

    let callCount = 0;
    const count = await buffer.replay(async (_p) => {
      callCount++;
      if (callCount === 1) throw new Error('network error');
    });

    assert.strictEqual(count, 0);       // none sent successfully
    assert.strictEqual(buffer.size, 2); // both re-queued
  });
});
```

- [ ] **Step 2: Run buffer tests**

```bash
cd extension
npm run test:unit -- --spec 'test/unit/buffer.test.ts'
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
cd ..
git add extension/test/unit/buffer.test.ts
git commit -m "test(extension): unit tests for TelemetryBuffer"
```

---

## Task 4: Sender Unit Tests

**Files:**
- Create: `extension/test/unit/sender.test.ts`

- [ ] **Step 1: Write sender tests**

Create `extension/test/unit/sender.test.ts`:

```typescript
import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as axios from 'axios';

// We test the sender's internal hash and retry logic without instantiating the full class
// (which requires VS Code API). We do this by importing the class with mock-vscode injected.

// Patch the vscode module before importing sender
const vscode = require('../fixtures/mock-vscode');
require.cache[require.resolve('vscode')] = {
  id: 'vscode',
  filename: 'vscode',
  loaded: true,
  exports: vscode,
  parent: null,
  children: [],
  paths: [],
};

import { TelemetrySender } from '../../src/telemetry/sender';
import { ExtensionContext } from '../fixtures/mock-vscode';
import { NORMAL_TELEMETRY_PAYLOAD } from '../fixtures/sample-events';

describe('TelemetrySender — internal helpers', () => {
  let sender: TelemetrySender;
  let ctx: ExtensionContext;
  let axiosStub: sinon.SinonStub;

  beforeEach(() => {
    ctx = new ExtensionContext() as any;
    sender = new TelemetrySender(ctx as any);
    axiosStub = sinon.stub(axios, 'post');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('hashPayload returns a stable string for the same input', () => {
    const hash1 = (sender as any).hashPayload(NORMAL_TELEMETRY_PAYLOAD);
    const hash2 = (sender as any).hashPayload(NORMAL_TELEMETRY_PAYLOAD);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(typeof hash1, 'string');
    assert.ok(hash1.length > 0);
  });

  it('hashPayload returns different strings for different inputs', () => {
    const h1 = (sender as any).hashPayload({ a: 1 });
    const h2 = (sender as any).hashPayload({ a: 2 });
    assert.notStrictEqual(h1, h2);
  });

  it('postPayload calls axios.post with telemetry ingest URL', async () => {
    axiosStub.resolves({ status: 200 });
    await (sender as any).postPayload(NORMAL_TELEMETRY_PAYLOAD);
    assert.ok(axiosStub.calledOnce);
    const [url] = axiosStub.firstCall.args;
    assert.ok(url.includes('/api/v1/telemetry/telemetry/ingest'));
  });

  it('postPayload throws on 401 response (axios throws on non-2xx)', async () => {
    const err = Object.assign(new Error('Unauthorized'), { response: { status: 401 } });
    axiosStub.rejects(err);
    await assert.rejects(
      () => (sender as any).postPayload(NORMAL_TELEMETRY_PAYLOAD),
      /Unauthorized/
    );
  });

  it('stop clears both timeout and handshake timer', () => {
    // Set fake timers
    const fakeTimeout = setTimeout(() => {}, 99999);
    const fakeInterval = setInterval(() => {}, 99999);
    (sender as any).timeout = fakeTimeout;
    (sender as any).handshakeTimer = fakeInterval;

    sender.stop();

    assert.strictEqual((sender as any).timeout, undefined);
    assert.strictEqual((sender as any).handshakeTimer, undefined);
  });

  it('gatewayUrl returns configured value from vscode settings', () => {
    const url = (sender as any).gatewayUrl();
    assert.strictEqual(url, 'http://localhost:8000');
  });
});
```

- [ ] **Step 2: Run sender tests**

```bash
cd extension
npm run test:unit -- --spec 'test/unit/sender.test.ts'
```

Expected: All tests PASS. If the vscode module mock injection fails, the import order needs adjusting — move the `require.cache` patch to a mocha `rootHooks` file.

- [ ] **Step 3: Commit**

```bash
cd ..
git add extension/test/unit/sender.test.ts
git commit -m "test(extension): unit tests for TelemetrySender helpers"
```

---

## Task 5: Integration Pipeline Test

**Files:**
- Create: `extension/test/integration/pipeline.test.ts`

- [ ] **Step 1: Write pipeline integration test**

Create `extension/test/integration/pipeline.test.ts`:

```typescript
/**
 * Integration test: scanner → buffer → (mock sender) pipeline.
 * Does NOT require VS Code or a live server.
 */
import { strict as assert } from 'assert';
import * as sinon from 'sinon';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const vscode = require('../fixtures/mock-vscode');
require.cache[require.resolve('vscode')] = {
  id: 'vscode', filename: 'vscode', loaded: true,
  exports: vscode, parent: null, children: [], paths: [],
};

import { scanForSecrets } from '../../src/secrets/scanner';
import { TelemetryBuffer } from '../../src/telemetry/buffer';
import { ExtensionContext } from '../fixtures/mock-vscode';
import { SECRET_CONTAINING_SNIPPET, NORMAL_TELEMETRY_PAYLOAD } from '../fixtures/sample-events';

describe('Telemetry Pipeline Integration', () => {
  let ctx: ExtensionContext;
  let buffer: TelemetryBuffer;

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-pipe-'));
    ctx = new ExtensionContext() as any;
    (ctx as any).globalStorageUri = { fsPath: tmpDir };
    buffer = new TelemetryBuffer(ctx as any);
  });

  afterEach(() => {
    sinon.restore();
    try {
      fs.rmSync((ctx as any).globalStorageUri.fsPath, { recursive: true, force: true });
    } catch {}
  });

  it('secrets are redacted before payload reaches the buffer', () => {
    const rawSnippet = SECRET_CONTAINING_SNIPPET;
    const redacted = scanForSecrets(rawSnippet);
    const payload = { ...NORMAL_TELEMETRY_PAYLOAD, code_snippet: redacted };

    buffer.push(payload);
    const stored = buffer.shift()!;

    assert.ok(!JSON.stringify(stored).includes('sk-proj-'), 'API key leaked into buffer');
    assert.ok(!JSON.stringify(stored).includes('AKIAIOSFODNN7EXAMPLE'), 'AWS key leaked into buffer');
    assert.ok(!JSON.stringify(stored).includes('MySecret123'), 'password leaked into buffer');
  });

  it('payload with clean snippet passes through without modification', () => {
    const cleanSnippet = 'const x = add(1, 2);';
    const redacted = scanForSecrets(cleanSnippet);
    assert.strictEqual(redacted, cleanSnippet, 'clean snippet should not be modified');

    buffer.push({ ...NORMAL_TELEMETRY_PAYLOAD, code_snippet: redacted });
    const stored = buffer.shift()!;
    assert.strictEqual((stored as any).code_snippet, cleanSnippet);
  });

  it('buffer replay delivers payloads to mock sender in order', async () => {
    const payloads = [{ seq: 1 }, { seq: 2 }, { seq: 3 }];
    payloads.forEach(p => buffer.push(p));

    const received: unknown[] = [];
    const count = await buffer.replay(async (p) => { received.push(p); });

    assert.strictEqual(count, 3);
    assert.deepStrictEqual(received, payloads);
  });

  it('failed send does not lose payload — stays in buffer', async () => {
    buffer.push({ seq: 1 });

    await buffer.replay(async (_p) => { throw new Error('network down'); });

    assert.strictEqual(buffer.size, 1, 'payload should still be in buffer after failed send');
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
cd extension
npm run test:integration
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
cd ..
git add extension/test/integration/
git commit -m "test(extension): integration pipeline tests (scanner → buffer → sender)"
```

---

## Task 6: E2E Test Setup (Headless VS Code)

**Files:**
- Create: `extension/test/runTest.ts`
- Create: `extension/test/e2e/extension.test.ts`

- [ ] **Step 1: Create E2E runner**

Create `extension/test/runTest.ts`:

```typescript
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '../../');
  const extensionTestsPath = path.resolve(__dirname, './e2e/extension.test');

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: ['--disable-extensions', '--no-sandbox'],
  });
}

main().catch(err => {
  console.error('E2E test runner failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Create E2E test**

Create `extension/test/e2e/extension.test.ts`:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('ADT Extension E2E', () => {
  suiteSetup(async () => {
    // Wait for extension to activate
    const ext = vscode.extensions.getExtension('PurpleDrip.adt-extension');
    assert.ok(ext, 'Extension not found — check publisher and name in package.json');
    if (!ext.isActive) {
      await ext.activate();
    }
  });

  test('Extension activates without error', () => {
    const ext = vscode.extensions.getExtension('PurpleDrip.adt-extension');
    assert.ok(ext?.isActive, 'Extension should be active after activation');
  });

  test('ADT register command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('adt.register'), 'adt.register command not found');
  });

  test('ADT status command is registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('adt.status'), 'adt.status command not found');
  });

  test('Extension configuration schema is accessible', () => {
    const config = vscode.workspace.getConfiguration('adt');
    const gatewayUrl = config.get<string>('gatewayUrl');
    assert.ok(typeof gatewayUrl === 'string', 'gatewayUrl config should be a string');
    assert.ok(gatewayUrl.startsWith('http'), 'default gatewayUrl should be an HTTP URL');
  });
});
```

- [ ] **Step 3: Compile and run E2E tests**

```bash
cd extension
npm run compile
npm run test:e2e
```

Expected: VS Code launches headlessly, extension activates, all 4 tests PASS.

If VS Code can't launch in the CI environment (no display), run with:
```bash
DISPLAY=:0 npm run test:e2e
```
Or skip E2E in CI by checking `process.env.CI` in `runTest.ts`.

- [ ] **Step 4: Commit**

```bash
cd ..
git add extension/test/e2e/ extension/test/runTest.ts
git commit -m "test(extension): E2E tests with headless VS Code runner"
```

---

## Task 7: Full Extension Test Run

- [ ] **Step 1: Run all unit tests**

```bash
cd extension && npm run test:unit
```

Expected: All scanner, buffer, sender tests PASS.

- [ ] **Step 2: Run integration tests**

```bash
npm run test:integration
```

Expected: Pipeline tests PASS.

- [ ] **Step 3: Run E2E**

```bash
npm run test:e2e
```

Expected: Extension activates, commands registered.

- [ ] **Step 4: Commit final state**

```bash
cd ..
git add extension/
git commit -m "test(extension): complete unit, integration, and E2E test suite"
```
