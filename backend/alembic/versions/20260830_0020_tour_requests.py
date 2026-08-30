"""Create public tour requests.

Revision ID: 20260830_0020
Revises: 20260830_0019
"""

import sqlalchemy as sa
from alembic import op


revision = "20260830_0020"
down_revision = "20260830_0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tour_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("contact", sa.String(length=255), nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("budget", sa.String(length=100), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=16), server_default="NEW", nullable=False),
        sa.Column("tg_message_id", sa.Integer(), nullable=True),
        sa.Column("personal_data_consent", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('NEW', 'CONTACTED', 'CLOSED')",
            name="tour_requests_status_valid",
        ),
        sa.CheckConstraint(
            "personal_data_consent = true",
            name="tour_requests_personal_data_consent_required",
        ),
    )


def downgrade() -> None:
    op.drop_table("tour_requests")
