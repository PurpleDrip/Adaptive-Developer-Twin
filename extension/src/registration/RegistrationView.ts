import * as vscode from 'vscode';
import { machineIdSync } from 'node-machine-id';

export class RegistrationView {
    public static currentPanel: RegistrationView | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static render(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        if (RegistrationView.currentPanel) {
            RegistrationView.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'adtRegistration',
                'ADT: Developer Registration',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [extensionUri],
                }
            );
            RegistrationView.currentPanel = new RegistrationView(panel, context);
        }
    }

    private constructor(panel: vscode.WebviewPanel, private readonly context: vscode.ExtensionContext) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
        this._setWebviewMessageListener(this._panel.webview);
    }

    public dispose() {
        RegistrationView.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            this._disposables.pop()?.dispose();
        }
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.command) {
                    case 'connect':
                        // Forward pre-filled data directly to connectAccount.
                        // The handler accepts { user_id, extension_id, machine_id }.
                        await vscode.commands.executeCommand('adt.connectAccount', message.data);
                        // Close panel on success (the command handles error display itself)
                        this.dispose();
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

    private _getWebviewContent(): string {
        const vscodeMid = vscode.env.machineId;
        let nativeMid = vscodeMid;
        try { nativeMid = machineIdSync(); } catch { /* fall back to vscode ID */ }

        const displayId = `${vscodeMid.slice(0, 8)}… / HW:${nativeMid.slice(0, 8)}…`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADT Registration</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #050505;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 40px;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      align-items: flex-start;
    }
    .container {
      max-width: 480px;
      width: 100%;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .logo {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo-title {
      background: linear-gradient(135deg, #7c6fe0, #e05fa0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 22px;
      font-weight: 800;
    }
    .logo-sub {
      color: #6a6a8a;
      font-size: 12px;
      margin-top: 6px;
    }
    .field {
      margin-bottom: 18px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.09em;
    }
    input {
      width: 100%;
      background: #161616;
      border: 1px solid #2a2a2a;
      color: #fff;
      padding: 11px 14px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      transition: border-color 150ms;
    }
    input:focus { border-color: #7c6fe0; }
    input::placeholder { color: #404060; }
    .btn {
      width: 100%;
      background: linear-gradient(135deg, #7c6fe0, #e05fa0);
      color: #fff;
      border: none;
      padding: 13px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      margin-top: 8px;
      transition: opacity 150ms;
    }
    .btn:hover { opacity: 0.88; }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .hw-info {
      margin-top: 20px;
      font-size: 10px;
      color: #3a3a55;
      text-align: center;
      line-height: 1.6;
    }
    .hw-id {
      color: #5a5a80;
      font-family: monospace;
      font-size: 9.5px;
    }
    .error {
      background: rgba(224,95,95,0.1);
      border: 1px solid rgba(224,95,95,0.3);
      color: #f38ba8;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      margin-top: 12px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-title">Connect Your Twin</div>
      <div class="logo-sub">Enter your IDs from the ADT company portal</div>
    </div>

    <div class="field">
      <label>Extension ID</label>
      <input type="text" id="extensionId" placeholder="ADT-XXXXXX" autocomplete="off">
    </div>

    <button class="btn" id="submitBtn" onclick="submit()">Link This Device</button>

    <div class="error" id="errorBox"></div>

    <div class="hw-info">
      Device fingerprint:<br>
      <span class="hw-id">${displayId}</span><br>
      Hardware-locked — unique per physical machine.
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function submit() {
      const extensionId = document.getElementById('extensionId').value.trim();
      const errorBox = document.getElementById('errorBox');
      const btn = document.getElementById('submitBtn');

      if (!extensionId) {
        errorBox.textContent = 'Please enter your Extension ID.';
        errorBox.style.display = 'block';
        return;
      }

      errorBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Verifying hardware lock…';

      vscode.postMessage({
        command: 'connect',
        data: {
          extension_id: extensionId,
          machine_id: '${vscodeMid}',
          native_hwid: '${nativeMid}',
        }
      });
    }

    document.getElementById('extensionId').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  </script>
</body>
</html>`;
    }
}
