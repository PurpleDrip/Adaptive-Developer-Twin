from fastapi import HTTPException, Depends, status, Request
from typing import List
import json
import os

def role_required(allowed_roles: List[str]):
    """
    Dependency to enforce Role-Based Access Control.
    """
    async def role_checker(user_role: str = Depends(get_current_role)):
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Required roles {allowed_roles}, but you are '{user_role}'"
            )
        return True
    return role_checker

async def get_current_role(request: Request):
    # This expects the API Gateway or frontend to forward the role header
    user_role = request.headers.get("X-User-Role", "developer")
    return user_role
