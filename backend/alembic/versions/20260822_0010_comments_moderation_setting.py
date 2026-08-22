import sqlalchemy as sa
from alembic import op


revision = "20260822_0010"
down_revision = "20260822_0009"
branch_labels = None
depends_on = None


def upgrade():
    settings = sa.table("settings", sa.column("key", sa.String), sa.column("value", sa.Text))
    op.bulk_insert(settings, [{"key": "comments_moderation_enabled", "value": "false"}])


def downgrade():
    op.execute("DELETE FROM settings WHERE key = 'comments_moderation_enabled'")
