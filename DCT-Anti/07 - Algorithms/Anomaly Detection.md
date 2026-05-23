---
tags: [algorithm]
---

# Anomaly Detection

> Sub-models inside Fusion that feed into the [[Reliability Score Model]]. Each catches a different bot/fraud signature.

## 1. Keystroke padding

**The signature**: a script that types at a constant rate produces uniform inter-keystroke intervals (e.g., 100 ms ± 0). Humans produce log-normal-ish distributions (typically 50–500 ms with long tail).

**The check** (simplified):

```python
def padding_check(wpm_values: list[float]) -> float:
    if len(wpm_values) < 5:
        return 1.0  # not enough data, give benefit of doubt
    stdev = numpy.std(wpm_values)
    mean = numpy.mean(wpm_values)
    cv = stdev / max(mean, 0.01)  # coefficient of variation
    # Humans: cv typically 0.3–0.7
    # Bots: cv near 0
    if cv < 0.05:
        return 0.0
    return min(1.0, cv / 0.3)
```

## 2. Human jitter

**The signature**: real typing has *bursts* (a sentence flows) and *pauses* (thinking). The autocorrelation of WPM at lag 1 is low for humans (next ping is uncorrelated with current) and high for bots (steady-state).

**The check** (simplified):

```python
def jitter_check(wpm_values: list[float]) -> float:
    if len(wpm_values) < 8:
        return 1.0
    autocorr = numpy.corrcoef(wpm_values[:-1], wpm_values[1:])[0, 1]
    # Humans: autocorr typically -0.2 to 0.2
    # Bots: autocorr near 1.0
    return 1.0 - abs(autocorr)
```

## 3. Snippet variety

**The signature**: a paste-bot inserts the same lines repeatedly. Humans iterate, refactor, rename. The Jaccard similarity of consecutive snippets is low for humans, high for bots.

```python
def variety_check(snippets: list[str]) -> float:
    if len(snippets) < 2:
        return 1.0
    sims = []
    for a, b in zip(snippets[:-1], snippets[1:]):
        sa, sb = set(a.split()), set(b.split())
        sims.append(len(sa & sb) / max(len(sa | sb), 1))
    avg_sim = numpy.mean(sims)
    return 1.0 - avg_sim
```

## 4. Command-to-keystroke ratio

**The signature**: a real dev runs commands (save, format, navigate, search) interleaved with typing. A bot might only `dispatchEvent('keypress')`.

```python
def command_health(keystrokes: int, commands: int) -> float:
    if keystrokes == 0:
        return 0.5  # neutral
    ratio = commands / keystrokes
    # Human typical: 0.005 to 0.05 (one command per ~20–200 keystrokes)
    if ratio == 0:
        return 0.3  # suspicious but not impossible
    return clip(min(1.0, ratio / 0.005), 0.0, 1.0)
```

## 5. Idle balance

**The signature**: zero idle seconds across a 5-minute window suggests automation. Humans pause to read, think, switch context.

```python
def idle_health(idle_seconds: int, ping_count: int) -> float:
    if ping_count == 0:
        return 1.0
    idle_ratio = idle_seconds / (ping_count * 30)  # 30 s window per ping
    # Humans typical: 0.1 to 0.6
    if idle_ratio < 0.05:
        return 0.3
    return clip(idle_ratio / 0.3, 0.0, 1.0)
```

## 6. Working hours alignment

**The signature**: org has working hours (e.g., 09:00–17:00 IST). Activity at 03:00 local is suspicious **per org policy**.

This is a **soft** check — low weight, since night owls and timezone shifts are real.

```python
def hours_check(timestamp, working_hours: tuple = (9, 17)) -> float:
    hour = timestamp.hour
    if working_hours[0] <= hour < working_hours[1]:
        return 1.0
    # off-hours: not zero, just damped
    return 0.6
```

## Code location

- `backend/fusion/app/services/anomaly_detector.py :: AnomalyDetector` — **stub**, all of the above to implement
- Tracked: [[13 - Yet to Implement/Backend - Fusion - Anomaly Detector]]

## The arms race

Anomaly detection is **adversarial**. Once a determined attacker knows our checks, they can:

- Add random jitter to their bot
- Vary snippet content per ping
- Sleep between commands

We defeat this with **layered defense**:

1. SHA-HWID anchor at the hardware level (this fixes 95% of casual cheating)
2. These anomaly checks
3. Long-term consistency checks: a dev whose skill profile suddenly diverges from their history (next gap: [[13 - Yet to Implement/Backend - Fusion - Drift Detection]])
4. Manager review of `fraud_flag` cases — humans in the loop

Any single layer can be beaten. All four at once is hard.
