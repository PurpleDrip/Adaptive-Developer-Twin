"""
ADT Anomaly Detector — Production-grade telemetry fraud detection.

Algorithms:
  3. Isolation Forest (batch anomaly detection)
  4. WPM Jitter Check (human verification heuristic)
  
Integrated with Online Learner for incremental model updates.
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any, Optional, Tuple
import logging
import pickle
import os

logger = logging.getLogger("adt.anomaly_detector")

# Path to persist the trained model
MODEL_PATH = os.getenv("ANOMALY_MODEL_PATH", "/tmp/adt_anomaly_model.pkl")


class AnomalyDetector:
    """
    Production-grade anomaly detection for telemetry integrity.
    Uses pre-trained Isolation Forest + statistical heuristics.
    """

    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self._model: Optional[IsolationForest] = None
        self._is_fitted = False
        self._training_samples = 0
        self._load_or_create_model()

    def _load_or_create_model(self):
        """Load persisted model or create new one."""
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    state = pickle.load(f)
                    self._model = state["model"]
                    self._is_fitted = state["is_fitted"]
                    self._training_samples = state["samples"]
                logger.info(f"Loaded pre-trained anomaly model ({self._training_samples} samples).")
                return
            except Exception as e:
                logger.warning(f"Failed to load anomaly model: {e}. Creating new.")

        self._model = IsolationForest(
            contamination=self.contamination,
            n_estimators=200,  # More trees = more robust
            max_samples="auto",
            random_state=42,
            n_jobs=-1,
        )
        self._is_fitted = False

    def _persist_model(self):
        """Save model to disk for reuse across restarts."""
        try:
            with open(MODEL_PATH, "wb") as f:
                pickle.dump({
                    "model": self._model,
                    "is_fitted": self._is_fitted,
                    "samples": self._training_samples,
                }, f)
        except Exception as e:
            logger.warning(f"Failed to persist anomaly model: {e}")

    @staticmethod
    def _extract_features(records: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract a feature matrix from telemetry records.
        Features: [keystroke_rate, wpm, command_rate, error_rate, idle_ratio, copy_paste_rate]
        """
        features = []
        for r in records:
            duration = max(r.get("session_duration", 1.0), 1.0)  # Avoid division by zero
            keystrokes = r.get("keystrokes", r.get("total_keystrokes", 0))
            commands = r.get("commands_executed", r.get("total_commands", 0))
            errors = r.get("errors_encountered", r.get("total_errors", 0))
            idle = r.get("idle_seconds", r.get("total_idle_seconds", 0.0))
            copy_paste = r.get("copy_paste_count", r.get("total_copy_paste", 0))

            features.append([
                keystrokes / duration,          # Keystroke rate (per second)
                r.get("wpm", r.get("avg_wpm", 0.0)),  # Words per minute
                commands / duration,            # Command rate
                errors / max(keystrokes, 1),    # Error ratio
                idle / duration,                # Idle ratio
                copy_paste / max(keystrokes, 1),  # Copy-paste ratio
            ])
        return np.array(features, dtype=np.float64)

    def train(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Train the Isolation Forest on a labeled dataset.
        Call this once with historical data to establish baseline.
        """
        if len(training_data) < 20:
            return {"status": "insufficient_data", "message": "Need at least 20 samples"}

        features = self._extract_features(training_data)
        self._model.fit(features)
        self._is_fitted = True
        self._training_samples = len(training_data)
        self._persist_model()

        logger.info(f"Anomaly model trained on {len(training_data)} samples.")
        return {
            "status": "trained",
            "samples": len(training_data),
            "features": ["keystroke_rate", "wpm", "command_rate", "error_rate", "idle_ratio", "copy_paste_rate"],
        }

    def analyze_batch(self, batch_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a telemetry batch for anomalies.

        Returns:
            reliability_score, anomaly flags, and flagged indices
        """
        if len(batch_data) < 3:
            return {
                "status": "insufficient_data",
                "is_reliable": True,
                "reliability_score": 1.0,
                "anomalies_detected": 0,
                "message": "Not enough data points for analysis (need ≥3)",
            }

        features = self._extract_features(batch_data)

        if not self._is_fitted:
            # If model isn't trained yet, fit on this batch and predict
            if len(batch_data) >= 10:
                self._model.fit(features)
                self._is_fitted = True
                self._training_samples = len(batch_data)
                self._persist_model()

            predictions = self._model.fit_predict(features)
        else:
            predictions = self._model.predict(features)

        # Anomaly scores (lower = more anomalous)
        raw_scores = self._model.decision_function(features)

        anomaly_indices = np.where(predictions == -1)[0].tolist()
        anomaly_count = len(anomaly_indices)
        reliability_score = round(1.0 - (anomaly_count / len(batch_data)), 3)

        # Per-record details
        record_details = []
        for i, (pred, score) in enumerate(zip(predictions, raw_scores)):
            record_details.append({
                "index": i,
                "is_anomaly": bool(pred == -1),
                "anomaly_score": round(float(score), 4),
            })

        return {
            "status": "analyzed",
            "is_reliable": reliability_score >= 0.8,
            "reliability_score": reliability_score,
            "anomalies_detected": anomaly_count,
            "total_records": len(batch_data),
            "flagged_indices": anomaly_indices,
            "record_details": record_details,
            "message": (
                "Telemetry appears reliable."
                if reliability_score >= 0.8
                else "WARNING: Potential automated/fraudulent activity detected."
            ),
        }

    @staticmethod
    def check_human_jitter(wpm_values: List[float]) -> Dict[str, Any]:
        """
        Statistical analysis of WPM variance to detect robotic input.
        Real humans have natural typing variability (jitter).

        Returns:
            reliability_factor, statistics, and classification
        """
        if not wpm_values or len(wpm_values) < 3:
            return {
                "reliability_factor": 1.0,
                "classification": "insufficient_data",
                "stats": {},
            }

        wpm_arr = np.array(wpm_values, dtype=np.float64)
        mean_wpm = float(np.mean(wpm_arr))
        std_dev = float(np.std(wpm_arr))
        cv = std_dev / mean_wpm if mean_wpm > 0 else 0  # Coefficient of variation
        min_wpm = float(np.min(wpm_arr))
        max_wpm = float(np.max(wpm_arr))
        wpm_range = max_wpm - min_wpm

        stats = {
            "mean_wpm": round(mean_wpm, 2),
            "std_dev": round(std_dev, 2),
            "cv": round(cv, 4),
            "min": round(min_wpm, 2),
            "max": round(max_wpm, 2),
            "range": round(wpm_range, 2),
            "sample_count": len(wpm_values),
        }

        # Classification logic
        if std_dev < 0.5 and mean_wpm > 15:
            # Nearly zero variance with high WPM = robotic script
            reliability = 0.1
            classification = "bot_detected"
        elif std_dev < 2.0 and mean_wpm > 80:
            # Very low variance with very high WPM = suspicious
            reliability = 0.3
            classification = "suspicious"
        elif cv < 0.05 and mean_wpm > 10:
            # Coefficient of variation too low = unnaturally consistent
            reliability = 0.4
            classification = "suspicious"
        elif cv > 0.8:
            # Very high variance = erratic, might be idle periods mixed with bursts
            reliability = 0.7
            classification = "erratic"
        else:
            # Normal human typing pattern
            reliability = 1.0
            classification = "human_verified"

        return {
            "reliability_factor": round(reliability, 2),
            "classification": classification,
            "stats": stats,
        }

    @staticmethod
    def compute_composite_reliability(
        batch_result: Dict[str, Any],
        jitter_result: Dict[str, Any],
    ) -> float:
        """
        Combine Isolation Forest and Jitter Check into a single reliability score.
        Weights: 60% Isolation Forest, 40% Jitter.
        """
        if_score = batch_result.get("reliability_score", 1.0)
        jitter_score = jitter_result.get("reliability_factor", 1.0)
        composite = (if_score * 0.6) + (jitter_score * 0.4)
        return round(max(0.0, min(1.0, composite)), 3)
