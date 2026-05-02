"""
ADT AI Core — Production-grade Semantic Extraction using CodeBERT.
Uses microsoft/codebert-base (768-dim transformer embeddings) to identify domain expertise.

Algorithms:
  1. CodeBERT Embedding + Domain Centroid Similarity
  2. SHAP-style Source Attribution (XAI)
"""
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from typing import Dict, Any, List, Optional, Tuple
from functools import lru_cache
import logging
import threading

logger = logging.getLogger("adt.ai_core")


class CodeBERTAnalyzer:
    """
    Production-grade semantic analysis using microsoft/codebert-base.
    Thread-safe, lazy-loaded, with cached domain centroids.
    """
    MODEL_NAME = "microsoft/codebert-base"
    _instance = None
    _lock = threading.Lock()

    # Domain centroid keywords — used to build reference vectors
    DOMAIN_PATTERNS = {
        "backend": [
            "FastAPI endpoint router", "sqlalchemy ORM model", "PostgreSQL database query",
            "JWT authentication token", "REST API microservice", "async await handler",
            "middleware request response", "pydantic schema validation",
        ],
        "frontend": [
            "React hooks useState useEffect", "JSX component rendering", "tailwind CSS styling",
            "flexbox grid layout responsive", "DOM manipulation event handler",
            "Redux state management", "Next.js server side rendering",
        ],
        "neo4j": [
            "Cypher query MATCH RETURN", "Neo4j GraphDatabase driver session",
            "node relationship traversal path", "MERGE CREATE SET property",
            "graph algorithm centrality pagerank",
        ],
        "devops": [
            "docker container image build", "kubernetes pod deployment service",
            "CI CD pipeline github actions", "terraform infrastructure provision",
            "nginx reverse proxy load balancer", "monitoring prometheus grafana",
        ],
        "ml": [
            "neural network training loss", "scikit-learn classifier regression",
            "pandas dataframe preprocessing", "tensorflow keras model layers",
            "feature engineering selection", "gradient descent optimization",
        ],
        "testing": [
            "pytest unit test assertion", "mock patch fixture", "integration test endpoint",
            "coverage report statement branch", "test driven development TDD",
        ],
        "database": [
            "SQL query SELECT JOIN WHERE", "MongoDB collection aggregation pipeline",
            "Redis cache key value store", "database migration schema version",
            "connection pool transaction commit",
        ],
        "security": [
            "encryption hash bcrypt argon2", "OAuth2 OpenID Connect authentication",
            "CORS cross origin policy", "SQL injection XSS prevention",
            "certificate TLS SSL HTTPS", "role based access control RBAC",
        ],
    }

    def __init__(self):
        self.tokenizer = None
        self.model = None
        self._centroids: Dict[str, np.ndarray] = {}
        self._initialized = False

    @classmethod
    def get_instance(cls) -> "CodeBERTAnalyzer":
        """Thread-safe singleton access."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def initialize(self):
        """Lazy load model and pre-compute domain centroids."""
        if self._initialized:
            return

        with self._lock:
            if self._initialized:
                return

            logger.info(f"Loading CodeBERT model '{self.MODEL_NAME}'...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.MODEL_NAME)
            self.model = AutoModel.from_pretrained(self.MODEL_NAME)
            self.model.eval()  # Set to evaluation mode for inference

            # Pre-compute and cache domain centroids
            logger.info("Computing domain centroids...")
            for domain, patterns in self.DOMAIN_PATTERNS.items():
                embeddings = [self._embed(p) for p in patterns]
                # Use L2-normalized mean for stable cosine similarity
                centroid = np.mean(embeddings, axis=0)
                norm = np.linalg.norm(centroid)
                if norm > 0:
                    centroid = centroid / norm
                self._centroids[domain] = centroid

            self._initialized = True
            logger.info(f"CodeBERT initialized with {len(self._centroids)} domain centroids.")

    def _embed(self, text: str) -> np.ndarray:
        """Generate a 768-dim mean-pooled embedding for text."""
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True,
            padding=True, max_length=512
        )
        with torch.no_grad():
            outputs = self.model(**inputs)
        # Mean pooling over token dimension
        return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

    def analyze_code(self, snippet: str) -> Dict[str, float]:
        """
        Analyze a code snippet and return domain similarity scores.

        Returns:
            Dict mapping domain → similarity score (0.0–1.0)
        """
        if not snippet or len(snippet.strip()) < 10:
            return {d: 0.05 for d in self.DOMAIN_PATTERNS}

        self.initialize()
        snippet_vec = self._embed(snippet)
        snippet_norm = np.linalg.norm(snippet_vec)
        if snippet_norm == 0:
            return {d: 0.05 for d in self.DOMAIN_PATTERNS}

        snippet_normalized = snippet_vec / snippet_norm

        results = {}
        for domain, centroid in self._centroids.items():
            # Cosine similarity with pre-normalized vectors
            similarity = float(np.dot(snippet_normalized, centroid))
            results[domain] = round(max(0.0, min(1.0, similarity)), 4)

        return results

    def analyze_resume(self, resume_text: str) -> Dict[str, float]:
        """
        Analyze resume text for domain expertise signals.
        Applies a 0.7 damping factor since resume claims are weaker evidence.
        """
        if not resume_text or len(resume_text.strip()) < 20:
            return {d: 0.2 for d in self.DOMAIN_PATTERNS}

        raw_scores = self.analyze_code(resume_text)
        return {d: round(s * 0.7, 4) for d, s in raw_scores.items()}

    def batch_analyze(self, texts: List[str]) -> List[Dict[str, float]]:
        """
        Batch analyze multiple code snippets efficiently.
        Shares model initialization cost across all texts.
        """
        self.initialize()
        return [self.analyze_code(t) for t in texts]

    def get_raw_embedding(self, text: str) -> np.ndarray:
        """Get the raw 768-dim embedding vector for custom downstream tasks."""
        self.initialize()
        return self._embed(text)


class SHAPExplainer:
    """
    SHAP-style Source Attribution for Explainable AI (XAI).
    Explains which evidence sources drove skill scores.
    """

    @staticmethod
    def explain_score(skill: str, sources: Dict[str, float]) -> Dict[str, Any]:
        """
        Identify top contributors to a skill score with impact ratios.

        Args:
            skill: The skill being explained (e.g., "backend")
            sources: Evidence map (e.g., {"telemetry": 0.8, "resume": 0.3})

        Returns:
            Explanation with primary driver, impact ratio, and reasoning
        """
        if not sources:
            return {
                "primary_driver": "none",
                "impact": 0.0,
                "contributions": {},
                "reasoning": f"No evidence available for '{skill}'.",
            }

        total = sum(abs(v) for v in sources.values())
        if total == 0:
            return {
                "primary_driver": "none",
                "impact": 0.0,
                "contributions": {},
                "reasoning": f"All evidence sources for '{skill}' are zero.",
            }

        # Calculate normalized contribution ratios (Shapley-like attribution)
        contributions = {}
        for source, value in sorted(sources.items(), key=lambda x: x[1], reverse=True):
            contributions[source] = {
                "raw_value": round(value, 4),
                "impact_ratio": round(value / total, 4),
            }

        sorted_sources = sorted(sources.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_sources[0]
        secondary = sorted_sources[1] if len(sorted_sources) > 1 else ("none", 0)

        return {
            "primary_driver": primary[0],
            "impact": round(primary[1] / total, 4),
            "secondary_driver": secondary[0],
            "contributions": contributions,
            "reasoning": (
                f"'{skill}' strength is primarily driven by {primary[0]} "
                f"(contribution: {primary[1]:.3f}, {primary[1]/total*100:.1f}% impact). "
                f"Secondary driver: {secondary[0]} ({secondary[1]:.3f})."
            ),
        }

    @staticmethod
    def explain_batch(
        skills: Dict[str, Dict[str, float]]
    ) -> Dict[str, Dict[str, Any]]:
        """Explain all skills at once."""
        return {
            skill: SHAPExplainer.explain_score(skill, sources)
            for skill, sources in skills.items()
        }
