import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.allocation.app.services.skill_matcher import SkillMatcher

pytestmark = [pytest.mark.unit, pytest.mark.algorithm]


class TestCalculateMatch:
    def test_identical_vectors_returns_one(self):
        v = {"backend": 0.8, "frontend": 0.5, "neo4j": 0.3}
        assert abs(SkillMatcher.calculate_match(v, v) - 1.0) < 1e-6

    def test_orthogonal_vectors_returns_zero(self):
        v1 = {"backend": 1.0, "frontend": 0.0}
        v2 = {"backend": 0.0, "frontend": 1.0}
        assert SkillMatcher.calculate_match(v1, v2) == 0.0

    def test_empty_vectors_returns_zero(self):
        assert SkillMatcher.calculate_match({}, {}) == 0.0

    def test_one_empty_vector_returns_zero(self):
        assert SkillMatcher.calculate_match({"backend": 1.0}, {}) == 0.0

    def test_partial_overlap_correct_cosine(self):
        v1 = {"backend": 1.0, "frontend": 0.0}
        v2 = {"backend": 0.8, "frontend": 0.6}
        score = SkillMatcher.calculate_match(v1, v2)
        assert abs(score - 0.8) < 1e-6

    def test_result_in_unit_interval(self):
        import random
        random.seed(42)
        for _ in range(20):
            v1 = {k: random.random() for k in ["backend", "frontend", "ml", "neo4j"]}
            v2 = {k: random.random() for k in ["backend", "frontend", "ml", "neo4j"]}
            score = SkillMatcher.calculate_match(v1, v2)
            assert 0.0 <= score <= 1.0

    def test_missing_skill_treated_as_zero(self):
        v1 = {"backend": 1.0}
        v2 = {"backend": 0.5, "frontend": 0.9}
        score = SkillMatcher.calculate_match(v1, v2)
        assert 0.0 < score < 1.0
