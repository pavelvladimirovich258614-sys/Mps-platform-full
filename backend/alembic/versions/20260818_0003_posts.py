"""Create countries and posts.
Revision ID: 20260818_0003
Revises: 20260818_0002
"""
from alembic import op
import sqlalchemy as sa
revision="20260818_0003"; down_revision="20260818_0002"; branch_labels=None; depends_on=None
def upgrade():
    op.create_table("countries",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("name",sa.String(100),unique=True),sa.Column("flag_emoji",sa.String(8)),sa.Column("sort_order",sa.Integer()),sa.Column("is_active",sa.Boolean()))
    op.create_table("posts",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("type",sa.String(20)),sa.Column("title",sa.String(255)),sa.Column("slug",sa.String(300),unique=True),sa.Column("cover_url",sa.String(2048)),sa.Column("body",sa.Text()),sa.Column("excerpt",sa.Text()),sa.Column("author_id",sa.Integer(),sa.ForeignKey("users.id")),sa.Column("status",sa.String(20)),sa.Column("published_at",sa.DateTime(timezone=True)),sa.Column("views",sa.Integer()),sa.Column("likes_count",sa.Integer()),sa.Column("cta_enabled",sa.Boolean()),sa.Column("video_url",sa.String(2048)),sa.Column("hotel_name",sa.String(255)),sa.Column("country_id",sa.Integer(),sa.ForeignKey("countries.id")),sa.Column("shot_at",sa.Date()),sa.Column("by_request",sa.Boolean()))
    op.create_table("post_likes",sa.Column("post_id",sa.Integer(),sa.ForeignKey("posts.id",ondelete="CASCADE"),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id",ondelete="CASCADE"),primary_key=True),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now()))
    op.bulk_insert(sa.table("countries",sa.column("name"),sa.column("flag_emoji"),sa.column("sort_order"),sa.column("is_active")),[{"name":n,"flag_emoji":f,"sort_order":i,"is_active":True} for i,(n,f) in enumerate([("ОАЭ","🇦🇪"),("Турция","🇹🇷"),("Вьетнам","🇻🇳"),("Таиланд","🇹🇭"),("Китай","🇨🇳"),("Египет","🇪🇬"),("Мальдивы","🇲🇻"),("Россия","🇷🇺")])])
def downgrade(): op.drop_table("post_likes");op.drop_table("posts");op.drop_table("countries")
