from pydantic import BaseModel


class QuizAnswerSubmission(BaseModel):
    question_id: int
    answer_id: int


class QuizSubmission(BaseModel):
    answers: list[QuizAnswerSubmission]


class QuizResultResponse(BaseModel):
    score: float
    passed: bool
    passing_score: int