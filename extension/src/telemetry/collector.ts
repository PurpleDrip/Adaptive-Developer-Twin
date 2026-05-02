import * as vscode from 'vscode';

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
    private keystrokes: number = 0;
    private commandsCount: number = 0;
    private lastTick: number = Date.now();
    private wpm: number = 0;
    private charCount: number = 0;

    constructor() {
        this.setupListeners();
    }

    private setupListeners() {
        // Track Keystrokes
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.contentChanges.length > 0) {
                this.keystrokes++;
                const text = event.contentChanges[0].text;
                this.charCount += text.length;
            }
        });

        // Track Commands (Approximate)
        vscode.commands.onDidExecuteCommand(() => {
            this.commandsCount++;
        });
    }

    public collect(): TelemetryData {
        const now = Date.now();
        const durationMin = (now - this.lastTick) / 60000;
        
        // Calculate WPM: (chars / 5) / minutes
        this.wpm = durationMin > 0 ? (this.charCount / 5) / durationMin : 0;
        
        const activeEditor = vscode.window.activeTextEditor;
        const activeFile = activeEditor?.document.fileName || 'none';
        const lang = activeEditor?.document.languageId || 'none';
        
        // Sample snippet (last 500 chars around cursor)
        let snippet = "";
        if (activeEditor) {
            const selection = activeEditor.selection;
            const start = new vscode.Position(Math.max(0, selection.active.line - 10), 0);
            const end = new vscode.Position(selection.active.line + 10, 0);
            snippet = activeEditor.document.getText(new vscode.Range(start, end));
        }

        const data: TelemetryData = {
            wpm: Math.min(200, Math.round(this.wpm)),
            keystrokes: this.keystrokes,
            commands_executed: this.commandsCount,
            active_file: activeFile,
            languages_used: { [lang]: 1.0 },
            code_snippet: snippet,
            git_branch: "main", // In prod, use git extension API
            timestamp: new Date().toISOString()
        };

        // Reset counters for next interval
        this.keystrokes = 0;
        this.commandsCount = 0;
        this.charCount = 0;
        this.lastTick = now;

        return data;
    }
}
