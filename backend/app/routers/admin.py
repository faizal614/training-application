from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from backend.app.auth.authorization import require_admin
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.course import Course
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.certificate import Certificate

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

password_hash = PasswordHash.recommended()


# =========================================================
# CREATE ADMIN
# =========================================================

@router.post("/create")
def create_admin(
    name: str,
    email: str,
    password: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    admin = User(
        name=name,
        email=email,
        password_hash=password_hash.hash(password),
        role=UserRole.ADMIN,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {
        "id": admin.id,
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
        "is_active": admin.is_active,
    }


# =========================================================
# CREATE INSTRUCTOR
# =========================================================

@router.post("/instructors")
def create_instructor(
    name: str,
    email: str,
    password: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    instructor = User(
        name=name,
        email=email,
        password_hash=password_hash.hash(password),
        role=UserRole.INSTRUCTOR,
        is_active=True,
    )

    db.add(instructor)
    db.commit()
    db.refresh(instructor)

    return {
        "id": instructor.id,
        "name": instructor.name,
        "email": instructor.email,
        "role": instructor.role,
        "is_active": instructor.is_active,
    }


# =========================================================
# GET ALL INSTRUCTORS
# =========================================================

@router.get("/instructors")
def get_instructors(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    instructors = (
        db.query(User)
        .filter(User.role == UserRole.INSTRUCTOR)
        .order_by(User.id)
        .all()
    )

    return [
        {
            "id": instructor.id,
            "name": instructor.name,
            "email": instructor.email,
            "role": instructor.role,
            "is_active": instructor.is_active,
        }
        for instructor in instructors
    ]


# =========================================================
# COURSE ASSIGNMENT REQUEST
# =========================================================

class InstructorCourseAssignment(BaseModel):
    instructor_id: int


# =========================================================
# ASSIGN COURSE TO INSTRUCTOR
# =========================================================

@router.post("/courses/{course_id}/instructors")
def assign_course_to_instructor(
    course_id: int,
    assignment_data: InstructorCourseAssignment,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # CHECK COURSE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CHECK INSTRUCTOR
    # -----------------------------------------------------

    instructor = (
        db.query(User)
        .filter(
            User.id == assignment_data.instructor_id,
            User.role == UserRole.INSTRUCTOR,
        )
        .first()
    )

    if instructor is None:
        raise HTTPException(
            status_code=404,
            detail="Instructor not found",
        )

    # -----------------------------------------------------
    # CHECK EXISTING ASSIGNMENT
    # -----------------------------------------------------

    existing_assignment = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.user_id == instructor.id,
            CourseAssignment.course_id == course.id,
        )
        .first()
    )

    if existing_assignment is not None:
        raise HTTPException(
            status_code=400,
            detail="Course is already assigned to this instructor",
        )

    # -----------------------------------------------------
    # CREATE ASSIGNMENT
    # -----------------------------------------------------

    assignment = CourseAssignment(
        user_id=instructor.id,
        course_id=course.id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Course assigned to instructor successfully",
        "assignment_id": assignment.id,
        "instructor_id": instructor.id,
        "instructor_name": instructor.name,
        "course_id": course.id,
        "course_title": course.title,
    }


# =========================================================
# GET INSTRUCTOR COURSE ASSIGNMENTS
# =========================================================

@router.get("/instructors/courses")
def get_instructor_courses(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(CourseAssignment)
        .join(
            User,
            CourseAssignment.user_id == User.id,
        )
        .join(
            Course,
            CourseAssignment.course_id == Course.id,
        )
        .filter(
            User.role == UserRole.INSTRUCTOR
        )
        .order_by(
            User.name,
            Course.title,
        )
        .all()
    )

    return [
        {
            "assignment_id": assignment.id,
            "instructor_id": assignment.user_id,
            "instructor_name": assignment.user.name,
            "instructor_email": assignment.user.email,
            "course_id": assignment.course_id,
            "course_title": assignment.course.title,
            "course_description": assignment.course.description,
            "assigned_at": assignment.assigned_at,
        }
        for assignment in assignments
    ]


# =========================================================
# UPDATE INSTRUCTOR ACCESS
# =========================================================

@router.patch("/instructors/{instructor_id}/access")
def update_instructor_access(
    instructor_id: int,
    is_active: bool,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # FIND INSTRUCTOR
    # -----------------------------------------------------

    instructor = (
        db.query(User)
        .filter(
            User.id == instructor_id,
            User.role == UserRole.INSTRUCTOR,
        )
        .first()
    )

    if instructor is None:
        raise HTTPException(
            status_code=404,
            detail="Instructor not found",
        )

    # -----------------------------------------------------
    # UPDATE ACCESS
    # -----------------------------------------------------

    instructor.is_active = is_active

    db.commit()
    db.refresh(instructor)

    return {
        "id": instructor.id,
        "name": instructor.name,
        "email": instructor.email,
        "role": instructor.role,
        "is_active": instructor.is_active,
    }
# =========================================================
# LEARNER COURSE ASSIGNMENT REQUEST
# =========================================================

class LearnerCourseAssignment(BaseModel):
    learner_id: int


# =========================================================
# GET ALL LEARNERS
# =========================================================

@router.get("/learners")
def get_learners(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    learners = (
        db.query(User)
        .filter(User.role == UserRole.LEARNER)
        .order_by(User.id)
        .all()
    )

    return [
        {
            "id": learner.id,
            "name": learner.name,
            "email": learner.email,
            "role": learner.role,
            "is_active": learner.is_active,
        }
        for learner in learners
    ]


# =========================================================
# ASSIGN COURSE TO LEARNER
# =========================================================

@router.post("/courses/{course_id}/learners")
def assign_course_to_learner(
    course_id: int,
    assignment_data: LearnerCourseAssignment,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # CHECK COURSE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CHECK LEARNER
    # -----------------------------------------------------

    learner = (
        db.query(User)
        .filter(
            User.id == assignment_data.learner_id,
            User.role == UserRole.LEARNER,
        )
        .first()
    )

    if learner is None:
        raise HTTPException(
            status_code=404,
            detail="Learner not found",
        )

    # -----------------------------------------------------
    # CHECK EXISTING ASSIGNMENT
    # -----------------------------------------------------

    existing_assignment = (
        db.query(CourseAssignment)
        .filter(
            CourseAssignment.user_id == learner.id,
            CourseAssignment.course_id == course.id,
        )
        .first()
    )

    if existing_assignment is not None:
        raise HTTPException(
            status_code=400,
            detail="Course is already assigned to this learner",
        )

    # -----------------------------------------------------
    # CREATE ASSIGNMENT
    # -----------------------------------------------------

    assignment = CourseAssignment(
        user_id=learner.id,
        course_id=course.id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": "Course assigned to learner successfully",
        "assignment_id": assignment.id,
        "learner_id": learner.id,
        "learner_name": learner.name,
        "course_id": course.id,
        "course_title": course.title,
    }


# =========================================================
# GET LEARNER COURSE ASSIGNMENTS
# =========================================================

@router.get("/learners/courses")
def get_learner_courses(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    assignments = (
        db.query(CourseAssignment)
        .join(
            User,
            CourseAssignment.user_id == User.id,
        )
        .join(
            Course,
            CourseAssignment.course_id == Course.id,
        )
        .filter(
            User.role == UserRole.LEARNER
        )
        .order_by(
            User.name,
            Course.title,
        )
        .all()
    )

    return [
        {
            "assignment_id": assignment.id,
            "learner_id": assignment.user_id,
            "learner_name": assignment.user.name,
            "learner_email": assignment.user.email,
            "course_id": assignment.course_id,
            "course_title": assignment.course.title,
            "course_description": assignment.course.description,
            "assigned_at": assignment.assigned_at,
        }
        for assignment in assignments
    ]


# =========================================================
# UPDATE LEARNER ACCESS
# =========================================================

@router.patch("/learners/{learner_id}/access")
def update_learner_access(
    learner_id: int,
    is_active: bool,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    learner = (
        db.query(User)
        .filter(
            User.id == learner_id,
            User.role == UserRole.LEARNER,
        )
        .first()
    )

    if learner is None:
        raise HTTPException(
            status_code=404,
            detail="Learner not found",
        )

    learner.is_active = is_active

    db.commit()
    db.refresh(learner)

    return {
        "id": learner.id,
        "name": learner.name,
        "email": learner.email,
        "role": learner.role,
        "is_active": learner.is_active,
    }

# =========================================================
# DELETE LEARNER
# =========================================================

@router.delete("/learners/{learner_id}")
def delete_learner(
    learner_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    learner = (
        db.query(User)
        .filter(
            User.id == learner_id,
            User.role == UserRole.LEARNER,
        )
        .first()
    )

    if learner is None:
        raise HTTPException(
            status_code=404,
            detail="Learner not found",
        )

    db.delete(learner)
    db.commit()

    return {
        "message": "Learner deleted successfully"
    }
    # =========================================================
# ADMIN PROGRESS
# =========================================================

from backend.app.models.module import Module
from backend.app.models.module_progress import ModuleProgress
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt


# =========================================================
# GET LEARNER PROGRESS
# =========================================================

@router.get("/progress")
def get_learner_progress(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # GET ALL LEARNERS
    # -----------------------------------------------------

    learners = (
        db.query(User)
        .filter(
            User.role == UserRole.LEARNER
        )
        .order_by(User.id)
        .all()
    )

    result = []

    # -----------------------------------------------------
    # BUILD PROGRESS FOR EACH LEARNER
    # -----------------------------------------------------

    for learner in learners:

        # -------------------------------------------------
        # GET ASSIGNED COURSES
        # -------------------------------------------------

        assignments = (
            db.query(CourseAssignment)
            .filter(
                CourseAssignment.user_id == learner.id
            )
            .all()
        )

        learner_courses = []

        # -------------------------------------------------
        # EACH ASSIGNED COURSE
        # -------------------------------------------------

        for assignment in assignments:

            course = (
                db.query(Course)
                .filter(
                    Course.id == assignment.course_id
                )
                .first()
            )

            if course is None:
                continue

            # ---------------------------------------------
            # GET COURSE MODULES
            # ---------------------------------------------

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

            module_results = []

            completed_modules = 0

            # ---------------------------------------------
            # EACH MODULE
            # ---------------------------------------------

            for module in modules:

                module_progress = (
                    db.query(ModuleProgress)
                    .filter(
                        ModuleProgress.user_id
                        == learner.id,
                        ModuleProgress.module_id
                        == module.id,
                    )
                    .first()
                )

                if module_progress is not None:
                    module_status = (
                        module_progress.status.value
                    )

                    completed_at = (
                        module_progress.completed_at
                    )
                else:
                    module_status = "pending"
                    completed_at = None

                if module_status == "completed":
                    completed_modules += 1

                # -----------------------------------------
                # GET QUIZ
                # -----------------------------------------

                quiz = (
                    db.query(Quiz)
                    .filter(
                        Quiz.module_id == module.id
                    )
                    .first()
                )

                quiz_results = []

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

                    for attempt in attempts:
                        quiz_results.append(
                            {
                                "attempt_id": attempt.id,
                                "quiz_id": attempt.quiz_id,
                                "quiz_title": quiz.title,
                                "score": attempt.score,
                                "passed": attempt.passed,
                                "passing_score": quiz.passing_score,
                                "attempted_at": attempt.attempted_at,
                            }
                        )

                module_results.append(
                    {
                        "module_id": module.id,
                        "module_title": module.title,
                        "display_order": module.display_order,
                        "status": module_status,
                        "completed_at": completed_at,
                        "quiz": (
                            {
                                "quiz_id": quiz.id,
                                "quiz_title": quiz.title,
                                "passing_score": quiz.passing_score,
                                "max_attempts": quiz.max_attempts,
                                "attempts": quiz_results,
                            }
                            if quiz is not None
                            else None
                        ),
                    }
                )

            # ---------------------------------------------
            # COURSE PROGRESS
            # ---------------------------------------------

            total_modules = len(modules)

            if total_modules > 0:
                progress_percentage = (
                    completed_modules
                    / total_modules
                ) * 100
            else:
                progress_percentage = 0

            learner_courses.append(
                {
                    "course_id": course.id,
                    "course_title": course.title,
                    "course_description": course.description,
                    "completed_modules": completed_modules,
                    "total_modules": total_modules,
                    "progress_percentage": progress_percentage,
                    "completed": (
                        total_modules > 0
                        and completed_modules
                        == total_modules
                    ),
                    "modules": module_results,
                }
            )

        # -------------------------------------------------
        # ADD LEARNER
        # -------------------------------------------------

        result.append(
            {
                "learner_id": learner.id,
                "learner_name": learner.name,
                "learner_email": learner.email,
                "is_active": learner.is_active,
                "courses": learner_courses,
            }
        )

    return result

# =========================================================
# GET ALL CERTIFICATES
# =========================================================

@router.get("/certificates")
def get_all_certificates(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    certificates = (
        db.query(Certificate, User)
        .join(
            User,
            Certificate.user_id == User.id,
        )
        .order_by(
            Certificate.completion_date.desc()
        )
        .all()
    )

    return [
        {
            "id": certificate.id,
            "certificate_number": certificate.certificate_number,
            "user_id": certificate.user_id,
            "learner_name": certificate.participant_name,
            "learner_email": user.email,
            "course_id": certificate.course_id,
            "course_name": certificate.course_name,
            "completion_date": certificate.completion_date,
            "final_score": certificate.final_score,
        }
        for certificate, user in certificates
    ]
