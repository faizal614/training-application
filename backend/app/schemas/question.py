from pydantic import BaseModel


class QuestionCreate(BaseModel):
    question_text: str
    display_order: int


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    display_order: int

    model_config = {
        "from_attributes": True
    }