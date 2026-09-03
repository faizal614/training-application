from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.authorization import require_admin
from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db

from backend.app.models.answer import Answer
from backend.app.models.certificate import Certificate
from backend.app.models.course import Course
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.models.question import Question
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.training_content import TrainingContent
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
# GET AVAILABLE COURSES FOR CURRENT USER
# =========================================================
#
# IMPORTANT:
#
# This endpoint returns ALL courses on the platform.
#
# A learner does NOT need to be assigned a course before
# the course appears in the course catalogue.
#
# If the learner has an existing assignment/enrollment:
#
#     assignment_id -> assignment ID
#     assigned_at   -> assignment date
#     deadline      -> course deadline
#
# If the learner has NOT enrolled/been assigned:
#
#     assignment_id -> None
#     assigned_at   -> None
#     deadline      -> None
#
# This allows the frontend to display all available courses
# and allow the learner to enroll in them.
#
# =========================================================

@router.get("/enrolled/me")
def get_my_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # GET ALL COURSES
    # -----------------------------------------------------

    courses = (
        db.query(Course)
        .order_by(Course.id)
        .all()
    )

    # -----------------------------------------------------
    # GET CURRENT USER'S ASSIGNMENTS
    # -----------------------------------------------------

    assignments = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.user_id == current_user.id
        )
        .all()
    )

    # -----------------------------------------------------
    # CREATE ASSIGNMENT LOOKUP
    # -----------------------------------------------------

    assignments_by_course = {
        assignment.course_id: assignment
        for assignment in assignments
    }

    result = []

    # =====================================================
    # PROCESS EVERY COURSE
    # =====================================================

    for course in courses:

        # -------------------------------------------------
        # CHECK WHETHER CURRENT USER IS ENROLLED
        # -------------------------------------------------

        assignment = assignments_by_course.get(
            course.id
        )

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
        # GET CURRENT USER'S MODULE PROGRESS
        # =================================================

        if module_ids:

            progress_records = (
                db.query(ModuleProgress)
                .filter(
                    ModuleProgress.user_id
                    == current_user.id,
                    ModuleProgress.module_id.in_(
                        module_ids
                    ),
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

            if progress is None:
                continue

            # -------------------------------------------------
            # Handle enum status safely.
            # -------------------------------------------------

            if hasattr(
                progress.status,
                "value",
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
                # ASSIGNMENT / ENROLLMENT
                # -----------------------------------------

                "assignment_id": (
                    assignment.id
                    if assignment is not None
                    else None
                ),

                "is_enrolled": (
                    assignment is not None
                ),

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

                "assigned_at": (
                    assignment.assigned_at
                    if assignment is not None
                    else None
                ),

                # -----------------------------------------
                # DEADLINE
                # -----------------------------------------

                "deadline": (
                    assignment.deadline
                    if assignment is not None
                    else None
                ),

                # -----------------------------------------
                # COMPLETION
                # -----------------------------------------

                "completed": completed,

                # -----------------------------------------
                # PROGRESS
                # -----------------------------------------

                "completed_modules": completed_modules,

                "total_modules": total_modules,

                "progress_percentage": (
                    progress_percentage
                ),
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
            CourseAssignment.user_id
            == current_user.id,

            CourseAssignment.course_id
            == course_id,
        )
        .first()
    )

    if existing_assignment is not None:
        raise HTTPException(
            status_code=400,
            detail="Already enrolled in this course",
        )

    # -----------------------------------------------------
    # CREATE ASSIGNMENT / ENROLLMENT
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

                ModuleProgress.module_id.in_(
                    module_ids
                ),
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
# Delete all course-related records before deleting the
# course itself.
#
# Deletion order:
#
# Certificate
#      ↓
# Course Assignments
#      ↓
# Module Progress
#      ↓
# Training Content
#      ↓
# Quiz Attempts
#      ↓
# Answers
#      ↓
# Questions
#      ↓
# Quizzes
#      ↓
# Modules
#      ↓
# Course
#
# Children must be deleted before their parent records
# because of PostgreSQL foreign-key constraints.
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
        # 1. DELETE CERTIFICATES
        # =================================================
        #
        # Certificates reference the course.
        #
        # =================================================

        db.query(Certificate).filter(
            Certificate.course_id == course_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 2. DELETE COURSE ASSIGNMENTS
        # =================================================
        #
        # Assignments reference the course.
        #
        # =================================================

        db.query(CourseAssignment).filter(
            CourseAssignment.course_id == course_id
        ).delete(
            synchronize_session=False
        )

        # =================================================
        # 3. GET ALL MODULES
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
        # 4. DELETE MODULE-RELATED DATA
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
            # DELETE TRAINING CONTENT
            # ---------------------------------------------
            #
            # training_contents.module_id references
            # modules.id.
            #
            # Therefore training contents MUST be deleted
            # before the modules themselves.
            #
            # ---------------------------------------------

            db.query(TrainingContent).filter(
                TrainingContent.module_id.in_(
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
            # DELETE QUIZ-RELATED DATA
            # ---------------------------------------------

            if quiz_ids:

                # =========================================
                # DELETE QUIZ ATTEMPTS
                # =========================================
                #
                # QuizAttempt references Quiz.
                #
                # =========================================

                db.query(QuizAttempt).filter(
                    QuizAttempt.quiz_id.in_(
                        quiz_ids
                    )
                ).delete(
                    synchronize_session=False
                )

                # =========================================
                # GET QUESTIONS
                # =========================================

                questions = (
                    db.query(Question)
                    .filter(
                        Question.quiz_id.in_(
                            quiz_ids
                        )
                    )
                    .all()
                )

                question_ids = [
                    question.id
                    for question in questions
                ]

                # =========================================
                # DELETE ANSWERS
                # =========================================
                #
                # Answer references Question.
                #
                # =========================================

                if question_ids:

                    db.query(Answer).filter(
                        Answer.question_id.in_(
                            question_ids
                        )
                    ).delete(
                        synchronize_session=False
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

            # =================================================
            # DELETE MODULES
            # =================================================

            db.query(Module).filter(
                Module.id.in_(
                    module_ids
                )
            ).delete(
                synchronize_session=False
            )

        # =================================================
        # 5. DELETE COURSE
        # =================================================

        db.delete(course)

        # =================================================
        # 6. COMMIT EVERYTHING
        # =================================================

        db.commit()

    except Exception as error:

        # -------------------------------------------------
        # ROLLBACK EVERYTHING
        # -------------------------------------------------

        db.rollback()

        # -------------------------------------------------
        # PRINT THE REAL DATABASE ERROR
        # -------------------------------------------------

        print(
            f"Failed to delete course "
            f"{course_id}: {error}"
        )

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