import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        try:
            print("Deleting old classroom data...")
            
            # Delete enrollments first
            result = await session.execute(text("DELETE FROM enrollments"))
            print(f"Deleted {result.rowcount} enrollments")
            
            # Delete classroom teacher assignments
            result = await session.execute(text("DELETE FROM classroom_teacher_assignments"))
            print(f"Deleted {result.rowcount} classroom teacher assignments")
            
            # Delete classrooms
            result = await session.execute(text("DELETE FROM classrooms"))
            print(f"Deleted {result.rowcount} classrooms")
            
            await session.commit()
            print("Cleanup completed successfully!")
            
        except Exception as e:
            await session.rollback()
            print(f"Error: {str(e)}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())