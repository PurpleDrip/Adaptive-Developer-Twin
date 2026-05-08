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

if __name__ == "__main__":
    asyncio.run(create_demo_test())
