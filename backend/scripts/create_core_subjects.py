"""
Step 1: Create Core Subjects with Homeroom Intelligence
This script creates the standard subjects needed for classroom creation
and sets up the foundation for homeroom auto-assignment
"""

import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def create_core_subjects():
    engine = create_async_engine(DATABASE_URL)
    
    async with AsyncSession(engine) as session:
        print("📖 Creating core subjects with homeroom intelligence...")
        
        # Check if subjects already exist
        result = await session.execute(text("SELECT COUNT(*) FROM subjects"))
        existing_count = result.scalar()
        
        if existing_count > 0:
            print(f"✅ Found {existing_count} existing subjects. Checking for missing core subjects...")
        
        # Core subjects for homeroom auto-assignment
        core_subjects = [
            {
                "name": "Mathematics", 
                "code": "MATH", 
                "type": "CORE",
                "homeroom_default": True,
                "description": "Core mathematics curriculum"
            },
            {
                "name": "English Language Arts", 
                "code": "ELA", 
                "type": "CORE",
                "homeroom_default": True,
                "description": "Reading, writing, and language skills"
            },
            {
                "name": "Science", 
                "code": "SCI", 
                "type": "CORE",
                "homeroom_default": True,
                "description": "Elementary and middle school science"
            },
            {
                "name": "Social Studies", 
                "code": "SS", 
                "type": "CORE",
                "homeroom_default": True,
                "description": "History, geography, and social sciences"
            },
            {
                "name": "Reading", 
                "code": "READ", 
                "type": "CORE",
                "homeroom_default": True,
                "description": "Reading comprehension and literacy"
            },
        ]
        
        # Enrichment subjects (require specialist teachers)
        enrichment_subjects = [
            {
                "name": "Art", 
                "code": "ART", 
                "type": "ENRICHMENT",
                "specialist_required": True,
                "description": "Visual arts and creative expression"
            },
            {
                "name": "Physical Education", 
                "code": "PE", 
                "type": "ENRICHMENT",
                "specialist_required": True,
                "description": "Physical fitness and sports"
            },
            {
                "name": "Music", 
                "code": "MUS", 
                "type": "ENRICHMENT",
                "specialist_required": True,
                "description": "Music education and performance"
            },
            {
                "name": "Library", 
                "code": "LIB", 
                "type": "ENRICHMENT",
                "specialist_required": True,
                "description": "Information literacy and research skills"
            },
        ]
        
        # Special services subjects
        special_subjects = [
            {
                "name": "Speech Therapy", 
                "code": "SPEECH", 
                "type": "SPECIAL",
                "specialist_required": True,
                "description": "Speech and language therapy"
            },
            {
                "name": "Reading Support", 
                "code": "READ_SUPP", 
                "type": "SPECIAL",
                "specialist_required": True,
                "description": "Additional reading support services"
            },
            {
                "name": "Math Support", 
                "code": "MATH_SUPP", 
                "type": "SPECIAL",
                "specialist_required": True,
                "description": "Additional mathematics support"
            },
        ]
        
        all_subjects = core_subjects + enrichment_subjects + special_subjects
        created_count = 0
        
        for subject_data in all_subjects:
            # Check if subject already exists
            existing = await session.execute(text("""
                SELECT id FROM subjects WHERE code = :code
            """), {"code": subject_data["code"]})
            
            if existing.scalar_one_or_none():
                print(f"   ⏭️  Subject {subject_data['name']} ({subject_data['code']}) already exists")
                continue
            
            subject_id = str(uuid.uuid4())
            
            await session.execute(text("""
                INSERT INTO subjects (
                    id, name, code, subject_type, 
                    applies_to_elementary, applies_to_middle,
                    is_homeroom_default, requires_specialist, 
                    allows_cross_grade, is_system_core, created_by_admin
                ) VALUES (
                    :id, :name, :code, :subject_type,
                    :elementary, :middle,
                    :homeroom_default, :requires_specialist,
                    :allows_cross_grade, :is_system_core, :created_by_admin
                )
            """), {
                "id": subject_id,
                "name": subject_data["name"],
                "code": subject_data["code"],
                "subject_type": subject_data["type"],
                "elementary": True,  # All subjects apply to elementary
                "middle": True,      # All subjects apply to middle school
                "homeroom_default": subject_data.get("homeroom_default", False),
                "requires_specialist": subject_data.get("specialist_required", False),
                "allows_cross_grade": subject_data.get("cross_grade", False),
                "is_system_core": True,  # Mark as system-created
                "created_by_admin": False  # System-created, not admin-created
            })
            
            print(f"   ✅ Created: {subject_data['name']} ({subject_data['code']}) - {subject_data['type']}")
            created_count += 1
        
        await session.commit()
        
        # Verify subjects were created
        final_result = await session.execute(text("SELECT COUNT(*) FROM subjects"))
        final_count = final_result.scalar()
        
        print(f"\n🎉 Subject creation complete!")
        print(f"   📊 Total subjects in system: {final_count}")
        print(f"   ✨ Subjects created this run: {created_count}")
        
        # Show core subjects for homeroom assignment
        core_result = await session.execute(text("""
            SELECT name, code FROM subjects 
            WHERE is_homeroom_default = true 
            ORDER BY name
        """))
        core_subjects_list = core_result.fetchall()
        
        print(f"\n🏫 Core subjects for homeroom auto-assignment:")
        for subject in core_subjects_list:
            print(f"   📚 {subject.name} ({subject.code})")
        
        print(f"\n🔧 Next steps:")
        print(f"   1. Test classroom creation in admin panel")
        print(f"   2. Verify subject dropdown is populated")
        print(f"   3. Create test classrooms with teachers and rooms")

if __name__ == "__main__":
    asyncio.run(create_core_subjects())