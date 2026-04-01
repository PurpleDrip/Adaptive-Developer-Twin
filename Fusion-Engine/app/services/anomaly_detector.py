from sklearn.ensemble import IsolationForest
import numpy as np
from typing import List, Dict, Any

class AnomalyDetector:
    def __init__(self, contamination: float = 0.05):
        self.model = IsolationForest(contamination=contamination, random_state=42)

    def analyze_telemetry_batch(self, batch_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Uses Isolation Forest to detect 'cheating' or 'automated' telemetry patterns.
        Features: [Normalized Keystrokes, WPM, Command Frequency]
        """
        if len(batch_data) < 5:
            return {"status": "insufficient_data", "is_reliable": True}

        # Vectorize key metrics that suggest high productivity
        features = []
        for d in batch_data:
            # Derived feature: keystrokes per minute
            duration = d.get('session_duration', 5.0)
            ks_rate = d.get('keystrokes', 0) / duration
            
            features.append([
                ks_rate,
                d.get('wpm', 0),
                d.get('commands_executed', 0)
            ])
            
        data_matrix = np.array(features)
        
        # Train and detect
        preds = self.model.fit_predict(data_matrix)
        
        # Count anomalies (-1)
        anomaly_indices = np.where(preds == -1)[0].tolist()
        anomaly_count = len(anomaly_indices)
        reliability_score = round(1.0 - (anomaly_count / len(batch_data)), 2)
        
        return {
            "status": "analyzed",
            "is_reliable": reliability_score > 0.8,
            "reliability_score": reliability_score,
            "anomalies_detected": anomaly_count,
            "flagged_indices": anomaly_indices,
            "message": "Anomaly check complete" if reliability_score > 0.8 else "WARNING: Potential automated activity detected"
        }

    @staticmethod
    def check_human_jitter(wpm_values: List[float]) -> float:
        """
        Calculates variability in WPM. 
        Too little variability suggests a flat robotic input.
        """
        if not wpm_values or len(wpm_values) < 3:
            return 1.0 # Default reliability
            
        std_dev = np.std(wpm_values)
        # If std_dev is nearly zero but WPM is high, it's a loop script
        if std_dev < 0.1 and np.mean(wpm_values) > 10:
            return 0.1 # Low reliability
        return 1.0
