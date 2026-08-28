"""Add ordered review photos.

Revision ID: 20260829_0018
Revises: 20260828_0017
"""

import sqlalchemy as sa
from alembic import op


revision = "20260829_0018"
down_revision = "20260828_0017"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "review_photos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("review_id", sa.Integer(), sa.ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.CheckConstraint("position >= 0 AND position <= 1", name="review_photos_position_range"),
        sa.UniqueConstraint("review_id", "position", name="uq_review_photos_review_position"),
    )
    op.execute(
        "INSERT INTO review_photos (review_id, url, position) "
        "SELECT id, photo_url, 0 FROM reviews WHERE photo_url IS NOT NULL"
    )


def downgrade():
    op.drop_table("review_photos")
