from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.auth.authorization import (
    require_admin,
    require_instructor_or_admin,
)
from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db

from backend.app.models.course import Course
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.module import Module
from backend.app.models.module_progress import (
    ModuleProgress,
    ModuleProgressStatus,
)
from backend.app.models.question import Question
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.user import User, UserRole

from backend.app.schemas.module import (
    ModuleCreate,
    ModuleResponse,
)
from backend.app.schemas.module_progress import (
    ModuleProgressResponse,
)


router = APIRouter(
    prefix="/courses",
    tags=["Modules"],
)


# =========================================================
# HELPER
# =========================================================

def check_module_access(
    module: Module,
    current_user: User,
    db: Session,
):
    """
    Admins can manage every module.

    Instructors can only manage modules belonging
    to courses assigned to them.
    """

    if current_user.role == UserRole.ADMIN:
        return

    assignment = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.course_id
            == module.course_id,
            CourseAssignment.user_id
            == current_user.id,
        )
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this module",
        )


# =========================================================
# CREATE MODULE
# =========================================================

@router.post(
    "/{course_id}/modules",
    response_model=ModuleResponse,
)
def create_module(
    course_id: int,
    module_data: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
    # -----------------------------------------------------
    # CHECK COURSE
    # -----------------------------------------------------

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id
        )
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    # -----------------------------------------------------
    # CHECK INSTRUCTOR ACCESS
    # -----------------------------------------------------

    if current_user.role != UserRole.ADMIN:

        assignment = (
            db.query(CourseAssignment)
            .filter(
                CourseAssignment.course_id
                == course_id,
                CourseAssignment.user_id
                == current_user.id,
            )
            .first()
        )

        if assignment is None:
            raise HTTPException(
                status_code=403,
                detail="This course is not assigned to you",
            )

    # -----------------------------------------------------
    # CREATE
    # -----------------------------------------------------

    module = Module(
        course_id=course_id,
        title=module_data.title,
        display_order=module_data.display_order,
    )

    db.add(module)
    db.commit()
    db.refresh(module)

    return module


# =========================================================
# GET COURSE MODULES
# =========================================================

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
        .filter(
            Course.id == course_id
        )
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    return (
        db.query(Module)
        .filter(
            Module.course_id == course_id
        )
        .order_by(
            Module.display_order
        )
        .all()
    )


# =========================================================
# GET SINGLE MODULE
# =========================================================

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
        .filter(
            Module.id == module_id
        )
        .first()
    )

    if module is None:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    return module


# =========================================================
# UPDATE MODULE
# =========================================================

@router.put(
    "/modules/{module_id}",
    response_model=ModuleResponse,
)
def update_module(
    module_id: int,
    module_data: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
    module = (
        db.query(Module)
        .filter(
            Module.id == module_id
        )
        .first()
    )

    if module is None:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    check_module_access(
        module,
        current_user,
        db,
    )

    if not module_data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Module title is required",
        )

    if module_data.display_order < 1:
        raise HTTPException(
            status_code=400,
            detail="Display order must be at least 1",
        )

    module.title = module_data.title.strip()
    module.display_order = module_data.display_order

    db.commit()
    db.refresh(module)

    return module


# =========================================================
# GET MODULE PROGRESS
# =========================================================

@router.get(
    "/modules/{module_id}/progress",
    response_model=ModuleProgressResponse,
)
def get_module_progress(
    module_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    module = (
        db.query(Module)
        .filter(
            Module.id == module_id
        )
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


# =========================================================
# COMPLETE MODULE PROGRESS
# =========================================================

@router.put(
    "/modules/{module_id}/progress",
    response_model=ModuleProgressResponse,
)
def complete_module_progress(
    module_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    module = (
        db.query(Module)
        .filter(
            Module.id == module_id
        )
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
        progress = ModuleProgress(
            user_id=current_user.id,
            module_id=module_id,
            status=ModuleProgressStatus.COMPLETED,
            completed_at=datetime.utcnow(),
        )

        db.add(progress)

    else:
        progress.status = (
            ModuleProgressStatus.COMPLETED
        )

        if progress.completed_at is None:
            progress.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return progress


# =========================================================
# DELETE MODULE
# =========================================================

@router.delete(
    "/modules/{module_id}",
)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
    module = (
        db.query(Module)
        .filter(
            Module.id == module_id
        )
        .first()
    )

    if module is None:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    check_module_access(
        module,
        current_user,
        db,
    )

    try:
        # -------------------------------------------------
        # DELETE MODULE PROGRESS
        # -------------------------------------------------

        db.query(ModuleProgress).filter(
            ModuleProgress.module_id == module_id
        ).delete(
            synchronize_session=False
        )

        # -------------------------------------------------
        # FIND QUIZ
        # -------------------------------------------------

        quiz = (
            db.query(Quiz)
            .filter(
                Quiz.module_id == module_id
            )
            .first()
        )

        if quiz is not None:

            # ---------------------------------------------
            # DELETE ATTEMPTS
            # ---------------------------------------------

            db.query(QuizAttempt).filter(
                QuizAttempt.quiz_id == quiz.id
            ).delete(
                synchronize_session=False
            )

            # ---------------------------------------------
            # DELETE ANSWERS
            # ---------------------------------------------

            db.execute(
                text(
                    """
                    DELETE FROM answers
                    WHERE question_id IN (
                        SELECT id
                        FROM questions
                        WHERE quiz_id = :quiz_id
                    )
                    """
                ),
                {
                    "quiz_id": quiz.id,
                },
            )

            # ---------------------------------------------
            # DELETE QUESTIONS
            # ---------------------------------------------

            db.query(Question).filter(
                Question.quiz_id == quiz.id
            ).delete(
                synchronize_session=False
            )

            # ---------------------------------------------
            # DELETE QUIZ
            # ---------------------------------------------

            db.delete(quiz)
            db.flush()

        # -------------------------------------------------
        # DELETE MODULE
        # -------------------------------------------------

        db.delete(module)

        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete module and its related quiz data",
        )

    return {
        "message": "Module deleted successfully",
        "module_id": module_id,
    }