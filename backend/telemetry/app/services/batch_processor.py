import asyncio
import os
import httpx
import logging
from datetime import datetime, timedelta, time
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from shared.database.mongo import get_collection
from shared.models.telemetry import TelemetryBatchDocument
from shared.services.audit_logger import AuditLogger

logger = logging.getLogger("adt.batch_processor")

class BatchProcessor:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.fusion_url = os.getenv("FUSION_URL", "http://fusion-service:8000")
        self.thg_url = os.getenv("THG_URL", "http://thg-service:8000")
        self.monitoring_url = os.getenv("MONITORING_URL", "http://127.0.0.1:8007")
        self.batch_interval = int(os.getenv("BATCH_INTERVAL_MINUTES", 5))

    def start(self):
        self.scheduler.add_job(
            self.process_batches, 'interval',
            minutes=self.batch_interval,
            id='batch_processor'
        )
        self.scheduler.start()

    async def _fetch_and_apply_config(self):
        """Fetches system config and reschedules the job if interval changed."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.monitoring_url}/api/v1/monitoring/system-config")
                if resp.status_code == 200:
                    new_interval = int(resp.json().get("batch_interval_minutes", self.batch_interval))
                    if new_interval != self.batch_interval:
                        self.batch_interval = new_interval
                        job = self.scheduler.get_job('batch_processor')
                        if job:
                            job.reschedule(trigger='interval', minutes=new_interval)
                            logger.info(f"[BATCH] Interval rescheduled to {new_interval} min from system config")
        except Exception as e:
            logger.warning(f"[BATCH] Could not fetch system config: {e}")

    async def process_batches(self):
        """Main batch processing loop."""
        await self._fetch_and_apply_config()
        logger.info("Starting micro-batch telemetry processing...")

        logger.info("Starting batch telemetry processing...")
        db_raw = get_collection("telemetry_raw")
        db_batches = get_collection("telemetry_batches")
        
        # 1. Get all unprocessed telemetry
        unprocessed = await db_raw.find({"processed": False}).to_list(length=10000)
        if not unprocessed:
            logger.info("No unprocessed telemetry found.")
            return

        # 2. Group by user_id
        user_groups = {}
        for record in unprocessed:
            uid = record.get("user_id")
            if not uid:
                logger.warning(f"Skipping telemetry record {record.get('_id')} due to missing user_id")
                continue
            if uid not in user_groups:
                user_groups[uid] = []
            user_groups[uid].append(record)

        # 3. Process each user group
        async with httpx.AsyncClient(timeout=30.0) as client:
            audit = AuditLogger(get_collection("audit_log").database)
            
            for user_id, records in user_groups.items():
                batch_id = f"BATCH-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{user_id[:8]}"
                
                # Aggregate and create batch doc
                window_start = min(r["timestamp"] for r in records)
                window_end = max(r["timestamp"] for r in records)
                batch_doc = TelemetryBatchDocument.create(batch_id, user_id, records, window_start, window_end)
                
                try:
                    # A. Call Fusion Engine
                    fusion_resp = await client.post(
                        f"{self.fusion_url}/api/v1/fusion/fusion/{user_id}/run", 
                        json={"telemetry_summary": batch_doc["aggregated_signals"], "resume_profile": {}, "project_profile": {}}
                    )
                    
                    if fusion_resp.status_code == 201:
                        fusion_data = fusion_resp.json()
                        batch_doc["fusion_result"] = fusion_data
                        batch_doc["status"] = "completed"
                        
                        # B. Update THG (Neo4j)
                        skill_updates = fusion_data.get("skill_updates", {})
                        thg_success_count = 0
                        
                        for skill, details in skill_updates.items():
                            if details["strength"] > 0.01:
                                # Get current state for audit
                                # (In a full prod system we'd fetch current first, here we just log update)
                                await client.post(f"{self.thg_url}/api/v1/thg/thg/update", json={
                                    "dev_id": user_id,
                                    "skill_name": skill,
                                    "strength": details["strength"],
                                    "confidence": details["confidence"]
                                })
                                
                                # C. Audit Log
                                await audit.log_thg_update(
                                    user_id=user_id,
                                    source="telemetry_batch",
                                    skill_name=skill,
                                    old_strength=0.0, # Simplified
                                    new_strength=details["strength"],
                                    old_confidence=0.0,
                                    new_confidence=details["confidence"],
                                    metadata={"batch_id": batch_id}
                                )
                                thg_success_count += 1
                        
                        batch_doc["thg_updates"] = {"count": thg_success_count}
                    else:
                        batch_doc["status"] = "failed"
                        batch_doc["error"] = fusion_resp.text

                except Exception as e:
                    logger.error(f"Error processing batch {batch_id}: {e}")
                    batch_doc["status"] = "failed"
                    batch_doc["error"] = str(e)

                # Save batch and mark raw as processed
                batch_doc["processed_at"] = datetime.utcnow()
                await db_batches.insert_one(batch_doc)
                
                record_ids = [r["_id"] for r in records]
                await db_raw.update_many(
                    {"_id": {"$in": record_ids}},
                    {"$set": {"processed": True, "batch_id": batch_id}}
                )

        logger.info(f"Batch processing complete for {len(user_groups)} users.")


