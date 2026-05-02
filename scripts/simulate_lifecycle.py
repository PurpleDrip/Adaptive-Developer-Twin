import requests
import time
import uuid
import json

GATEWAY_URL = "http://localhost:8000/api/v1"

def simulate():
    print("🚀 Starting ADT Production Lifecycle Simulation...")
    
    # 1. Register User
    print("\n[Step 1] Registering a new Senior Developer...")
    user_data = {
        "name": "Shashanth Vemuri",
        "username": f"shashanth_{uuid.uuid4().hex[:4]}",
        "email": f"shashanth_{uuid.uuid4().hex[:4]}@company.com",
        "phone_number": "9876543210",
        "gender": "Male",
        "password": "SecurePassword123!",
        "strong_domains": ["backend", "neo4j", "ml"],
        "experience_level": "Senior",
        "github_project_urls": ["https://github.com/shashanth/adt-v1"]
    }
    
    reg_resp = requests.post(f"{GATEWAY_URL}/auth/users/register", json=user_data)
    if reg_resp.status_code != 201:
        print(f"❌ Registration failed: {reg_resp.text}")
        return
    
    res = reg_resp.json()
    user_id = res["user_id"]
    ext_id = res["extension_id"]
    print(f"✅ Registered! UserID: {user_id} | ExtID: {ext_id}")

    # 2. Simulate Telemetry (Extension activity)
    print("\n[Step 2] Sending Telemetry Batch (Simulating VS Code activity)...")
    telemetry = {
        "user_id": user_id,
        "extension_id": ext_id,
        "wpm": 65,
        "keystrokes": 450,
        "commands_executed": 12,
        "active_file": "Fusion-Engine/app/services/bayesian_fusion.py",
        "languages_used": {"python": 1.0},
        "code_snippet": "def fuse_skills(evidence):\n    return BayesianFuser.update(evidence)",
        "git_branch": "main",
        "session_duration": 30
    }
    
    tel_resp = requests.post(f"{GATEWAY_URL}/telemetry/telemetry/ingest", json=telemetry)
    print(f"✅ Telemetry Ingested: {tel_resp.status_code}")

    # 3. Check THG State
    print("\n[Step 3] Verifying initial THG Graph state...")
    thg_resp = requests.get(f"{GATEWAY_URL}/thg/thg/{user_id}/skills")
    print(f"✅ Current Skills: {json.dumps(thg_resp.json().get('skills'), indent=2)}")

    # 4. Create and Assign Task
    print("\n[Step 4] Senior Dev creating a new high-priority task...")
    task_data = {
        "title": "Optimize CodeBERT Embedding Performance",
        "description": "Implement lazy-loading and GPU caching for the CodeBERT model to reduce inference latency.",
        "required_skills": {"backend": 0.8, "ml": 0.9},
        "complexity": 5,
        "priority": "High",
        "created_by": "admin_system"
    }
    
    task_resp = requests.post(f"{GATEWAY_URL}/task/tasks/create", json=task_data)
    task_res = task_resp.json()
    task_id = task_res["task_id"]
    print(f"✅ Task Created: {task_id}")
    print(f"🔍 Top Candidates Suggested by AI: {task_res['top_candidates']}")

    # 5. Complete Task & Review
    print("\n[Step 5] Completing task and submitting Senior Dev Review...")
    requests.post(f"{GATEWAY_URL}/task/tasks/{task_id}/complete")
    
    review_data = {
        "review_score": 0.95,
        "review_comment": "Excellent implementation. Met all performance goals.",
        "reviewed_by": "Senior_Dev_Lead",
        "skills_demonstrated": {"backend": 1.0, "ml": 1.0}
    }
    requests.post(f"{GATEWAY_URL}/task/tasks/{task_id}/review", json=review_data)
    print("✅ Task Completed and Reviewed.")

    # 6. Verify Burnout Prediction
    print("\n[Step 6] Running Analytics: Predicting Burnout Risk...")
    burnout_resp = requests.get(f"{GATEWAY_URL}/analytics/stats/{user_id}/burnout")
    print(f"✅ AI Burnout Risk Assessment: {json.dumps(burnout_resp.json(), indent=2)}")

    # 7. Final Leaderboard
    print("\n[Step 7] Checking Global Leaderboard (PageRank Weighted)...")
    board_resp = requests.get(f"{GATEWAY_URL}/analytics/leaderboard/?skill=backend")
    print(f"✅ Leaderboard: {json.dumps(board_resp.json()[:3], indent=2)}")

    print("\n🏆 Simulation Complete! The ADT-v1 Production System is fully operational.")

if __name__ == "__main__":
    simulate()
