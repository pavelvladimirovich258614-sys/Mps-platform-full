import sqlalchemy as sa
from alembic import op


revision = "20260820_0008"
down_revision = "20260818_0007"
branch_labels = None
depends_on = None


def upgrade():
    settings = sa.table("settings", sa.column("key", sa.String), sa.column("value", sa.Text))
    op.bulk_insert(settings, [
        {"key": "legal_name", "value": "ООО «Под солнцем»"},
        {"key": "legal_inn", "value": "7716593499"},
        {"key": "legal_ogrn", "value": "1077763465867"},
        {"key": "contact_address", "value": "г. Москва, ул. Марксистская, 5К1"},
        {"key": "contact_email", "value": "Coralclub5av@mail.ru"},
        {"key": "contact_phone", "value": "+7 (495) 21-21-421"},
    ])


def downgrade():
    op.execute("DELETE FROM settings WHERE key IN ('legal_name', 'legal_inn', 'legal_ogrn', 'contact_address', 'contact_email', 'contact_phone')")
