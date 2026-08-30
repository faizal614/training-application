from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


if TYPE_CHECKING:
    from backend.app.models.course_assignment import CourseAssignment
    from backend.app.models.module_progress import ModuleProgress
    from backend.app.models.quiz_attempt import QuizAttempt


class UserRole(str, Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    LEARNER = "learner"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.LEARNER,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # ---------------------------------------------------------
    # COURSE ASSIGNMENTS
    # ---------------------------------------------------------

    course_assignments: Mapped[
        list["CourseAssignment"]
    ] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # ---------------------------------------------------------
    # MODULE PROGRESS
    # ---------------------------------------------------------

    module_progress: Mapped[
        list["ModuleProgress"]
    ] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # ---------------------------------------------------------
    # QUIZ ATTEMPTS
    # ---------------------------------------------------------

    quiz_attempts: Mapped[
        list["QuizAttempt"]
    ] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )