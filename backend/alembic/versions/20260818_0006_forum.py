import sqlalchemy as sa
from alembic import op
revision="20260818_0006";down_revision="20260818_0005";branch_labels=None;depends_on=None
def upgrade():
 op.create_table("forum_topics",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("country_id",sa.Integer(),sa.ForeignKey("countries.id")),sa.Column("author_id",sa.Integer(),sa.ForeignKey("users.id")),sa.Column("title",sa.String(255)),sa.Column("is_locked",sa.Boolean()),sa.Column("messages_count",sa.Integer()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()),sa.Column("last_message_at",sa.DateTime(timezone=True)))
 op.create_table("forum_messages",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("topic_id",sa.Integer(),sa.ForeignKey("forum_topics.id",ondelete="CASCADE")),sa.Column("author_id",sa.Integer(),sa.ForeignKey("users.id")),sa.Column("body",sa.Text()),sa.Column("is_ai",sa.Boolean()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
def downgrade():op.drop_table("forum_messages");op.drop_table("forum_topics")
