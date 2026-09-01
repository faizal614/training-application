from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base
from backend.app.models.course import Course
from backend.app.models.user import User


class CourseAssignment(Base):
    __tablename__ = "course_assignments"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"),
        nullable=False,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # =====================================================
    # COURSE DEADLINE
    # =====================================================

    deadline: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # =====================================================
    # DEADLINE REMINDER
    # =====================================================
    #
    # Stores when the 1-hour-before-deadline reminder
    # was sent.
    #
    # NULL = reminder has not been sent.
    #
    # This prevents the same learner from receiving
    # the same reminder repeatedly.
    #
    # =====================================================

    deadline_reminder_sent_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    user: Mapped["User"] = relationship(
        back_populates="course_assignments",
    )

    course: Mapped["Course"] = relationship(
        back_populates="assignments",
    )

    # =====================================================
    # CONSTRAINTS
    # =====================================================

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "course_id",
            name="uq_course_assignment_user_course",
        ),
    )