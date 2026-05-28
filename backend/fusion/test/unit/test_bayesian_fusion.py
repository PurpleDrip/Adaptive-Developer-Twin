import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.fusion.app.services.bayesian_fusion import BayesianFuser

pytestmark = [pytest.mark.unit, pytest.mark.algorithm]


class TestCalculatePosteriorConfidence:
    def test_result_in_unit_interval(self):
        result = BayesianFuser.calculate_posterior_confidence(
            prior_strength=0.7, current_strength=0.8,
            prior_confidence=0.6, sample_size=5, skill_category="backend"
        )
        assert 0.0 <= result <= 1.0

    def test_clamps_out_of_range_inputs(self):
        result = BayesianFuser.calculate_posterior_confidence(
            prior_strength=1.5, current_strength=-0.5,
            prior_confidence=2.0, sample_size=100
        )
        assert 0.0 <= result <= 1.0

    def test_larger_sample_size_increases_confidence(self):
        low = BayesianFuser.calculate_posterior_confidence(0.7, 0.8, 0.5, sample_size=1)
        high = BayesianFuser.calculate_posterior_confidence(0.7, 0.8, 0.5, sample_size=100)
        assert high >= low

    def test_unknown_skill_category_uses_defaults(self):
        result = BayesianFuser.calculate_posterior_confidence(0.5, 0.6, 0.5, skill_category="unknown_domain")
        assert 0.0 <= result <= 1.0

    def test_all_known_domains_valid(self):
        domains = ["backend", "frontend", "neo4j", "ml", "devops", "testing", "database", "security"]
        for d in domains:
            r = BayesianFuser.calculate_posterior_confidence(0.6, 0.7, 0.5, skill_category=d)
            assert 0.0 <= r <= 1.0, f"Out of range for domain: {d}"


class TestBatchUpdate:
    def test_all_results_in_unit_interval(self):
        skills = {
            "backend": {"strength": 0.8, "confidence": 0.7},
            "frontend": {"strength": 0.5, "confidence": 0.4},
            "neo4j": {"strength": 0.3, "confidence": 0.2},
        }
        results = BayesianFuser.batch_update(skills, sample_size=3)
        for skill, conf in results.items():
            assert 0.0 <= conf <= 1.0

    def test_preserves_all_skill_keys(self):
        skills = {"backend": {"strength": 0.8, "confidence": 0.6}, "ml": {"strength": 0.5, "confidence": 0.4}}
        results = BayesianFuser.batch_update(skills)
        assert set(results.keys()) == {"backend", "ml"}

    def test_empty_skills_returns_empty(self):
        results = BayesianFuser.batch_update({})
        assert results == {}
