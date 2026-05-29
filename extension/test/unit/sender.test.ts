/**
 * Unit tests for TelemetrySender internal helpers.
 *
 * Approach: test/setup.js is loaded via --require before tests run, which
 * registers a Module._resolveFilename hook mapping 'vscode' → mock-vscode.ts.
 * This means we can import sender.ts directly without proxyquire.
 */
import { expect } from 'chai';
import * as sinon from 'sinon';
import axios from 'axios';
import { TelemetrySender } from '../../src/telemetry/sender';
import { ExtensionContext } from '../fixtures/mock-vscode';
import { NORMAL_TELEMETRY_PAYLOAD } from '../fixtures/sample-events';

describe('TelemetrySender — internal helpers', () => {
  let sender: any;
  let ctx: any;
  let axiosStub: sinon.SinonStub;

  beforeEach(() => {
    ctx = new ExtensionContext();
    sender = new TelemetrySender(ctx);
    axiosStub = sinon.stub(axios, 'post');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('hashPayload returns a stable string for the same input', () => {
    const hash1 = sender.hashPayload(NORMAL_TELEMETRY_PAYLOAD);
    const hash2 = sender.hashPayload(NORMAL_TELEMETRY_PAYLOAD);
    expect(hash1).to.equal(hash2);
    expect(hash1).to.be.a('string');
    expect(hash1.length).to.be.greaterThan(0);
  });

  it('hashPayload returns different strings for different inputs', () => {
    expect(sender.hashPayload({ a: 1 })).to.not.equal(sender.hashPayload({ a: 2 }));
  });

  it('postPayload calls axios.post with telemetry ingest URL', async () => {
    axiosStub.resolves({ status: 200 });
    await sender.postPayload(NORMAL_TELEMETRY_PAYLOAD);
    expect(axiosStub.calledOnce).to.equal(true);
    expect(axiosStub.firstCall.args[0]).to.include('/api/v1/telemetry/telemetry/ingest');
  });

  it('postPayload throws when axios rejects', async () => {
    axiosStub.rejects(new Error('Unauthorized'));
    let threw = false;
    try {
      await sender.postPayload(NORMAL_TELEMETRY_PAYLOAD);
    } catch (e: any) {
      threw = true;
      expect(e.message).to.include('Unauthorized');
    }
    expect(threw).to.equal(true);
  });

  it('stop clears both timeout and handshake timer', () => {
    const fakeTimeout = setTimeout(() => {}, 99999);
    const fakeInterval = setInterval(() => {}, 99999);
    sender.timeout = fakeTimeout;
    sender.handshakeTimer = fakeInterval;
    sender.stop();
    expect(sender.timeout).to.equal(undefined);
    expect(sender.handshakeTimer).to.equal(undefined);
  });

  it('gatewayUrl returns configured value from vscode settings', () => {
    // mockVscode.workspace.getConfiguration('adt').get('gatewayUrl') → 'http://localhost:8000'
    expect(sender.gatewayUrl()).to.equal('http://localhost:8000');
  });
});
