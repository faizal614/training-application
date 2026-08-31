from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.auth.authorization import (
    require_admin,
    require_instructor_or_admin,
)
from backend.app.auth.dependencies import get_current_user
from backend.app.database import get_db

from backend.app.models.answer import Answer
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
# UPDATE SCHEMAS
# =========================================================

class QuizUpdate(BaseModel):
    title: str
    passing_score: int
    max_attempts: int


class QuestionUpdate(BaseModel):
    question_text: str
    display_order: int


class AnswerUpdate(BaseModel):
    answer_text: str
    is_correct: bool
    display_order: int


# =========================================================
# ACCESS HELPER
# =========================================================

def check_module_access(
    module: Module,
    current_user: User,
    db: Session,
):
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

    return quiz


# =========================================================
# UPDATE QUIZ
# =========================================================

@router.put(
    "/quiz/{quiz_id}",
    response_model=QuizResponse,
)
def update_quiz(
    quiz_id: int,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
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

    check_module_access(
        module,
        current_user,
        db,
    )

    if not quiz_data.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Quiz title is required",
        )

    if not 0 <= quiz_data.passing_score <= 100:
        raise HTTPException(
            status_code=400,
            detail="passing_score must be between 0 and 100",
        )

    if quiz_data.max_attempts < 1:
        raise HTTPException(
            status_code=400,
            detail="max_attempts must be at least 1",
        )

    quiz.title = quiz_data.title.strip()
    quiz.passing_score = quiz_data.passing_score
    quiz.max_attempts = quiz_data.max_attempts

    db.commit()
    db.refresh(quiz)

    return quiz


# =========================================================
# DELETE QUIZ
# =========================================================

@router.delete(
    "/quiz/{quiz_id}",
)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
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

    check_module_access(
        module,
        current_user,
        db,
    )

    questions = (
        db.query(Question)
        .filter(
            Question.quiz_id == quiz_id
        )
        .all()
    )

    question_ids = [
        question.id
        for question in questions
    ]

    if question_ids:
        db.query(Answer).filter(
            Answer.question_id.in_(question_ids)
        ).delete(
            synchronize_session=False
        )

    db.query(Question).filter(
        Question.quiz_id == quiz_id
    ).delete(
        synchronize_session=False
    )

    db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id
    ).delete(
        synchronize_session=False
    )

    db.delete(quiz)

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete quiz",
        )

    return {
        "message": "Quiz deleted successfully",
        "quiz_id": quiz_id,
        "module_id": module.id,
    }


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
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
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

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    check_module_access(
        module,
        current_user,
        db,
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
# GET QUIZ QUESTIONS
# =========================================================

@router.get(
    "/quizzes/{quiz_id}/questions",
)
def get_quiz_questions(
    quiz_id: int,
    db: Session = Depends(get_db),
):
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

    questions = (
        db.query(Question)
        .filter(
            Question.quiz_id == quiz_id
        )
        .order_by(
            Question.display_order
        )
        .all()
    )

    result = []

    for question in questions:

        answers = (
            db.query(Answer)
            .filter(
                Answer.question_id == question.id
            )
            .order_by(
                Answer.display_order
            )
            .all()
        )

        result.append(
            {
                "id": question.id,
                "quiz_id": question.quiz_id,
                "question_text": question.question_text,
                "display_order": question.display_order,
                "answers": [
                    {
                        "id": answer.id,
                        "question_id": answer.question_id,
                        "answer_text": answer.answer_text,
                        "is_correct": bool(
                            answer.is_correct
                        ),
                        "display_order": answer.display_order,
                    }
                    for answer in answers
                ],
            }
        )

    return result


# =========================================================
# UPDATE QUESTION
# =========================================================

@router.put(
    "/questions/{question_id}",
    response_model=QuestionResponse,
)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
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

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == question.quiz_id
        )
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    check_module_access(
        module,
        current_user,
        db,
    )

    question.question_text = (
        question_data.question_text.strip()
    )

    question.display_order = (
        question_data.display_order
    )

    db.commit()
    db.refresh(question)

    return question


# =========================================================
# DELETE QUESTION
# =========================================================

@router.delete(
    "/questions/{question_id}",
)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
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

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == question.quiz_id
        )
        .first()
    )

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    check_module_access(
        module,
        current_user,
        db,
    )

    db.query(Answer).filter(
        Answer.question_id == question_id
    ).delete(
        synchronize_session=False
    )

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully",
        "question_id": question_id,
    }


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
    current_user: User = Depends(
        require_instructor_or_admin
    ),
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

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == question.quiz_id
        )
        .first()
    )

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    check_module_access(
        module,
        current_user,
        db,
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
# UPDATE ANSWER
# =========================================================

@router.put(
    "/answers/{answer_id}",
    response_model=AnswerResponse,
)
def update_answer(
    answer_id: int,
    answer_data: AnswerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
    answer = (
        db.query(Answer)
        .filter(
            Answer.id == answer_id
        )
        .first()
    )

    if answer is None:
        raise HTTPException(
            status_code=404,
            detail="Answer not found",
        )

    question = (
        db.query(Question)
        .filter(
            Question.id == answer.question_id
        )
        .first()
    )

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == question.quiz_id
        )
        .first()
    )

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    check_module_access(
        module,
        current_user,
        db,
    )

    answer.answer_text = (
        answer_data.answer_text.strip()
    )

    answer.is_correct = (
        answer_data.is_correct
    )

    answer.display_order = (
        answer_data.display_order
    )

    db.commit()
    db.refresh(answer)

    return answer


# =========================================================
# DELETE ANSWER
# =========================================================

@router.delete(
    "/answers/{answer_id}",
)
def delete_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_instructor_or_admin
    ),
):
    answer = (
        db.query(Answer)
        .filter(
            Answer.id == answer_id
        )
        .first()
    )

    if answer is None:
        raise HTTPException(
            status_code=404,
            detail="Answer not found",
        )

    question = (
        db.query(Question)
        .filter(
            Question.id == answer.question_id
        )
        .first()
    )

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == question.quiz_id
        )
        .first()
    )

    module = (
        db.query(Module)
        .filter(
            Module.id == quiz.module_id
        )
        .first()
    )

    check_module_access(
        module,
        current_user,
        db,
    )

    db.delete(answer)
    db.commit()

    return {
        "message": "Answer deleted successfully",
        "answer_id": answer_id,
    }


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

    if not submission.answers:
        raise HTTPException(
            status_code=400,
            detail="At least one answer is required",
        )

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

    correct_answers = 0

    total_questions = len(
        submission.answers
    )

    for submitted_answer in submission.answers:

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

    score = (
        correct_answers
        / total_questions
    ) * 100

    passed = (
        score >= quiz.passing_score
    )

    quiz_attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=round(score),
        passed=passed,
    )

    db.add(quiz_attempt)

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

        if module_progress.completed_at is None:
            module_progress.completed_at = (
                datetime.utcnow()
            )

    attempts_used = previous_attempts + 1

    attempts_remaining = max(
        quiz.max_attempts
        - attempts_used,
        0,
    )

    redo_required = (
        not passed
        and attempts_remaining == 0
    )

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

    db.commit()

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