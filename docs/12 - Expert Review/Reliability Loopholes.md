---
tags: [reliability]
---

# Reliability Loopholes

## 1. No retries on cross-service calls

`httpx.AsyncClient.post(...)` without retry policy. A transient network blip fails the operation that triggered it. The Telemetry → Fusion call in the batch processor is especially vulnerable — a single failure aborts the batch.

**Fix**: Resilient HTTP client with `tenacity` (exponential backoff + jitter, max 3 attempts) for idempotent calls; explicit retry-or-DLQ for non-idempotent.

## 2. No circuit breaker

If Fusion is down, Telemetry keeps hammering it for every batch tick. No backoff, no quick-fail.

**Fix**: Open-source: `pybreaker`. Trip after N consecutive failures → fail-fast for `cooldown`.

## 3. Fusion failure leaves orphan raw

In `process_batches`:

```python
fusion_resp = await client.post(...)
if fusion_resp.status_code != 201:
    batch_doc["status"] = "failed"
# raw records are NOT marked processed
```

But the code path that DOES mark processed isn't conditional on fusion success today (per the readme description). Net effect: raw rows can be processed twice in successive batches, OR never (depending on the exact code).

**Fix**: Two-phase commit pattern. Mark raw rows with `batch_id` first; only mark `processed=true` AFTER fusion + THG succeed. Failed batches: leave raw with `batch_id` set, status=`failed`, replayable.

## 4. BatchProcessor isn't safe to run in N replicas

Two telemetry pods both think they're THE processor → both pick up the same unprocessed records → double-count.

**Fix**: Leader election via a Redis SETNX-with-expiry lock or K8s lease primitive.

## 5. No DLQ

Repeatedly failing batches keep retrying indefinitely. One poison message (e.g., a snippet that crashes CodeBERT) can stall the queue forever.

**Fix**: After N retries, move to `telemetry_batches_dlq` collection with full error context.

## 6. CodeBERT cold start blocks first request

Sync model load on first call → first user waits ~6s. Subsequent requests fast.

**Fix**: Warm-load on app startup (`@app.on_event("startup")` calls `analyze_code("test")` to trigger lazy init).

## 7. Mongo connection pool sized for tens, not thousands

Default `maxPoolSize=50, minPoolSize=5`. At 10k devs × 1 ping/30s = 333 req/s; with ~50ms per req → 17 concurrent connections needed peak. **Fine** for now. At 100k devs → 3.3k req/s → ~170 concurrent → pool too small.

**Fix**: Configure `maxPoolSize` per-service based on profiling.

## 8. No timeout on httpx calls

Wait, there is: 30s. But 30s is **way too long** for a hot-path call. A slow upstream causes thread starvation in async tasks.

**Fix**: Tight timeouts per call site (3s for THG `/update`, 5s for Fusion `/run`, 1s for Auth `/validate-extension`).

## 9. No graceful shutdown

FastAPI lifespan closes Mongo. The APScheduler job is *cancelled mid-tick*. If the tick was halfway through committing audit + THG updates, the system ends in an inconsistent state.

**Fix**: On SIGTERM, set a "stop accepting new ticks" flag, wait for in-flight tick to complete (with timeout), then close DBs.

## 10. CodeBERT shared singleton not protected against concurrent inference

If two requests hit the analyzer simultaneously, the model itself is thread-safe under the hood (PyTorch), but the centroid dict update path (if it ever runs concurrently) is racy.

**Fix**: Verify centroid loading happens at startup only; if any runtime mutation exists, add a lock.

## 11. SHEC handshake state is per-process

`users.last_known_state_hash` is stored in Mongo, but the comparison happens in one telemetry pod. With multiple pods, no consistency issue. **However**, a follow-up read-after-write race could occur if a single dev's two requests land on different pods within milliseconds.

**Fix**: Read-after-write isn't a problem here since each request is independent. Just verify.

## 12. No idempotency key on `/ingest`

Extension retries (e.g., network hiccup) can double-write the same raw record. Currently same timestamp → distinct documents. Batch aggregation double-counts.

**Fix**: Accept `Idempotency-Key` header (UUID per ping); reject duplicates within a TTL window.

---

Each loophole → [[13 - Yet to Implement/_MOC]] punch-list item.
