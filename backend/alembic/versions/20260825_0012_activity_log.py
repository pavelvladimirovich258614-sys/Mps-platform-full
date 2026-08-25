import sqlalchemy as sa
from alembic import op


revision = "20260825_0012"
down_revision = "20260824_0011"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "activity_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("reference_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "event_type IN ('post_published', 'comment_created', 'post_liked', 'user_followed')",
            name="activity_log_event_type",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id", "event_type", "reference_id", name="uq_activity_log_user_event_reference"
        ),
    )
    op.create_index(
        "ix_activity_log_user_created_at_id",
        "activity_log",
        ["user_id", "created_at", "id"],
    )

    op.execute(
        """
        INSERT INTO activity_log (user_id, event_type, reference_id, created_at)
        SELECT author_id, 'post_published', id, published_at
        FROM posts
        WHERE status IN ('PUBLISHED', 'published') AND published_at IS NOT NULL
        """
    )
    op.execute(
        """
        INSERT INTO activity_log (user_id, event_type, reference_id, created_at)
        SELECT user_id, 'comment_created', id, created_at
        FROM comments
        """
    )
    op.execute(
        """
        INSERT INTO activity_log (user_id, event_type, reference_id, created_at)
        SELECT user_id, 'post_liked', post_id, created_at
        FROM post_likes
        """
    )
    op.execute(
        """
        INSERT INTO activity_log (user_id, event_type, reference_id, created_at)
        SELECT follower_id, 'user_followed', following_id, created_at
        FROM user_follows
        """
    )


def downgrade():
    op.drop_index("ix_activity_log_user_created_at_id", table_name="activity_log")
    op.drop_table("activity_log")
