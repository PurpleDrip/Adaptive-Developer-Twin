import * as vscode from 'vscode';
import axios from 'axios';
import { TelemetryCollector, TelemetryData } from './collector';

export class TelemetrySender {
    private interval: NodeJS.Timeout | undefined;
    private collector: TelemetryCollector;

    constructor() {
        this.collector = new TelemetryCollector();
    }

    public start() {
        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl');
        const extensionId = config.get<string>('extensionId');
        const userId = config.get<string>('userId');

        if (!extensionId || !userId) {
            vscode.window.showWarningMessage("ADT: Please register first to enable telemetry.");
            return;
        }

        console.log("ADT Telemetry Sender started.");
        
        // Send data every 30 seconds
        this.interval = setInterval(async () => {
            const data = this.collector.collect();
            
            try {
                await axios.post(`${gatewayUrl}/api/v1/telemetry/ingest`, {
                    ...data,
                    extension_id: extensionId,
                    user_id: userId,
                    session_duration: 30 // Approx
                });
                console.log("ADT: Telemetry pushed successfully.");
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
