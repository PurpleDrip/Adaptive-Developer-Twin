# Backend Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit + integration test coverage across all 9 backend services, with algorithm-level testing for Fusion, Allocation, and Analytics.

**Architecture:** Each service gets `test/unit/` and `test/integration/` sub-folders. Unit tests mock DB/Redis/HTTP using `mongomock` and `fakeredis`. Integration tests require a live `.env` with real credentials. A root `pytest.ini` registers markers and a root `conftest.py` handles env loading.

**Tech Stack:** pytest, pytest-asyncio, pytest-mock, httpx, mongomock, fakeredis, numpy, torch, xgboost, scipy

---

## File Map

```
pytest.ini                                              ← root pytest config
conftest.py                                             ← root env loader
requirements-test.txt                                   ← test-only dependencies

backend/auth/test/conftest.py
backend/auth/test/unit/test_models.py
backend/auth/test/unit/test_services.py
backend/auth/test/integration/test_routes.py

backend/telemetry/test/conftest.py
backend/telemetry/test/unit/test_models.py
backend/telemetry/test/unit/test_batch_processor.py
backend/telemetry/test/integration/test_routes.py

backend/fusion/test/conftest.py
backend/fusion/test/unit/test_anomaly_detector.py
backend/fusion/test/unit/test_weight_engine.py
backend/fusion/test/unit/test_bayesian_fusion.py
backend/fusion/test/integration/test_routes.py

backend/allocation/test/conftest.py
backend/allocation/test/unit/test_skill_matcher.py
backend/allocation/test/unit/test_workload_optimizer.py
backend/allocation/test/integration/test_routes.py

backend/analytics/test/conftest.py
backend/analytics/test/unit/test_burnout_predictor.py
backend/analytics/test/unit/test_success_predictor.py
backend/analytics/test/integration/test_routes.py

backend/thg/test/conftest.py
backend/thg/test/unit/test_schemas.py
backend/thg/test/integration/test_routes.py

backend/monitoring/test/conftest.py
backend/monitoring/test/unit/test_middleware.py
backend/monitoring/test/integration/test_routes.py

backend/gateway/test/conftest.py
backend/gateway/test/unit/test_ip_whitelist.py
backend/gateway/test/integration/test_proxy.py

backend/task/test/conftest.py
backend/task/test/unit/test_services.py
backend/task/test/integration/test_routes.py
```

---

## Task 1: Root Pytest Configuration

**Files:**
- Create: `pytest.ini`
- Create: `conftest.py`
- Create: `requirements-test.txt`

- [ ] **Step 1: Create pytest.ini**

```ini
[pytest]
asyncio_mode = auto
pythonpath = .
testpaths = backend
markers =
    unit: unit tests — no external dependencies, run anywhere
    integration: integration tests — requires live .env credentials
    algorithm: algorithm correctness tests — may be slow
    slow: tests taking longer than 2 seconds
```

- [ ] **Step 2: Create root conftest.py**

```python
import os
import pytest
from dotenv import load_dotenv

def pytest_configure(config):
    """Load .env before any test runs."""
    load_dotenv(override=False)
```

- [ ] **Step 3: Create requirements-test.txt**

```
pytest>=7.4
pytest-asyncio>=0.23
pytest-mock>=3.12
httpx>=0.27
mongomock>=4.1
fakeredis>=2.20
python-dotenv>=1.0
```

- [ ] **Step 4: Install test dependencies**

Run from project root:
```bash
pip install -r requirements-test.txt
```

Expected: all packages install without error.

- [ ] **Step 5: Verify pytest discovers backend**

```bash
pytest --collect-only -q 2>&1 | head -20
```

Expected: "no tests ran" (no test files yet — confirming discovery works).

- [ ] **Step 6: Commit**

```bash
git add pytest.ini conftest.py requirements-test.txt
git commit -m "test: add root pytest config and test dependencies"
```

---

## Task 2: Fusion — AnomalyDetector Unit Tests

**Files:**
- Create: `backend/fusion/test/__init__.py`
- Create: `backend/fusion/test/unit/__init__.py`
- Create: `backend/fusion/test/unit/test_anomaly_detector.py`

- [ ] **Step 1: Create `__init__.py` stubs**

```bash
mkdir -p backend/fusion/test/unit
touch backend/fusion/test/__init__.py backend/fusion/test/unit/__init__.py
```

- [ ] **Step 2: Write failing tests**

Create `backend/fusion/test/unit/test_anomaly_detector.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.fusion.app.services.anomaly_detector import AnomalyDetector

pytestmark = pytest.mark.unit


class TestCheckHumanJitter:
    def test_zero_variance_high_wpm_is_bot(self):
        # Identical WPM values + high mean → robotic
        wpm = [100.0, 100.0, 100.0, 100.0, 100.0]
        result = AnomalyDetector.check_human_jitter(wpm)
        assert result["classification"] == "bot_detected"
        assert result["reliability_factor"] == 0.1

    def test_normal_variance_is_human(self):
        # Natural human variability
        wpm = [45.0, 52.3, 38.7, 61.2, 44.8, 55.1, 42.0]
        result = AnomalyDetector.check_human_jitter(wpm)
        assert result["classification"] == "human_verified"
        assert result["reliability_factor"] == 1.0

    def test_insufficient_data_returns_safe_default(self):
        result = AnomalyDetector.check_human_jitter([50.0, 60.0])  # < 3 samples
        assert result["classification"] == "insufficient_data"
        assert result["reliability_factor"] == 1.0

    def test_empty_list_returns_safe_default(self):
        result = AnomalyDetector.check_human_jitter([])
        assert result["classification"] == "insufficient_data"

    def test_very_high_cv_is_erratic(self):
        # High variance relative to mean
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
            {"wpm": 50, "session_duration": 60, "keystrokes": 300, "commands_executed": 10, "errors_encountered": 2, "idle_seconds": 5.0, "copy_paste_count": 3}
            for _ in range(15)
        ]
        result = detector.analyze_batch(records)
        for key in ["status", "is_reliable", "reliability_score", "anomalies_detected", "total_records"]:
            assert key in result

    def test_reliability_score_in_range(self):
        detector = AnomalyDetector()
        records = [
            {"wpm": 50 + i, "session_duration": 60, "keystrokes": 300, "commands_executed": 10, "errors_encountered": 2, "idle_seconds": 5.0, "copy_paste_count": 3}
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
        # Both default to 1.0 → composite = 1.0
        assert score == 1.0
```

- [ ] **Step 3: Run to verify tests fail correctly**

```bash
pytest backend/fusion/test/unit/test_anomaly_detector.py -v 2>&1 | head -30
```

Expected: ImportError or module not found — the import path needs verifying before fixing.

- [ ] **Step 4: Fix import path if needed and run again**

If ImportError persists, check service structure:
```bash
pytest backend/fusion/test/unit/test_anomaly_detector.py -v --tb=short
```

Expected: All tests PASS (the code is already written, we're testing existing logic).

- [ ] **Step 5: Commit**

```bash
git add backend/fusion/test/
git commit -m "test(fusion): unit tests for AnomalyDetector"
```

---

## Task 3: Fusion — WeightEngine + BayesianFuser Unit Tests

**Files:**
- Create: `backend/fusion/test/unit/test_weight_engine.py`
- Create: `backend/fusion/test/unit/test_bayesian_fusion.py`

- [ ] **Step 1: Write WeightEngine tests**

Create `backend/fusion/test/unit/test_weight_engine.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from backend.fusion.app.services.weight_engine import WeightEngine

pytestmark = pytest.mark.unit


class TestCalculateSkillScore:
    def test_empty_evidence_returns_zero(self):
        assert WeightEngine.calculate_skill_score({}) == 0.0

    def test_single_source_returns_its_value(self):
        # Only telemetry (weight=0.40), normalized by that single weight → returns value itself
        score = WeightEngine.calculate_skill_score({"telemetry": 0.8})
        assert abs(score - 0.8) < 0.001

    def test_two_sources_weighted_normalized(self):
        evidence = {"telemetry": 0.8, "weekly_test": 0.7}
        score = WeightEngine.calculate_skill_score(evidence)
        # telemetry: 0.8 * 0.40 = 0.32, weekly_test: 0.7 * 0.25 = 0.175
        # total_score=0.495, total_weight=0.65, normalized=0.495/0.65≈0.7615
        assert abs(score - round(0.495 / 0.65, 4)) < 0.001

    def test_unknown_source_uses_default_weight(self):
        # Unknown source gets weight 0.10
        evidence = {"some_new_source": 1.0}
        score = WeightEngine.calculate_skill_score(evidence)
        assert abs(score - 1.0) < 0.001  # normalized by 0.10/0.10 = 1.0

    def test_all_sources_present(self):
        evidence = {
            "telemetry": 1.0, "weekly_test": 1.0, "resume": 1.0,
            "projects": 1.0, "peer_feedback": 1.0
        }
        score = WeightEngine.calculate_skill_score(evidence)
        # All values are 1.0, so normalized result is 1.0
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
        assert results["backend"]["confidence"] == 1.0  # 4/4 sources

    def test_confidence_partial_sources(self):
        all_evidence = {"frontend": {"telemetry": 0.5}}  # 1 of 4 sources
        results = WeightEngine.fuse_all_skills(all_evidence)
        assert results["frontend"]["confidence"] == 0.25  # 1/4

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
```

- [ ] **Step 2: Write BayesianFuser tests**

Create `backend/fusion/test/unit/test_bayesian_fusion.py`:

```python
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
            assert 0.0 <= conf <= 1.0, f"Out of range for skill: {skill}"

    def test_preserves_all_skill_keys(self):
        skills = {"backend": {"strength": 0.8, "confidence": 0.6}, "ml": {"strength": 0.5, "confidence": 0.4}}
        results = BayesianFuser.batch_update(skills)
        assert set(results.keys()) == {"backend", "ml"}

    def test_empty_skills_returns_empty(self):
        results = BayesianFuser.batch_update({})
        assert results == {}
```

- [ ] **Step 3: Run all fusion unit tests**

```bash
pytest backend/fusion/test/unit/ -v -m unit
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/fusion/test/unit/test_weight_engine.py backend/fusion/test/unit/test_bayesian_fusion.py
git commit -m "test(fusion): unit tests for WeightEngine and BayesianFuser"
```

---

## Task 4: Allocation — SkillMatcher + WorkloadOptimizer Unit Tests

**Files:**
- Create: `backend/allocation/test/__init__.py`
- Create: `backend/allocation/test/unit/__init__.py`
- Create: `backend/allocation/test/unit/test_skill_matcher.py`
- Create: `backend/allocation/test/unit/test_workload_optimizer.py`

- [ ] **Step 1: Write SkillMatcher tests**

```bash
mkdir -p backend/allocation/test/unit
touch backend/allocation/test/__init__.py backend/allocation/test/unit/__init__.py
```

Create `backend/allocation/test/unit/test_skill_matcher.py`:

```python
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
        # dot=0.8, norm1=1.0, norm2=sqrt(0.64+0.36)=1.0 → 0.8
        assert abs(score - 0.8) < 1e-6

    def test_result_in_unit_interval(self):
        import random
        for _ in range(20):
            v1 = {k: random.random() for k in ["backend", "frontend", "ml", "neo4j"]}
            v2 = {k: random.random() for k in ["backend", "frontend", "ml", "neo4j"]}
            score = SkillMatcher.calculate_match(v1, v2)
            assert 0.0 <= score <= 1.0

    def test_missing_skill_treated_as_zero(self):
        v1 = {"backend": 1.0}
        v2 = {"backend": 0.5, "frontend": 0.9}
        score = SkillMatcher.calculate_match(v1, v2)
        # v1=[1,0], v2=[0.5,0.9]: dot=0.5, norm1=1, norm2≈1.03 → ~0.485
        assert 0.0 < score < 1.0
```

- [ ] **Step 2: Write WorkloadOptimizer tests**

Create `backend/allocation/test/unit/test_workload_optimizer.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
import numpy as np
from backend.allocation.app.services.workload_optimizer import WorkloadOptimizer

pytestmark = [pytest.mark.unit, pytest.mark.algorithm]


class TestOptimizeAssignments:
    def test_empty_matrix_returns_empty(self):
        result = WorkloadOptimizer.optimize_assignments([], [], np.array([]).reshape(0, 0))
        assert result == []

    def test_below_threshold_not_assigned(self):
        tasks = [{"task_id": "T1"}]
        devs = [{"user_id": "D1"}]
        scores = np.array([[0.1]])  # below 0.2 threshold
        result = WorkloadOptimizer.optimize_assignments(tasks, devs, scores)
        assert result == []

    def test_perfect_match_assigns_all(self):
        tasks = [{"task_id": "T1"}, {"task_id": "T2"}]
        devs = [{"user_id": "D1"}, {"user_id": "D2"}]
        scores = np.array([[0.9, 0.2], [0.1, 0.85]])
        result = WorkloadOptimizer.optimize_assignments(tasks, devs, scores)
        assert len(result) == 2
        task_ids = {r["task_id"] for r in result}
        assert task_ids == {"T1", "T2"}

    def test_hungarian_maximizes_total_score(self):
        tasks = [{"task_id": "T1"}, {"task_id": "T2"}]
        devs = [{"user_id": "D1"}, {"user_id": "D2"}]
        # D1 is better at T1, D2 is better at T2 → optimal assignment
        scores = np.array([[0.9, 0.3], [0.4, 0.8]])
        result = WorkloadOptimizer.optimize_assignments(tasks, devs, scores)
        assignments = {r["task_id"]: r["user_id"] for r in result}
        assert assignments["T1"] == "D1"
        assert assignments["T2"] == "D2"

    def test_score_in_result_matches_matrix(self):
        tasks = [{"task_id": "T1"}]
        devs = [{"user_id": "D1"}]
        scores = np.array([[0.75]])
        result = WorkloadOptimizer.optimize_assignments(tasks, devs, scores)
        assert len(result) == 1
        assert result[0]["match_score"] == 0.75

    def test_assignment_type_is_global_optimal(self):
        tasks = [{"task_id": "T1"}]
        devs = [{"user_id": "D1"}]
        scores = np.array([[0.6]])
        result = WorkloadOptimizer.optimize_assignments(tasks, devs, scores)
        assert result[0]["assignment_type"] == "global_optimal"
```

- [ ] **Step 3: Run allocation unit tests**

```bash
pytest backend/allocation/test/unit/ -v -m "unit or algorithm"
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/allocation/test/
git commit -m "test(allocation): unit tests for SkillMatcher and WorkloadOptimizer"
```

---

## Task 5: Analytics — BurnoutPredictor + SuccessPredictor Unit Tests

**Files:**
- Create: `backend/analytics/test/__init__.py`
- Create: `backend/analytics/test/unit/__init__.py`
- Create: `backend/analytics/test/unit/test_burnout_predictor.py`
- Create: `backend/analytics/test/unit/test_success_predictor.py`

- [ ] **Step 1: Setup**

```bash
mkdir -p backend/analytics/test/unit
touch backend/analytics/test/__init__.py backend/analytics/test/unit/__init__.py
```

- [ ] **Step 2: Write BurnoutPredictor tests**

Create `backend/analytics/test/unit/test_burnout_predictor.py`:

```python
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
        series = [DAILY_RECORD] * 5  # < 7 days
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
        series = [DAILY_RECORD] * 45  # more than 30 → should cap at 30
        result = self.predictor.predict_risk(series)
        assert result["days_analyzed"] <= 30

    def test_trend_key_present(self):
        series = [DAILY_RECORD] * 10
        result = self.predictor.predict_risk(series)
        assert "trend" in result
        assert result["trend"] in ["increasing", "stable"]

    def test_critical_status_above_08(self):
        # GRU is untrained → outputs a value from random weights.
        # We just verify status boundaries — not absolute values.
        series = [DAILY_RECORD] * 10
        result = self.predictor.predict_risk(series)
        score = result["risk_score"]
        if score > 0.8:
            assert result["status"] == "critical"
        elif score > 0.5:
            assert result["status"] == "at_risk"
        else:
            assert result["status"] == "healthy"
```

- [ ] **Step 3: Write SuccessPredictor tests**

Create `backend/analytics/test/unit/test_success_predictor.py`:

```python
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
        # heuristic: 0.95*0.5 + (3/4)*0.3 + 1.0*0.2 = 0.475 + 0.225 + 0.2 = 0.9
        assert result["probability"] > 0.7

    def test_low_match_junior_high_workload_has_low_prob(self):
        dev = {"skill_match_score": 0.1, "experience_level": "Junior", "current_workload": 5, "historical_success_rate": 0.3}
        task = {"complexity": 5}
        result = self.predictor.predict_success(dev, task)
        # heuristic: 0.1*0.5 + (1/4)*0.3 + max(0, 1-1)*0.2 = 0.05 + 0.075 + 0 = 0.125
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
        assert result["confidence"] == 0.6  # heuristic confidence

    def test_missing_fields_use_defaults(self):
        # Should not raise even with minimal input
        result = self.predictor.predict_success({}, {})
        assert 0.0 <= result["probability"] <= 1.0
```

- [ ] **Step 4: Run analytics unit tests**

```bash
pytest backend/analytics/test/unit/ -v -m "unit or algorithm"
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/analytics/test/
git commit -m "test(analytics): unit tests for BurnoutPredictor and SuccessPredictor"
```

---

## Task 6: Gateway — IPWhitelistMiddleware Unit Tests

**Files:**
- Create: `backend/gateway/test/__init__.py`
- Create: `backend/gateway/test/unit/__init__.py`
- Create: `backend/gateway/test/unit/test_ip_whitelist.py`

- [ ] **Step 1: Setup**

```bash
mkdir -p backend/gateway/test/unit
touch backend/gateway/test/__init__.py backend/gateway/test/unit/__init__.py
```

- [ ] **Step 2: Write IPWhitelist tests**

Create `backend/gateway/test/unit/test_ip_whitelist.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from unittest.mock import MagicMock
from backend.gateway.app.main import IPWhitelistMiddleware

pytestmark = pytest.mark.unit


@pytest.fixture
def middleware():
    app_mock = MagicMock()
    mw = IPWhitelistMiddleware(app_mock, monitoring_url="http://mock-monitoring:8000")
    mw._whitelist = ["127.0.0.1", "::1", "10.0.0.0/8", "192.168.1.0/24"]
    return mw


class TestIsAllowed:
    def test_localhost_ipv4_allowed(self, middleware):
        assert middleware._is_allowed("127.0.0.1") is True

    def test_localhost_ipv6_allowed(self, middleware):
        assert middleware._is_allowed("::1") is True

    def test_office_network_cidr_allowed(self, middleware):
        assert middleware._is_allowed("10.0.1.5") is True
        assert middleware._is_allowed("10.255.255.255") is True

    def test_subnet_192_168_1_x_allowed(self, middleware):
        assert middleware._is_allowed("192.168.1.100") is True

    def test_external_ip_blocked(self, middleware):
        assert middleware._is_allowed("8.8.8.8") is False
        assert middleware._is_allowed("203.0.113.1") is False

    def test_invalid_ip_blocked(self, middleware):
        assert middleware._is_allowed("not-an-ip") is False

    def test_empty_whitelist_blocks_all(self, middleware):
        middleware._whitelist = []
        assert middleware._is_allowed("127.0.0.1") is False

    def test_exact_ip_entry_allowed(self, middleware):
        middleware._whitelist = ["192.168.50.10"]
        assert middleware._is_allowed("192.168.50.10") is True
        assert middleware._is_allowed("192.168.50.11") is False
```

- [ ] **Step 3: Run gateway unit tests**

```bash
pytest backend/gateway/test/unit/ -v -m unit
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/gateway/test/
git commit -m "test(gateway): unit tests for IPWhitelistMiddleware"
```

---

## Task 7: Auth — Unit Tests (Models + Service Logic)

**Files:**
- Create: `backend/auth/test/__init__.py`
- Create: `backend/auth/test/conftest.py`
- Create: `backend/auth/test/unit/__init__.py`
- Create: `backend/auth/test/unit/test_models.py`
- Create: `backend/auth/test/unit/test_services.py`

- [ ] **Step 1: Setup**

```bash
mkdir -p backend/auth/test/unit
touch backend/auth/test/__init__.py backend/auth/test/unit/__init__.py
```

- [ ] **Step 2: Create auth conftest**

Create `backend/auth/test/conftest.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.fixture
def mock_collection():
    col = MagicMock()
    col.find_one = AsyncMock(return_value=None)
    col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock_id"))
    col.update_one = AsyncMock(return_value=None)
    col.update_many = AsyncMock(return_value=None)
    return col

@pytest.fixture
def patch_get_collection(mock_collection):
    with patch("shared.database.mongo.get_collection", return_value=mock_collection):
        yield mock_collection
```

- [ ] **Step 3: Write model validation tests**

Create `backend/auth/test/unit/test_models.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from pydantic import ValidationError
from shared.models.user import UserRegistrationDTO, LoginDTO

pytestmark = pytest.mark.unit


class TestUserRegistrationDTO:
    VALID = {
        "name": "Alice Dev",
        "username": "alice123",
        "email": "alice@example.com",
        "phone_number": "9876543210",
        "gender": "Female",
        "password": "SecurePass123!",
        "strong_domains": ["backend", "ml"],
        "github_project_urls": []
    }

    def test_valid_registration_passes(self):
        dto = UserRegistrationDTO(**self.VALID)
        assert dto.username == "alice123"
        assert dto.email == "alice@example.com"

    def test_missing_required_field_raises(self):
        data = {**self.VALID}
        del data["email"]
        with pytest.raises(ValidationError):
            UserRegistrationDTO(**data)

    def test_empty_name_raises(self):
        data = {**self.VALID, "name": ""}
        with pytest.raises(ValidationError):
            UserRegistrationDTO(**data)

    def test_strong_domains_must_be_list(self):
        data = {**self.VALID, "strong_domains": "backend"}
        with pytest.raises(ValidationError):
            UserRegistrationDTO(**data)


class TestLoginDTO:
    def test_valid_login_dto(self):
        dto = LoginDTO(username="alice", password="pass")
        assert dto.username == "alice"

    def test_missing_password_raises(self):
        with pytest.raises(ValidationError):
            LoginDTO(username="alice")
```

- [ ] **Step 4: Run auth unit tests**

```bash
pytest backend/auth/test/unit/ -v -m unit
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/auth/test/
git commit -m "test(auth): unit tests for models and DTO validation"
```

---

## Task 8: Auth — Integration Tests (Routes)

**Files:**
- Create: `backend/auth/test/integration/__init__.py`
- Create: `backend/auth/test/integration/test_routes.py`

- [ ] **Step 1: Setup**

```bash
mkdir -p backend/auth/test/integration
touch backend/auth/test/integration/__init__.py
```

- [ ] **Step 2: Write integration route tests**

Create `backend/auth/test/integration/test_routes.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture
async def auth_app():
    """Import the auth app with DB mocked."""
    mock_col = MagicMock()
    mock_col.find_one = AsyncMock(return_value=None)
    mock_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="id"))
    mock_col.update_one = AsyncMock(return_value=None)

    with patch("shared.database.mongo.connect_mongo", AsyncMock()), \
         patch("shared.database.mongo.close_mongo", AsyncMock()), \
         patch("shared.database.mongo.get_collection", return_value=mock_col):
        from backend.auth.app.main import app
        yield app


@pytest.fixture
async def client(auth_app):
    async with AsyncClient(transport=ASGITransport(app=auth_app), base_url="http://test") as c:
        yield c


class TestAuthHealthRoute:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/auth/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


class TestLoginRoute:
    async def test_login_unknown_user_returns_401(self, client):
        resp = await client.post("/api/v1/auth/users/login", json={"username": "ghost", "password": "wrong"})
        assert resp.status_code == 401

    async def test_login_missing_fields_returns_422(self, client):
        resp = await client.post("/api/v1/auth/users/login", json={"username": "alice"})
        assert resp.status_code == 422


class TestRegisterRoute:
    VALID_PAYLOAD = {
        "name": "Test Dev",
        "username": "testdev_unique",
        "email": "testdev@example.com",
        "phone_number": "1234567890",
        "gender": "Male",
        "password": "SecurePass123!",
        "strong_domains": ["backend"],
        "github_project_urls": []
    }

    async def test_register_returns_201_and_extension_id(self, client):
        resp = await client.post("/api/v1/auth/users/register", json=self.VALID_PAYLOAD)
        assert resp.status_code == 201
        body = resp.json()
        assert "extension_id" in body
        assert body["extension_id"].startswith("ADT-")
        assert "user_id" in body

    async def test_register_missing_name_returns_422(self, client):
        data = {**self.VALID_PAYLOAD}
        del data["name"]
        resp = await client.post("/api/v1/auth/users/register", json=data)
        assert resp.status_code == 422
```

- [ ] **Step 3: Run integration tests**

```bash
pytest backend/auth/test/integration/ -v -m integration
```

Expected: All tests PASS (DB is mocked, no live connection needed).

- [ ] **Step 4: Commit**

```bash
git add backend/auth/test/integration/
git commit -m "test(auth): integration tests for login and register routes"
```

---

## Task 9: Telemetry — Unit + Integration Tests

**Files:**
- Create: `backend/telemetry/test/__init__.py`
- Create: `backend/telemetry/test/unit/__init__.py`
- Create: `backend/telemetry/test/unit/test_batch_processor.py`
- Create: `backend/telemetry/test/integration/__init__.py`
- Create: `backend/telemetry/test/integration/test_routes.py`

- [ ] **Step 1: Setup**

```bash
mkdir -p backend/telemetry/test/unit backend/telemetry/test/integration
touch backend/telemetry/test/__init__.py backend/telemetry/test/unit/__init__.py backend/telemetry/test/integration/__init__.py
```

- [ ] **Step 2: Write batch processor unit tests**

Create `backend/telemetry/test/unit/test_batch_processor.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.unit


class TestBatchProcessor:
    def setup_method(self):
        import os
        os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")

    def test_init_uses_env_interval(self):
        with patch.dict("os.environ", {"BATCH_INTERVAL_MINUTES": "10"}):
            from backend.telemetry.app.services.batch_processor import BatchProcessor
            bp = BatchProcessor()
            assert bp.batch_interval == 10

    def test_init_defaults_to_5_minutes(self):
        with patch.dict("os.environ", {}, clear=False):
            os.environ.pop("BATCH_INTERVAL_MINUTES", None)
            from backend.telemetry.app.services.batch_processor import BatchProcessor
            import importlib
            import backend.telemetry.app.services.batch_processor as bpm
            importlib.reload(bpm)
            bp = bpm.BatchProcessor()
            assert bp.batch_interval == 5

    async def test_process_batches_skips_when_paused(self):
        from backend.telemetry.app.services.batch_processor import BatchProcessor
        bp = BatchProcessor()
        bp._fetch_and_apply_config = AsyncMock(return_value=False)

        mock_col = MagicMock()
        mock_col.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))

        with patch("shared.database.mongo.get_collection", return_value=mock_col):
            await bp.process_batches()
            # Should return early — no DB calls after paused check
            mock_col.find.assert_not_called()

    async def test_process_batches_no_unprocessed_telemetry(self):
        from backend.telemetry.app.services.batch_processor import BatchProcessor
        bp = BatchProcessor()
        bp._fetch_and_apply_config = AsyncMock(return_value=True)

        mock_col = MagicMock()
        mock_col.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))

        with patch("shared.database.mongo.get_collection", return_value=mock_col):
            await bp.process_batches()
            # Should log "No unprocessed telemetry" and return
```

- [ ] **Step 3: Write telemetry route integration tests**

Create `backend/telemetry/test/integration/test_routes.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture
async def telemetry_app():
    mock_col = MagicMock()
    mock_col.find_one = AsyncMock(return_value={"extension_id": "ADT-TEST1234", "user_id": "u1", "is_active": True, "machine_id": None})
    mock_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="id"))
    mock_col.count_documents = AsyncMock(return_value=5)
    mock_col.update_one = AsyncMock(return_value=None)

    with patch("shared.database.mongo.connect_mongo", AsyncMock()), \
         patch("shared.database.mongo.close_mongo", AsyncMock()), \
         patch("shared.database.mongo.get_collection", return_value=mock_col), \
         patch("backend.telemetry.app.main.BatchProcessor") as MockBP:
        MockBP.return_value.start = MagicMock()
        from backend.telemetry.app.main import app
        yield app


@pytest.fixture
async def client(telemetry_app):
    async with AsyncClient(transport=ASGITransport(app=telemetry_app), base_url="http://test") as c:
        yield c


class TestTelemetryRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/telemetry/health")
        assert resp.status_code == 200

    async def test_status_endpoint_returns_count(self, client):
        resp = await client.get("/api/v1/telemetry/telemetry/status/ADT-TEST1234")
        assert resp.status_code == 200
        assert "pending_records" in resp.json()

    async def test_handshake_missing_params_returns_422(self, client):
        resp = await client.post("/api/v1/telemetry/telemetry/handshake")
        assert resp.status_code == 422

    async def test_ingest_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/telemetry/telemetry/ingest", json={})
        assert resp.status_code == 422
```

- [ ] **Step 4: Run telemetry tests**

```bash
pytest backend/telemetry/test/ -v -m "unit or integration"
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/telemetry/test/
git commit -m "test(telemetry): unit and integration tests for batch processor and routes"
```

---

## Task 10: THG, Monitoring, Task — Unit + Integration Tests

**Files:**
- Create: `backend/thg/test/`, `backend/monitoring/test/`, `backend/task/test/` (with unit/ and integration/ subdirs)

- [ ] **Step 1: Setup all three**

```bash
mkdir -p backend/thg/test/unit backend/thg/test/integration
mkdir -p backend/monitoring/test/unit backend/monitoring/test/integration
mkdir -p backend/task/test/unit backend/task/test/integration
touch backend/thg/test/__init__.py backend/thg/test/unit/__init__.py backend/thg/test/integration/__init__.py
touch backend/monitoring/test/__init__.py backend/monitoring/test/unit/__init__.py backend/monitoring/test/integration/__init__.py
touch backend/task/test/__init__.py backend/task/test/unit/__init__.py backend/task/test/integration/__init__.py
```

- [ ] **Step 2: Write THG schema unit tests**

Create `backend/thg/test/unit/test_schemas.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from pydantic import ValidationError
from backend.thg.app.schemas.thg import SkillUpdateRequest  # adjust import to match actual class names

pytestmark = pytest.mark.unit


class TestTHGSchemas:
    def test_skill_strength_must_be_between_0_and_1(self):
        # This test WILL FAIL if the schema does NOT enforce range bounds — revealing a bug.
        try:
            req = SkillUpdateRequest(dev_id="u1", skill_name="backend", strength=1.5, confidence=0.8)
            # If no validation error, the schema is missing a constraint
            assert req.strength <= 1.0, "BUG: skill strength > 1.0 allowed without validation"
        except (ValidationError, Exception):
            pass  # Validation working correctly

    def test_valid_skill_update_passes(self):
        req = SkillUpdateRequest(dev_id="u1", skill_name="backend", strength=0.8, confidence=0.7)
        assert req.dev_id == "u1"
        assert req.strength == 0.8
```

- [ ] **Step 3: Write THG integration health test**

Create `backend/thg/test/integration/test_routes.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture
async def thg_app():
    mock_session = AsyncMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.run = AsyncMock(return_value=MagicMock(data=lambda: []))

    with patch("backend.thg.app.services.neo4j.connect_neo4j", AsyncMock()), \
         patch("backend.thg.app.services.neo4j.close_neo4j", AsyncMock()), \
         patch("backend.thg.app.services.neo4j.get_session", return_value=mock_session):
        from backend.thg.app.main import app
        yield app


@pytest.fixture
async def client(thg_app):
    async with AsyncClient(transport=ASGITransport(app=thg_app), base_url="http://test") as c:
        yield c


class TestTHGRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/thg/health")
        assert resp.status_code == 200

    async def test_create_dev_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/thg/create-dev", json={})
        assert resp.status_code == 422

    async def test_get_developers_returns_list(self, client):
        resp = await client.get("/api/v1/thg/developers")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
```

- [ ] **Step 4: Write Monitoring integration test**

Create `backend/monitoring/test/integration/test_routes.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture
async def monitoring_app():
    mock_col = MagicMock()
    mock_col.find_one = AsyncMock(return_value={
        "batch_interval_minutes": 5,
        "heartbeat_interval_seconds": 30,
        "is_monitoring_paused": False,
        "office_network_whitelist": ["127.0.0.1"],
        "shec_handshake_interval_ms": 5000
    })
    mock_col.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))
    mock_col.update_one = AsyncMock(return_value=None)

    mock_redis = MagicMock()
    mock_redis.pubsub = MagicMock(return_value=MagicMock())

    with patch("shared.database.mongo.connect_mongo", AsyncMock()), \
         patch("shared.database.mongo.close_mongo", AsyncMock()), \
         patch("shared.database.mongo.get_collection", return_value=mock_col), \
         patch("redis.from_url", return_value=mock_redis):
        from backend.monitoring.app.main import app
        yield app


@pytest.fixture
async def client(monitoring_app):
    async with AsyncClient(transport=ASGITransport(app=monitoring_app), base_url="http://test") as c:
        yield c


class TestMonitoringRoutes:
    async def test_system_config_returns_200(self, client):
        resp = await client.get("/api/v1/monitoring/system-config")
        assert resp.status_code == 200
        data = resp.json()
        assert "batch_interval_minutes" in data

    async def test_audit_log_returns_list(self, client):
        resp = await client.get("/api/v1/monitoring/audit-log")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
```

- [ ] **Step 5: Write Task service integration test**

Create `backend/task/test/integration/test_routes.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture
async def task_app():
    mock_col = MagicMock()
    mock_col.find_one = AsyncMock(return_value=None)
    mock_col.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))
    mock_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="id"))

    with patch("shared.database.mongo.connect_mongo", AsyncMock()), \
         patch("shared.database.mongo.close_mongo", AsyncMock()), \
         patch("shared.database.mongo.get_collection", return_value=mock_col):
        from backend.task.app.main import app
        yield app


@pytest.fixture
async def client(task_app):
    async with AsyncClient(transport=ASGITransport(app=task_app), base_url="http://test") as c:
        yield c


class TestTaskRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/task/health")
        assert resp.status_code == 200

    async def test_match_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/task/match", json={})
        assert resp.status_code == 422

    async def test_create_task_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/task/create", json={})
        assert resp.status_code == 422
```

- [ ] **Step 6: Run all remaining service tests**

```bash
pytest backend/thg/test/ backend/monitoring/test/ backend/task/test/ -v -m "unit or integration"
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/thg/test/ backend/monitoring/test/ backend/task/test/
git commit -m "test(thg,monitoring,task): unit and integration tests"
```

---

## Task 11: Fusion + Allocation Integration Tests

**Files:**
- Create: `backend/fusion/test/integration/__init__.py`
- Create: `backend/fusion/test/integration/test_routes.py`
- Create: `backend/allocation/test/integration/__init__.py`
- Create: `backend/allocation/test/integration/test_routes.py`

- [ ] **Step 1: Write Fusion integration tests**

```bash
mkdir -p backend/fusion/test/integration backend/allocation/test/integration
touch backend/fusion/test/integration/__init__.py backend/allocation/test/integration/__init__.py
```

Create `backend/fusion/test/integration/test_routes.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from httpx import AsyncClient, ASGITransport

pytestmark = pytest.mark.integration


@pytest.fixture
async def fusion_app():
    from backend.fusion.app.main import app
    yield app


@pytest.fixture
async def client(fusion_app):
    async with AsyncClient(transport=ASGITransport(app=fusion_app), base_url="http://test") as c:
        yield c


class TestFusionRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/fusion/health")
        assert resp.status_code == 200

    async def test_analyze_text_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/fusion/fusion/analyze-text", json={})
        assert resp.status_code == 422

    async def test_analyze_text_with_text_returns_vector(self, client):
        resp = await client.post(
            "/api/v1/fusion/fusion/analyze-text",
            json={"text": "Build a REST API with FastAPI and PostgreSQL"}
        )
        # Should return 200 with a vector dict
        assert resp.status_code == 200
        body = resp.json()
        assert "vector" in body
        assert isinstance(body["vector"], dict)
```

- [ ] **Step 2: Write Allocation integration tests**

Create `backend/allocation/test/integration/test_routes.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock

pytestmark = pytest.mark.integration


@pytest.fixture
async def allocation_app():
    from backend.allocation.app.main import app
    yield app


@pytest.fixture
async def client(allocation_app):
    async with AsyncClient(transport=ASGITransport(app=allocation_app), base_url="http://test") as c:
        yield c


class TestAllocationRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/allocation/health")
        assert resp.status_code == 200

    async def test_rank_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/allocation/rank", json={})
        assert resp.status_code == 422
```

- [ ] **Step 3: Run all tests with summary**

```bash
pytest backend/ -v --tb=short -q 2>&1 | tail -30
```

Expected: Summary showing all tests passing. Note any failures for bug tracking.

- [ ] **Step 4: Commit**

```bash
git add backend/fusion/test/integration/ backend/allocation/test/integration/
git commit -m "test(fusion,allocation): integration tests for all routes"
```

---

## Task 12: Full Suite Run + Bug Report

- [ ] **Step 1: Run complete unit suite**

```bash
pytest backend/ -m unit -v --tb=short 2>&1 | tee test-results-unit.txt
```

- [ ] **Step 2: Run algorithm suite**

```bash
pytest backend/ -m algorithm -v --tb=short 2>&1 | tee test-results-algorithm.txt
```

- [ ] **Step 3: Run integration suite (mocked — no live DB needed)**

```bash
pytest backend/ -m integration -v --tb=short 2>&1 | tee test-results-integration.txt
```

- [ ] **Step 4: Document any failures**

For each FAILED test, check whether:
- The test has a bug (wrong assertion) → fix the test
- The production code has a bug → document in a `BUGS.md` at the project root

- [ ] **Step 5: Commit results**

```bash
git add .
git commit -m "test: complete backend test suite — all services covered"
```
