"""Create users.

Revision ID: 20260818_0002
Revises: 20260818_0001
"""
from alembic import op
import sqlalchemy as sa

revision = "20260818_0002"
down_revision = "20260818_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("tg_id", sa.BigInteger(), unique=True), sa.Column("email", sa.String(320), unique=True), sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"), sa.Column("name", sa.String(255), nullable=False, server_default=""), sa.Column("avatar_url", sa.String(2048)), sa.Column("bio", sa.Text()), sa.Column("role", sa.String(16), nullable=False, server_default="reader"), sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default="false"), sa.Column("is_banned", sa.Boolean(), nullable=False, server_default="false"), sa.Column("last_seen_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()), sa.CheckConstraint("tg_id IS NOT NULL OR email IS NOT NULL", name="users_identity_required"))


def downgrade() -> None:
    op.drop_table("users")
