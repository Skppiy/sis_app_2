# backend/fix_academic_year_naming.py
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def fix_academic_year_naming():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db')
    async with engine.begin() as conn:
        try:
            # Rename the column from school_year_id to academic_year_id
            await conn.execute(text('ALTER TABLE enrollments RENAME COLUMN school_year_id TO academic_year_id'))
            print('✅ Renamed school_year_id to academic_year_id in database')
            
            # Verify the column was renamed
            result = await conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'enrollments' AND table_schema = 'public'
                AND column_name LIKE '%academic_year%'
            """))
            columns = [row[0] for row in result.fetchall()]
            print(f'✅ Academic year columns: {columns}')
            
        except Exception as e:
            print(f'Error: {e}')
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_academic_year_naming())