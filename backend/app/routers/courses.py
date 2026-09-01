from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.auth.authorization import require_admin
from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db

from backend.app.models.course import Course
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.models.question import Question
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.user import User, UserRole

from backend.app.schemas.course import (
    CourseCreate,
    CourseResponse,
)


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


# =========================================================
# CREATE COURSE
# =========================================================

@router.post(
    "/",
    response_model=CourseResponse,
)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # -----------------------------------------------------
    # NORMALIZE CATEGORY
    # -----------------------------------------------------

    category = (
        course_data.category.strip()
        if course_data.category
        else "General"
    )

    if not category:
        category = "General"

    # -----------------------------------------------------
    # CREATE COURSE
    # -----------------------------------------------------

    course = Course(
        title=course_data.title,
        description=course_data.description,
        category=category,
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course


# =========================================================
# GET ALL COURSES
# =========================================================

@router.get(
    "/",
    response_model=list[CourseResponse],
)
def get_courses(
    db: Session = Depends(get_db),
):
    return (
        db.query(Course)
        .order_by(Course.id)
        .all()
    )


# =========================================================
# GET MY ENROLLED COURSES
# =========================================================

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
            "category": assignment.course.category,
            "assigned_at": assignment.assigned_at,
        }
        for assignment in assignments
    ]


# =========================================================
# GET SINGLE COURSE
# =========================================================

@router.get(
    "/{course_id}",
    response_model=CourseResponse,
)
def get_course(
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

    return course


# =========================================================
# UPDATE COURSE
# =========================================================

@router.put(
    "/{course_id}",
    response_model=CourseResponse,
)
def update_course(
    course_id: int,
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # -----------------------------------------------------
    # FIND COURSE
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
    # NORMALIZE CATEGORY
    # -----------------------------------------------------

    category = (
        course_data.category.strip()
        if course_data.category
        else "General"
    )

    if not category:
        category = "General"

    # -----------------------------------------------------
    # UPDATE COURSE
    # -----------------------------------------------------

    course.title = course_data.title
    course.description = course_data.description
    course.category = category

    db.commit()
    db.refresh(course)

    return course


# =========================================================
# ENROLL IN COURSE
# =========================================================

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


# =========================================================
# GET MY COURSE PROGRESS
# =========================================================

@router.get("/{course_id}/progress")
def get_course_progress(
    course_id: int,
    current_user: User = Depends(get_current_user),
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

    user_id = current_user.id

    modules = (
        db.query(Module)
        .filter(
            Module.course_id == course_id
        )
        .order_by(
            Module.display_order
        )
        .all()
    )

    module_ids = [
        module.id
        for module in modules
    ]

    if module_ids:
        progress_records = (
            db.query(ModuleProgress)
            .filter(
                ModuleProgress.user_id == user_id,
                ModuleProgress.module_id.in_(module_ids),
            )
            .all()
        )
    else:
        progress_records = []

    progress_by_module = {
        progress.module_id: progress
        for progress in progress_records
    }

    completed_modules = 0
    module_progress = []

    for module in modules:

        progress = progress_by_module.get(
            module.id
        )

        if progress is not None:

            module_status = (
                progress.status.value
            )

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
            completed_modules
            / total_modules
        ) * 100

    return {
        "course_id": course_id,
        "user_id": user_id,
        "total_modules": total_modules,
        "completed_modules": completed_modules,
        "pending_modules": (
            total_modules
            - completed_modules
        ),
        "progress_percentage": (
            progress_percentage
        ),
        "modules": module_progress,
    }


# =========================================================
# DELETE COURSE
# =========================================================
#
# Deletion order:
#
# Course
#   ├── Course Assignments
#   └── Modules
#        ├── Module Progress
#        └── Quiz
#             ├── Quiz Attempts
#             └── Questions
#                  └── Answers
#
# Delete children first, then parent.
#
# =========================================================

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    # -----------------------------------------------------
    # FIND COURSE
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

    try:

        # =================================================
        # 1. DELETE COURSE ASSIGNMENTS
        # =================================================

        db.query(CourseAssignment).filter(
            CourseAssignment.course_id == course_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 2. GET ALL MODULES
        # =================================================

        modules = (
            db.query(Module)
            .filter(
                Module.course_id == course_id
            )
            .all()
        )

        module_ids = [
            module.id
            for module in modules
        ]

        # =================================================
        # 3. DELETE MODULE-RELATED DATA
        # =================================================

        if module_ids:

            # ---------------------------------------------
            # DELETE MODULE PROGRESS
            # ---------------------------------------------

            db.query(ModuleProgress).filter(
                ModuleProgress.module_id.in_(
                    module_ids
                )
            ).delete(
                synchronize_session=False
            )

            # ---------------------------------------------
            # GET QUIZZES
            # ---------------------------------------------

            quizzes = (
                db.query(Quiz)
                .filter(
                    Quiz.module_id.in_(
                        module_ids
                    )
                )
                .all()
            )

            quiz_ids = [
                quiz.id
                for quiz in quizzes
            ]

            # ---------------------------------------------
            # DELETE QUIZ DATA
            # ---------------------------------------------

            if quiz_ids:

                # =========================================
                # DELETE QUIZ ATTEMPTS
                # =========================================

                db.query(QuizAttempt).filter(
                    QuizAttempt.quiz_id.in_(
                        quiz_ids
                    )
                ).delete(
                    synchronize_session=False
                )

                # =========================================
                # DELETE ANSWERS
                #
                # Answers reference Questions.
                # =========================================

                db.execute(
                    text(
                        """
                        DELETE FROM answers
                        WHERE question_id IN (
                            SELECT id
                            FROM questions
                            WHERE quiz_id = ANY(:quiz_ids)
                        )
                        """
                    ),
                    {
                        "quiz_ids": quiz_ids,
                    },
                )

                # =========================================
                # DELETE QUESTIONS
                # =========================================

                db.query(Question).filter(
                    Question.quiz_id.in_(
                        quiz_ids
                    )
                ).delete(
                    synchronize_session=False
                )

                # =========================================
                # DELETE QUIZZES
                # =========================================

                db.query(Quiz).filter(
                    Quiz.id.in_(
                        quiz_ids
                    )
                ).delete(
                    synchronize_session=False
                )

            # ---------------------------------------------
            # DELETE MODULES
            # ---------------------------------------------

            db.query(Module).filter(
                Module.id.in_(
                    module_ids
                )
            ).delete(
                synchronize_session=False
            )

        # =================================================
        # 4. DELETE COURSE
        # =================================================

        db.delete(course)

        # =================================================
        # 5. COMMIT
        # =================================================

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to delete course "
                "and its related data"
            ),
        )

    return {
        "message": "Course deleted successfully",
        "course_id": course_id,
    }