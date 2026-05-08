import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Always-excluded directories (even if not in .gitignore)
const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', '.vscode', 'out', 'dist', '__pycache__',
    '.next', 'build', '.cache', '.turbo', 'coverage', '.nyc_output',
    'vendor', '.gradle', 'target', 'bin', 'obj', 'venv', '.venv',
    'env', '.env', '.tox', 'eggs', '.eggs', 'htmlcov', '.mypy_cache',
    '.pytest_cache', '.hypothesis'
]);

// Always-excluded file extensions (binary / heavy / sensitive)
const EXCLUDED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.ico', '.svg', '.webp', '.avif',
    '.vsix', '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.mp4', '.mp3', '.wav', '.ogg', '.webm', '.avi',
    '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
    '.exe', '.dll', '.so', '.dylib', '.a', '.o', '.obj',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.db', '.sqlite', '.sqlite3', '.dump',
    '.lock',        // package-lock.json, yarn.lock etc. (too large, low signal)
    '.map',         // source maps
    '.min.js', '.min.css'
]);

// Always-excluded filenames (sensitive)
const EXCLUDED_FILENAMES = new Set([
    '.env', '.env.local', '.env.production', '.env.development',
    '.env.staging', '.env.test', '.env.example',
    'secrets.json', 'credentials.json', 'service-account.json',
    '.npmrc', '.pypirc'
]);

const MAX_FILE_BYTES = 50_000;       // 50 KB per file — skip larger files
const MAX_TOTAL_BYTES = 3_000_000;   // 3 MB total zip ceiling

function shouldSkip(relativePath: string): boolean {
    const parts = relativePath.split(/[\\/]/);
    for (const part of parts) {
        if (EXCLUDED_DIRS.has(part)) return true;
        if (EXCLUDED_FILENAMES.has(part)) return true;
    }
    const base = path.basename(relativePath);
    if (EXCLUDED_FILENAMES.has(base)) return true;

    // Check compound extensions like .min.js
    if (base.includes('.min.')) return true;

    const ext = path.extname(base).toLowerCase();
    return EXCLUDED_EXTENSIONS.has(ext);
}

function walkSync(
    dir: string,
    baseDir: string,
    files: Array<{ rel: string; content: Buffer }>,
    totalBytes: { val: number }
): void {
    if (totalBytes.val >= MAX_TOTAL_BYTES) return;

    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        if (totalBytes.val >= MAX_TOTAL_BYTES) break;

        const fullPath = path.join(dir, entry.name);
        const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');

        if (shouldSkip(rel)) continue;

        if (entry.isDirectory()) {
            walkSync(fullPath, baseDir, files, totalBytes);
        } else if (entry.isFile()) {
            try {
                const stat = fs.statSync(fullPath);
                if (stat.size > MAX_FILE_BYTES) continue;
                const content = fs.readFileSync(fullPath);
                files.push({ rel, content });
                totalBytes.val += stat.size;
            } catch {
                // Unreadable file — skip silently
            }
        }
    }
}

/**
 * Zips the current VS Code workspace (respecting exclusions) and returns
 * the result as a base64 string. Returns null if workspace is unavailable,
 * empty, or exceeds size limits.
 */
export async function createWorkspaceSnapshot(): Promise<string | null> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return null;

    const root = folders[0].uri.fsPath;

    // Dynamically require adm-zip to avoid bundling issues in some environments
    let AdmZip: any;
    try {
        AdmZip = require('adm-zip');
    } catch {
        vscode.window.showWarningMessage('ADT: adm-zip not found — workspace snapshot skipped.');
        return null;
    }

    const files: Array<{ rel: string; content: Buffer }> = [];
    const totalBytes = { val: 0 };

    walkSync(root, root, files, totalBytes);

    if (files.length === 0) return null;

    try {
        const zip = new AdmZip();
        for (const { rel, content } of files) {
            zip.addFile(rel, content);
        }
        const buffer: Buffer = zip.toBuffer();
        vscode.window.showWarningMessage(
            `ADT: Workspace snapshot — ${files.length} files, ${(buffer.length / 1024).toFixed(0)} KB`
        );
        return buffer.toString('base64');
    } catch (e) {
        vscode.window.showWarningMessage(`ADT: Snapshot compression failed — ${e}`);
        return null;
    }
}
