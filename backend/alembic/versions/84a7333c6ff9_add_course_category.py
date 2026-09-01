"""add course category

Revision ID: 84a7333c6ff9
Revises: backfill_content_titles
Create Date: 2026-09-01 09:49:30.649506

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "84a7333c6ff9"
down_revision: Union[str, Sequence[str], None] = "backfill_content_titles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add the column temporarily as nullable so existing
    # courses can receive a category.
    op.add_column(
        "courses",
        sa.Column(
            "category",
            sa.String(length=100),
            nullable=True,
        ),
    )

    # Give existing courses a safe default category.
    op.execute(
        """
        UPDATE courses
        SET category = 'General'
        WHERE category IS NULL
        """
    )

    # Make the column required after existing rows
    # have been populated.
    op.alter_column(
        "courses",
        "category",
        existing_type=sa.String(length=100),
        nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "courses",
        "category",
    )