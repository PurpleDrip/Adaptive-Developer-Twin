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
        const existingId = await context.secrets.get('adt.extensionId');
        if (existingId) {
            const confirm = await vscode.window.showWarningMessage(
                "This machine is already linked to a twin. Connecting a new ID will overwrite the previous one. Proceed?",
                "Yes", "No"
            );
            if (confirm !== "Yes") return;
        }

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
                    
                    // Fetch user info for UI
                    const userResp = await axios.post(`${gatewayUrl}/api/v1/auth/users/validate-extension?extension_id=${extensionId}&machine_id=${mid}`);
                    await context.secrets.store('adt.userId', userResp.data.user_id);
                    
                    vscode.window.showInformationMessage(`ADT: Handshake Success! Twin linked to this hardware.`);
                    statusBarItem.text = "$(pulse) ADT: Connected";
                    
                    // Restart sender
                    sender.stop();
                    sender.start();
                }
            } catch (e: any) {
                const msg = e.response?.data?.detail || "Handshake failed. Hardware mismatch or invalid ID.";
                vscode.window.showErrorMessage(`ADT Handshake Error: ${msg}`);
            }
        });
    });

    context.subscriptions.push(disposableConnect);

    // 5. Task Notification Listener (Polling every 5 minutes)
    setInterval(async () => {
        const userId = await context.secrets.get('adt.userId');
        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl');

        if (!userId) return;

        try {
            const resp = await axios.get(`${gatewayUrl}/api/v1/task/user/${userId}`);
            const tasks = resp.data;
            const openTasks = tasks.filter((t: any) => t.status === "assigned");
            
            if (openTasks.length > 0) {
                vscode.window.showInformationMessage(`ADT: You have ${openTasks.length} pending tasks assigned!`, "View Tasks").then(selection => {
                    if (selection === "View Tasks") {
                        vscode.env.openExternal(vscode.Uri.parse("http://localhost:3000/tasks"));
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
