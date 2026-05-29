/**
 * Unit tests for TelemetryBuffer.
 *
 * Approach: test/setup.js is loaded via --require before tests run, which
 * registers a Module._resolveFilename hook mapping 'vscode' → mock-vscode.ts.
 * This means we can import buffer.ts directly without proxyquire.
 */
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TelemetryBuffer, BufferedPayload } from '../../src/telemetry/buffer';
import { ExtensionContext } from '../fixtures/mock-vscode';

function makeTempContext(): any {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adt-buf-test-'));
  const ctx = new ExtensionContext();
  (ctx as any).globalStorageUri = { fsPath: tmpDir };
  return ctx;
}

describe('TelemetryBuffer', () => {
  let ctx: any;
  let buffer: TelemetryBuffer;

  beforeEach(() => {
    ctx = makeTempContext();
    buffer = new TelemetryBuffer(ctx);
  });

  afterEach(() => {
    try {
      fs.rmSync(ctx.globalStorageUri.fsPath, { recursive: true, force: true });
    } catch {}
  });

  it('starts empty', () => {
    expect(buffer.size).to.equal(0);
    expect(buffer.isEmpty()).to.equal(true);
  });

  it('push increases size', () => {
    buffer.push({ event: 'test' });
    expect(buffer.size).to.equal(1);
    expect(buffer.isEmpty()).to.equal(false);
  });

  it('shift pops in FIFO order', () => {
    buffer.push({ id: 1 });
    buffer.push({ id: 2 });
    expect(buffer.shift()).to.deep.equal({ id: 1 });
    expect(buffer.size).to.equal(1);
  });

  it('shift on empty returns undefined', () => {
    expect(buffer.shift()).to.equal(undefined);
  });

  it('clear empties the buffer', () => {
    buffer.push({ event: 'a' });
    buffer.push({ event: 'b' });
    buffer.clear();
    expect(buffer.size).to.equal(0);
  });

  it('evicts oldest entries when over MAX_ENTRIES (1000)', () => {
    for (let i = 0; i < 1005; i++) {
      buffer.push({ seq: i });
    }
    expect(buffer.size).to.equal(1000);
    expect(buffer.shift()).to.deep.equal({ seq: 5 });
  });

  it('persists to disk and reloads on re-instantiation', () => {
    buffer.push({ persisted: true });
    const buffer2 = new TelemetryBuffer(ctx);
    expect(buffer2.size).to.equal(1);
    expect(buffer2.shift()).to.deep.equal({ persisted: true });
  });

  it('replay sends all payloads and returns count', async () => {
    buffer.push({ seq: 1 });
    buffer.push({ seq: 2 });
    const sent: BufferedPayload[] = [];
    const count = await buffer.replay(async (p) => { sent.push(p); });
    expect(count).to.equal(2);
    expect(sent).to.deep.equal([{ seq: 1 }, { seq: 2 }]);
    expect(buffer.size).to.equal(0);
  });

  it('replay stops and re-queues on send failure', async () => {
    buffer.push({ seq: 1 });
    buffer.push({ seq: 2 });
    let callCount = 0;
    const count = await buffer.replay(async () => {
      callCount++;
      throw new Error('network error');
    });
    expect(count).to.equal(0);
    expect(buffer.size).to.equal(2);
  });
});
