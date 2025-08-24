import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from alembic import context
from sqlalchemy import create_engine, MetaData

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Create empty metadata for now - we'll define tables in migrations
target_metadata = MetaData()

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # Get database URL from alembic.ini or environment
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        # Fallback to hardcoded for now
        url = "postgresql://postgres:postgres@localhost:5433/sis_db"
    
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Get database URL from alembic.ini or environment
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        # Fallback to hardcoded for now
        url = "postgresql://postgres:postgres@localhost:5433/sis_db"
    
    connectable = create_engine(url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()