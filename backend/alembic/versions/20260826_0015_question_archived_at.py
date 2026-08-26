"""add soft-archive timestamp to questions

Revision ID: 20260826_0015
Revises: 20260826_0014
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = "20260826_0015"
down_revision = "20260826_0014"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("questions", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("questions", "archived_at")
