import sqlalchemy as sa
from alembic import op


revision = "20260826_0013"
down_revision = "20260825_0012"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_forum_topics_country_id_created_at_id",
        "forum_topics",
        ["country_id", sa.text("created_at DESC"), sa.text("id DESC")],
    )
    op.create_index("ix_forum_topics_author_id", "forum_topics", ["author_id"])
    op.create_index(
        "ix_forum_messages_topic_id_created_at_id",
        "forum_messages",
        ["topic_id", sa.text("created_at DESC"), sa.text("id DESC")],
    )


def downgrade():
    op.drop_index("ix_forum_messages_topic_id_created_at_id", table_name="forum_messages")
    op.drop_index("ix_forum_topics_author_id", table_name="forum_topics")
    op.drop_index("ix_forum_topics_country_id_created_at_id", table_name="forum_topics")
