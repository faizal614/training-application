from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.authorization import require_instructor_or_admin
from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db
from backend.app.models.course import Course
from backend.app.models.module import Module
from backend.app.models.module_progress import (
    ModuleProgress,
    ModuleProgressStatus,
)
from backend.app.models.user import User
from backend.app.schemas.module import ModuleCreate, ModuleResponse
from backend.app.schemas.module_progress import ModuleProgressResponse


router = APIRouter(
    prefix="/courses",
    tags=["Modules"],
)


# -------------------------
# CREATE MODULE
# -------------------------

@router.post(
    "/{course_id}/modules",
    response_model=ModuleResponse,
)
def create_module(
    course_id: int,
    module_data: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor_or_admin),
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    module = Module(
        course_id=course_id,
        title=module_data.title,
        display_order=module_data.display_order,
    )

    db.add(module)
    db.commit()
    db.refresh(module)

    return module


# -------------------------
# GET COURSE MODULES
# -------------------------

@router.get(
    "/{course_id}/modules",
    response_model=list[ModuleResponse],
)
def get_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    return (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .order_by(Module.display_order)
        .all()
    )


# -------------------------
# GET SINGLE MODULE
# -------------------------

@router.get(
    "/modules/{module_id}",
    response_model=ModuleResponse,
)
def get_module(
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

    return module


# -------------------------
# GET MODULE PROGRESS
# -------------------------

@router.get(
    "/modules/{module_id}/progress",
    response_model=ModuleProgressResponse,
)
def get_module_progress(
    module_id: int,
    current_user: User = Depends(get_current_user),
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

    progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.module_id == module_id,
            ModuleProgress.user_id == current_user.id,
        )
        .first()
    )

    if progress is None:
        raise HTTPException(
            status_code=404,
            detail="Module progress not found",
        )

    return progress


# -------------------------
# COMPLETE MODULE PROGRESS
# -------------------------

@router.put(
    "/modules/{module_id}/progress",
    response_model=ModuleProgressResponse,
)
def complete_module_progress(
    module_id: int,
    current_user: User = Depends(get_current_user),
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

    progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.module_id == module_id,
            ModuleProgress.user_id == current_user.id,
        )
        .first()
    )

    # If progress does not exist, create it as completed.
    if progress is None:
        progress = ModuleProgress(
            user_id=current_user.id,
            module_id=module_id,
            status=ModuleProgressStatus.COMPLETED,
            completed_at=datetime.utcnow(),
        )

        db.add(progress)

    # If progress already exists, keep it completed.
    else:
        progress.status = ModuleProgressStatus.COMPLETED

        if progress.completed_at is None:
            progress.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return progress