import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        # First, let's see what duplicates we have
        result = await session.execute(text("""
            SELECT user_id, role, school_id, COUNT(*) as count
            FROM user_roles 
            GROUP BY user_id, role, school_id
            HAVING COUNT(*) > 1
        """))
        
        duplicates = result.fetchall()
        if not duplicates:
            print("✅ No duplicate roles found!")
            return
        
        print(f"Found {len(duplicates)} duplicate role combinations:")
        for dup in duplicates:
            print(f"  User {dup[0]}: {dup[1]} at school {dup[2]} (count: {dup[3]})")
        
        # Remove duplicates by keeping only the first occurrence
        await session.execute(text("""
            DELETE FROM user_roles 
            WHERE (user_id, role, school_id) IN (
                SELECT user_id, role, school_id
                FROM (
                    SELECT user_id, role, school_id,
                           ROW_NUMBER() OVER (PARTITION BY user_id, role, school_id ORDER BY created_at) as rn
                    FROM user_roles
                ) t
                WHERE rn > 1
            )
        """))
        
        await session.commit()
        print("✅ Duplicate roles cleaned up!")

if __name__ == "__main__":
    asyncio.run(main())
