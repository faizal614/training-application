from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base
from backend.app.models.question import Question


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id"),
        nullable=False,
    )

    answer_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_correct: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    display_order: Mapped[int] = mapped_column(
        nullable=False,
    )

    question: Mapped["Question"] = relationship(
        back_populates="answers",
    )