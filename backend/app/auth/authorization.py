from fastapi import Depends, HTTPException, status

from backend.app.auth.dependencies import get_current_user
from backend.app.models.user import User, UserRole


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def require_instructor_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role not in {
        UserRole.ADMIN,
        UserRole.INSTRUCTOR,
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or admin access required",
        )

    return current_user