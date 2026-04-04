import numpy as np
from typing import Optional

class BayesianFuser:
    """
    Implements a probabilistic update rule for skill confidence using Beta-Binomial conjugate prior.
    Confidence is a posterior probability based on new versus old evidence.
    """
    @staticmethod
    def calculate_posterior_confidence(
        prior_strength: float, 
        current_strength: float, 
        prior_confidence: float,
        sample_size: int = 1,
        skill_category: Optional[str] = None
    ) -> float:
        """
        Proper Bayesian update using Beta-Binomial conjugate prior.
        
        Args:
            prior_strength: Previous skill strength [0,1]
            current_strength: Current observation [0,1] 
            prior_confidence: Previous confidence level [0,1]
            sample_size: Number of observations in current batch
            skill_category: Skill domain for hyperparameter tuning
            
        Returns:
            Updated confidence score [0,1]
        """
        # Hyperparameters per skill category (Beta distribution parameters)
        hyperparams = {
            "backend": {"alpha": 2, "beta": 2},      # More concentrated
            "frontend": {"alpha": 1.5, "beta": 1.5},
            "neo4j": {"alpha": 1, "beta": 2},         # Less confident initially
            "ml": {"alpha": 1.5, "beta": 2.5},
            "devops": {"alpha": 1, "beta": 1.5},
        }
        
        # Default hyperparameters
        alpha, beta = hyperparams.get(skill_category, {"alpha": 1.5, "beta": 1.5}).values()
        
        # Prior belief distribution
        prior_alpha = alpha + prior_strength * 10  # Scale to reasonable counts
        prior_beta = beta + (1 - prior_strength) * 10
        
        # Update with current observation
        successes = int(current_strength * sample_size)
        failures = sample_size - successes
        
        posterior_alpha = prior_alpha + successes
        posterior_beta = prior_beta + failures
        
        # Expected value of posterior (mean of Beta distribution)
        posterior_mean = posterior_alpha / (posterior_alpha + posterior_beta)
        
        # Confidence is inverse of variance (certainty measure)
        variance = (posterior_alpha * posterior_beta) / (
            (posterior_alpha + posterior_beta + 1) * (posterior_alpha + posterior_beta) ** 2
        )
        confidence = 1.0 / (1.0 + variance)  # Normalized certainty
        
        # Blend with prior confidence (momentum)
        momentum_factor = min(0.3, 1.0 / np.sqrt(sample_size))  # Less momentum for larger samples
        final_confidence = confidence * (1 - momentum_factor) + prior_confidence * momentum_factor
        
        return round(np.clip(final_confidence, 0.0, 1.0), 3)
