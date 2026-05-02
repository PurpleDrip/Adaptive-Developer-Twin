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
        
        // Read from secure secrets
        const extensionId = await this.context.secrets.get('adt.extensionId');
        const userId = await this.context.secrets.get('adt.userId');
        const mid = vscode.env.machineId;

        if (!extensionId || !userId) {
            console.log("ADT: Telemetry deferred (No connected twin).");
            return;
        }

        console.log("ADT Telemetry Sender started.");
        
        this.interval = setInterval(async () => {
            const data = this.collector.collect();
            
            try {
                await axios.post(`${gatewayUrl}/api/v1/telemetry/ingest`, {
                    ...data,
                    extension_id: extensionId,
                    user_id: userId,
                    machine_id: mid,
                    session_duration: 30
                });
                console.log("ADT: Telemetry pushed (Handshake Verified).");
            } catch (error) {
                console.error("ADT: Failed to push telemetry", error);
            }
        }, 30000);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
