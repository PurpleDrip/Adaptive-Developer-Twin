"""
ADT Workload Optimizer — Global task-developer assignment optimization.
Algorithm: Hungarian Algorithm (Kuhn-Munkres) / Min-Cost Max-Flow.
Ensures optimal distribution of tasks to prevent burnout and maximize total match score.
"""
import numpy as np
from scipy.optimize import linear_sum_assignment
from typing import List, Dict, Any
import logging

logger = logging.getLogger("adt.workload_optimizer")

class WorkloadOptimizer:
    """
    Optimizes the assignment of multiple tasks to multiple developers.
    Solves the bipartite matching problem to maximize total match quality.
    """

    @staticmethod
    def optimize_assignments(
        tasks: List[Dict[str, Any]], 
        developers: List[Dict[str, Any]],
        match_scores: np.ndarray
    ) -> List[Dict[str, Any]]:
        """
        Calculates the optimal 1:1 mapping between tasks and developers.
        
        Args:
            tasks: List of task objects
            developers: List of developer objects
            match_scores: 2D matrix [len(tasks) x len(developers)] of match scores
            
        Returns:
            List of optimized assignments
        """
        if match_scores.size == 0:
            return []

        # Scipy's linear_sum_assignment minimizes cost. 
        # Since we want to maximize match scores, we convert scores to costs (1 - score).
        cost_matrix = 1.0 - match_scores
        
        # row_ind corresponds to tasks, col_ind to developers
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        
        assignments = []
        for r, c in zip(row_ind, col_ind):
            # Only assign if the match is decent (> 0.2)
            if match_scores[r, c] > 0.2:
                assignments.append({
                    "task_id": tasks[r]["task_id"],
                    "user_id": developers[c]["user_id"],
                    "match_score": round(float(match_scores[r, c]), 4),
                    "assignment_type": "global_optimal"
                })
                
        return assignments

    @staticmethod
    def calculate_cost_matrix(tasks: List[Dict[str, Any]], developers: List[Dict[str, Any]]) -> np.ndarray:
        """
        Stub for generating the cost matrix based on skill similarity and current workload.
        In production, this would be computed using the SkillMatcher.
        """
        # (For now, we assume the scores are passed in directly to optimize_assignments)
        pass
