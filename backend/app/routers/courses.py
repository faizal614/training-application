from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.course import Course
from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.schemas.course import CourseCreate, CourseResponse


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.post("/", response_model=CourseResponse)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
):
    course = Course(
        title=course_data.title,
        description=course_data.description,
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course


@router.get("/", response_model=list[CourseResponse])
def get_courses(
    db: Session = Depends(get_db),
):
    return db.query(Course).all()


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
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

    return course


@router.get("/{course_id}/progress")
def get_course_progress(
    course_id: int,
    user_id: int,
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

    modules = (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .order_by(Module.display_order)
        .all()
    )

    progress_records = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id == user_id,
            ModuleProgress.module_id.in_(
                [module.id for module in modules]
            ),
        )
        .all()
    )

    progress_by_module = {
        progress.module_id: progress
        for progress in progress_records
    }

    completed_modules = 0
    module_progress = []

    for module in modules:
        progress = progress_by_module.get(module.id)

        if progress is not None:
            status = progress.status.value

            if progress.status.value == "completed":
                completed_modules += 1
        else:
            status = "pending"

        module_progress.append(
            {
                "module_id": module.id,
                "title": module.title,
                "status": status,
            }
        )

    total_modules = len(modules)

    if total_modules == 0:
        progress_percentage = 0
    else:
        progress_percentage = (
            completed_modules / total_modules
        ) * 100

    return {
        "course_id": course_id,
        "user_id": user_id,
        "total_modules": total_modules,
        "completed_modules": completed_modules,
        "pending_modules": total_modules - completed_modules,
        "progress_percentage": progress_percentage,
        "modules": module_progress,
    }