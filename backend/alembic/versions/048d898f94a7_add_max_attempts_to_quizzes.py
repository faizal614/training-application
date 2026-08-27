"""add max attempts to quizzes

Revision ID: 048d898f94a7
Revises: a62d79f07e08
Create Date: 2026-08-27 16:30:43.340632

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "048d898f94a7"
down_revision: Union[str, Sequence[str], None] = "a62d79f07e08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add the column with a default value so existing rows
    # receive a valid value.
    op.add_column(
        "quizzes",
        sa.Column(
            "max_attempts",
            sa.Integer(),
            nullable=False,
            server_default="3",
        ),
    )

    # Remove the database-level default after existing rows
    # have been populated.
    op.alter_column(
        "quizzes",
        "max_attempts",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "quizzes",
        "max_attempts",
    )