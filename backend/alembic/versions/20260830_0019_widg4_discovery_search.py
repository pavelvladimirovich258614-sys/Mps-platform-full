"""Add PostgreSQL indexes for WIDG-4 discovery search."""

from alembic import op


revision = "20260830_0019"
down_revision = "20260829_0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        """
        CREATE INDEX ix_posts_discovery_search_fts
        ON posts USING gin (
            to_tsvector(
                'russian'::regconfig,
                coalesce(title, '') || ' ' || coalesce(body, '')
            )
        )
        """
    )
    op.execute(
        """
        CREATE INDEX ix_users_discovery_name_trgm
        ON users USING gin (name gin_trgm_ops)
        """
    )
    op.execute(
        """
        CREATE INDEX ix_forum_topics_discovery_title_trgm
        ON forum_topics USING gin (title gin_trgm_ops)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_forum_topics_discovery_title_trgm")
    op.execute("DROP INDEX IF EXISTS ix_users_discovery_name_trgm")
    op.execute("DROP INDEX IF EXISTS ix_posts_discovery_search_fts")
    # pg_trgm may be shared by later features, so downgrade intentionally retains it.
