from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.authorization import require_admin
from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db
from backend.app.models.course import Course
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.models.user import User, UserRole
from backend.app.schemas.course import CourseCreate, CourseResponse


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


# -------------------------
# CREATE COURSE
# -------------------------

@router.post("/", response_model=CourseResponse)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    course = Course(
        title=course_data.title,
        description=course_data.description,
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course


# -------------------------
# GET ALL COURSES
# -------------------------

@router.get("/", response_model=list[CourseResponse])
def get_courses(
    db: Session = Depends(get_db),
):
    return db.query(Course).all()


# -------------------------
# GET MY ENROLLED COURSES
# -------------------------

@router.get("/enrolled/me")
def get_my_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.user_id == current_user.id,
        )
        .all()
    )

    return [
        {
            "assignment_id": assignment.id,
            "course_id": assignment.course.id,
            "title": assignment.course.title,
            "description": assignment.course.description,
            "assigned_at": assignment.assigned_at,
        }
        for assignment in assignments
    ]


# -------------------------
# GET SINGLE COURSE
# -------------------------

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


# -------------------------
# ENROLL IN COURSE
# -------------------------

@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=403,
            detail="Only learners can enroll in courses",
        )

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

    existing_assignment = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.user_id == current_user.id,
            CourseAssignment.course_id == course_id,
        )
        .first()
    )

    if existing_assignment is not None:
        raise HTTPException(
            status_code=400,
            detail="Already enrolled in this course",
        )

    assignment = CourseAssignment(
        user_id=current_user.id,
        course_id=course_id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Successfully enrolled in course",
        "course_id": course_id,
        "user_id": current_user.id,
        "assignment_id": assignment.id,
    }


# -------------------------
# GET MY COURSE PROGRESS
# -------------------------

@router.get("/{course_id}/progress")
def get_course_progress(
    course_id: int,
    current_user: User = Depends(get_current_user),
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

    user_id = current_user.id

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
            module_status = progress.status.value

            if progress.status.value == "completed":
                completed_modules += 1
        else:
            module_status = "pending"

        module_progress.append(
            {
                "module_id": module.id,
                "title": module.title,
                "status": module_status,
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