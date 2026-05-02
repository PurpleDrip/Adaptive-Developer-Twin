import * as vscode from 'vscode';
import axios from 'axios';
import { TelemetrySender } from './telemetry/sender';

let sender: TelemetrySender;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('ADT Extension is now active.');

    // 1. Initialize Telemetry
    sender = new TelemetrySender();
    sender.start();

    // 2. Setup Status Bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(pulse) ADT: Active";
    statusBarItem.tooltip = "Adaptive Developer Twin is monitoring";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 3. Register Commands
    let disposableReg = vscode.commands.registerCommand('adt.register', async () => {
        // In a real extension, this would open a WebView. 
        // For the demo, we use input boxes.
        const name = await vscode.window.showInputBox({ prompt: "Enter Full Name" });
        const email = await vscode.window.showInputBox({ prompt: "Enter Email" });
        const username = await vscode.window.showInputBox({ prompt: "Enter Username" });
        
        if (!name || !email || !username) return;

        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl');

        try {
            const resp = await axios.post(`${gatewayUrl}/api/v1/auth/users/register`, {
                name, email, username,
                phone_number: "0000000000",
                gender: "Other",
                password: "password123",
                strong_domains: ["backend"],
                experience_level: "Junior"
            });

            if (resp.data.status === "registered") {
                await config.update('extensionId', resp.data.extension_id, vscode.ConfigurationTarget.Global);
                await config.update('userId', resp.data.user_id, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`ADT: Successfully registered! ID: ${resp.data.extension_id}`);
                
                // Restart sender with new IDs
                sender.stop();
                sender.start();
            }
        } catch (e) {
            vscode.window.showErrorMessage("ADT Registration failed. Check Gateway connection.");
        }
    });

    context.subscriptions.push(disposableReg);

    // 4. Task Notification Listener (Polling every 5 minutes)
    setInterval(async () => {
        const config = vscode.workspace.getConfiguration('adt');
        const userId = config.get<string>('userId');
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
