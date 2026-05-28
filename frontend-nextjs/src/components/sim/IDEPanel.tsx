'use client';

import React from 'react';

interface IDEPanelProps {
  fileName: string;
  code: string;
  pingFlash: boolean;
  isTyping: boolean;
  lang?: string;
}

// Minimal Python/TS token colorizer — good enough for demo snippets
function tokenize(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, li) => (
    <div key={li} className="flex">
      <span className="select-none w-10 text-right pr-4 shrink-0" style={{ color: '#4a5568' }}>
        {li + 1}
      </span>
      <span style={{ flex: 1 }}>{colorizeLine(line, lang)}</span>
    </div>
  ));
}

const PY_KEYWORDS = /\b(from|import|def|async|await|return|if|not|raise|class|with|for|in|True|False|None)\b/g;
const PY_DECORATOR = /^(\s*)(@\w+)/;
const PY_STRING = /('[^']*'|"[^"]*")/g;
const PY_COMMENT = /(#.*)$/;
const TS_KEYWORDS = /\b(import|from|export|const|let|var|function|return|interface|type|class|extends|implements|async|await|if|else|for|of|in|true|false|null|undefined|React)\b/g;
const TS_STRING = /('[^']*'|"[^"]*"|`[^`]*`)/g;
const TS_COMMENT = /(\/\/.*)$/;

function colorizeLine(line: string, lang: string): React.ReactNode {
  const isPy = lang === 'python';
  const keywordRe = isPy ? PY_KEYWORDS : TS_KEYWORDS;
  const stringRe = isPy ? PY_STRING : TS_STRING;
  const commentRe = isPy ? PY_COMMENT : TS_COMMENT;
  const decoratorRe = isPy ? PY_DECORATOR : null;

  // Handle comments (entire rest of line)
  const commentMatch = commentRe.exec(line);
  if (commentMatch) {
    const before = line.slice(0, commentMatch.index);
    return (
      <>
        {colorizePart(before, keywordRe, stringRe, decoratorRe)}
        <span style={{ color: '#6a9955' }}>{commentMatch[0]}</span>
      </>
    );
  }

  return colorizePart(line, keywordRe, stringRe, decoratorRe);
}

function colorizePart(
  text: string,
  keywordRe: RegExp,
  stringRe: RegExp,
  decoratorRe: RegExp | null,
): React.ReactNode {
  // Check for decorator
  if (decoratorRe) {
    const m = decoratorRe.exec(text);
    if (m) {
      return (
        <>
          {m[1]}
          <span style={{ color: '#dcdcaa' }}>{m[2]}</span>
          {text.slice(m[0].length)}
        </>
      );
    }
  }

  // Split by strings first, then colorize keywords within non-string chunks
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  const strRe = new RegExp(stringRe.source, 'g');
  let sm: RegExpExecArray | null;

  while ((sm = strRe.exec(text)) !== null) {
    if (sm.index > lastIdx) {
      parts.push(colorizeKeywords(text.slice(lastIdx, sm.index), keywordRe, parts.length));
    }
    parts.push(<span key={`s${sm.index}`} style={{ color: '#ce9178' }}>{sm[0]}</span>);
    lastIdx = sm.index + sm[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(colorizeKeywords(text.slice(lastIdx), keywordRe, parts.length));
  }

  return <>{parts}</>;
}

function colorizeKeywords(text: string, keywordRe: RegExp, keyBase: number): React.ReactNode {
  const re = new RegExp(keywordRe.source, 'g');
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    parts.push(<span key={`k${keyBase}_${i++}`} style={{ color: '#569cd6' }}>{m[0]}</span>);
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));

  return <React.Fragment key={keyBase}>{parts}</React.Fragment>;
}

// Deterministic minimap bar data — avoids SSR/client hydration mismatch from Math.random()
const MINIMAP_BARS: { w: number; a: number }[] = Array.from({ length: 24 }, (_, i) => {
  const h = ((i + 1) * 48271) % 100;
  return { w: 40 + h * 0.4, a: 0.04 + (h % 80) * 0.001 };
});

export default function IDEPanel({ fileName, code, pingFlash, isTyping, lang = 'python' }: IDEPanelProps) {
  const ext = fileName.split('.').pop() || 'py';

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0f14', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* VS Code-style title bar */}
      <div style={{ background: '#1e2030', borderBottom: '1px solid #252740', height: 36, display: 'flex', alignItems: 'center', paddingLeft: 12, gap: 8, flexShrink: 0 }}>
        {/* Tab */}
        <div style={{
          height: 36, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, gap: 6,
          borderTop: '2px solid #7c6fe0', background: '#0d0f14',
          fontSize: 12, color: '#cdd6f4',
        }}>
          <span style={{ fontSize: 10, color: '#6a9955' }}>●</span>
          {fileName.split('/').pop()}
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ height: 22, background: '#171923', borderBottom: '1px solid #1a1d2e', display: 'flex', alignItems: 'center', paddingLeft: 56, fontSize: 11, color: '#5a6480', flexShrink: 0 }}>
        {fileName}
      </div>

      {/* Editor body */}
      <div className="relative flex-1 overflow-auto" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", fontSize: 13, lineHeight: '1.7', color: '#cdd6f4', padding: '12px 0' }}>
        {tokenize(code, lang)}

        {/* Blinking cursor at end of code */}
        {isTyping && (
          <div className="inline-block" style={{ width: 2, height: 16, background: '#cdd6f4', marginLeft: 1, verticalAlign: 'middle', animation: 'blink 1s step-start infinite' }} />
        )}

        {/* Minimap */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 60, height: '100%',
          background: '#111320', borderLeft: '1px solid rgba(255,255,255,0.04)',
          overflow: 'hidden', pointerEvents: 'none',
        }}>
          {MINIMAP_BARS.map((bar, i) => (
            <div key={i} style={{
              height: 2, margin: '2px 4px',
              background: `rgba(255,255,255,${bar.a})`,
              width: `${bar.w}%`,
            }} />
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height: 22, background: '#1a1d2e', borderTop: '1px solid #1e2136',
        display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12,
        fontSize: 10, color: '#5a6480', gap: 16, flexShrink: 0,
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* LIVE ping badge */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: pingFlash ? '#7c6fe0' : '#5a6480',
            transition: 'color 0.15s',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: pingFlash ? '#7c6fe0' : '#4a5568',
              boxShadow: pingFlash ? '0 0 6px #7c6fe0' : 'none',
              transition: 'all 0.15s',
              display: 'inline-block',
            }} />
            {pingFlash ? 'sending telemetry' : 'live · alice@sim'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>{ext === 'py' ? 'Python' : ext === 'tsx' ? 'TypeScript JSX' : ext.toUpperCase()}</span>
          <span>UTF-8</span>
          <span>ADT Extension ✓</span>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
