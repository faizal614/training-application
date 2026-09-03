import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)

from fastapi.responses import RedirectResponse

from sqlalchemy.orm import Session

from backend.app.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)

from backend.app.auth.google_oauth import oauth

from backend.app.database import get_db

from backend.app.models.user import User

from backend.app.schemas.auth import (
    AuthResponse,
    SignInRequest,
    SignUpRequest,
)

from backend.app.auth.dependencies import (
    get_current_user,
)

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
    # -----------------------------------------------------
    # CHECK EXISTING USER
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == user_data.email
        )
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    # -----------------------------------------------------
    # CREATE USER
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CREATE ACCESS TOKEN
    # -----------------------------------------------------

    access_token = create_access_token(
        user.id
    )

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
    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == user_data.email
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # -----------------------------------------------------
    # VERIFY PASSWORD
    # -----------------------------------------------------
    #
    # Google-only users have no password.
    #
    # Therefore, explicitly reject password login for
    # accounts that do not have a password hash.
    #
    # -----------------------------------------------------

    if not user.password_hash:
        raise HTTPException(
            status_code=401,
            detail="This account uses Google sign-in. Please continue with Google.",
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
            detail=(
                "Your account has been deactivated. "
                "Please contact an administrator."
            ),
        )

    # -----------------------------------------------------
    # CREATE ACCESS TOKEN
    # -----------------------------------------------------

    access_token = create_access_token(
        user.id
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
    )


# =========================================================
# GOOGLE SSO LOGIN
# =========================================================

@router.get(
    "/google/login"
)
async def google_login(
    request: Request,
):
    # -----------------------------------------------------
    # GET REDIRECT URI
    # -----------------------------------------------------

    redirect_uri = os.getenv(
        "GOOGLE_REDIRECT_URI"
    )

    if not redirect_uri:
        raise HTTPException(
            status_code=500,
            detail=(
                "GOOGLE_REDIRECT_URI "
                "is not configured"
            ),
        )

    # -----------------------------------------------------
    # REDIRECT USER TO GOOGLE
    # -----------------------------------------------------

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
    )


# =========================================================
# GOOGLE SSO CALLBACK
# =========================================================

@router.get(
    "/google/callback"
)
async def google_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    try:

        # =================================================
        # EXCHANGE GOOGLE AUTHORIZATION CODE
        # FOR GOOGLE TOKENS
        # =================================================

        token = (
            await oauth.google.authorize_access_token(
                request
            )
        )

        # =================================================
        # GET GOOGLE USER INFORMATION
        # =================================================

        userinfo = token.get(
            "userinfo"
        )

        if not userinfo:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unable to retrieve "
                    "Google account information"
                ),
            )

        google_sub = userinfo.get(
            "sub"
        )

        email = userinfo.get(
            "email"
        )

        name = userinfo.get(
            "name"
        )

        # =================================================
        # VALIDATE GOOGLE INFORMATION
        # =================================================

        if not google_sub:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Google account is missing "
                    "a unique identifier"
                ),
            )

        if not email:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Google account is missing "
                    "an email address"
                ),
            )

        # =================================================
        # FIND USER BY GOOGLE SUB
        # =================================================

        user = (
            db.query(User)
            .filter(
                User.google_sub == google_sub
            )
            .first()
        )

        # =================================================
        # FIND USER BY EMAIL
        # =================================================
        #
        # This allows an existing local account to be
        # linked to its Google account.
        #
        # =================================================

        if user is None:

            user = (
                db.query(User)
                .filter(
                    User.email == email
                )
                .first()
            )

            if user is not None:

                # -----------------------------------------
                # LINK GOOGLE ACCOUNT
                # -----------------------------------------

                user.google_sub = google_sub
                user.auth_provider = "google"

                db.commit()
                db.refresh(user)

        # =================================================
        # CREATE NEW GOOGLE USER
        # =================================================

        if user is None:

            user = User(
                name=(
                    name
                    or email.split("@")[0]
                ),
                email=email,
                password_hash=None,
                auth_provider="google",
                google_sub=google_sub,
                is_active=True,
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        # =================================================
        # CHECK ACCOUNT STATUS
        # =================================================

        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Your account has been deactivated. "
                    "Please contact an administrator."
                ),
            )

        # =================================================
        # CREATE APPLICATION JWT
        # =================================================
        #
        # IMPORTANT:
        #
        # We do NOT use Google's access token as the
        # application's authentication token.
        #
        # We create the same JWT used by normal signin.
        #
        # =================================================

        access_token = create_access_token(
            user.id
        )

        # =================================================
        # REDIRECT TO FRONTEND
        # =================================================

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173",
        )

        return RedirectResponse(
            url=(
                f"{frontend_url}"
                f"/google-callback"
                f"?token={access_token}"
            )
        )

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Google OAuth callback failed: "
            f"{error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Google authentication failed",
        )


# =========================================================
# CURRENT USER
# =========================================================

@router.get(
    "/me"
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }