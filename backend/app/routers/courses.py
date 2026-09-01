from datetime import datetime

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
#
# Returns courses assigned to the currently authenticated
# learner.
#
# Includes:
#
# - Assignment information
# - Deadline
# - Module completion
# - Course completion status
# - Progress percentage
#
# IMPORTANT:
#
# A course is considered completed when:
#
#     total_modules > 0
#     AND
#     completed_modules == total_modules
#
# If completed == True, the frontend can display
# "COMPLETED" instead of the deadline.
#
# =========================================================

@router.get("/enrolled/me")
def get_my_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # GET CURRENT USER'S ASSIGNMENTS
    # -----------------------------------------------------

    assignments = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.user_id == current_user.id,
        )
        .order_by(
            CourseAssignment.id
        )
        .all()
    )

    result = []

    # -----------------------------------------------------
    # PROCESS EACH ASSIGNMENT
    # -----------------------------------------------------

    for assignment in assignments:

        course = assignment.course

        # -------------------------------------------------
        # SAFETY CHECK
        # -------------------------------------------------

        if course is None:
            continue

        # =================================================
        # GET COURSE MODULES
        # =================================================

        modules = (
            db.query(Module)
            .filter(
                Module.course_id == course.id
            )
            .order_by(
                Module.display_order
            )
            .all()
        )

        # -------------------------------------------------
        # MODULE IDS
        # -------------------------------------------------

        module_ids = [
            module.id
            for module in modules
        ]

        # =================================================
        # GET MODULE PROGRESS
        # =================================================

        if module_ids:

            progress_records = (
                db.query(ModuleProgress)
                .filter(
                    ModuleProgress.user_id == current_user.id,
                    ModuleProgress.module_id.in_(module_ids),
                )
                .all()
            )

        else:

            progress_records = []

        # -------------------------------------------------
        # MAP PROGRESS BY MODULE
        # -------------------------------------------------

        progress_by_module = {
            progress.module_id: progress
            for progress in progress_records
        }

        # =================================================
        # COUNT COMPLETED MODULES
        # =================================================

        completed_modules = 0

        for module in modules:

            progress = progress_by_module.get(
                module.id
            )

            if progress is not None:

                # -------------------------------------------------
                # Handle enum status safely.
                # -------------------------------------------------

                if hasattr(
                    progress.status,
                    "value"
                ):
                    module_status = (
                        progress.status.value
                    )
                else:
                    module_status = str(
                        progress.status
                    )

                if module_status == "completed":
                    completed_modules += 1

        # =================================================
        # TOTAL MODULES
        # =================================================

        total_modules = len(modules)

        # =================================================
        # PROGRESS PERCENTAGE
        # =================================================

        if total_modules > 0:

            progress_percentage = (
                completed_modules
                / total_modules
            ) * 100

        else:

            progress_percentage = 0

        # =================================================
        # COURSE COMPLETION
        # =================================================
        #
        # Do NOT consider a course with zero modules
        # completed.
        #
        # This prevents an empty course from being
        # incorrectly marked as completed.
        #
        # =================================================

        completed = (
            total_modules > 0
            and completed_modules == total_modules
        )

        # =================================================
        # ADD COURSE TO RESPONSE
        # =================================================

        result.append(
            {
                # -----------------------------------------
                # ASSIGNMENT
                # -----------------------------------------

                "assignment_id": assignment.id,

                # -----------------------------------------
                # COURSE
                # -----------------------------------------

                "course_id": course.id,

                "title": course.title,

                "description": course.description,

                "category": course.category,

                # -----------------------------------------
                # ASSIGNMENT DATE
                # -----------------------------------------

                "assigned_at": assignment.assigned_at,

                # -----------------------------------------
                # DEADLINE
                # -----------------------------------------

                "deadline": assignment.deadline,

                # -----------------------------------------
                # COMPLETION
                # -----------------------------------------

                "completed": completed,

                # -----------------------------------------
                # PROGRESS
                # -----------------------------------------

                "completed_modules": completed_modules,

                "total_modules": total_modules,

                "progress_percentage": progress_percentage,
            }
        )

    return result


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
    # -----------------------------------------------------
    # ONLY LEARNERS CAN ENROLL
    # -----------------------------------------------------

    if current_user.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=403,
            detail="Only learners can enroll in courses",
        )

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
    # CHECK EXISTING ASSIGNMENT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CREATE ASSIGNMENT
    # -----------------------------------------------------

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

    user_id = current_user.id

    # =====================================================
    # GET MODULES
    # =====================================================

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

    # -----------------------------------------------------
    # MODULE IDS
    # -----------------------------------------------------

    module_ids = [
        module.id
        for module in modules
    ]

    # =====================================================
    # GET PROGRESS RECORDS
    # =====================================================

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

    # -----------------------------------------------------
    # MAP PROGRESS
    # -----------------------------------------------------

    progress_by_module = {
        progress.module_id: progress
        for progress in progress_records
    }

    # =====================================================
    # BUILD MODULE PROGRESS
    # =====================================================

    completed_modules = 0
    module_progress = []

    for module in modules:

        progress = progress_by_module.get(
            module.id
        )

        if progress is not None:

            if hasattr(
                progress.status,
                "value"
            ):
                module_status = (
                    progress.status.value
                )
            else:
                module_status = str(
                    progress.status
                )

            if module_status == "completed":
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

    # =====================================================
    # COURSE PROGRESS
    # =====================================================

    total_modules = len(modules)

    if total_modules == 0:

        progress_percentage = 0

    else:

        progress_percentage = (
            completed_modules
            / total_modules
        ) * 100

    # -----------------------------------------------------
    # COURSE COMPLETED
    # -----------------------------------------------------

    completed = (
        total_modules > 0
        and completed_modules == total_modules
    )

    # =====================================================
    # RESPONSE
    # =====================================================

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

        "completed": completed,

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


# =========================================================
# UPDATE COURSE ASSIGNMENT DEADLINE
# =========================================================
#
# Allows an admin to:
#
# - Set a new deadline
# - Change an existing deadline
# - Remove a deadline by sending null
#
# =========================================================

@router.patch(
    "/course-assignments/{assignment_id}/deadline"
)
def update_course_assignment_deadline(
    assignment_id: int,
    deadline_data: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    # -----------------------------------------------------
    # FIND ASSIGNMENT
    # -----------------------------------------------------

    assignment = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.id == assignment_id
        )
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Course assignment not found",
        )

    # -----------------------------------------------------
    # GET DEADLINE
    # -----------------------------------------------------

    deadline = deadline_data.get(
        "deadline"
    )

    # =====================================================
    # SET / UPDATE DEADLINE
    # =====================================================

    if deadline is not None:

        try:

            parsed_deadline = (
                datetime.fromisoformat(
                    deadline.replace(
                        "Z",
                        "+00:00"
                    )
                )
            )

        except ValueError:

            raise HTTPException(
                status_code=400,
                detail="Invalid deadline format",
            )

        # -------------------------------------------------
        # MAKE COMPARISON TIMEZONE-SAFE
        # -------------------------------------------------

        if parsed_deadline.tzinfo is not None:

            now = datetime.now(
                parsed_deadline.tzinfo
            )

        else:

            now = datetime.now()

        # -------------------------------------------------
        # DEADLINE MUST BE IN FUTURE
        # -------------------------------------------------

        if parsed_deadline <= now:

            raise HTTPException(
                status_code=400,
                detail=(
                    "The deadline must be in the future."
                ),
            )

        # -------------------------------------------------
        # SAVE DEADLINE
        # -------------------------------------------------

        assignment.deadline = parsed_deadline

    else:

        # =================================================
        # REMOVE DEADLINE
        # =================================================

        assignment.deadline = None

    # =====================================================
    # SAVE
    # =====================================================

    db.commit()
    db.refresh(assignment)

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "assignment_id": assignment.id,

        "deadline": assignment.deadline,

        "message": (
            "Course assignment deadline "
            "updated successfully"
        ),
    }