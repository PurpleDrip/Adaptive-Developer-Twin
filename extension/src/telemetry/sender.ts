import * as vscode from 'vscode';
import axios from 'axios';
import { TelemetryCollector } from './collector';

export class TelemetrySender {
    private interval: NodeJS.Timeout | undefined;
    private collector: TelemetryCollector;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.collector = new TelemetryCollector();
    }

    public async start() {
        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl');
        
        const extensionId = await this.context.secrets.get('adt.extensionId');
        const userId = await this.context.secrets.get('adt.userId');
        const mid = vscode.env.machineId;

        if (!extensionId || !userId) {
            console.log("ADT: Telemetry deferred (No connected twin).");
            return;
        }

        // 1. SHEC Protocol Handshake (Detect Offline/Overnight Activity)
        const lastHash = this.context.globalState.get<string>('adt.lastStateHash') || "INIT";
        try {
            const handshake = await axios.post(`${gatewayUrl}/api/v1/telemetry/telemetry/handshake`, null, {
                params: { user_id: userId, current_hash: lastHash }
            });

            if (handshake.data.status === "mismatch") {
                console.log("ADT: State Mismatch! Backfilling missed diffs...");
                // In a real system, we'd trigger a git-diff based backfill here
            }
        } catch (e) {
            console.error("ADT: Handshake failed, proceeding with standard telemetry.");
        }

        console.log("ADT Telemetry Sender: CONTINUOUS_SHEC Mode Active.");
        
        this.interval = setInterval(async () => {
            const data = this.collector.collect();
            
            try {
                const resp = await axios.post(`${gatewayUrl}/api/v1/telemetry/telemetry/ingest`, {
                    ...data,
                    extension_id: extensionId,
                    user_id: userId,
                    machine_id: mid,
                    sync_type: "DELTA",
                    session_duration: 30
                });
                
                // Update local SHEC state
                if (resp.data.status === "ingested") {
                    const newHash = Math.random().toString(36).substring(7); // Simulate new hash
                    this.context.globalState.update('adt.lastStateHash', newHash);
                }
            } catch (error) {
                console.error("ADT: Telemetry Ingest Failed (Hardware Lock active?)", error);
            }
        }, 30000);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
