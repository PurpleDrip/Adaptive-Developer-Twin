import * as vscode from 'vscode';
import axios from 'axios';
import { TelemetryCollector } from './collector';
import { createWorkspaceSnapshot } from './snapshotter';

export class TelemetrySender {
    private timeout: ReturnType<typeof setTimeout> | undefined;
    private collector: TelemetryCollector;
    private context: vscode.ExtensionContext;
    private isFirstTick = true;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.collector = new TelemetryCollector();
    }

    // ─── Config ───────────────────────────────────────────────────────────────

    private gatewayUrl(): string {
        return vscode.workspace.getConfiguration('adt').get<string>('gatewayUrl') || 'http://127.0.0.1:8000';
    }

    private async fetchIntervalSeconds(): Promise<number> {
        try {
            const resp = await axios.get(
                `${this.gatewayUrl()}/api/v1/monitoring/system-config`,
                { timeout: 3000 }
            );
            return Number(resp.data?.heartbeat_interval_seconds) || 30;
        } catch {
            return 30;
        }
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    public async start() {
        const extensionId = await this.context.secrets.get('adt.extensionId');
        if (!extensionId) {
            vscode.window.showWarningMessage('ADT: Telemetry deferred — no Extension ID connected.');
            return;
        }

        const mid = vscode.env.machineId;

        // SHEC Protocol Handshake
        const lastHash = this.context.globalState.get<string>('adt.lastStateHash') || 'INIT';
        try {
            const handshake = await axios.post(
                `${this.gatewayUrl()}/api/v1/telemetry/telemetry/handshake`,
                null,
                { params: { extension_id: extensionId, current_hash: lastHash, machine_id: mid } }
            );
            if (handshake.data.status === 'mismatch') {
                vscode.window.showWarningMessage('ADT: State mismatch detected — backfilling missed diffs…');
            }
        } catch {
            vscode.window.showWarningMessage('ADT: SHEC handshake failed — proceeding with standard telemetry.');
        }

        vscode.window.showWarningMessage('ADT: Monitoring active — SHEC continuous sync started.');
        this.isFirstTick = true;
        this.scheduleNext();
    }

    public stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }

    /** Called by extension.ts on deactivate to flush a FINAL snapshot. */
    public async sendFinalSync() {
        const extensionId = await this.context.secrets.get('adt.extensionId');
        if (!extensionId) return;

        const data = this.collector.collect();
        try {
            await axios.post(`${this.gatewayUrl()}/api/v1/telemetry/telemetry/ingest`, {
                ...data,
                extension_id: extensionId,
                machine_id: vscode.env.machineId,
                sync_type: 'final',
            }, { timeout: 5000 });
            vscode.window.showWarningMessage('ADT: Final session sync completed.');
        } catch {
            vscode.window.showWarningMessage('ADT: Final sync failed — session data may be incomplete.');
        }
    }

    // ─── Core tick loop ───────────────────────────────────────────────────────

    private scheduleNext() {
        this.fetchIntervalSeconds().then(secs => {
            this.timeout = setTimeout(() => this.tickAndReschedule(), secs * 1000);
        }).catch(() => {
            this.timeout = setTimeout(() => this.tickAndReschedule(), 30_000);
        });
    }

    private async tickAndReschedule() {
        await this.sendHeartbeat();
        this.scheduleNext();
    }

    private async sendHeartbeat() {
        const extensionId = await this.context.secrets.get('adt.extensionId');
        if (!extensionId) return;

        const data = this.collector.collect();
        const mid = vscode.env.machineId;

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
            machine_id: mid,
            sync_type: syncType,
        };

        if (snapshotB64) {
            payload.workspace_snapshot_url = snapshotB64;
        }

        try {
            const resp = await axios.post(
                `${this.gatewayUrl()}/api/v1/telemetry/telemetry/ingest`,
                payload,
                { timeout: 10_000 }
            );
            if (resp.data.status === 'ingested') {
                const newHash = Math.random().toString(36).substring(7);
                this.context.globalState.update('adt.lastStateHash', newHash);
            }
        } catch (error: any) {
            vscode.window.showWarningMessage(
                `ADT: Heartbeat failed — ${error?.response?.data?.detail || error?.message || 'network error'}`
            );
        }
    }
}
