import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.fusion.app.services.anomaly_detector import AnomalyDetector

pytestmark = pytest.mark.unit


class TestCheckHumanJitter:
    def test_zero_variance_high_wpm_is_bot(self):
        wpm = [100.0, 100.0, 100.0, 100.0, 100.0]
        result = AnomalyDetector.check_human_jitter(wpm)
        assert result["classification"] == "bot_detected"
        assert result["reliability_factor"] == 0.1

    def test_normal_variance_is_human(self):
        wpm = [45.0, 52.3, 38.7, 61.2, 44.8, 55.1, 42.0]
        result = AnomalyDetector.check_human_jitter(wpm)
        assert result["classification"] == "human_verified"
        assert result["reliability_factor"] == 1.0

    def test_insufficient_data_returns_safe_default(self):
        result = AnomalyDetector.check_human_jitter([50.0, 60.0])
        assert result["classification"] == "insufficient_data"
        assert result["reliability_factor"] == 1.0

    def test_empty_list_returns_safe_default(self):
        result = AnomalyDetector.check_human_jitter([])
        assert result["classification"] == "insufficient_data"

    def test_very_high_cv_is_erratic(self):
        wpm = [5.0, 200.0, 3.0, 180.0, 4.0, 190.0]
        result = AnomalyDetector.check_human_jitter(wpm)
        assert result["classification"] == "erratic"
        assert result["reliability_factor"] == 0.7

    def test_stats_keys_present(self):
        wpm = [50.0, 55.0, 48.0, 52.0, 60.0]
        result = AnomalyDetector.check_human_jitter(wpm)
        for key in ["mean_wpm", "std_dev", "cv", "min", "max", "range", "sample_count"]:
            assert key in result["stats"], f"Missing key: {key}"


class TestAnalyzeBatch:
    def test_too_few_records_returns_reliable(self):
        detector = AnomalyDetector()
        result = detector.analyze_batch([{"wpm": 50, "session_duration": 60, "keystrokes": 100}])
        assert result["status"] == "insufficient_data"
        assert result["is_reliable"] is True
        assert result["reliability_score"] == 1.0

    def test_batch_returns_expected_keys(self):
        detector = AnomalyDetector()
        records = [
            {"wpm": 50, "session_duration": 60, "keystrokes": 300, "commands_executed": 10,
             "errors_encountered": 2, "idle_seconds": 5.0, "copy_paste_count": 3}
            for _ in range(15)
        ]
        result = detector.analyze_batch(records)
        for key in ["status", "is_reliable", "reliability_score", "anomalies_detected", "total_records"]:
            assert key in result

    def test_reliability_score_in_range(self):
        detector = AnomalyDetector()
        records = [
            {"wpm": 50 + i, "session_duration": 60, "keystrokes": 300, "commands_executed": 10,
             "errors_encountered": 2, "idle_seconds": 5.0, "copy_paste_count": 3}
            for i in range(15)
        ]
        result = detector.analyze_batch(records)
        assert 0.0 <= result["reliability_score"] <= 1.0


class TestCompositeReliability:
    def test_weighted_average_calculation(self):
        batch = {"reliability_score": 0.8}
        jitter = {"reliability_factor": 0.6}
        score = AnomalyDetector.compute_composite_reliability(batch, jitter)
        expected = round((0.8 * 0.6) + (0.6 * 0.4), 3)
        assert score == expected

    def test_result_clamped_to_unit_interval(self):
        score = AnomalyDetector.compute_composite_reliability(
            {"reliability_score": 2.0}, {"reliability_factor": 3.0}
        )
        assert 0.0 <= score <= 1.0

    def test_defaults_to_safe_values_on_missing_keys(self):
        score = AnomalyDetector.compute_composite_reliability({}, {})
        assert score == 1.0
