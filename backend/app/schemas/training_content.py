from pydantic import BaseModel


# =========================================================
# CREATE TRAINING CONTENT
# =========================================================

class TrainingContentCreate(BaseModel):

    title: str | None = None

    description: str | None = None

    content_type: str

    video_url: str | None = None

    subtitle: str | None = None

    body: str | None = None

    display_order: int


# =========================================================
# UPDATE TRAINING CONTENT
# =========================================================

class TrainingContentUpdate(BaseModel):

    title: str | None = None

    description: str | None = None

    content_type: str

    video_url: str | None = None

    subtitle: str | None = None

    body: str | None = None

    display_order: int


# =========================================================
# RESPONSE
# =========================================================

class TrainingContentResponse(BaseModel):

    id: int

    module_id: int

    title: str | None = None

    description: str | None = None

    content_type: str

    video_url: str | None = None

    subtitle: str | None = None

    body: str | None = None

    display_order: int

    model_config = {
        "from_attributes": True
    }