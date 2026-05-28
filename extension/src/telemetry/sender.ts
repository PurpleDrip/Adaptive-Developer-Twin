import * as vscode from 'vscode';
import axios from 'axios';
import { machineIdSync } from 'node-machine-id';
import { TelemetryCollector } from './collector';
import { TelemetryBuffer, BufferedPayload } from './buffer';
import { createWorkspaceSnapshot } from './snapshotter';

interface RuntimeConfig {
    intervalSeconds: number;
    isPaused: boolean;
    handshakeIntervalMs: number;
}

export class TelemetrySender {
    private timeout: ReturnType<typeof setTimeout> | undefined;
    private handshakeTimer: ReturnType<typeof setInterval> | undefined;
    private collector: TelemetryCollector;
    private buffer: TelemetryBuffer;
    private isFirstTick = true;
    private lastIntervalSeconds = 30;
    private lastHandshakeIntervalMs = 5000;
    private isPaused = false;

    constructor(private readonly context: vscode.ExtensionContext) {
        this.collector = new TelemetryCollector();
        this.buffer = new TelemetryBuffer(context);
    }

    // ── Config ────────────────────────────────────────────────────────────────

    private gatewayUrl(): string {
        return vscode.workspace.getConfiguration('adt').get<string>('gatewayUrl') || 'http://127.0.0.1:8000';
    }

    private getMachineIds(): { vscodeMachineId: string; nativeHwid: string } {
        return {
            vscodeMachineId: vscode.env.machineId,
            nativeHwid: (() => { try { return machineIdSync(); } catch { return vscode.env.machineId; } })(),
        };
    }

    private async fetchRuntimeConfig(): Promise<RuntimeConfig> {
        try {
            const resp = await axios.get(
                `${this.gatewayUrl()}/api/v1/monitoring/system-config`,
                { timeout: 3000 }
            );
            return {
                intervalSeconds:    Number(resp.data?.heartbeat_interval_seconds) || 30,
                isPaused:           Boolean(resp.data?.is_monitoring_paused),
                handshakeIntervalMs: Number(resp.data?.shec_handshake_interval_ms) || 5000,
            };
        } catch {
            return {
                intervalSeconds:    this.lastIntervalSeconds,
                isPaused:           this.isPaused,
                handshakeIntervalMs: this.lastHandshakeIntervalMs,
            };
        }
    }

    // Deterministic hash of the payload for state continuity tracking
    private hashPayload(payload: Record<string, unknown>): string {
        const str = JSON.stringify(payload, Object.keys(payload).sort());
        let h = 5381;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) + h) ^ str.charCodeAt(i);
            h = h >>> 0; // keep unsigned
        }
        return h.toString(36);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    public async start() {
        const extensionId = await this.context.secrets.get('adt.extensionId');
        if (!extensionId) {
            vscode.window.showWarningMessage('ADT: Telemetry deferred — no Extension ID connected.');
            return;
        }

        await this.runHandshake();

        vscode.window.showWarningMessage('ADT: Monitoring active — SHEC continuous sync started.');
        this.isFirstTick = true;
        this.resetHandshakeTimer(this.lastHandshakeIntervalMs);
        this.scheduleNext();

        if (!this.buffer.isEmpty()) {
            vscode.window.showWarningMessage(`ADT: Replaying ${this.buffer.size} buffered event(s) from offline period…`);
            await this.buffer.replay(p => this.postPayload(p));
        }
    }

    public stop() {
        if (this.timeout) { clearTimeout(this.timeout); this.timeout = undefined; }
        if (this.handshakeTimer) { clearInterval(this.handshakeTimer); this.handshakeTimer = undefined; }
    }

    // ── SHEC periodic re-handshake ────────────────────────────────────────────

    private resetHandshakeTimer(intervalMs: number) {
        if (this.handshakeTimer) clearInterval(this.handshakeTimer);
        this.handshakeTimer = setInterval(() => this.runHandshake(), intervalMs);
    }

    private async runHandshake() {
        const extensionId = await this.context.secrets.get('adt.extensionId');
        if (!extensionId) return;
        const { vscodeMachineId, nativeHwid } = this.getMachineIds();
        const lastHash = this.context.globalState.get<string>('adt.lastStateHash') || 'INIT';
        try {
            const resp = await axios.post(
                `${this.gatewayUrl()}/api/v1/telemetry/telemetry/handshake`, null,
                { params: { extension_id: extensionId, current_hash: lastHash, machine_id: vscodeMachineId, native_hwid: nativeHwid } }
            );
            if (resp.data.status === 'mismatch') {
                vscode.window.showWarningMessage('ADT: State mismatch detected — backfilling missed diffs…');
            }
        } catch {
            // silent — network may be briefly unavailable
        }
    }

    public async sendFinalSync() {
        const extensionId = await this.context.secrets.get('adt.extensionId');
        if (!extensionId) return;

        const data = await this.collector.collect();
        const { vscodeMachineId, nativeHwid } = this.getMachineIds();
        const payload: Record<string, unknown> = {
            ...data,
            extension_id: extensionId,
            machine_id: vscodeMachineId,
            native_hwid: nativeHwid,
            sync_type: 'final',
        };

        try {
            await this.postPayload(payload);
            vscode.window.showWarningMessage('ADT: Final session sync completed.');
        } catch {
            // Buffer for next session
            this.buffer.push(payload);
            vscode.window.showWarningMessage('ADT: Final sync failed — buffered for next session.');
        }
    }

    // ── Core tick loop ────────────────────────────────────────────────────────

    private scheduleNext() {
        this.fetchRuntimeConfig().then(cfg => {
            const { intervalSeconds, isPaused, handshakeIntervalMs } = cfg;

            if (intervalSeconds !== this.lastIntervalSeconds) {
                vscode.window.showWarningMessage(
                    `ADT: Heartbeat interval updated ${this.lastIntervalSeconds}s → ${intervalSeconds}s`
                );
                this.lastIntervalSeconds = intervalSeconds;
            }

            if (isPaused && !this.isPaused) {
                vscode.window.showWarningMessage('ADT: Monitoring paused by administrator.');
            } else if (!isPaused && this.isPaused) {
                vscode.window.showWarningMessage('ADT: Monitoring resumed.');
            }
            this.isPaused = isPaused;

            if (handshakeIntervalMs !== this.lastHandshakeIntervalMs) {
                this.lastHandshakeIntervalMs = handshakeIntervalMs;
                this.resetHandshakeTimer(handshakeIntervalMs);
            }

            this.timeout = setTimeout(() => this.tickAndReschedule(), intervalSeconds * 1000);
        }).catch(() => {
            this.timeout = setTimeout(() => this.tickAndReschedule(), this.lastIntervalSeconds * 1000);
        });
    }

    private async tickAndReschedule() {
        if (!this.isPaused) {
            await this.sendHeartbeat();
        }
        this.scheduleNext();
    }

    private async sendHeartbeat() {
        const extensionId = await this.context.secrets.get('adt.extensionId');
        if (!extensionId) return;

        const data = await this.collector.collect();
        const { vscodeMachineId, nativeHwid } = this.getMachineIds();

        let syncType = 'delta';
        let snapshotB64: string | null = null;

        if (this.isFirstTick) {
            this.isFirstTick = false;
            syncType = 'initial';
            vscode.window.showWarningMessage('ADT: INITIAL sync — capturing workspace snapshot…');
            snapshotB64 = await createWorkspaceSnapshot();
        }

        const payload: Record<string, unknown> = {
            ...data,
            extension_id: extensionId,
            machine_id: vscodeMachineId,
            native_hwid: nativeHwid,
            sync_type: syncType,
        };

        if (snapshotB64) {
            payload.workspace_snapshot_url = snapshotB64;
        }

        try {
            await this.postPayload(payload);
            const newHash = this.hashPayload(payload);
            this.context.globalState.update('adt.lastStateHash', newHash);

            // Attempt to drain buffer on successful send
            if (!this.buffer.isEmpty()) {
                await this.buffer.replay(p => this.postPayload(p));
            }
        } catch (error: any) {
            // Buffer failed payload for replay
            this.buffer.push(payload);
            const remaining = this.buffer.size;
            vscode.window.showWarningMessage(
                `ADT: Heartbeat failed — buffered (${remaining} queued). ` +
                `${error?.response?.data?.detail || error?.message || 'network error'}`
            );
        }
    }

    private async postPayload(payload: BufferedPayload): Promise<void> {
        await axios.post(
            `${this.gatewayUrl()}/api/v1/telemetry/telemetry/ingest`,
            payload,
            { timeout: 10_000 }
        );
    }
}
