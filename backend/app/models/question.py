from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base
from backend.app.models.quiz import Quiz

if TYPE_CHECKING:
    from backend.app.models.answer import Answer


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)

    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id"),
        nullable=False,
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    display_order: Mapped[int] = mapped_column(
        nullable=False,
    )

    quiz: Mapped["Quiz"] = relationship(
        back_populates="questions",
    )

    answers: Mapped[list["Answer"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
    )