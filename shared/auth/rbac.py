from fastapi import HTTPException, Depends, status
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

async def get_current_role(user_role: str = "developer"):
    # This will be integrated with the Auth Service's session validation
    return user_role
