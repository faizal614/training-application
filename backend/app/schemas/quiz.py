from pydantic import BaseModel


class QuizCreate(BaseModel):
    title: str
    passing_score: int
    max_attempts: int = 3


class QuizResponse(BaseModel):
    id: int
    module_id: int
    title: str
    passing_score: int
    max_attempts: int

    model_config = {
        "from_attributes": True
    }