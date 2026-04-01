import numpy as np

class BayesianFuser:
    """
    Implements a probabilistic update rule for skill confidence (HMM-lite).
    Confidence is a posterior probability based on new versus old evidence.
    """
    @staticmethod
    def calculate_posterior_confidence(
        prior_strength: float, 
        current_strength: float, 
        prior_confidence: float
    ) -> float:
        """
        Bayesian update:
        Confidence = how well the current observation matches the established trend.
        If there's a large delta, confidence is penalized (until more evidence arrives).
        """
        # [0,1] range delta
        delta = abs(current_strength - prior_strength)
        
        # Likelihood of current evidence being accurate
        # High delta = low likelihood of reliability for this update
        likelihood = np.exp(-2.0 * delta)
        
        # Posterior update (simplified Bayesian combination)
        posterior = (prior_confidence * 0.7) + (likelihood * 0.3)
        
        return round(min(posterior, 1.0), 2)
