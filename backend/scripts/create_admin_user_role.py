import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

ADMIN_EMAIL = "admin@example.com"
ROLE = "admin_principal"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as s:
        u = (await s.execute(text("SELECT id FROM users WHERE email=:e"), {"e": ADMIN_EMAIL})).scalar_one_or_none()
        if not u:
            print("Admin user not found; create user first.")
            return
        school = (await s.execute(text("SELECT id FROM schools LIMIT 1"))).scalar_one_or_none()
        if not school:
            print("No school found; create a school first.")
            return
        exists = (await s.execute(text("""
            SELECT 1 FROM user_roles WHERE user_id=:u AND role=:r AND school_id=:s
        """), {"u": str(u), "r": ROLE, "s": str(school)})).first()
        if exists:
            print("Admin role already exists.")
            return
        await s.execute(text("""
            INSERT INTO user_roles (user_id, role, school_id, is_active, created_at, updated_at)
            VALUES (:u, :r, :s, true, NOW(), NOW())
        """), {"u": str(u), "r": ROLE, "s": str(school)})
        await s.commit()
        print("Admin role created.")

if __name__ == "__main__":
    asyncio.run(main())











