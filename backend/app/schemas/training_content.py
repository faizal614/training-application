from pydantic import BaseModel


class TrainingContentCreate(BaseModel):
    content_type: str
    video_url: str | None = None
    subtitle: str | None = None
    body: str | None = None
    display_order: int


class TrainingContentResponse(BaseModel):
    id: int
    module_id: int
    content_type: str
    video_url: str | None = None
    subtitle: str | None = None
    body: str | None = None
    display_order: int

    model_config = {
        "from_attributes": True
    }