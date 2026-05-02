"""
ADT Burnout Predictor — Time-series analysis for developer health.
Algorithm: Gated Recurrent Unit (GRU) / LSTM for sequence modeling.
Analyzes 30-day telemetry trends to predict cognitive exhaustion.
"""
import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Any
import logging

logger = logging.getLogger("adt.burnout_predictor")

class BurnoutModel(nn.Module):
    """Simple GRU for time-series burnout prediction."""
    def __init__(self, input_dim=6, hidden_dim=32):
        super(BurnoutModel, self). __init__()
        self.gru = nn.GRU(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        _, h = self.gru(x)
        out = self.fc(h.squeeze(0))
        return self.sigmoid(out)

class BurnoutPredictor:
    """
    Analyzes historical telemetry to identify burnout risk.
    """
    def __init__(self):
        self.model = BurnoutModel()
        # In production, load state_dict here
        # self.model.load_state_dict(torch.load('burnout_v1.pth'))
        self.model.eval()

    def predict_risk(self, telemetry_series: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Takes a sequence of daily aggregated telemetry.
        Features: [WPM, Keystrokes, Commands, Errors, IdleRatio, CopyPaste]
        """
        if len(telemetry_series) < 7:
            return {"risk_score": 0.1, "status": "insufficient_data", "message": "Need at least 7 days of data"}

        # Prepare input tensor [1, seq_len, 6]
        features = []
        for r in telemetry_series[-30:]: # Last 30 days
            features.append([
                r.get("wpm", 50.0) / 100.0,
                r.get("keystrokes", 1000) / 5000.0,
                r.get("commands", 20) / 100.0,
                r.get("errors", 5) / 50.0,
                r.get("idle_ratio", 0.2),
                r.get("copy_paste_ratio", 0.1)
            ])
        
        input_tensor = torch.tensor([features], dtype=torch.float32)
        
        with torch.no_grad():
            risk_score = self.model(input_tensor).item()

        status = "healthy"
        if risk_score > 0.8: status = "critical"
        elif risk_score > 0.5: status = "at_risk"

        return {
            "user_id": telemetry_series[0].get("user_id"),
            "risk_score": round(risk_score, 4),
            "status": status,
            "days_analyzed": len(features),
            "trend": "increasing" if features[-1][3] > features[0][3] else "stable" # Simple error trend
        }
