import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def add_school_year_column():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db')
    async with engine.begin() as conn:
        try:
            # Add school_year_id column that references academic_years
            await conn.execute(text('ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS school_year_id UUID'))
            print('✅ Added school_year_id column to enrollments table')
            
            # Add foreign key constraint (without IF NOT EXISTS)
            try:
                await conn.execute(text('''
                    ALTER TABLE enrollments 
                    ADD CONSTRAINT fk_enrollments_academic_year 
                    FOREIGN KEY (school_year_id) REFERENCES academic_years(id)
                '''))
                print('✅ Added foreign key constraint to academic_years')
            except Exception as fk_error:
                if "already exists" in str(fk_error):
                    print('⚠️  Foreign key constraint already exists')
                else:
                    print(f'⚠️  Foreign key error: {fk_error}')
            
            # Verify columns
            result = await conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'enrollments' AND table_schema = 'public'
                ORDER BY column_name
            """))
            columns = [row[0] for row in result.fetchall()]
            print(f'Updated columns: {columns}')
            
        except Exception as e:
            print(f'Error: {e}')
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_school_year_column())