import * as vscode from 'vscode';
import * as path from 'path';
import { scanForSecrets } from '../secrets/scanner';

// ── Path deny-list (skip telemetry from these files entirely) ─────────────────
const DENY_PATH_PATTERNS: RegExp[] = [
    /\.(env|env\..+)$/i,
    /\.(pem|key|crt|cer|p12|pfx|p8)$/i,
    /id_rsa(\..+)?$/i,
    /(credential|secret|password|passwd)(s)?(\..+)?$/i,
    /\.aws[/\\]credentials/i,
    /\.docker[/\\]config\.json$/i,
    /\.npmrc$/i,
    /\.pypirc$/i,
    /service-account.*\.json$/i,
    /secrets\.json$/i,
];

function isSensitivePath(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    return DENY_PATH_PATTERNS.some(re => re.test(normalized));
}

// ── Git branch detection via built-in git extension API ──────────────────────
async function getGitBranch(): Promise<string> {
    try {
        const gitExt = vscode.extensions.getExtension('vscode.git');
        if (!gitExt) return 'unknown';
        const git = gitExt.isActive ? gitExt.exports : await gitExt.activate();
        const api = git.getAPI(1);
        const repos = api.repositories;
        if (repos.length > 0) {
            return repos[0].state.HEAD?.name ?? 'detached';
        }
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

// ── Telemetry data shape (matches backend IngestPayload) ─────────────────────
export interface TelemetryData {
    wpm: number;
    keystrokes: number;
    commands_executed: number;
    active_file: string;
    languages_used: { [key: string]: number };
    code_snippet: string;
    git_branch: string;
    timestamp: string;
}

export class TelemetryCollector {
    private keystrokes = 0;
    private commandsCount = 0;
    private lastTick = Date.now();
    private wpm = 0;
    private charCount = 0;
    private gitBranch = 'unknown';

    constructor() {
        this.setupListeners();
        // Prime git branch asynchronously
        getGitBranch().then(b => { this.gitBranch = b; });
    }

    private setupListeners() {
        // Track keystrokes via text document changes
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.contentChanges.length > 0) {
                this.keystrokes++;
                this.charCount += event.contentChanges[0].text.length;
            }
        });

        // Track commands executed (onDidExecuteCommand added in VS Code 1.87; use runtime check)
        const onExec = (vscode.commands as Record<string, unknown>)['onDidExecuteCommand'];
        if (typeof onExec === 'function') {
            (onExec as (handler: () => void) => void)(() => { this.commandsCount++; });
        } else {
            // Fallback: count document saves as a proxy for user command activity
            vscode.workspace.onDidSaveTextDocument(() => { this.commandsCount++; });
        }

        // Refresh git branch on file save (cheap proxy for repo activity)
        vscode.workspace.onDidSaveTextDocument(() => {
            getGitBranch().then(b => { this.gitBranch = b; });
        });
    }

    public async collect(): Promise<TelemetryData> {
        const now = Date.now();
        const durationMin = (now - this.lastTick) / 60_000;

        this.wpm = durationMin > 0 ? (this.charCount / 5) / durationMin : 0;

        const activeEditor = vscode.window.activeTextEditor;
        const activeFile = activeEditor?.document.fileName ?? 'none';
        const lang = activeEditor?.document.languageId ?? 'none';

        let snippet = '';
        if (activeEditor && !isSensitivePath(activeFile)) {
            const selection = activeEditor.selection;
            const start = new vscode.Position(Math.max(0, selection.active.line - 10), 0);
            const end = new vscode.Position(selection.active.line + 10, 0);
            const raw = activeEditor.document.getText(new vscode.Range(start, end));
            snippet = scanForSecrets(raw);
        }

        // Sanitize active_file: strip workspace root prefix + flag sensitive paths
        const safeFile = isSensitivePath(activeFile) ? '<<SENSITIVE_FILE>>' : path.basename(activeFile);

        const data: TelemetryData = {
            wpm: Math.min(200, Math.round(this.wpm)),
            keystrokes: this.keystrokes,
            commands_executed: this.commandsCount,
            active_file: safeFile,
            languages_used: { [lang]: 1.0 },
            code_snippet: snippet,
            git_branch: this.gitBranch,
            timestamp: new Date().toISOString(),
        };

        // Reset counters
        this.keystrokes = 0;
        this.commandsCount = 0;
        this.charCount = 0;
        this.lastTick = now;

        return data;
    }
}
