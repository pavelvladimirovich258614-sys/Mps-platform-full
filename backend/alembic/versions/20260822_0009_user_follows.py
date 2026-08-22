import sqlalchemy as sa
from alembic import op


revision = "20260822_0009"
down_revision = "20260820_0008"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_follows",
        sa.Column("follower_id", sa.Integer(), nullable=False),
        sa.Column("following_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("follower_id <> following_id", name="user_follows_not_self"),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["following_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("follower_id", "following_id"),
    )
    op.create_index("ix_user_follows_following_id", "user_follows", ["following_id"])


def downgrade():
    op.drop_index("ix_user_follows_following_id", table_name="user_follows")
    op.drop_table("user_follows")
