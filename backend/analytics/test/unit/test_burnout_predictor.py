import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.analytics.app.services.burnout_predictor import BurnoutPredictor

pytestmark = [pytest.mark.unit, pytest.mark.algorithm]

DAILY_RECORD = {
    "user_id": "test-user-1",
    "wpm": 60.0,
    "keystrokes": 2000,
    "commands": 30,
    "errors": 5,
    "idle_ratio": 0.2,
    "copy_paste_ratio": 0.1
}


class TestBurnoutPredictor:
    def setup_method(self):
        self.predictor = BurnoutPredictor()

    def test_insufficient_data_returns_safe_default(self):
        series = [DAILY_RECORD] * 5
        result = self.predictor.predict_risk(series)
        assert result["status"] == "insufficient_data"
        assert result["risk_score"] == 0.1

    def test_sufficient_data_returns_valid_score(self):
        series = [DAILY_RECORD] * 10
        result = self.predictor.predict_risk(series)
        assert 0.0 <= result["risk_score"] <= 1.0

    def test_status_is_one_of_known_values(self):
        series = [DAILY_RECORD] * 10
        result = self.predictor.predict_risk(series)
        assert result["status"] in ["healthy", "at_risk", "critical", "insufficient_data"]

    def test_user_id_preserved_from_series(self):
        series = [DAILY_RECORD] * 10
        result = self.predictor.predict_risk(series)
        assert result["user_id"] == "test-user-1"

    def test_days_analyzed_bounded_at_30(self):
        series = [DAILY_RECORD] * 45
        result = self.predictor.predict_risk(series)
        assert result["days_analyzed"] <= 30

    def test_trend_key_present(self):
        series = [DAILY_RECORD] * 10
        result = self.predictor.predict_risk(series)
        assert "trend" in result
        assert result["trend"] in ["increasing", "stable"]

    def test_status_matches_score_thresholds(self):
        series = [DAILY_RECORD] * 10
        result = self.predictor.predict_risk(series)
        score = result["risk_score"]
        if score > 0.8:
            assert result["status"] == "critical"
        elif score > 0.5:
            assert result["status"] == "at_risk"
        else:
            assert result["status"] == "healthy"
