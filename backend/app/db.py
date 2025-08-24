from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from .config import get_settings

class Base(DeclarativeBase):
    pass

_engine = None
_session_factory = None

def get_engine():
    global _engine, _session_factory
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(settings.database_url, future=True, echo=False)
    return _engine

def get_sessionmaker():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(bind=get_engine(), expire_on_commit=False, class_=AsyncSession)
    return _session_factory

async def get_session() -> AsyncSession:
    SessionLocal = get_sessionmaker()
    async with SessionLocal() as session:
        yield session
