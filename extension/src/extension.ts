import * as vscode from 'vscode';
import axios from 'axios';
import { TelemetrySender } from './telemetry/sender';

let sender: TelemetrySender;
let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
    vscode.window.showWarningMessage('ADT Extension activated.');

    // 1. Show machine ID for dev-phase hardware locking
    const mid = vscode.env.machineId;
    vscode.window.showWarningMessage(`[ADT Dev] Machine ID: ${mid}`);

    // 2. Initialize Telemetry Sender
    sender = new TelemetrySender(context);
    sender.start();

    // 3. Setup Status Bar
    const extensionId = await context.secrets.get('adt.extensionId');
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = extensionId ? '$(pulse) ADT: Connected' : '$(alert) ADT: Not Connected';
    statusBarItem.tooltip = extensionId ? 'ADT is monitoring your twin' : 'Click to connect your Extension ID';
    statusBarItem.command = 'adt.connectAccount';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 4. Prompt to connect if no Extension ID stored
    if (!extensionId) {
        vscode.window.showWarningMessage(
            'ADT: No Extension ID found. Connect your twin to start monitoring.',
            'Connect Now'
        ).then(selection => {
            if (selection === 'Connect Now') {
                vscode.commands.executeCommand('adt.connectAccount');
            }
        });
    }

    // 5. Register Connect Command
    const disposableConnect = vscode.commands.registerCommand('adt.connectAccount', async () => {
        const inputId = await vscode.window.showInputBox({
            prompt: 'Enter your ADT Extension ID (from the web registration page)',
            placeHolder: 'ADT-XXXXXX',
            ignoreFocusOut: true,
            validateInput: (v) => v && v.trim().length > 0 ? null : 'Extension ID cannot be empty'
        });

        if (!inputId) return;

        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl') || 'http://127.0.0.1:8000';
        const machineId = vscode.env.machineId;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'ADT: Performing Hardware Handshake…',
            cancellable: false
        }, async () => {
            try {
                const resp = await axios.post(
                    `${gatewayUrl}/api/v1/auth/users/hardware-lock`,
                    null,
                    { params: { extension_id: inputId.trim(), machine_id: machineId } }
                );

                if (resp.data.status === 'locked' || resp.data.status === 'verified') {
                    await context.secrets.store('adt.extensionId', inputId.trim());
                    statusBarItem.text = '$(pulse) ADT: Connected';
                    vscode.window.showInformationMessage(
                        `ADT: Hardware lock verified. Twin is now active for Machine ${machineId.slice(0, 8)}…`
                    );
                    // Restart telemetry with the new ID (triggers INITIAL sync)
                    sender.stop();
                    sender.start();
                } else {
                    vscode.window.showErrorMessage('ADT: Handshake rejected — unexpected server response.');
                }
            } catch (e: any) {
                const detail = e?.response?.data?.detail || e?.message || 'Unknown error';
                vscode.window.showErrorMessage(`ADT: Handshake failed — ${detail}`);
            }
        });
    });

    context.subscriptions.push(disposableConnect);

    // 6. Task Notification Poller (every 5 minutes)
    setInterval(async () => {
        const eid = await context.secrets.get('adt.extensionId');
        if (!eid) return;

        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl') || 'http://127.0.0.1:8000';

        try {
            const resp = await axios.get(
                `${gatewayUrl}/api/v1/task/tasks/user-by-extension/${eid}`,
                { params: { machine_id: vscode.env.machineId } }
            );
            const openTasks = (resp.data || []).filter((t: any) => t.status === 'assigned');
            if (openTasks.length > 0) {
                vscode.window.showInformationMessage(
                    `ADT: ${openTasks.length} task(s) assigned to you.`,
                    'View Tasks'
                ).then(sel => {
                    if (sel === 'View Tasks') {
                        vscode.env.openExternal(vscode.Uri.parse('http://127.0.0.1:3000/dashboard'));
                    }
                });
            }
        } catch (e) {
            vscode.window.showWarningMessage('ADT: Task poll failed.');
        }
    }, 300000);
}

export async function deactivate() {
    if (sender) {
        await sender.sendFinalSync();
        sender.stop();
    }
}
