from datetime import datetime

from pydantic import BaseModel


class CertificateResponse(BaseModel):
    id: int
    certificate_number: str
    user_id: int
    course_id: int
    participant_name: str
    course_name: str
    completion_date: datetime
    final_score: int

    model_config = {
        "from_attributes": True
    }