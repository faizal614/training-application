from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base

if TYPE_CHECKING:
    from backend.app.models.module import Module
    from backend.app.models.user import User


class ModuleProgressStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class ModuleProgress(Base):
    __tablename__ = "module_progress"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id"),
        nullable=False,
    )

    status: Mapped[ModuleProgressStatus] = mapped_column(
        SQLEnum(ModuleProgressStatus),
        nullable=False,
        default=ModuleProgressStatus.PENDING,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "module_id",
            name="uq_module_progress_user_module",
        ),
    )

    user: Mapped["User"] = relationship(
        back_populates="module_progress",
    )

    module: Mapped["Module"] = relationship(
        back_populates="progress",
    )
