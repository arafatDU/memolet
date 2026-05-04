"""fix_embedding_dim_384

Revision ID: d5646d7915c7
Revises: f139e6186032
Create Date: 2026-04-30 14:14:19.039627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'd5646d7915c7'
down_revision: Union[str, Sequence[str], None] = 'f139e6186032'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change embedding column from 1536 to 384 dims (all-MiniLM-L6-v2)."""
    op.alter_column(
        'memolets', 'embedding',
        existing_type=Vector(1536),
        type_=Vector(384),
        existing_nullable=True,
    )


def downgrade() -> None:
    """Revert embedding column back to 1536 dims."""
    op.alter_column(
        'memolets', 'embedding',
        existing_type=Vector(384),
        type_=Vector(1536),
        existing_nullable=True,
    )
