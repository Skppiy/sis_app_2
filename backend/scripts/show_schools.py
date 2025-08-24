import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as s:
        result = await s.execute(text("SELECT * FROM schools"))
        schools = result.fetchall()
        print("Current schools in database:")
        print("=" * 50)
        for school in schools:
            print(f"ID: {school.id}")
            print(f"Name: {school.name}")
            print(f"Address: {school.address}")
            print(f"City: {school.city}")
            print(f"State: {school.state}")
            print(f"Zip Code: {school.zip_code}")
            print(f"Timezone: {school.tz}")
            print("-" * 40)
        
        if not schools:
            print("No schools found in database")

if __name__ == "__main__":
    asyncio.run(main())
