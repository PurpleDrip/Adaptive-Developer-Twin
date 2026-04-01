from typing import Dict, List

class WeightEngine:
    # Configurable weights for different evidence sources
    DEFAULT_WEIGHTS = {
        "telemetry": 0.40,
        "weekly_test": 0.25,
        "resume": 0.20,
        "projects": 0.15
    }

    @staticmethod
    def calculate_skill_score(evidence: Dict[str, float], weights: Dict[str, float] = None) -> float:
        """
        Calculates a weighted average score for a single skill.
        evidence: {'telemetry': 0.8, 'weekly_test': 0.7, ...}
        """
        if not weights:
            weights = WeightEngine.DEFAULT_WEIGHTS
        
        total_score = 0.0
        total_weight_applied = 0.0
        
        for source, weight in weights.items():
            if source in evidence and evidence[source] is not None:
                total_score += (evidence[source] * weight)
                total_weight_applied += weight
        
        if total_weight_applied == 0:
            return 0.0
            
        # Normalize in case some sources are missing
        return round(total_score / total_weight_applied, 3)

    @staticmethod
    def fuse_all_skills(all_evidence: Dict[str, Dict[str, float]]) -> Dict[str, Dict[str, float]]:
        """
        all_evidence: {
            "backend": {"telemetry": 0.76, "weekly_test": 0.82, "resume": 0.68, "projects": 0.78},
            "neo4j": {"telemetry": 0.50, "resume": 0.70}
        }
        """
        results = {}
        for skill_name, evidence_map in all_evidence.items():
            strength = WeightEngine.calculate_skill_score(evidence_map)
            
            # Simple confidence: ratio of available sources
            total_sources = len(WeightEngine.DEFAULT_WEIGHTS)
            available_sources = len([v for v in evidence_map.values() if v is not None])
            confidence = round(available_sources / total_sources, 2)
            
            results[skill_name] = {
                "strength": strength,
                "confidence": confidence,
                "sources": evidence_map
            }
        return results
