from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from shared.database.mongo import get_collection
from shared.models.operations import NotificationDocument
import uuid

router = APIRouter()

@router.post("/send", status_code=201)
async def send_notification(notification: NotificationDocument):
    """Internal endpoint for other services to trigger notifications."""
    notif_col = get_collection("notifications")
    notif_doc = notification.dict()
    notif_doc["created_at"] = datetime.utcnow()
    await notif_col.insert_one(notif_doc)
    return {"status": "sent", "id": notification.notification_id}

@router.get("/{user_id}", response_model=List[NotificationDocument])
async def get_user_notifications(user_id: str, unread_only: bool = False):
    """Fetch notifications for a specific user."""
    notif_col = get_collection("notifications")
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False
    
    cursor = notif_col.find(query).sort("created_at", -1).limit(50)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results

@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str):
    """Mark a notification as read."""
    notif_col = get_collection("notifications")
    result = await notif_col.update_one(
        {"notification_id": notification_id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "marked_as_read"}
