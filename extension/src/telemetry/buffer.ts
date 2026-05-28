/**
 * Offline telemetry buffer — persists failed heartbeat payloads to disk
 * (using VS Code's globalStorageUri) and replays them on reconnect.
 *
 * Implements: Extension - Offline Buffer (P1)
 * - Buffer capped at MAX_ENTRIES; oldest entries evicted when full
 * - Replay uses exponential back-off (1s → 2s → 4s … capped at 60s)
 * - Status bar badge shows "buffered: N" when non-empty
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const MAX_ENTRIES = 1000;
const BUFFER_FILE = 'adt_telemetry_buffer.json';

export type BufferedPayload = Record<string, unknown>;

export class TelemetryBuffer {
    private readonly bufferPath: string;
    private entries: BufferedPayload[] = [];

    constructor(private readonly context: vscode.ExtensionContext) {
        const storageDir = context.globalStorageUri.fsPath;
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        this.bufferPath = path.join(storageDir, BUFFER_FILE);
        this.load();
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    private load() {
        try {
            if (fs.existsSync(this.bufferPath)) {
                const raw = fs.readFileSync(this.bufferPath, 'utf8');
                this.entries = JSON.parse(raw) ?? [];
            }
        } catch {
            this.entries = [];
        }
    }

    private save() {
        try {
            fs.writeFileSync(this.bufferPath, JSON.stringify(this.entries), 'utf8');
        } catch {
            // Non-fatal — buffer lives in-memory if disk write fails
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public push(payload: BufferedPayload) {
        this.entries.push(payload);
        // Evict oldest if over cap
        if (this.entries.length > MAX_ENTRIES) {
            this.entries = this.entries.slice(this.entries.length - MAX_ENTRIES);
        }
        this.save();
    }

    public get size(): number {
        return this.entries.length;
    }

    public isEmpty(): boolean {
        return this.entries.length === 0;
    }

    /** Pops the oldest entry (FIFO replay order). */
    public shift(): BufferedPayload | undefined {
        const entry = this.entries.shift();
        this.save();
        return entry;
    }

    public clear() {
        this.entries = [];
        this.save();
    }

    /**
     * Attempts to replay all buffered payloads in FIFO order.
     * Returns how many were successfully sent.
     * Leaves failed payloads in the buffer for the next replay attempt.
     */
    public async replay(
        send: (payload: BufferedPayload) => Promise<void>,
        statusBarItem?: vscode.StatusBarItem
    ): Promise<number> {
        if (this.isEmpty()) return 0;

        let sent = 0;
        let delayMs = 1000;

        while (!this.isEmpty()) {
            const payload = this.shift()!;
            try {
                await send(payload);
                sent++;
                delayMs = 1000; // reset back-off on success
            } catch {
                // Re-queue at front and stop replay — try again next tick
                this.entries.unshift(payload);
                this.save();
                break;
            }
            await new Promise(r => setTimeout(r, delayMs));
            delayMs = Math.min(60_000, delayMs * 2);
        }

        if (statusBarItem) {
            const remaining = this.size;
            if (remaining > 0) {
                statusBarItem.text = `$(warning) ADT: buffered: ${remaining}`;
            }
        }

        return sent;
    }
}
