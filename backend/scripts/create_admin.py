import asyncio, uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from passlib.context import CryptContext

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

EMAIL = "admin@example.com"
PASSWORD = "ChangeMe123!"
FIRST = "Admin"
LAST = "User"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as s:
        res = await s.execute(text("SELECT id FROM users WHERE email=:e"), {"e": EMAIL})
        if res.first():
            print("Admin already exists."); return
        await s.execute(text("""
            INSERT INTO users (id, email, hashed_password, first_name, last_name, role, is_active, created_at, updated_at)
            VALUES (:id, :email, :hp, :first, :last, 'admin', true, NOW(), NOW())
        """), {
            "id": str(uuid.uuid4()),
            "email": EMAIL,
            "hp": pwd.hash(PASSWORD),
            "first": FIRST,
            "last": LAST
        })
        await s.commit()
        print("Admin created:", EMAIL)

if __name__ == "__main__":
    asyncio.run(main())
