import * as vscode from 'vscode';
import { machineIdSync } from 'node-machine-id';

export class RegistrationView {
    public static currentPanel: RegistrationView | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static render(extensionUri: vscode.Uri) {
        if (RegistrationView.currentPanel) {
            RegistrationView.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'adtRegistration',
                'ADT: Developer Registration',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [extensionUri]
                }
            );

            RegistrationView.currentPanel = new RegistrationView(panel, extensionUri);
        }
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
        this._setWebviewMessageListener(this._panel.webview);
    }

    public dispose() {
        RegistrationView.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: any) => {
                const { command, data } = message;
                switch (command) {
                    case 'connect':
                        // Forward to the connection handler
                        vscode.commands.executeCommand('adt.connectAccount', data);
                        break;
                    case 'error':
                        vscode.window.showErrorMessage(`ADT: ${message.text}`);
                        break;
                }
            },
            undefined,
            this._disposables
        );
    }

    private _getWebviewContent() {
        const mid = machineIdSync();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        background-color: #050505;
                        color: #ffffff;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        padding: 40px;
                        display: flex;
                        justify-content: center;
                    }
                    .container {
                        max-width: 500px;
                        width: 100%;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(20px);
                        padding: 32px;
                        border-radius: 16px;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    }
                    .logo-section {
                        text-align: center;
                        margin-bottom: 32px;
                    }
                    .gradient-text {
                        background: linear-gradient(135deg, #3b82f6, #6366f1);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        font-size: 24px;
                        font-weight: 800;
                    }
                    .input-group {
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-size: 12px;
                        color: #a0a0a0;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                    }
                    input, select {
                        width: 100%;
                        background: #161616;
                        border: 1px solid #262626;
                        color: white;
                        padding: 12px;
                        border-radius: 8px;
                        outline: none;
                        box-sizing: border-box;
                    }
                    input:focus {
                        border-color: #3b82f6;
                    }
                    .btn {
                        width: 100%;
                        background: linear-gradient(135deg, #3b82f6, #6366f1);
                        color: white;
                        border: none;
                        padding: 14px;
                        border-radius: 8px;
                        font-weight: 700;
                        cursor: pointer;
                        margin-top: 10px;
                    }
                    .btn:hover {
                        opacity: 0.9;
                    }
                    .hardware-info {
                        margin-top: 24px;
                        font-size: 11px;
                        color: #525252;
                        text-align: center;
                    }
                    .machine-id {
                        color: #3b82f6;
                        font-family: monospace;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo-section">
                        <div class="gradient-text">Connect Your Twin</div>
                        <p style="color: #a0a0a0; font-size: 13px;">Enter your IDs from the company portal</p>
                    </div>
                    
                    <div class="input-group">
                        <label>User ID</label>
                        <input type="text" id="userId" placeholder="usr_XXXXXX">
                    </div>
                    
                    <div class="input-group">
                        <label>Extension ID</label>
                        <input type="text" id="extensionId" placeholder="ext_XXXXXX">
                    </div>

                    <button class="btn" onclick="submit()">Link This Device</button>

                    <div class="hardware-info">
                        Verifying Device: <span class="machine-id">${mid.substring(0, 16)}...</span>
                        <br>Hardware-locked to office laptop.
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    function submit() {
                        const data = {
                            user_id: document.getElementById('userId').value,
                            extension_id: document.getElementById('extensionId').value,
                            machine_id: "${mid}"
                        };
                        
                        if (!data.user_id || !data.extension_id) {
                            vscode.postMessage({ command: 'error', text: 'Please enter both IDs' });
                            return;
                        }
                        
                        vscode.postMessage({ command: 'connect', data });
                    }
                </script>
            </body>
            </html>
        `;
    }
}
