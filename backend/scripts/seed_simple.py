# backend/scripts/seed_simple.py
"""
Simple seeding script that avoids import conflicts
"""

import asyncio
import sys
import os
import uuid
from datetime import date, datetime, timezone

# Add path without importing app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import only database and config, avoid app imports
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def seed_basic_data():
    """Seed basic data using raw SQL to avoid import conflicts"""
    engine = create_async_engine(DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        print("🌱 Starting basic data seeding...")
        
        # Check if data already exists
        result = await session.execute(text("SELECT COUNT(*) FROM schools"))
        school_count = result.scalar()
        
        if school_count > 0:
            print("✅ Data already exists, skipping seeding")
            return
        
        # 1. Create test school
        print("🏫 Creating Springfield Elementary...")
        school_id = str(uuid.uuid4())
        await session.execute(text("""
            INSERT INTO schools (id, name, address, city, state, zip_code, tz)
            VALUES (:id, 'Springfield Elementary', '123 Main Street', 'Springfield', 'IL', '62701', 'America/Chicago')
        """), {"id": school_id})
        
        # 2. Create academic year
        print("📅 Creating 2024-2025 academic year...")
        academic_year_id = str(uuid.uuid4())
        await session.execute(text("""
            INSERT INTO academic_years (id, name, short_name, start_date, end_date, is_active)
            VALUES (:id, '2024-2025', '24-25', '2024-08-15', '2025-06-15', true)
        """), {"id": academic_year_id})
        
        # 3. Create admin user
        print("👨‍💼 Creating admin user...")
        from app.security import get_password_hash
        admin_id = str(uuid.uuid4())
        hashed_password = get_password_hash("admin123")
        
        await session.execute(text("""
            INSERT INTO users (id, email, hashed_password, first_name, last_name, is_active, created_at, updated_at)
            VALUES (:id, 'admin@springfield.edu', :password, 'System', 'Administrator', true, :now, :now)
        """), {
            "id": admin_id,
            "password": hashed_password,
            "now": datetime.now(timezone.utc)
        })
        
        # 4. Create admin role
        await session.execute(text("""
            INSERT INTO user_roles (user_id, role, school_id, is_active)
            VALUES (:user_id, 'admin', :school_id, true)
        """), {"user_id": admin_id, "school_id": school_id})
        
        # 5. Create a few basic rooms
        print("🏫 Creating rooms...")
        rooms_data = [
            ("Room 101", "101", "CLASSROOM"),
            ("Room 102", "102", "CLASSROOM"),
            ("Art Room", "ART", "SPECIAL"),
            ("Gymnasium", "GYM", "SPECIAL")
        ]
        
        for name, code, room_type in rooms_data:
            room_id = str(uuid.uuid4())
            await session.execute(text("""
                INSERT INTO rooms (id, name, room_code, room_type, capacity, school_id, has_projector, has_computers, has_smartboard, has_sink, is_bookable, is_active)
                VALUES (:id, :name, :code, :type, 25, :school_id, false, false, false, false, true, true)
            """), {
                "id": room_id,
                "name": name,
                "code": code,
                "type": room_type,
                "school_id": school_id
            })
        
        await session.commit()
        
        print("\n📊 Seeding Summary:")
        print("   🏫 Schools: 1 (Springfield Elementary)")
        print("   📅 Academic Years: 1 (2024-2025)")
        print("   👥 Users: 1 (admin)")
        print("   🏫 Rooms: 4 basic rooms")
        print("\n🔐 Test Account:")
        print("   Admin: admin@springfield.edu / admin123")
        
        print("\n✅ Basic seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_basic_data())