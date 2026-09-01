from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.auth import (
    AuthResponse,
    SignInRequest,
    SignUpRequest,
)
from backend.app.auth.dependencies import get_current_user
from backend.app.services.notifications import (
    send_account_created_notification,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# =========================================================
# SIGN UP
# =========================================================

@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    user_data: SignUpRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(
            user_data.password
        ),
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # -----------------------------------------------------
    # SEND ACCOUNT CREATED EMAIL
    # -----------------------------------------------------

    send_account_created_notification(
        user_name=user.name,
        user_email=user.email,
    )

    access_token = create_access_token(user.id)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
    )

# =========================================================
# SIGN IN
# =========================================================

@router.post(
    "/signin",
    response_model=AuthResponse,
)
def signin(
    user_data: SignInRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        user_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # -----------------------------------------------------
    # CHECK ACCOUNT STATUS
    # -----------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated. Please contact an administrator.",
        )

    access_token = create_access_token(user.id)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
    )


# =========================================================
# CURRENT USER
# =========================================================

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }