from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.authorization import require_instructor_or_admin
from backend.app.database import get_db
from backend.app.models.module import Module
from backend.app.models.training_content import TrainingContent
from backend.app.models.user import User
from backend.app.schemas.training_content import (
    TrainingContentCreate,
    TrainingContentUpdate,
    TrainingContentResponse,
)


router = APIRouter(
    prefix="/modules",
    tags=["Training Content"],
)


# =========================================================
# CREATE TRAINING CONTENT
# =========================================================

@router.post(
    "/{module_id}/content",
    response_model=TrainingContentResponse,
)
def create_training_content(
    module_id: int,
    content_data: TrainingContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin),
):
    module = (
        db.query(Module)
        .filter(Module.id == module_id)
        .first()
    )

    if module is None:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    # -----------------------------------------------------
    # VALIDATE CONTENT TYPE
    # -----------------------------------------------------

    if content_data.content_type not in {
        "text",
        "video",
    }:
        raise HTTPException(
            status_code=400,
            detail="Content type must be either 'text' or 'video'",
        )

    # -----------------------------------------------------
    # VALIDATE TITLE
    # -----------------------------------------------------

    if not content_data.title or not content_data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Content title is required",
        )

    # -----------------------------------------------------
    # VALIDATE TEXT CONTENT
    # -----------------------------------------------------

    if (
        content_data.content_type == "text"
        and not content_data.body
    ):
        raise HTTPException(
            status_code=400,
            detail="Text content requires a body",
        )

    # -----------------------------------------------------
    # VALIDATE VIDEO CONTENT
    # -----------------------------------------------------

    if (
        content_data.content_type == "video"
        and not content_data.video_url
    ):
        raise HTTPException(
            status_code=400,
            detail="Video content requires a video URL",
        )

    # -----------------------------------------------------
    # CREATE CONTENT
    # -----------------------------------------------------

    content = TrainingContent(
        module_id=module_id,
        title=content_data.title.strip(),
        description=(
            content_data.description.strip()
            if content_data.description
            else None
        ),
        content_type=content_data.content_type,
        video_url=content_data.video_url,
        body=content_data.body,
        display_order=content_data.display_order,
    )

    db.add(content)
    db.commit()
    db.refresh(content)

    return content


# =========================================================
# GET ALL CONTENT FOR A MODULE
# =========================================================

@router.get(
    "/{module_id}/content",
    response_model=list[TrainingContentResponse],
)
def get_module_content(
    module_id: int,
    db: Session = Depends(get_db),
):
    module = (
        db.query(Module)
        .filter(Module.id == module_id)
        .first()
    )

    if module is None:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    return (
        db.query(TrainingContent)
        .filter(
            TrainingContent.module_id == module_id
        )
        .order_by(
            TrainingContent.display_order,
            TrainingContent.id,
        )
        .all()
    )


# =========================================================
# GET SINGLE TRAINING CONTENT
# =========================================================

@router.get(
    "/content/{content_id}",
    response_model=TrainingContentResponse,
)
def get_training_content(
    content_id: int,
    db: Session = Depends(get_db),
):
    content = (
        db.query(TrainingContent)
        .filter(
            TrainingContent.id == content_id
        )
        .first()
    )

    if content is None:
        raise HTTPException(
            status_code=404,
            detail="Training content not found",
        )

    return content


# =========================================================
# UPDATE TRAINING CONTENT
# =========================================================

@router.put(
    "/content/{content_id}",
    response_model=TrainingContentResponse,
)
def update_training_content(
    content_id: int,
    content_data: TrainingContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin),
):
    content = (
        db.query(TrainingContent)
        .filter(
            TrainingContent.id == content_id
        )
        .first()
    )

    if content is None:
        raise HTTPException(
            status_code=404,
            detail="Training content not found",
        )

    # -----------------------------------------------------
    # VALIDATE CONTENT TYPE
    # -----------------------------------------------------

    if content_data.content_type not in {
        "text",
        "video",
    }:
        raise HTTPException(
            status_code=400,
            detail="Content type must be either 'text' or 'video'",
        )

    # -----------------------------------------------------
    # VALIDATE TITLE
    # -----------------------------------------------------

    if not content_data.title or not content_data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Content title is required",
        )

    # -----------------------------------------------------
    # VALIDATE TEXT CONTENT
    # -----------------------------------------------------

    if (
        content_data.content_type == "text"
        and not content_data.body
    ):
        raise HTTPException(
            status_code=400,
            detail="Text content requires a body",
        )

    # -----------------------------------------------------
    # VALIDATE VIDEO CONTENT
    # -----------------------------------------------------

    if (
        content_data.content_type == "video"
        and not content_data.video_url
    ):
        raise HTTPException(
            status_code=400,
            detail="Video content requires a video URL",
        )

    # -----------------------------------------------------
    # UPDATE CONTENT
    # -----------------------------------------------------

    content.title = content_data.title.strip()

    content.description = (
        content_data.description.strip()
        if content_data.description
        else None
    )

    content.content_type = (
        content_data.content_type
    )

    content.video_url = (
        content_data.video_url
    )

    content.body = (
        content_data.body
    )

    content.display_order = (
        content_data.display_order
    )

    db.commit()
    db.refresh(content)

    return content


# =========================================================
# DELETE TRAINING CONTENT
# =========================================================

@router.delete(
    "/content/{content_id}",
)
def delete_training_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin),
):
    content = (
        db.query(TrainingContent)
        .filter(
            TrainingContent.id == content_id
        )
        .first()
    )

    if content is None:
        raise HTTPException(
            status_code=404,
            detail="Training content not found",
        )

    module_id = content.module_id

    db.delete(content)
    db.commit()

    return {
        "message": "Training content deleted successfully",
        "content_id": content_id,
        "module_id": module_id,
    }