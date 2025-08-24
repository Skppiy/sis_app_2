import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from passlib.context import CryptContext
import sys

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main(email: str, new_password: str):
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as s:
        res = await s.execute(text("SELECT id FROM users WHERE email=:e"), {"e": email})
        row = res.first()
        if not row:
            print(f"User not found: {email}")
            return
        await s.execute(
            text("UPDATE users SET hashed_password=:hp WHERE email=:e"),
            {"hp": pwd.hash(new_password), "e": email},
        )
        await s.commit()
        print(f"Password updated for {email}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/set_password.py <email> <new_password>")
    else:
        asyncio.run(main(sys.argv[1], sys.argv[2]))










