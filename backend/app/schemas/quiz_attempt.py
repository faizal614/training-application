from pydantic import BaseModel


# =========================================================
# QUIZ SUBMISSION
# =========================================================

class QuizAnswerSubmission(BaseModel):
    question_id: int
    answer_id: int


class QuizSubmission(BaseModel):
    answers: list[QuizAnswerSubmission]


# =========================================================
# QUIZ RESULT
# =========================================================

class QuizResultResponse(BaseModel):
    score: float
    passed: bool
    passing_score: float

    attempts_used: int
    attempts_remaining: int
    max_attempts: int

    redo_required: bool

    is_last_module: bool