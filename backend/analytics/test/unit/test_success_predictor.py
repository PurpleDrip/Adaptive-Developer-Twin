import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.analytics.app.services.success_predictor import SuccessPredictor

pytestmark = [pytest.mark.unit, pytest.mark.algorithm]


class TestSuccessPredictor:
    def setup_method(self):
        self.predictor = SuccessPredictor()

    def test_probability_in_unit_interval(self):
        dev = {"skill_match_score": 0.7, "experience_level": "Mid", "current_workload": 2, "historical_success_rate": 0.8}
        task = {"complexity": 3}
        result = self.predictor.predict_success(dev, task)
        assert 0.0 <= result["probability"] <= 1.0

    def test_high_match_senior_low_workload_has_high_prob(self):
        dev = {"skill_match_score": 0.95, "experience_level": "Senior", "current_workload": 0, "historical_success_rate": 0.95}
        task = {"complexity": 2}
        result = self.predictor.predict_success(dev, task)
        assert result["probability"] > 0.7

    def test_low_match_junior_high_workload_has_low_prob(self):
        dev = {"skill_match_score": 0.1, "experience_level": "Junior", "current_workload": 5, "historical_success_rate": 0.3}
        task = {"complexity": 5}
        result = self.predictor.predict_success(dev, task)
        assert result["probability"] < 0.5

    def test_method_is_heuristic_when_not_trained(self):
        dev = {"skill_match_score": 0.7}
        task = {"complexity": 3}
        result = self.predictor.predict_success(dev, task)
        assert result["method"] == "heuristic_weighted_average"

    def test_confidence_key_present(self):
        dev = {"skill_match_score": 0.7}
        task = {"complexity": 3}
        result = self.predictor.predict_success(dev, task)
        assert "confidence" in result
        assert result["confidence"] == 0.6

    def test_missing_fields_use_defaults(self):
        result = self.predictor.predict_success({}, {})
        assert 0.0 <= result["probability"] <= 1.0
