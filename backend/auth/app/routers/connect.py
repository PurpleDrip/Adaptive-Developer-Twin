from fastapi import APIRouter, HTTPException
from shared.database.mongo import get_collection
from pydantic import BaseModel

router = APIRouter()

class ConnectionDTO(BaseModel):
    user_id: str
    extension_id: str
    machine_id: str

@router.post("/connect")
async def connect_device(dto: ConnectionDTO):
    """
    Validates a connection request from an extension.
    Ensures the IDs match and the hardware is approved.
    """
    users_col = get_collection("users")
    approved_devices = get_collection("approved_devices")

    # 1. Hardware Whitelisting Check
    is_approved = await approved_devices.find_one({"machine_id": dto.machine_id})
    if not is_approved:
        raise HTTPException(status_code=403, detail="Unauthorized Device: This machine is not an approved office device.")

    # 2. Verify IDs match an existing user
    user = await users_col.find_one({
        "user_id": dto.user_id,
        "extension_id": dto.extension_id
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="Invalid Credentials: User ID or Extension ID is incorrect.")

    # 3. Update user record with the verified machine_id
    await users_col.update_one(
        {"user_id": dto.user_id},
        {"$set": {"machine_id": dto.machine_id, "last_connected": "2026-05-02T12:00:00Z"}}
    )

    return {
        "status": "connected",
        "message": f"Successfully connected {user['name']}'s twin to this hardware.",
        "user_id": dto.user_id,
        "extension_id": dto.extension_id
    }
