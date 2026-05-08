import * as vscode from 'vscode';
import axios from 'axios';
import { TelemetrySender } from './telemetry/sender';

let sender: TelemetrySender;
let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
    console.log('ADT Extension is now active.');
    
    // 1. Initialize Telemetry
    sender = new TelemetrySender(context);
    sender.start();

    // 2. Proactive Registration Check
    const extensionId = await context.secrets.get('adt.extensionId');
    if (!extensionId) {
        vscode.window.showInformationMessage(
            "Welcome to ADT! Please connect your twin to start monitoring.",
            "Connect Now"
        ).then(selection => {
            if (selection === "Connect Now") {
                vscode.commands.executeCommand('adt.connectAccount');
            }
        });
    }

    // 3. Setup Status Bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = extensionId ? "$(pulse) ADT: Connected" : "$(alert) ADT: Disconnected";
    statusBarItem.tooltip = extensionId ? "ADT is monitoring your twin" : "Please connect your Extension ID";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 4. Register Handshake Command
    let disposableConnect = vscode.commands.registerCommand('adt.connectAccount', async () => {
        const extensionId = await vscode.window.showInputBox({ 
            prompt: "Enter your ADT Extension ID (from the registration page)",
            placeHolder: "ADT-XXXXXX",
            ignoreFocusOut: true
        });

        if (!extensionId) return;

        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl');
        const mid = vscode.env.machineId;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "ADT: Performing Hardware Handshake...",
            cancellable: false
        }, async () => {
            try {
                const resp = await axios.post(`${gatewayUrl}/api/v1/auth/users/hardware-lock?extension_id=${extensionId}&machine_id=${mid}`);

                if (resp.data.status === "locked" || resp.data.status === "verified") {
                    await context.secrets.store('adt.extensionId', extensionId);
                    
                    vscode.window.showInformationMessage(`ADT: Handshake Success! Twin linked to this hardware.`);
                    statusBarItem.text = "$(pulse) ADT: Connected";
                    
                    sender.stop();
                    sender.start();
                }
            } catch (e: any) {
                vscode.window.showErrorMessage(`ADT Handshake Error: Invalid ID or Hardware Lock Violation.`);
            }
        });
    });

    context.subscriptions.push(disposableConnect);

    // 5. Task Notification Listener (Polling every 5 minutes via ExtensionID)
    setInterval(async () => {
        const extensionId = await context.secrets.get('adt.extensionId');
        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl');

        if (!extensionId) return;

        try {
            const mid = vscode.env.machineId;
            // Updated to use extension_id and machine_id for hardware lock enforcement
            const resp = await axios.get(`${gatewayUrl}/api/v1/task/tasks/user-by-extension/${extensionId}`, {
                params: { machine_id: mid }
            });
            const tasks = resp.data;
            const openTasks = tasks.filter((t: any) => t.status === "assigned");
            
            if (openTasks.length > 0) {
                vscode.window.showInformationMessage(`ADT: You have ${openTasks.length} pending tasks assigned!`, "View Tasks").then(selection => {
                    if (selection === "View Tasks") {
                        vscode.env.openExternal(vscode.Uri.parse("http://127.0.0.1:3000/dashboard"));
                    }
                });
            }
        } catch (e) {
            console.error("ADT: Failed to poll tasks");
        }
    }, 300000);
}

export function deactivate() {
    if (sender) sender.stop();
}
