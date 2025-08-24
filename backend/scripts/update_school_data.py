import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    async with Session() as s:
        # Update Springfield High School with city, state, zip_code
        result = await s.execute(text("""
            UPDATE schools 
            SET city = 'Springfield', 
                state = 'IL', 
                zip_code = '62701'
            WHERE name LIKE '%Springfield%'
            RETURNING name, city, state, zip_code
        """))
        updated_school = result.fetchone()
        await s.commit()
        
        if updated_school:
            print(f"✅ Updated: {updated_school.name}")
            print(f"   City: {updated_school.city}")
            print(f"   State: {updated_school.state}")  
            print(f"   Zip: {updated_school.zip_code}")
        else:
            print("❌ No schools were updated")

if __name__ == "__main__":
    asyncio.run(main())
