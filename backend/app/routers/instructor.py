from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.authorization import (
    require_instructor_or_admin,
)
from backend.app.database import get_db

from backend.app.models.course import Course
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.user import User, UserRole


router = APIRouter(
    prefix="/instructor",
    tags=["Instructor"],
)


# =========================================================
# HELPER
# =========================================================

def instructor_has_course_access(
    current_user: User,
    course_id: int,
    db: Session,
):
    """
    Admins can access every course.

    Instructors can only access courses assigned to them.
    """

    if current_user.role == UserRole.ADMIN:
        return True

    assignment = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.course_id == course_id,
            CourseAssignment.user_id == current_user.id,
        )
        .first()
    )

    return assignment is not None


# =========================================================
# GET INSTRUCTOR DASHBOARD
# =========================================================

@router.get("/dashboard")
def get_instructor_dashboard(
    current_user: User = Depends(
        require_instructor_or_admin
    ),
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(CourseAssignment)
        .join(
            Course,
            CourseAssignment.course_id == Course.id,
        )
        .filter(
            CourseAssignment.user_id == current_user.id
        )
        .order_by(
            Course.title
        )
        .all()
    )

    courses = []

    total_modules = 0
    total_learners = 0
    total_quiz_attempts = 0

    for assignment in assignments:

        course = assignment.course

        if course is None:
            continue

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

        module_count = len(modules)

        total_modules += module_count

        learner_assignments = (
            db.query(CourseAssignment)
            .join(
                User,
                CourseAssignment.user_id == User.id,
            )
            .filter(
                CourseAssignment.course_id == course.id,
                User.role == UserRole.LEARNER,
            )
            .all()
        )

        learner_count = len(
            learner_assignments
        )

        total_learners += learner_count

        module_ids = [
            module.id
            for module in modules
        ]

        quiz_attempt_count = 0

        if module_ids:

            quizzes = (
                db.query(Quiz)
                .filter(
                    Quiz.module_id.in_(module_ids)
                )
                .all()
            )

            quiz_ids = [
                quiz.id
                for quiz in quizzes
            ]

            if quiz_ids:

                quiz_attempt_count = (
                    db.query(QuizAttempt)
                    .filter(
                        QuizAttempt.quiz_id.in_(
                            quiz_ids
                        )
                    )
                    .count()
                )

        total_quiz_attempts += (
            quiz_attempt_count
        )

        courses.append(
            {
                "assignment_id": assignment.id,
                "course_id": course.id,
                "course_title": course.title,
                "course_description": course.description,
                "assigned_at": assignment.assigned_at,
                "module_count": module_count,
                "learner_count": learner_count,
                "quiz_attempt_count": quiz_attempt_count,
            }
        )

    return {
        "instructor": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "is_active": current_user.is_active,
        },
        "summary": {
            "course_count": len(courses),
            "module_count": total_modules,
            "learner_count": total_learners,
            "quiz_attempt_count": total_quiz_attempts,
        },
        "courses": courses,
    }


# =========================================================
# GET MY ASSIGNED COURSES
# =========================================================

@router.get("/courses")
def get_instructor_courses(
    current_user: User = Depends(
        require_instructor_or_admin
    ),
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(CourseAssignment)
        .join(
            Course,
            CourseAssignment.course_id == Course.id,
        )
        .filter(
            CourseAssignment.user_id == current_user.id
        )
        .order_by(
            Course.title
        )
        .all()
    )

    result = []

    for assignment in assignments:

        course = assignment.course

        if course is None:
            continue

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

        result.append(
            {
                "assignment_id": assignment.id,
                "course_id": course.id,
                "course_title": course.title,
                "course_description": course.description,
                "assigned_at": assignment.assigned_at,
                "modules": [
                    {
                        "module_id": module.id,
                        "title": module.title,
                        "display_order": module.display_order,
                    }
                    for module in modules
                ],
            }
        )

    return result


# =========================================================
# GET COURSE DETAILS
# =========================================================

@router.get("/courses/{course_id}")
def get_instructor_course(
    course_id: int,
    current_user: User = Depends(
        require_instructor_or_admin
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # CHECK ACCESS
    # -----------------------------------------------------

    if not instructor_has_course_access(
        current_user,
        course_id,
        db,
    ):
        raise HTTPException(
            status_code=403,
            detail="This course is not assigned to you",
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
    # FIND ASSIGNMENT
    # -----------------------------------------------------

    assignment = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.course_id == course_id,
            CourseAssignment.user_id == current_user.id,
        )
        .first()
    )

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

    # -----------------------------------------------------
    # GET NUMBER OF LEARNERS IN THIS COURSE
    # -----------------------------------------------------

    learner_count = (
        db.query(CourseAssignment)
        .join(
            User,
            CourseAssignment.user_id == User.id,
        )
        .filter(
            CourseAssignment.course_id == course.id,
            User.role == UserRole.LEARNER,
        )
        .count()
    )

    return {
        "course_id": course.id,
        "course_title": course.title,
        "course_description": course.description,
        "assigned_at": (
            assignment.assigned_at
            if assignment is not None
            else None
        ),

        "learner_count": learner_count,

        "modules": [
            {
                "module_id": module.id,
                "title": module.title,
                "display_order": module.display_order,
            }
            for module in modules
        ],
    }


# =========================================================
# GET COURSE LEARNERS + PROGRESS
# =========================================================

@router.get("/courses/{course_id}/learners")
def get_course_learners(
    course_id: int,
    current_user: User = Depends(
        require_instructor_or_admin
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # CHECK COURSE ACCESS
    # -----------------------------------------------------

    if not instructor_has_course_access(
        current_user,
        course_id,
        db,
    ):
        raise HTTPException(
            status_code=403,
            detail="This course is not assigned to you",
        )

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
    # GET COURSE MODULES
    # -----------------------------------------------------

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
    # GET LEARNERS
    # -----------------------------------------------------

    learner_assignments = (
        db.query(CourseAssignment)
        .join(
            User,
            CourseAssignment.user_id == User.id,
        )
        .filter(
            CourseAssignment.course_id == course_id,
            User.role == UserRole.LEARNER,
        )
        .order_by(
            User.name
        )
        .all()
    )

    result = []

    for assignment in learner_assignments:

        learner = assignment.user

        if learner is None:
            continue

        module_results = []
        completed_modules = 0

        for module in modules:

            progress = (
                db.query(ModuleProgress)
                .filter(
                    ModuleProgress.user_id
                    == learner.id,
                    ModuleProgress.module_id
                    == module.id,
                )
                .first()
            )

            if progress is None:
                module_status = "pending"
                completed_at = None
            else:
                module_status = (
                    progress.status.value
                )
                completed_at = (
                    progress.completed_at
                )

            if module_status == "completed":
                completed_modules += 1

            quiz = (
                db.query(Quiz)
                .filter(
                    Quiz.module_id == module.id
                )
                .first()
            )

            quiz_data = None

            if quiz is not None:

                attempts = (
                    db.query(QuizAttempt)
                    .filter(
                        QuizAttempt.user_id
                        == learner.id,
                        QuizAttempt.quiz_id
                        == quiz.id,
                    )
                    .order_by(
                        QuizAttempt.attempted_at
                    )
                    .all()
                )

                quiz_data = {
                    "quiz_id": quiz.id,
                    "quiz_title": quiz.title,
                    "passing_score": quiz.passing_score,
                    "max_attempts": quiz.max_attempts,
                    "attempts": [
                        {
                            "attempt_id": attempt.id,
                            "score": attempt.score,
                            "passed": attempt.passed,
                            "attempted_at": attempt.attempted_at,
                        }
                        for attempt in attempts
                    ],
                }

            module_results.append(
                {
                    "module_id": module.id,
                    "module_title": module.title,
                    "display_order": module.display_order,
                    "status": module_status,
                    "completed_at": completed_at,
                    "quiz": quiz_data,
                }
            )

        total_modules = len(modules)

        progress_percentage = (
            (
                completed_modules
                / total_modules
            ) * 100
            if total_modules > 0
            else 0
        )

        result.append(
            {
                "learner_id": learner.id,
                "learner_name": learner.name,
                "learner_email": learner.email,
                "is_active": learner.is_active,
                "completed_modules": completed_modules,
                "total_modules": total_modules,
                "progress_percentage": round(
                    progress_percentage,
                    1,
                ),
                "completed": (
                    total_modules > 0
                    and completed_modules
                    == total_modules
                ),
                "modules": module_results,
            }
        )

    return result