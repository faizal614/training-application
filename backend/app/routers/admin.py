from fastapi import APIRouter, Depends, HTTPException, status
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from backend.app.auth.authorization import require_admin
from backend.app.database import get_db
from backend.app.models.user import User, UserRole


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

password_hash = PasswordHash.recommended()


# -------------------------
# CREATE ADMIN
# -------------------------

@router.post("/create")
def create_admin(
    name: str,
    email: str,
    password: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    admin = User(
        name=name,
        email=email,
        password_hash=password_hash.hash(password),
        role=UserRole.ADMIN,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
    }


# -------------------------
# CREATE INSTRUCTOR
# -------------------------

@router.post("/instructors")
def create_instructor(
    name: str,
    email: str,
    password: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    instructor = User(
        name=name,
        email=email,
        password_hash=password_hash.hash(password),
        role=UserRole.INSTRUCTOR,
    )

    db.add(instructor)
    db.commit()
    db.refresh(instructor)

    return {
        "id": instructor.id,
        "name": instructor.name,
        "email": instructor.email,
        "role": instructor.role,
    }