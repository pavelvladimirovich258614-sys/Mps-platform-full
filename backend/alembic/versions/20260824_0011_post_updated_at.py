import sqlalchemy as sa
from alembic import op


revision = "20260824_0011"
down_revision = "20260822_0010"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("posts", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))


def downgrade():
    op.drop_column("posts", "updated_at")
