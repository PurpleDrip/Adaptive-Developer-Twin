---
tags: [ux-ui, animation]
---

# Micro-Animations & Interaction

Micro-animations elevate ADT from a standard corporate dashboard to a premium, satisfying user experience.

## Key Interaction Specs

### 1. Hover Transformations
All glass cards must lift slightly and brighten their inner border:
```css
.interactive-card {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 0.25s ease, 
              box-shadow 0.25s ease;
}

.interactive-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.4);
}
```

### 2. The "Twin Sync" Pulsing Indicator
When the VS Code extension registers activity, the web dashboard displays a glowing telemetry ring that pulses in sync with the extension heartbeat. 

```css
@keyframes sync-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(20, 184, 166, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
}

.sync-dot {
  animation: sync-pulse 2s infinite;
}
```

### 3. Glassmorphic Loading Screen
When loading dashboard charts, render dynamic CSS shimmer placeholders inside the glass panels rather than showing static spinners.
