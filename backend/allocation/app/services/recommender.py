"""
ADT Recommender — Task recommendations via Collaborative Filtering.
Algorithm: Singular Value Decomposition (SVD) / Matrix Factorization.
Identifies tasks that 'similar' developers have successfully completed.
"""
import numpy as np
from typing import List, Dict, Any
import logging

logger = logging.getLogger("adt.recommender")

class TaskRecommender:
    """
    Recommends task types to developers based on collective behavior.
    """
    
    @staticmethod
    def recommend_tasks(
        user_id: str, 
        user_task_matrix: np.ndarray, 
        user_map: Dict[str, int], 
        task_type_map: Dict[str, int]
    ) -> List[Dict[str, Any]]:
        """
        Uses SVD to fill missing values in the user-task interaction matrix.
        
        Args:
            user_id: ID of the user to get recommendations for
            user_task_matrix: Matrix of (users x task_types) with success scores
            user_map: Mapping of user_id to matrix index
            task_type_map: Mapping of task_type to matrix index
        """
        if user_id not in user_map:
            return []

        user_idx = user_map[user_id]
        
        # Decompose matrix: U * S * V
        # k=min(matrix.shape)-1
        try:
            u, s, vt = np.linalg.svd(user_task_matrix, full_matrices=False)
            
            # Reconstruct the predicted matrix
            predicted_matrix = np.dot(u, np.dot(np.diag(s), vt))
            
            user_predictions = predicted_matrix[user_idx]
            
            # Sort task types by predicted score
            recommendations = []
            inv_task_map = {v: k for k, v in task_type_map.items()}
            
            for idx, score in enumerate(user_predictions):
                # If the user hasn't tried this task type much (low value in original matrix)
                if user_task_matrix[user_idx, idx] < 0.1:
                    recommendations.append({
                        "task_type": inv_task_map[idx],
                        "recommendation_score": round(float(score), 4)
                    })
            
            return sorted(recommendations, key=lambda x: x["recommendation_score"], reverse=True)[:5]
            
        except Exception as e:
            logger.error(f"Recommendation failed: {e}")
            return []
