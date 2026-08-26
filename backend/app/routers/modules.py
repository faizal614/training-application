from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.course import Course
from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.schemas.module import ModuleCreate, ModuleResponse
from backend.app.schemas.module_progress import ModuleProgressResponse


router = APIRouter(
    prefix="/courses",
    tags=["Modules"],
)


@router.post(
    "/{course_id}/modules",
    response_model=ModuleResponse,
)
def create_module(
    course_id: int,
    module_data: ModuleCreate,
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

    module = Module(
        course_id=course_id,
        title=module_data.title,
        display_order=module_data.display_order,
    )

    db.add(module)
    db.commit()
    db.refresh(module)

    return module


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


@router.get(
    "/modules/{module_id}/progress",
    response_model=ModuleProgressResponse,
)
def get_module_progress(
    module_id: int,
    user_id: int,
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
            ModuleProgress.user_id == user_id,
        )
        .first()
    )

    if progress is None:
        raise HTTPException(
            status_code=404,
            detail="Module progress not found",
        )

    return progress