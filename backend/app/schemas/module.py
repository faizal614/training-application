from pydantic import BaseModel


class ModuleCreate(BaseModel):
    title: str
    display_order: int


class ModuleResponse(BaseModel):
    id: int
    course_id: int
    title: str
    display_order: int

    model_config = {
        "from_attributes": True
    }