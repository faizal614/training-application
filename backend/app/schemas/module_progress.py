from datetime import datetime

from pydantic import BaseModel

from backend.app.models.module_progress import ModuleProgressStatus


class ModuleProgressResponse(BaseModel):
    user_id: int
    module_id: int
    status: ModuleProgressStatus
    completed_at: datetime | None = None

    model_config = {
        "from_attributes": True
    }