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
        const mid = vscode.env.machineId;

        if (!extensionId) {
            console.log("ADT: Telemetry deferred (No connected twin).");
            return;
        }

        // 1. SHEC Protocol Handshake via ExtensionID
        const lastHash = this.context.globalState.get<string>('adt.lastStateHash') || "INIT";
        try {
            const handshake = await axios.post(`${gatewayUrl}/api/v1/telemetry/telemetry/handshake`, null, {
                params: { extension_id: extensionId, current_hash: lastHash, machine_id: mid }
            });

            if (handshake.data.status === "mismatch") {
                console.log("ADT: State Mismatch! Backfilling missed diffs...");
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
                    machine_id: mid,
                    sync_type: "DELTA",
                    session_duration: 30
                });
                
                if (resp.data.status === "ingested") {
                    const newHash = Math.random().toString(36).substring(7);
                    this.context.globalState.update('adt.lastStateHash', newHash);
                }
            } catch (error) {
                console.error("ADT: Telemetry Ingest Failed", error);
            }
        }, 30000);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
