"""
ADT Weight Engine — Production-grade multi-source evidence fusion.
Algorithm: Weighted Signal Fusion with adaptive weights and dynamic source discovery.
"""
from typing import Dict
import logging

logger = logging.getLogger("adt.weight_engine")

class WeightEngine:
    """Combines evidence from multiple sources into a single strength score."""

    # Base configurable weights for different evidence sources
    DEFAULT_WEIGHTS = {
        "telemetry": 0.40,
        "weekly_test": 0.25,
        "resume": 0.20,
        "projects": 0.15,
        "project_analysis": 0.20, # Dynamic source
        "peer_feedback": 0.10,    # Dynamic source
    }

    @classmethod
    def calculate_skill_score(cls, evidence: Dict[str, float], weights: Dict[str, float] = None) -> float:
        """
        Calculates a weighted average score for a single skill.
        evidence: {'telemetry': 0.8, 'weekly_test': 0.7, ...}
        """
        if not weights:
            weights = cls.DEFAULT_WEIGHTS
            
        total_score = 0.0
        total_weight_applied = 0.0
        
        for source, value in evidence.items():
            if value is not None:
                # Use default weight if source not explicitly in weights map
                weight = weights.get(source, 0.10) 
                total_score += (value * weight)
                total_weight_applied += weight
                
        if total_weight_applied == 0:
            return 0.0
            
        # Normalize score based on available evidence
        return round(total_score / total_weight_applied, 4)

    @classmethod
    def fuse_all_skills(cls, all_evidence: Dict[str, Dict[str, float]]) -> Dict[str, Dict[str, float]]:
        """
        all_evidence: {
            "backend": {"telemetry": 0.76, "weekly_test": 0.82, "resume": 0.68},
            "neo4j": {"telemetry": 0.50, "resume": 0.70}
        }
        """
        results = {}
        for skill_name, evidence_map in all_evidence.items():
            strength = cls.calculate_skill_score(evidence_map)
            
            # Simple confidence: ratio of available sources vs expected sources
            total_expected_sources = 4 # Telemetry, test, resume, projects
            available_sources = len([v for v in evidence_map.values() if v is not None])
            base_confidence = min(1.0, available_sources / total_expected_sources)
            
            results[skill_name] = {
                "strength": strength,
                "confidence": round(base_confidence, 4),
                "sources": {k: v for k, v in evidence_map.items() if v is not None}
            }
        return results
