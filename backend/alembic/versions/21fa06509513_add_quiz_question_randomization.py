"""add quiz question randomization

Revision ID: 21fa06509513
Revises: 84a7333c6ff9
Create Date: 2026-09-01 10:54:56.192748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21fa06509513'
down_revision: Union[str, Sequence[str], None] = '84a7333c6ff9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'quizzes',
        sa.Column(
            'randomize_questions',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        'quizzes',
        'randomize_questions',
    )