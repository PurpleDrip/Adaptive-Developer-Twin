---
tags: [yet-to-implement, p2, performance]
status: pending
priority: P2
estimate: 3 weeks
---

# Infra — Kafka for Telemetry

## Why
At 100k+ devs, direct Mongo writes from ingest don't scale. Buffer via Kafka, consume into Mongo asynchronously.

## Acceptance criteria
- [ ] `POST /ingest` writes to Kafka topic `telemetry.raw` (or AWS Kinesis)
- [ ] Mongo consumer drains the topic into `telemetry_raw`
- [ ] Idempotency via Kafka key = `(extension_id, timestamp)`
- [ ] Retention: 7 days
- [ ] Tests: at 10k req/s sustained, no DB writes lost

## Files involved
- IaC (Kafka cluster)
- `backend/telemetry/app/services/kafka_producer.py` (new)
- `backend/telemetry/app/services/kafka_consumer.py` (new)

## Tracked from
[[02 - System Architecture/Persistence Layer#What we don't use and why not]]
