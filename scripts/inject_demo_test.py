import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGO_URI = "mongodb+srv://shashanth1239_db_user:aCEe1GwfqiAWxwcc@adt.dzyoggh.mongodb.net/adt_db?retryWrites=true&w=majority&appName=ADT"

async def create_demo_test():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.adt_db
    
    test_id = "TEST-PY-001"
    questions = []
    for i in range(10):
        questions.append({
            "id": f"q_{i}",
            "question": f"Python Deep Dive Question {i+1}: What is the output of {i}*2?",
            "options": [str(i*2), str(i+2), "None", "Error"],
            "correct_option": 0,
            "domain": "python"
        })
    
    test_doc = {
        "test_id": test_id,
        "title": "Weekly Python Mastery Challenge",
        "domain": "python",
        "created_by": "mgr_001",
        "questions": questions,
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    await db.assessments.delete_many({"test_id": test_id})
    await db.assessments.insert_one(test_doc)
    print(f"[SUCCESS] Created Demo Test: {test_id}")

if __name__ == "__main__":
    asyncio.run(create_demo_test())
