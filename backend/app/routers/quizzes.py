from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.module import Module
from backend.app.models.quiz import Quiz
from backend.app.models.question import Question
from backend.app.models.answer import Answer

from backend.app.schemas.quiz import QuizCreate, QuizResponse
from backend.app.schemas.question import QuestionCreate, QuestionResponse
from backend.app.schemas.answer import AnswerCreate, AnswerResponse
from backend.app.schemas.quiz_attempt import (
    QuizSubmission,
    QuizResultResponse,
)
from datetime import datetime

from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.module_progress import (
    ModuleProgress,
    ModuleProgressStatus,
)

router = APIRouter(
    prefix="/modules",
    tags=["Quizzes"],
)


# -------------------------
# QUIZ
# -------------------------

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
        .filter(Quiz.module_id == module_id)
        .first()
    )

    if existing_quiz is not None:
        raise HTTPException(
            status_code=400,
            detail="Quiz already exists for this module",
        )

    quiz = Quiz(
        module_id=module_id,
        title=quiz_data.title,
        passing_score=quiz_data.passing_score,
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return quiz


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
        .filter(Quiz.module_id == module_id)
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    return quiz


# -------------------------
# QUESTIONS
# -------------------------

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
        .filter(Question.quiz_id == quiz_id)
        .order_by(Question.display_order)
        .all()
    )


# -------------------------
# ANSWERS
# -------------------------

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
        .filter(Question.id == question_id)
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


# -------------------------
# QUIZ SUBMISSION
# -------------------------

@router.post(
    "/quizzes/{quiz_id}/submit",
    response_model=QuizResultResponse,
)
def submit_quiz(
    quiz_id: int,
    user_id: int,
    submission: QuizSubmission,
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

    if not submission.answers:
        raise HTTPException(
            status_code=400,
            detail="At least one answer is required",
        )

    correct_answers = 0
    total_questions = len(submission.answers)

    for submitted_answer in submission.answers:
        answer = (
            db.query(Answer)
            .filter(
                Answer.id == submitted_answer.answer_id,
                Answer.question_id == submitted_answer.question_id,
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

    score = (correct_answers / total_questions) * 100
    passed = score >= quiz.passing_score

    # Save the quiz attempt
    quiz_attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz_id,
        score=round(score),
        passed=passed,
    )

    db.add(quiz_attempt)

    # Find the module associated with this quiz
    module_id = quiz.module_id

    module_progress = (
        db.query(ModuleProgress)
        .filter(
            ModuleProgress.user_id == user_id,
            ModuleProgress.module_id == module_id,
        )
        .first()
    )

    if module_progress is None:
        module_progress = ModuleProgress(
            user_id=user_id,
            module_id=module_id,
            status=(
                ModuleProgressStatus.COMPLETED
                if passed
                else ModuleProgressStatus.PENDING
            ),
            completed_at=datetime.utcnow() if passed else None,
        )

        db.add(module_progress)

    elif passed:
        module_progress.status = ModuleProgressStatus.COMPLETED
        module_progress.completed_at = datetime.utcnow()

    db.commit()

    return QuizResultResponse(
        score=score,
        passed=passed,
        passing_score=quiz.passing_score,
    )