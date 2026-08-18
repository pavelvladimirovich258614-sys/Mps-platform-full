"""Initialize the backend migration chain.

Revision ID: 20260818_0001
Revises:
Create Date: 2026-08-18 00:00:00
"""

from collections.abc import Sequence

revision: str = "20260818_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    return None


def downgrade() -> None:
    return None
