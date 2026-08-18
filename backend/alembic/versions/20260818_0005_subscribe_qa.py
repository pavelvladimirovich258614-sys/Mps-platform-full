import sqlalchemy as sa
from alembic import op
revision="20260818_0005";down_revision="20260818_0004";branch_labels=None;depends_on=None
def upgrade():
 op.create_table("subscriptions",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("email",sa.String(320),unique=True),sa.Column("confirmed",sa.Boolean()),sa.Column("confirm_token",sa.String(128),unique=True),sa.Column("unsub_token",sa.String(128),unique=True),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
 op.create_table("questions",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE")),sa.Column("target",sa.String(16)),sa.Column("body",sa.Text()),sa.Column("status",sa.String(16)),sa.Column("answer",sa.Text()),sa.Column("answered_by_name",sa.String(255)),sa.Column("tg_message_id",sa.Integer()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()),sa.Column("answered_at",sa.DateTime(timezone=True)))
def downgrade(): op.drop_table("questions");op.drop_table("subscriptions")
