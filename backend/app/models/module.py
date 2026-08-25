from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base
from backend.app.models.course import Course
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from backend.app.models.course import Course
    from backend.app.models.quiz import Quiz
    from backend.app.models.training_content import TrainingContent
    from backend.app.models.module_progress import ModuleProgress

class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True)

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    display_order: Mapped[int] = mapped_column(
        nullable=False,
    )

    course: Mapped["Course"] = relationship(
        back_populates="modules",
    )

    training_contents: Mapped[list["TrainingContent"]] = relationship(
        back_populates="module",
    )
    __tablename__ = "modules"

    quiz: Mapped["Quiz | None"] = relationship(
    back_populates="module",
)

    id: Mapped[int] = mapped_column(primary_key=True)

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    display_order: Mapped[int] = mapped_column(
        nullable=False,
    )

    course: Mapped["Course"] = relationship(
        back_populates="modules",
    )
    
    progress: Mapped[list["ModuleProgress"]] = relationship(
    back_populates="module",
)