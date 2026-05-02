"""
ADT Bayesian Fusion — Probabilistic skill confidence estimation.
Algorithm: Beta-Binomial Conjugate Prior with momentum blending.
"""
import numpy as np
from typing import Optional, Dict
import logging

logger = logging.getLogger("adt.bayesian_fusion")


class BayesianFuser:
    """Beta-Binomial conjugate prior for skill confidence updates."""

    DOMAIN_HYPERPARAMS: Dict[str, Dict[str, float]] = {
        "backend":   {"alpha": 2.0, "beta": 2.0},
        "frontend":  {"alpha": 1.5, "beta": 1.5},
        "neo4j":     {"alpha": 1.0, "beta": 2.5},
        "ml":        {"alpha": 1.5, "beta": 2.5},
        "devops":    {"alpha": 1.0, "beta": 1.5},
        "testing":   {"alpha": 2.0, "beta": 1.5},
        "database":  {"alpha": 1.5, "beta": 2.0},
        "security":  {"alpha": 1.0, "beta": 3.0},
    }

    @classmethod
    def calculate_posterior_confidence(
        cls, prior_strength: float, current_strength: float,
        prior_confidence: float, sample_size: int = 1,
        skill_category: Optional[str] = None,
    ) -> float:
        prior_strength = np.clip(prior_strength, 0.0, 1.0)
        current_strength = np.clip(current_strength, 0.0, 1.0)
        prior_confidence = np.clip(prior_confidence, 0.0, 1.0)
        sample_size = max(1, sample_size)

        hp = cls.DOMAIN_HYPERPARAMS.get(skill_category, {"alpha": 1.5, "beta": 1.5})
        effective_prior_weight = 10 * prior_confidence
        prior_alpha = hp["alpha"] + prior_strength * effective_prior_weight
        prior_beta = hp["beta"] + (1 - prior_strength) * effective_prior_weight

        posterior_alpha = prior_alpha + current_strength * sample_size
        posterior_beta = prior_beta + (1 - current_strength) * sample_size

        total = posterior_alpha + posterior_beta
        confidence = 1.0 - (1.0 / (1.0 + 0.1 * total))

        momentum = min(0.3, 1.0 / np.sqrt(sample_size + 1))
        final = confidence * (1 - momentum) + prior_confidence * momentum
        return round(float(np.clip(final, 0.0, 1.0)), 4)

    @classmethod
    def batch_update(cls, skills: Dict[str, Dict[str, float]], sample_size: int = 1) -> Dict[str, float]:
        return {
            skill: cls.calculate_posterior_confidence(
                d.get("strength", 0.5), d.get("strength", 0.5),
                d.get("confidence", 0.5), sample_size, skill,
            )
            for skill, d in skills.items()
        }
