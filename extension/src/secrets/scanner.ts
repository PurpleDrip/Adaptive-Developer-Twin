/**
 * Client-side secret scanner — redacts secrets before any snippet leaves the machine.
 * Defense-in-depth: the backend runs its own scan (Backend - Telemetry - Server-Side Secret Scan).
 *
 * Redaction format: <<REDACTED:{type}>>
 */

interface SecretPattern {
    type: string;
    re: RegExp;
}

const PATTERNS: SecretPattern[] = [
    // AWS
    { type: 'AWS_ACCESS_KEY',    re: /\bAKIA[0-9A-Z]{16}\b/g },
    { type: 'AWS_SECRET_KEY',    re: /\b[A-Za-z0-9/+]{40}\b/g },
    // GitHub PAT (classic ghp_ and fine-grained github_pat_)
    { type: 'GITHUB_PAT',        re: /\bghp_[A-Za-z0-9]{36,}\b/g },
    { type: 'GITHUB_PAT_FINE',   re: /\bgithub_pat_[A-Za-z0-9_]{80,}\b/g },
    // Generic API key patterns
    { type: 'API_KEY',           re: /\b(api[_-]?key|apikey)\s*[:=]\s*["']?[A-Za-z0-9\-_]{20,}["']?/gi },
    // JWT (three base64url segments separated by dots)
    { type: 'JWT',               re: /\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g },
    // Generic bearer tokens
    { type: 'BEARER_TOKEN',      re: /Bearer\s+[A-Za-z0-9\-_=+/]{20,}/gi },
    // Private key headers
    { type: 'PRIVATE_KEY',       re: /-----BEGIN[A-Z\s]+PRIVATE KEY-----[\s\S]*?-----END[A-Z\s]+PRIVATE KEY-----/g },
    // Password/secret assignment patterns
    { type: 'PASSWORD',          re: /\b(password|passwd|secret|token)\s*[:=]\s*["']?[^\s"',]{8,}["']?/gi },
    // MongoDB Atlas connection strings
    { type: 'MONGO_URI',         re: /mongodb(\+srv)?:\/\/[^@\s]+:[^@\s]+@[^\s"']+/gi },
    // High-entropy strings (≥32 chars, mixed alphanum + symbols — heuristic)
    { type: 'HIGH_ENTROPY',      re: /["'][A-Za-z0-9+/=_\-]{32,}["']/g },
];

/**
 * Scans `text` for secrets and replaces matches with `<<REDACTED:{type}>>`.
 * Returns the redacted string. If no secrets found, returns the original.
 */
export function scanForSecrets(text: string): string {
    let result = text;
    for (const { type, re } of PATTERNS) {
        // Reset lastIndex each time since patterns are module-level with /g flag
        re.lastIndex = 0;
        result = result.replace(re, `<<REDACTED:${type}>>`);
    }
    return result;
}

/**
 * Returns true if the text contains any secret pattern (without redacting).
 * Used for early-exit checks.
 */
export function containsSecret(text: string): boolean {
    for (const { re } of PATTERNS) {
        re.lastIndex = 0;
        if (re.test(text)) return true;
    }
    return false;
}
