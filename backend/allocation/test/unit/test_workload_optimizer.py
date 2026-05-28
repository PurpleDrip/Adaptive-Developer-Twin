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
        scores = np.array([[0.1]])
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
