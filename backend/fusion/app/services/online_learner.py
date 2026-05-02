"""
ADT Online Learner — Incremental model updates for Fusion Engine.
Maintains the 'Adaptive' nature of the Twin by learning from streaming telemetry.
"""
import logging
import numpy as np
from typing import List, Dict, Any
from app.services.anomaly_detector import AnomalyDetector

logger = logging.getLogger("adt.online_learner")

class OnlineLearner:
    """
    Manages incremental updates to AI models.
    Implements a sliding window retraining strategy for the Anomaly Detector.
    """
    
    def __init__(self, detector: AnomalyDetector, window_size: int = 1000):
        self.detector = detector
        self.window_size = window_size
        self.buffer: List[Dict[str, Any]] = []

    def ingest_sample(self, sample: Dict[str, Any]):
        """
        Adds a new telemetry sample to the training buffer.
        Triggers retraining when buffer reaches window size.
        """
        self.buffer.append(sample)
        
        # Keep buffer within window size
        if len(self.buffer) > self.window_size:
            self.buffer.pop(0)
            
        # Retrain every 100 new samples once buffer is full enough
        if len(self.buffer) >= 200 and len(self.buffer) % 100 == 0:
            self.retrain_anomaly_detector()

    def retrain_anomaly_detector(self):
        """
        Retrains the Isolation Forest on the current buffer.
        """
        logger.info(f"Triggering incremental retraining for Anomaly Detector with {len(self.buffer)} samples.")
        result = self.detector.train(self.buffer)
        logger.info(f"Retraining complete: {result.get('status')}")

    def get_stats(self) -> Dict[str, Any]:
        return {
            "buffer_size": len(self.buffer),
            "window_size": self.window_size,
            "is_ready": len(self.buffer) >= 200
        }
