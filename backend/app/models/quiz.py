from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base
from backend.app.models.module import Module

if TYPE_CHECKING:
    from backend.app.models.question import Question
    from backend.app.models.quiz_attempt import QuizAttempt


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id"),
        nullable=False,
        unique=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    passing_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    max_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
    )

    randomize_questions: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    # -----------------------------------------------------
    # MODULE
    # -----------------------------------------------------

    module: Mapped["Module"] = relationship(
        back_populates="quiz",
    )

    # -----------------------------------------------------
    # QUESTIONS
    # -----------------------------------------------------

    questions: Mapped[list["Question"]] = relationship(
        back_populates="quiz",
        cascade="all, delete-orphan",
    )

    # -----------------------------------------------------
    # QUIZ ATTEMPTS
    # -----------------------------------------------------

    attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="quiz",
        cascade="all, delete-orphan",
    )