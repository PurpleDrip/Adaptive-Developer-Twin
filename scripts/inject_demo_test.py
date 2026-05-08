import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

MONGO_URI = "mongodb+srv://shashanth1239_db_user:aCEe1GwfqiAWxwcc@adt.dzyoggh.mongodb.net/adt_db?retryWrites=true&w=majority&appName=ADT"

async def create_demo_test():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.adt_db
    
    test_id = "TEST-PY-001"
    
    # Questions with letter-based correct options (A/B/C/D)
    questions = [
        {"id": "q1", "question": "What is the output of print(type([]))?", "options": ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "<class 'set'>"], "correct_option": "B", "domain": "python"},
        {"id": "q2", "question": "Which keyword is used for function definition?", "options": ["func", "def", "function", "lambda"], "correct_option": "B", "domain": "python"},
        {"id": "q3", "question": "What does PEP 8 stand for?", "options": ["Python Enhancement Plan", "Python Enhancement Proposal", "Python Execution Protocol", "Python Extension Package"], "correct_option": "B", "domain": "python"},
        {"id": "q4", "question": "Which is immutable in Python?", "options": ["tuple", "list", "dict", "set"], "correct_option": "A", "domain": "python"},
        {"id": "q5", "question": "What is the default return value of a function?", "options": ["None", "0", "False", "''"], "correct_option": "A", "domain": "python"},
        {"id": "q6", "question": "Which method adds an element to a list?", "options": ["add()", "append()", "insert()", "push()"], "correct_option": "B", "domain": "python"},
        {"id": "q7", "question": "What is 2**3 in Python?", "options": ["8", "6", "9", "Error"], "correct_option": "A", "domain": "python"},
        {"id": "q8", "question": "Which module is used for regex?", "options": ["re", "regex", "regexp", "match"], "correct_option": "A", "domain": "python"},
        {"id": "q9", "question": "What does 'self' refer to in a class?", "options": ["The module", "The function", "The instance", "The class itself"], "correct_option": "C", "domain": "python"},
        {"id": "q10", "question": "Which is not a Python data type?", "options": ["int", "float", "varchar", "complex"], "correct_option": "C", "domain": "python"},
    ]
    
    test_doc = {
        "test_id": test_id,
        "title": "Weekly Python Mastery Challenge",
        "domain": "Python",
        "created_by": "mgr_001",
        "questions": questions,
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
    
    # Clear old tests and submissions
    await db.assessments.delete_many({"test_id": test_id})
    await db.test_submissions.delete_many({})
    await db.assessments.insert_one(test_doc)
    print(f"[SUCCESS] Created Demo Test: {test_id}")
    print(f"[INFO] Correct answers: B, B, B, A, A, B, A, A, C, C")

    # --- 2. Seed Assessment Submission ---
    submission_doc = {
        "submission_id": "sub_demo_001",
        "test_id": test_id,
        "user_id": "dev_001",
        "answers": {"q1": "B", "q2": "B", "q3": "B", "q4": "A", "q5": "A", "q6": "B", "q7": "A", "q8": "A", "q9": "C", "q10": "C"},
        "score": 1.0,
        "verified_at": datetime.now(timezone.utc),
        "is_legit": True
    }
    await db.test_submissions.insert_one(submission_doc)
    print(f"[SUCCESS] Injected Perfect Submission for dev_001")

    # --- 3. Seed Telemetry Raw ---
    await db.telemetry_raw.delete_many({"user_id": "dev_001"})
    raw_events = []
    for i in range(10):
        raw_events.append({
            "event_id": f"evt_demo_{i}",
            "user_id": "dev_001",
            "session_id": "sesh_demo_1",
            "timestamp": datetime.now(timezone.utc),
            "keystroke_count": 150 + (i * 10),
            "backspace_count": 5 + i,
            "files_changed": ["main.py", "utils.py"],
            "active_editor_time_ms": 60000,
            "language": "python"
        })
    await db.telemetry_raw.insert_many(raw_events)
    print(f"[SUCCESS] Injected 10 Raw Telemetry Events")

    # --- 4. Seed Telemetry Batches (Analytics Data) ---
    await db.telemetry_batches.delete_many({"user_id": "dev_001"})
    batch_doc = {
        "batch_id": "batch_demo_001",
        "user_id": "dev_001",
        "start_time": datetime.now(timezone.utc),
        "end_time": datetime.now(timezone.utc),
        "event_count": 10,
        "aggregated_signals": {
            "total_keystrokes": 5000,
            "total_backspaces": 200,
            "avg_wpm": 65.4,
            "languages_used": ["python", "typescript"],
            "total_active_time_ms": 3600000  # 1 hour
        }
    }
    await db.telemetry_batches.insert_one(batch_doc)
    print(f"[SUCCESS] Injected Telemetry Batch (WPM: 65.4, Lines ~1000)")

    # --- 5. Seed Audit Logs ---
    await db.audit_logs.delete_many({"user_id": "dev_001"})
    audit_events = [
        {"timestamp": datetime.now(timezone.utc), "user_id": "dev_001", "action": "LOGIN", "resource": "AuthService", "status": "SUCCESS", "metadata": {"ip": "127.0.0.1"}},
        {"timestamp": datetime.now(timezone.utc), "user_id": "dev_001", "action": "SUBMIT_ASSESSMENT", "resource": "TaskService", "status": "SUCCESS", "metadata": {"test_id": test_id}},
        {"timestamp": datetime.now(timezone.utc), "user_id": "dev_001", "action": "VIEW_DASHBOARD", "resource": "Frontend", "status": "SUCCESS", "metadata": {}}
    ]
    await db.audit_logs.insert_many(audit_events)
    print(f"[SUCCESS] Injected 3 Audit Logs")

if __name__ == "__main__":
    asyncio.run(create_demo_test())
