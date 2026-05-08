"""
ADT Skill Matcher — Semantic matching between task requirements and developer profiles.
"""
import numpy as np
from typing import Dict, Any
import httpx
import os
import logging

logger = logging.getLogger("adt.skill_matcher")

class SkillMatcher:
    """
    Semantic Skill Matching Engine.
    Calls Fusion Engine to get CodeBERT task vectors, then computes cosine similarity.
    """
    FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")

    @classmethod
    async def get_task_vector(cls, task_desc: str) -> Dict[str, float]:
        """
        Fetches true semantic vector from Fusion Engine (CodeBERT).
        Fallback to simple heuristic mapping if Fusion is down.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{cls.FUSION_URL}/api/v1/fusion/fusion/analyze-text",
                    json={"text": task_desc}
                )
                resp.raise_for_status()
                return resp.json().get("vector", {})
        except Exception as e:
            logger.error(f"Failed to fetch semantic vector from Fusion: {e}")
            # Fallback heuristic
            domains = ["backend", "frontend", "neo4j", "devops", "ml", "database", "security", "testing"]
            vector = {}
            desc_lower = task_desc.lower()
            for d in domains:
                vector[d] = 1.0 if d in desc_lower else 0.0
            
            if "api" in desc_lower or "endpoint" in desc_lower: vector["backend"] = 0.9
            if "react" in desc_lower or "ui" in desc_lower: vector["frontend"] = 0.9
            if "sql" in desc_lower or "data" in desc_lower: vector["database"] = 0.8
            return vector

    @staticmethod
    def calculate_match(task_vector: Dict[str, float], dev_skills: Dict[str, float]) -> float:
        """
        Calculates cosine similarity between task vector and developer skills.
        """
        keys = set(task_vector.keys()) | set(dev_skills.keys())
        if not keys:
            return 0.0
            
        v1 = np.array([task_vector.get(k, 0.0) for k in keys])
        v2 = np.array([dev_skills.get(k, 0.0) for k in keys])
        
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0: 
            return 0.0
            
        similarity = np.dot(v1, v2) / (norm1 * norm2)
        return float(np.clip(similarity, 0.0, 1.0))
