import numpy as np
from typing import Dict, List, Any

class SkillMatcher:
    """
    Semantic Skill Matching Engine.
    Used for task-developer alignment.
    In production, this would call the CodeBERT vectorizer.
    """
    @staticmethod
    def get_task_vector(task_desc: str) -> Dict[str, float]:
        """
        Calculates task domain vector.
        (Conceptual: 768-dim CodeBERT vector in production)
        """
        domains = ["backend", "frontend", "neo4j", "devops", "ml"]
        vector = {}
        for d in domains:
            # Fake a vector based on keywords for the demo
            if d.lower() in task_desc.lower():
                vector[d] = 1.0
            else:
                vector[d] = 0.0
                
        # Handle complex mapping (e.g., 'API' maps to backend)
        if "api" in task_desc.lower(): vector["backend"] = 0.9
        if "react" in task_desc.lower(): vector["frontend"] = 0.9
        if "sql" in task_desc.lower(): vector["backend"] = 0.8
        
        return vector

    @staticmethod
    def calculate_match(task_vector: Dict[str, float], dev_skills: Dict[str, float]) -> float:
        """
        Calculates cosine similarity between task vector and developer skills.
        """
        # Vectorize
        keys = set(task_vector.keys()) | set(dev_skills.keys())
        v1 = np.array([task_vector.get(k, 0.0) for k in keys])
        v2 = np.array([dev_skills.get(k, 0.0) for k in keys])
        
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0: return 0.0
        
        return float(np.dot(v1, v2) / (norm1 * norm2))
