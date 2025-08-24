import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from app.models.user_role import UserRole
from app.models.user import User
from app.models.school import School

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        # Get the admin user
        result = await session.execute(text("SELECT id FROM users WHERE email = 'admin@example.com'"))
        admin_user = result.scalar_one()
        
        if not admin_user:
            print("Admin user not found!")
            return
        
        # Get the first school
        school_result = await session.execute(text("SELECT id FROM schools LIMIT 1"))
        school = school_result.scalar_one()
        
        if not school:
            print("No schools found!")
            return
        
        # Check if admin role already exists
        existing_role = await session.execute(text("""
            SELECT user_id FROM user_roles 
            WHERE user_id = :user_id AND role = 'admin_principal' AND school_id = :school_id
        """), {"user_id": str(admin_user), "school_id": str(school)})
        
        if existing_role.scalar_one_or_none():
            print("Admin role already exists!")
            return
        
        # Create admin role
        await session.execute(text("""
            INSERT INTO user_roles (user_id, role, school_id, is_active, created_at, updated_at)
            VALUES (:user_id, 'admin_principal', :school_id, true, NOW(), NOW())
        """), {
            "user_id": str(admin_user),
            "school_id": str(school)
        })
        
        await session.commit()
        print(f"✅ Admin role created for user {admin_user} at school {school}")

if __name__ == "__main__":
    asyncio.run(main())


