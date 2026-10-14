from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token, oauth2_scheme
from app.database import get_db
from app.models.user import User, UserRole


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate Bearer token and retrieve the current authenticated User."""
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException(detail="Token payload is missing user ID")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedException(detail="User corresponding to token not found")
    if not user.is_active:
        raise UnauthorizedException(detail="User account is deactivated")

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def require_roles(allowed_roles: List[UserRole]):
    """Enforce endpoint permission based on user role."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != UserRole.ADMIN:
            raise ForbiddenException(
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}. Your role: {current_user.role.value}"
            )
        return current_user
    return role_checker


get_current_patient = require_roles([UserRole.PATIENT])
get_current_caregiver = require_roles([UserRole.CAREGIVER])
get_current_hcp = require_roles([UserRole.HEALTHCARE_PROFESSIONAL])
get_current_admin = require_roles([UserRole.ADMIN])
