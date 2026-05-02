"""
ADT Audit Log Model — Tracks every THG mutation for compliance and debugging.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class AuditLogDocument:
    """MongoDB document for audit_log collection."""
    @staticmethod
    def create(
        user_id: str,
        action: str,
        source: str,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> dict:
        """
        Args:
            user_id: The developer whose THG was updated
            action: One of: thg_update, task_assign, task_review, registration,
                    project_analysis, weekly_test, feedback, system_config_change
            source: What triggered the change: telemetry_batch, project_analysis,
                    review_feedback, weekly_test, manual, system
            before_state: THG state before the change (skill strengths/confidences)
            after_state: THG state after the change
            metadata: Extra context (batch_id, task_id, test_id, etc.)
        """
        return {
            "user_id": user_id,
            "action": action,
            "source": source,
            "before_state": before_state or {},
            "after_state": after_state or {},
            "metadata": metadata or {},
            "timestamp": datetime.utcnow(),
        }
