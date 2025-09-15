#!/usr/bin/env python3
"""
Simple cleanup script to delete old classroom model data.
Testing environment only - no backup needed.
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def cleanup_old_data():
    """Delete all old classroom model data to start fresh with homeroom intelligence."""
    
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        try:
            print("Starting cleanup of old classroom model data...")
            
            # Step 1: Delete all existing enrollments
            result = await session.execute(text("DELETE FROM enrollments"))
            enrollments_deleted = result.rowcount
            print(f"   ✓ Deleted {enrollments_deleted} enrollment records")
            
            # Step 2: Delete all existing classrooms  
            result = await session.execute(text("DELETE FROM classrooms"))
            classrooms_deleted = result.rowcount
            print(f"   ✓ Deleted {classrooms_deleted} classroom records")
            
            # Step 3: Clean up any homeroom intelligence tables if they exist
            try:
                result = await session.execute(text("DELETE FROM teacher_subject_assignments"))
                assignments_deleted = result.rowcount
                print(f"   ✓ Deleted {assignments_deleted} teacher subject assignment records")
            except Exception:
                print("   ℹ No teacher_subject_assignments table found (expected)")
            
            try:
                result = await session.execute(text("DELETE FROM student_subject_enrollments"))
                subject_enrollments_deleted = result.rowcount
                print(f"   ✓ Deleted {subject_enrollments_deleted} student subject enrollment records")
            except Exception:
                print("   ℹ No student_subject_enrollments table found (expected)")
            
            # Commit all changes
            await session.commit()
            
            print("Cleanup completed successfully!")
            print("Ready to create new homeroom classrooms using homeroom intelligence system")
            
            return True
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error during cleanup: {str(e)}")
            return False
        finally:
            await engine.dispose()

async def verify_cleanup():
    """Verify that cleanup was successful."""
    
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        try:
            # Check enrollments
            result = await session.execute(text("SELECT COUNT(*) FROM enrollments"))
            enrollment_count = result.scalar()
            
            # Check classrooms
            result = await session.execute(text("SELECT COUNT(*) FROM classrooms"))
            classroom_count = result.scalar()
            
            print(f"📊 Post-cleanup verification:")
            print(f"   Enrollments remaining: {enrollment_count}")
            print(f"   Classrooms remaining: {classroom_count}")
            
            if enrollment_count == 0 and classroom_count == 0:
                print("✅ Cleanup verification successful - ready for new homeroom model!")
                return True
            else:
                print("⚠️  Some records remain - may need manual cleanup")
                return False
                
        except Exception as e:
            print(f"❌ Error during verification: {str(e)}")
            return False
        finally:
            await engine.dispose()

async def main():
    print("Old Classroom Model Cleanup Script")
    print("=====================================")
    
    if "--verify" in sys.argv:
        success = await verify_cleanup()
    else:
        success = await cleanup_old_data()
        if success:
            await verify_cleanup()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)