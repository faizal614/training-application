from pydantic import BaseModel


class CourseCreate(BaseModel):
    title: str
    description: str | None = None
    category: str = "General"


class CourseResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    category: str

    model_config = {
        "from_attributes": True
    }