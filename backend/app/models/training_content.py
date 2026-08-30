from enum import Enum

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base
from backend.app.models.module import Module


class ContentType(str, Enum):
    TEXT = "text"
    VIDEO = "video"


class TrainingContent(Base):
    __tablename__ = "training_contents"

    # -----------------------------------------------------
    # DATABASE ID
    # -----------------------------------------------------

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    # -----------------------------------------------------
    # MODULE
    # -----------------------------------------------------

    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id"),
        nullable=False,
    )

    # -----------------------------------------------------
    # CONTENT TITLE
    # -----------------------------------------------------

    title: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    # -----------------------------------------------------
    # CONTENT DESCRIPTION
    # -----------------------------------------------------

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # CONTENT TYPE
    # -----------------------------------------------------

    content_type: Mapped[ContentType] = mapped_column(
        SQLEnum(ContentType),
        nullable=False,
    )

    # -----------------------------------------------------
    # SUBTITLE
    # -----------------------------------------------------

    subtitle: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    # -----------------------------------------------------
    # TEXT BODY
    # -----------------------------------------------------

    body: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # VIDEO URL
    # -----------------------------------------------------

    video_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # -----------------------------------------------------
    # DISPLAY ORDER
    # -----------------------------------------------------

    display_order: Mapped[int] = mapped_column(
        nullable=False,
    )

    # -----------------------------------------------------
    # MODULE RELATIONSHIP
    # -----------------------------------------------------

    module: Mapped["Module"] = relationship(
        back_populates="training_contents",
    )