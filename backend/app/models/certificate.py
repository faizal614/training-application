from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(primary_key=True)

    certificate_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"),
        nullable=False,
    )

    participant_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    course_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    completion_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    final_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )