from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.database.base import Base

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_db_and_tables() -> None:
    from app.models import analysis  # noqa: F401

    Base.metadata.create_all(bind=engine)
    migrate_sqlite_schema()


def migrate_sqlite_schema() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "prompt_analyses" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("prompt_analyses")}
    with engine.begin() as connection:
        if "improved_prompt" not in columns:
            connection.execute(text("ALTER TABLE prompt_analyses ADD COLUMN improved_prompt TEXT NOT NULL DEFAULT ''"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()