from pydantic import BaseModel


class AnswerCreate(BaseModel):
    answer_text: str
    is_correct: bool
    display_order: int


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    answer_text: str
    is_correct: bool
    display_order: int

    model_config = {
        "from_attributes": True
    }