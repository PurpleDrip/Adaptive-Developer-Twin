import numpy as np
from typing import Dict, Any, List

class CodeBERTSimulator:
    """
    Simulates CodeBERT (768-dim transformer) for commercial demonstration.
    Extracts semantic skills from raw code syntax instead of just file extensions.
    """
    DOMAIN_PATTERNS = {
        "backend": ["FastAPI", "sqlalchemy", "PostgreSQL", "JWT", "requests.get"],
        "frontend": ["React.useState", "JSX", "tailwind", "flexbox", "onClick"],
        "neo4j": ["GraphDatabase.driver", "session.run", "MATCH (n)", "MERGE (d)"],
        "devops": ["docker.from_env", "k8s_client", "yaml.safe_load"]
    }

    @staticmethod
    def analyze_semantic_content(snippet: str) -> Dict[str, float]:
        """
        Mocked semantic analysis representing what a real CodeBERT model 
        would extract from the 768-dim embeddings.
        """
        domain_evidence = {}
        for domain, keywords in CodeBERTSimulator.DOMAIN_PATTERNS.items():
            matches = sum(1 for kw in keywords if kw.lower() in snippet.lower())
            # Simulate a continuous semantic similarity score (0.0 to 1.0)
            domain_evidence[domain] = min(matches * 0.25, 1.0)
            
        return domain_evidence

class SHAPExplainer:
    """
    Simulates SHAP (Shapley Additive exPlanation) for XAI (Explainable AI).
    Provides reasoning for why certain skills are ranked high.
    Used for 'Top Tier' seller requirement.
    """
    @staticmethod
    def explain_score(skill: str, sources: Dict[str, float]) -> Dict[str, Any]:
        """
        Identify the top contributors to the skill score.
        """
        sorted_sources = sorted(sources.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_sources[0] if sorted_sources else ("none", 0)
        
        return {
            "primary_driver": primary[0],
            "impact": round(primary[1] / sum(sources.values()) if sum(sources.values()) > 0 else 0, 2),
            "reasoning": f"Evidence for '{skill}' was primarily driven by {primary[0]} (contribution: {primary[1]})."
        }
