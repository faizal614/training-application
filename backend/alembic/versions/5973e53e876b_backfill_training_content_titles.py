"""backfill training content titles

Revision ID: backfill_content_titles
Revises: 75becadfce9a
Create Date: 2026-08-28
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "backfill_content_titles"
down_revision: Union[str, Sequence[str], None] = "75becadfce9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Move existing subtitle values into title.

    Existing records were created before title/description
    were introduced, so their old title-like value is stored
    in subtitle.
    """

    op.execute(
        """
        UPDATE training_contents
        SET title = subtitle
        WHERE title IS NULL
          AND subtitle IS NOT NULL
          AND TRIM(subtitle) <> ''
        """
    )


def downgrade() -> None:
    """
    Do not remove the migrated title values automatically.
    """

    pass