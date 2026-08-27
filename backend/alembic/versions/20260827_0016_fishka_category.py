"""add nullable fishka category

Revision ID: 20260827_0016
Revises: 20260826_0015
Create Date: 2026-08-27
"""

from alembic import op
import sqlalchemy as sa


revision = "20260827_0016"
down_revision = "20260826_0015"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("posts", sa.Column("category", sa.String(length=120), nullable=True))


def downgrade():
    op.drop_column("posts", "category")
