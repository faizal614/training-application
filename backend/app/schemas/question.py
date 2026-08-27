from pydantic import BaseModel

from backend.app.schemas.answer import AnswerResponse


class QuestionCreate(BaseModel):
    question_text: str
    display_order: int


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    display_order: int
    answers: list[AnswerResponse] = []

    model_config = {
        "from_attributes": True
    }