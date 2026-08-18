import sqlalchemy as sa
from alembic import op
revision="20260818_0007";down_revision="20260818_0006";branch_labels=None;depends_on=None
def upgrade():
 op.create_table("settings",sa.Column("key",sa.String(100),primary_key=True),sa.Column("value",sa.Text()))
 op.bulk_insert(sa.table("settings",sa.column("key"),sa.column("value")),[{"key":"irishka_delay_min","value":"30"},{"key":"irishka_enabled","value":"true"}])
 op.execute("INSERT INTO users (email, email_verified, name, role, is_anonymous, is_banned) VALUES ('irishka@system.local', true, 'Иришка · ИИ-помощник', 'editor', false, false)")
def downgrade():op.drop_table("settings")
