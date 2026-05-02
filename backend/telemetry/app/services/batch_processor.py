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
        self.batch_interval = int(os.getenv("BATCH_INTERVAL_MINUTES", 30))

    def start(self):
        # Run every 30 minutes
        self.scheduler.add_job(self.process_batches, 'interval', minutes=self.batch_interval)
        self.scheduler.start()

    async def process_batches(self):
        """Main batch processing loop."""
        if not await self._is_monitoring_window():
            logger.info("Outside monitoring window or holiday. Skipping batch processing.")
            return

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
            uid = record["user_id"]
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

    async def _is_monitoring_window(self) -> bool:
        """Checks if current time is within 9am-6pm and not a holiday."""
        db_config = get_collection("system_config")
        config = await db_config.find_one({"key": "global_config"})
        
        # Defaults
        start_str = config.get("monitoring_window_start", "09:00") if config else "09:00"
        end_str = config.get("monitoring_window_end", "18:00") if config else "18:00"
        holidays = config.get("holidays", []) if config else []
        is_paused = config.get("is_monitoring_paused", False) if config else False

        if is_paused:
            return False

        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        
        # Holiday check
        for h in holidays:
            if h["date"] == today_str:
                if not h.get("is_half_day"):
                    return False
                # If half day, check if monitoring has resumed
                resume_time_str = h.get("half_day_end", "14:00")
                resume_time = time.fromisoformat(resume_time_str)
                if now.time() < resume_time:
                    return False

        # Window check
        start_time = time.fromisoformat(start_str)
        end_time = time.fromisoformat(end_str)
        
        return start_time <= now.time() <= end_time
