"""add fishka submission emoji and setting

Revision ID: 20260826_0014
Revises: 20260826_0013
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = "20260826_0014"
down_revision = "20260826_0013"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("posts", sa.Column("emoji", sa.String(length=32), nullable=True))
    settings = sa.table("settings", sa.column("key", sa.String), sa.column("value", sa.Text))
    op.bulk_insert(settings, [{"key": "fishka_submissions_enabled", "value": "false"}])


def downgrade():
    op.execute("DELETE FROM settings WHERE key = 'fishka_submissions_enabled'")
    op.drop_column("posts", "emoji")
