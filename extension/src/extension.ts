import * as vscode from 'vscode';
import { machineIdSync } from 'node-machine-id';
import { TelemetrySender } from './telemetry/sender';
import { RegistrationView } from './registration/RegistrationView';

let sender: TelemetrySender;
let statusBarItem: vscode.StatusBarItem;

// Returns both machine IDs for hardware-anchoring (P2: dual-HWID)
function getMachineIds(): { vscodeMachineId: string; nativeHwid: string } {
    return {
        vscodeMachineId: vscode.env.machineId,
        nativeHwid: (() => { try { return machineIdSync(); } catch { return vscode.env.machineId; } })(),
    };
}

export async function activate(context: vscode.ExtensionContext) {
    const { vscodeMachineId, nativeHwid } = getMachineIds();

    // 1. Show machine ID prominently
    vscode.window.showInformationMessage(
        `📌 ADT Machine ID: ${vscodeMachineId.slice(0, 12)}… (HW: ${nativeHwid.slice(0, 8)}…)\n\nCopy this if you need to re-register this machine.`
    );

    // 2. Initialize Telemetry Sender
    sender = new TelemetrySender(context);
    sender.start();

    // 3. Setup Status Bar
    let extensionId = await context.secrets.get('adt.extensionId');
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = extensionId ? '$(pulse) ADT: Connected' : '$(alert) ADT: Not Registered';
    statusBarItem.tooltip = extensionId
        ? `ADT Connected\nExtension ID: ${extensionId}\nMachine: ${vscodeMachineId.slice(0, 8)}…\n\nClick to reconnect`
        : `ADT Not Connected\nMachine: ${vscodeMachineId.slice(0, 8)}…\n\nClick to register`;
    statusBarItem.command = 'adt.register';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 4. Modal prompt if no Extension ID stored
    if (!extensionId) {
        const response = await vscode.window.showInformationMessage(
            'ADT: This machine is not yet registered. Register your Extension ID to enable neural twin monitoring.',
            { modal: true },
            'Register Now',
            'Later'
        );
        if (response === 'Register Now') {
            vscode.commands.executeCommand('adt.register');
        }
    } else {
        vscode.window.showInformationMessage(
            `✓ ADT Connected | Extension: ${extensionId} | Machine: ${vscodeMachineId.slice(0, 8)}…`
        );
    }

    // ── Command: adt.register ───────────────────────────────────────────────
    // Opens the full RegistrationView webview panel (form with User ID + Extension ID)
    const disposableRegister = vscode.commands.registerCommand('adt.register', () => {
        RegistrationView.render(context.extensionUri, context);
    });
    context.subscriptions.push(disposableRegister);

    // ── Command: adt.status ─────────────────────────────────────────────────
    // Shows a status summary popup
    const disposableStatus = vscode.commands.registerCommand('adt.status', async () => {
        const eid = await context.secrets.get('adt.extensionId');
        const { vscodeMachineId: mid, nativeHwid: hwid } = getMachineIds();
        if (eid) {
            const config = vscode.workspace.getConfiguration('adt');
            const gwUrl = config.get<string>('gatewayUrl') || 'http://127.0.0.1:8000';
            vscode.window.showInformationMessage(
                [
                    `ADT — Neural Twin Status`,
                    ``,
                    `Extension ID : ${eid}`,
                    `VS Code ID   : ${mid.slice(0, 16)}…`,
                    `Hardware ID  : ${hwid.slice(0, 16)}…`,
                    `Gateway      : ${gwUrl}`,
                    `Telemetry    : Active`,
                ].join('\n'),
                { modal: true }
            );
        } else {
            const sel = await vscode.window.showWarningMessage(
                'ADT: Not registered on this machine.',
                { modal: true },
                'Register Now'
            );
            if (sel === 'Register Now') {
                vscode.commands.executeCommand('adt.register');
            }
        }
    });
    context.subscriptions.push(disposableStatus);

    // ── Command: adt.connectAccount ─────────────────────────────────────────
    // Internal command used by RegistrationView and (legacy) inline flow
    // Accepts optional pre-filled data from the webview
    const disposableConnect = vscode.commands.registerCommand(
        'adt.connectAccount',
        async (data?: { user_id?: string; extension_id?: string; machine_id?: string }) => {
            let inputId: string | undefined;

            if (data?.extension_id) {
                // Called from RegistrationView with pre-filled form data
                inputId = data.extension_id.trim();
            } else {
                // Fallback: manual VS Code input box
                inputId = await vscode.window.showInputBox({
                    prompt: 'Enter your ADT Extension ID (from the web registration page)',
                    placeHolder: 'ADT-XXXXXX',
                    ignoreFocusOut: true,
                    validateInput: (v) => v && v.trim().length > 0 ? null : 'Extension ID cannot be empty',
                });
            }

            if (!inputId) return;

            const config = vscode.workspace.getConfiguration('adt');
            const gatewayUrl = config.get<string>('gatewayUrl') || 'http://127.0.0.1:8000';
            const { vscodeMachineId: machineId, nativeHwid } = getMachineIds();

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'ADT: Performing Hardware Handshake…',
                cancellable: false,
            }, async () => {
                try {
                    const axios = (await import('axios')).default;
                    const resp = await axios.post(
                        `${gatewayUrl}/api/v1/auth/users/hardware-lock`,
                        null,
                        {
                            params: {
                                extension_id: inputId!.trim(),
                                machine_id: machineId,
                                native_hwid: nativeHwid,
                            },
                        }
                    );

                    if (resp.data.status === 'locked' || resp.data.status === 'verified') {
                        await context.secrets.store('adt.extensionId', inputId!.trim());
                        statusBarItem.text = '$(pulse) ADT: Connected';
                        statusBarItem.tooltip = `ADT Connected\nExtension ID: ${inputId!.trim()}\nMachine: ${machineId.slice(0, 8)}…`;

                        vscode.window.showInformationMessage(
                            `✓ Hardware Lock Verified!\n\nYour neural twin is now active on this machine.`
                        );

                        // Restart telemetry with the new ID
                        sender.stop();
                        sender.start();
                    } else {
                        vscode.window.showErrorMessage(
                            `✗ Hardware Lock Failed\n\nServer returned: ${resp.data.status}\n\nPlease verify your Extension ID and try again.`,
                            { modal: true }
                        );
                    }
                } catch (e: any) {
                    const detail = e?.response?.data?.detail || e?.message || 'Unknown error';
                    vscode.window.showErrorMessage(
                        `✗ Connection Failed\n\n${detail}\n\nMake sure:\n1. Extension ID is correct\n2. Server is running at ${gatewayUrl}\n3. Check network connectivity`,
                        { modal: true }
                    );
                }
            });
        }
    );
    context.subscriptions.push(disposableConnect);

    // 5. Task Notification Poller (every 5 minutes)
    const taskPollInterval = setInterval(async () => {
        const eid = await context.secrets.get('adt.extensionId');
        if (!eid) return;

        const config = vscode.workspace.getConfiguration('adt');
        const gatewayUrl = config.get<string>('gatewayUrl') || 'http://127.0.0.1:8000';

        try {
            const axios = (await import('axios')).default;
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
        } catch {
            // Silent poll failure — avoid spamming the user
        }
    }, 300_000);

    context.subscriptions.push({ dispose: () => clearInterval(taskPollInterval) });
}

export async function deactivate() {
    if (sender) {
        await sender.sendFinalSync();
        sender.stop();
    }
}
