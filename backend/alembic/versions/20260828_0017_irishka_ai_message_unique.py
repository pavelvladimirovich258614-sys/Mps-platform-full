"""allow only one Иришка message per forum topic

Revision ID: 20260828_0017
Revises: 20260827_0016
Create Date: 2026-08-28
"""

from alembic import op
import sqlalchemy as sa


revision = "20260828_0017"
down_revision = "20260827_0016"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "uq_forum_messages_one_ai_per_topic",
        "forum_messages",
        ["topic_id"],
        unique=True,
        postgresql_where=sa.text("is_ai IS TRUE"),
        sqlite_where=sa.text("is_ai = 1"),
    )


def downgrade():
    op.drop_index(
        "uq_forum_messages_one_ai_per_topic",
        table_name="forum_messages",
    )
