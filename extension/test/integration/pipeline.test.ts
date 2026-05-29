/**
 * Integration tests for the telemetry pipeline: secret scanning → buffer → replay.
 *
 * Approach: test/setup.js maps 'vscode' → mock-vscode.ts globally, so we can
 * import buffer.ts and scanner.ts directly without proxyquire.
 */
import { expect } from 'chai';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { TelemetryBuffer } from '../../src/telemetry/buffer';
import { scanForSecrets } from '../../src/secrets/scanner';
import { ExtensionContext } from '../fixtures/mock-vscode';
import { SECRET_CONTAINING_SNIPPET, NORMAL_TELEMETRY_PAYLOAD } from '../fixtures/sample-events';

describe('Telemetry Pipeline Integration', () => {
  let ctx: any;
  let buffer: TelemetryBuffer;

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-pipe-'));
    ctx = new ExtensionContext();
    (ctx as any).globalStorageUri = { fsPath: tmpDir };
    buffer = new TelemetryBuffer(ctx);
  });

  afterEach(() => {
    try {
      fs.rmSync((ctx as any).globalStorageUri.fsPath, { recursive: true, force: true });
    } catch {}
  });

  it('secrets are redacted before payload reaches the buffer', () => {
    const redacted = scanForSecrets(SECRET_CONTAINING_SNIPPET);
    const payload = { ...NORMAL_TELEMETRY_PAYLOAD, code_snippet: redacted };
    buffer.push(payload);
    const stored = buffer.shift()!;
    expect(JSON.stringify(stored)).to.not.include('AKIAIOSFODNN7EXAMPLE');
    expect(JSON.stringify(stored)).to.not.include('MySecret123');
  });

  it('payload with clean snippet passes through without modification', () => {
    const cleanSnippet = 'const x = add(1, 2);';
    expect(scanForSecrets(cleanSnippet)).to.equal(cleanSnippet);
    buffer.push({ ...NORMAL_TELEMETRY_PAYLOAD, code_snippet: cleanSnippet });
    const stored = buffer.shift()!;
    expect((stored as any).code_snippet).to.equal(cleanSnippet);
  });

  it('buffer replay delivers payloads to mock sender in order', async () => {
    const payloads = [{ seq: 1 }, { seq: 2 }, { seq: 3 }];
    payloads.forEach((p: any) => buffer.push(p));
    const received: any[] = [];
    const count = await buffer.replay(async (p: any) => { received.push(p); });
    expect(count).to.equal(3);
    expect(received).to.deep.equal(payloads);
  });

  it('failed send does not lose payload — stays in buffer', async () => {
    buffer.push({ seq: 1 });
    await buffer.replay(async () => { throw new Error('network down'); });
    expect(buffer.size).to.equal(1);
  });
});
