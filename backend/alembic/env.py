from logging.config import fileConfig
import os
import sys

from dotenv import load_dotenv

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context


# =========================================================
# PROJECT ROOT
# =========================================================

sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
        )
    ),
)


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# ALEMBIC CONFIGURATION
# =========================================================

config = context.config


# =========================================================
# DATABASE URL
# =========================================================

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set"
    )

config.set_main_option(
    "sqlalchemy.url",
    database_url.replace(
        "%",
        "%%",
    ),
)


# =========================================================
# LOGGING
# =========================================================

if config.config_file_name is not None:
    fileConfig(
        config.config_file_name
    )


# =========================================================
# DATABASE BASE
# =========================================================

from backend.app.database import Base


# =========================================================
# IMPORT ALL MODELS
# =========================================================
# These imports are required so SQLAlchemy's metadata
# contains all tables when Alembic performs autogenerate.

from backend.app.models.user import User
from backend.app.models.course import Course
from backend.app.models.module import Module
from backend.app.models.training_content import TrainingContent
from backend.app.models.quiz import Quiz
from backend.app.models.question import Question
from backend.app.models.answer import Answer
from backend.app.models.course_assignment import CourseAssignment
from backend.app.models.module_progress import ModuleProgress
from backend.app.models.quiz_attempt import QuizAttempt
from backend.app.models.certificate import Certificate


# =========================================================
# TARGET METADATA
# =========================================================

target_metadata = Base.metadata


# =========================================================
# OFFLINE MIGRATIONS
# =========================================================

def run_migrations_offline() -> None:
    """
    Run migrations in offline mode.

    This generates SQL without creating a database
    connection.
    """

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


# =========================================================
# ONLINE MIGRATIONS
# =========================================================

def run_migrations_online() -> None:
    """
    Run migrations against the actual database.
    """

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {},
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# =========================================================
# RUN MIGRATIONS
# =========================================================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()