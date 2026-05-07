"""
ADT Audit Logger — Centralized audit logging for all THG mutations.
Every service calls this to log changes before/after THG updates.
"""
import logging
import os
import redis
import json
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger("adt.audit")


class AuditLogger:
    """
    Production-grade audit logger that writes to MongoDB.
    Used by: Telemetry batch processor, Task reviewer, Registration, Weekly tests.
    """

    def __init__(self, db):
        """
        Args:
            db: Motor database instance from shared.database.mongo
        """
        self._collection = db["audit_log"]
        # Redis for Real-time WebSocket broadcasting
        self.r_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)

    async def log(
        self,
        user_id: str,
        action: str,
        source: str,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Write an audit entry.

        Args:
            user_id: Developer whose data changed
            action: thg_update | task_assign | task_review | registration |
                    project_analysis | weekly_test | feedback | system_config_change
            source: telemetry_batch | project_analysis | review_feedback |
                    weekly_test | manual | system
            before_state: Skill strengths/confidences before change
            after_state: Skill strengths/confidences after change
            metadata: Extra context (batch_id, task_id, etc.)

        Returns:
            The inserted document ID as string
        """
        doc = {
            "user_id": user_id,
            "action": action,
            "source": source,
            "before_state": before_state or {},
            "after_state": after_state or {},
            "metadata": metadata or {},
            "timestamp": datetime.utcnow(),
        }
        result = await self._collection.insert_one(doc)
        # 2. Broadcast via Redis
        try:
            self.r_client.publish("audit_logs", json.dumps({
                "id": str(result.inserted_id),
                "user_id": user_id,
                "action": action,
                "source": source,
                "timestamp": doc["timestamp"].isoformat()
            }))
        except:
            pass

        return str(result.inserted_id)

    async def log_thg_update(
        self,
        user_id: str,
        source: str,
        skill_name: str,
        old_strength: float,
        new_strength: float,
        old_confidence: float,
        new_confidence: float,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Convenience method for THG skill updates."""
        return await self.log(
            user_id=user_id,
            action="thg_update",
            source=source,
            before_state={
                "skill": skill_name,
                "strength": old_strength,
                "confidence": old_confidence,
            },
            after_state={
                "skill": skill_name,
                "strength": new_strength,
                "confidence": new_confidence,
            },
            metadata=metadata,
        )

    async def log_system_config_change(
        self,
        changed_by: str,
        before_config: Dict[str, Any],
        after_config: Dict[str, Any],
    ) -> str:
        """Log when tech support changes system config (window, holidays, etc.)."""
        return await self.log(
            user_id=changed_by,
            action="system_config_change",
            source="manual",
            before_state=before_config,
            after_state=after_config,
            metadata={"changed_by_role": "tech_support"},
        )

    async def get_recent(self, limit: int = 100, user_id: Optional[str] = None) -> list:
        """Fetch recent audit entries, optionally filtered by user."""
        query = {}
        if user_id:
            query["user_id"] = user_id
        cursor = self._collection.find(query).sort("timestamp", -1).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_by_action(self, action: str, limit: int = 50) -> list:
        """Fetch audit entries by action type."""
        cursor = self._collection.find({"action": action}).sort("timestamp", -1).limit(limit)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
