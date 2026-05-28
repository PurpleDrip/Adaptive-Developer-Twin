import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.fusion.app.services.weight_engine import WeightEngine

pytestmark = pytest.mark.unit


class TestCalculateSkillScore:
    def test_empty_evidence_returns_zero(self):
        assert WeightEngine.calculate_skill_score({}) == 0.0

    def test_single_source_returns_its_value(self):
        score = WeightEngine.calculate_skill_score({"telemetry": 0.8})
        assert abs(score - 0.8) < 0.001

    def test_two_sources_weighted_normalized(self):
        evidence = {"telemetry": 0.8, "weekly_test": 0.7}
        score = WeightEngine.calculate_skill_score(evidence)
        assert abs(score - round(0.495 / 0.65, 4)) < 0.001

    def test_unknown_source_uses_default_weight(self):
        evidence = {"some_new_source": 1.0}
        score = WeightEngine.calculate_skill_score(evidence)
        assert abs(score - 1.0) < 0.001

    def test_all_sources_present(self):
        evidence = {
            "telemetry": 1.0, "weekly_test": 1.0, "resume": 1.0,
            "projects": 1.0, "peer_feedback": 1.0
        }
        score = WeightEngine.calculate_skill_score(evidence)
        assert abs(score - 1.0) < 0.001

    def test_score_bounded_in_unit_interval(self):
        evidence = {"telemetry": 0.5, "weekly_test": 0.6, "resume": 0.7}
        score = WeightEngine.calculate_skill_score(evidence)
        assert 0.0 <= score <= 1.0


class TestFuseAllSkills:
    def test_confidence_full_sources(self):
        all_evidence = {
            "backend": {"telemetry": 0.8, "weekly_test": 0.7, "resume": 0.6, "projects": 0.9},
        }
        results = WeightEngine.fuse_all_skills(all_evidence)
        assert results["backend"]["confidence"] == 1.0

    def test_confidence_partial_sources(self):
        all_evidence = {"frontend": {"telemetry": 0.5}}
        results = WeightEngine.fuse_all_skills(all_evidence)
        assert results["frontend"]["confidence"] == 0.25

    def test_result_structure(self):
        results = WeightEngine.fuse_all_skills({"neo4j": {"telemetry": 0.6, "resume": 0.5}})
        assert "strength" in results["neo4j"]
        assert "confidence" in results["neo4j"]
        assert "sources" in results["neo4j"]

    def test_sources_only_includes_non_none(self):
        all_evidence = {"ml": {"telemetry": 0.7, "resume": None}}
        results = WeightEngine.fuse_all_skills(all_evidence)
        assert "telemetry" in results["ml"]["sources"]
        assert "resume" not in results["ml"]["sources"]
