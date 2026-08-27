from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db
from backend.app.models.answer import Answer
from backend.app.models.module import Module
from backend.app.models.module_progress import (
    ModuleProgress,
    ModuleProgressStatus,
)
from backend.app.models.question import Question
from backend.app.models.quiz import Quiz
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.user import User
from backend.app.schemas.answer import (
    AnswerCreate,
    AnswerResponse,
)
from backend.app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
)
from backend.app.schemas.quiz import (
    QuizCreate,
    QuizResponse,
)
from backend.app.schemas.quiz_attempt import (
    QuizResultResponse,
    QuizSubmission,
)


router = APIRouter(
    prefix="/modules",
    tags=["Quizzes"],
)


# =========================================================
# CREATE QUIZ
# =========================================================

@router.post(
    "/{module_id}/quiz",
    response_model=QuizResponse,
)
def create_quiz(
    module_id: int,
    quiz_data: QuizCreate,
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

    existing_quiz = (
        db.query(Quiz)
        .filter(
            Quiz.module_id == module_id
        )
        .first()
    )

    if existing_quiz is not None:
        raise HTTPException(
            status_code=400,
            detail="Quiz already exists for this module",
        )

    if quiz_data.max_attempts < 1:
        raise HTTPException(
            status_code=400,
            detail="max_attempts must be at least 1",
        )

    if not 0 <= quiz_data.passing_score <= 100:
        raise HTTPException(
            status_code=400,
            detail="passing_score must be between 0 and 100",
        )

    quiz = Quiz(
        module_id=module_id,
        title=quiz_data.title,
        passing_score=quiz_data.passing_score,
        max_attempts=quiz_data.max_attempts,
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return quiz


# =========================================================
# GET MODULE QUIZ
# =========================================================

@router.get(
    "/{module_id}/quiz",
    response_model=QuizResponse,
)
def get_module_quiz(
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

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.module_id == module_id
        )
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    return quiz


# =========================================================
# CREATE QUESTION
# =========================================================

@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuestionResponse,
)
def create_question(
    quiz_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    question = Question(
        quiz_id=quiz_id,
        question_text=question_data.question_text,
        display_order=question_data.display_order,
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question


# =========================================================
# GET QUESTIONS
# =========================================================

@router.get(
    "/quizzes/{quiz_id}/questions",
    response_model=list[QuestionResponse],
)
def get_quiz_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    return (
        db.query(Question)
        .filter(
            Question.quiz_id == quiz_id
        )
        .order_by(
            Question.display_order
        )
        .all()
    )


# =========================================================
# CREATE ANSWER
# =========================================================

@router.post(
    "/questions/{question_id}/answers",
    response_model=AnswerResponse,
)
def create_answer(
    question_id: int,
    answer_data: AnswerCreate,
    db: Session = Depends(get_db),
):
    question = (
        db.query(Question)
        .filter(
            Question.id == question_id
        )
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    answer = Answer(
        question_id=question_id,
        answer_text=answer_data.answer_text,
        is_correct=answer_data.is_correct,
        display_order=answer_data.display_order,
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return answer


# =========================================================
# RESET QUIZ ATTEMPTS
# =========================================================

@router.post(
    "/{module_id}/quiz/reset",
)
def reset_quiz_attempts(
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

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.module_id == module_id
        )
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id
            == current_user.id,
            QuizAttempt.quiz_id
            == quiz.id,
        )
        .all()
    )

    for attempt in attempts:
        db.delete(attempt)

    module_progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id
            == current_user.id,
            ModuleProgress.module_id
            == module_id,
        )
        .first()
    )

    if module_progress is not None:
        module_progress.status = (
            ModuleProgressStatus.PENDING
        )

        module_progress.completed_at = None

    db.commit()

    return {
        "message": "Quiz attempts reset successfully",
        "attempts_remaining": quiz.max_attempts,
    }


# =========================================================
# SUBMIT QUIZ
# =========================================================

@router.post(
    "/quizzes/{quiz_id}/submit",
    response_model=QuizResultResponse,
)
def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    # -------------------------------------------------------
    # FIND QUIZ
    # -------------------------------------------------------

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id
        )
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    # -------------------------------------------------------
    # FIND MODULE
    # -------------------------------------------------------

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    if module is None:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    # -------------------------------------------------------
    # VALIDATE SUBMISSION
    # -------------------------------------------------------

    if not submission.answers:
        raise HTTPException(
            status_code=400,
            detail="At least one answer is required",
        )

    # -------------------------------------------------------
    # CHECK PREVIOUS ATTEMPTS
    # -------------------------------------------------------

    previous_attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id
            == current_user.id,
            QuizAttempt.quiz_id
            == quiz_id,
        )
        .count()
    )

    if previous_attempts >= quiz.max_attempts:
        raise HTTPException(
            status_code=400,
            detail=(
                "Maximum quiz attempts reached. "
                "Please redo the module."
            ),
        )

    # -------------------------------------------------------
    # CALCULATE SCORE
    # -------------------------------------------------------

    correct_answers = 0
    total_questions = len(
        submission.answers
    )

    for submitted_answer in (
        submission.answers
    ):

        question = (
            db.query(Question)
            .filter(
                Question.id
                == submitted_answer.question_id,
                Question.quiz_id
                == quiz_id,
            )
            .first()
        )

        if question is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Question does not belong "
                    "to this quiz"
                ),
            )

        answer = (
            db.query(Answer)
            .filter(
                Answer.id
                == submitted_answer.answer_id,
                Answer.question_id
                == submitted_answer.question_id,
            )
            .first()
        )

        if answer is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid answer submitted",
            )

        if answer.is_correct:
            correct_answers += 1

    # -------------------------------------------------------
    # SCORE
    # -------------------------------------------------------

    score = (
        correct_answers
        / total_questions
    ) * 100

    passed = (
        score >= quiz.passing_score
    )

    # -------------------------------------------------------
    # SAVE ATTEMPT
    # -------------------------------------------------------

    quiz_attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=round(score),
        passed=passed,
    )

    db.add(quiz_attempt)

    # -------------------------------------------------------
    # MODULE PROGRESS
    # -------------------------------------------------------

    module_id = quiz.module_id

    module_progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id
            == current_user.id,
            ModuleProgress.module_id
            == module_id,
        )
        .first()
    )

    if module_progress is None:

        module_progress = ModuleProgress(
            user_id=current_user.id,
            module_id=module_id,
            status=(
                ModuleProgressStatus.COMPLETED
                if passed
                else ModuleProgressStatus.PENDING
            ),
            completed_at=(
                datetime.utcnow()
                if passed
                else None
            ),
        )

        db.add(module_progress)

    elif passed:

        module_progress.status = (
            ModuleProgressStatus.COMPLETED
        )

        if (
            module_progress.completed_at
            is None
        ):
            module_progress.completed_at = (
                datetime.utcnow()
            )

    # -------------------------------------------------------
    # ATTEMPT INFORMATION
    # -------------------------------------------------------

    attempts_used = (
        previous_attempts + 1
    )

    attempts_remaining = max(
        quiz.max_attempts
        - attempts_used,
        0,
    )

    redo_required = (
        not passed
        and attempts_remaining == 0
    )

    # -------------------------------------------------------
    # DETERMINE LAST MODULE
    # -------------------------------------------------------

    total_modules = (
        db.query(Module)
        .filter(
            Module.course_id
            == module.course_id
        )
        .count()
    )
    is_last_module = (
        module.display_order
        == total_modules
    )

    # -------------------------------------------------------
    # SAVE
    # -------------------------------------------------------

    db.commit()

    # -------------------------------------------------------
    # RESPONSE
    # -------------------------------------------------------

    return QuizResultResponse(
        score=score,
        passed=passed,
        passing_score=quiz.passing_score,
        attempts_used=attempts_used,
        attempts_remaining=attempts_remaining,
        max_attempts=quiz.max_attempts,
        redo_required=redo_required,
        is_last_module=is_last_module,
    )