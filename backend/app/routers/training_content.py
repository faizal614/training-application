from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.module import Module
from backend.app.models.training_content import TrainingContent
from backend.app.schemas.training_content import (
    TrainingContentCreate,
    TrainingContentResponse,
)


router = APIRouter(
    prefix="/modules",
    tags=["Training Content"],
)


@router.post(
    "/{module_id}/content",
    response_model=TrainingContentResponse,
)
def create_training_content(
    module_id: int,
    content_data: TrainingContentCreate,
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

    content = TrainingContent(
        module_id=module_id,
        content_type=content_data.content_type,
        video_url=content_data.video_url,
        subtitle=content_data.subtitle,
        body=content_data.body,
        display_order=content_data.display_order,
    )

    db.add(content)
    db.commit()
    db.refresh(content)

    return content


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
        .filter(TrainingContent.module_id == module_id)
        .order_by(TrainingContent.display_order)
        .all()
    )