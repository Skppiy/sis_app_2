import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        # Get admin user ID
        user_result = await session.execute(text("SELECT id FROM users WHERE email = 'admin@example.com'"))
        admin_user_id = user_result.scalar_one()
        
        if not admin_user_id:
            print("Admin user not found!")
            return
        
        # Remove the old 'admin' role, keep only 'admin_principal'
        await session.execute(text("""
            DELETE FROM user_roles 
            WHERE user_id = :user_id AND role = 'admin'
        """), {"user_id": str(admin_user_id)})
        
        await session.commit()
        print("✅ Removed duplicate 'admin' role, keeping 'admin_principal'")
        
        # Verify the result
        roles_result = await session.execute(text("""
            SELECT role, school_id, is_active
            FROM user_roles 
            WHERE user_id = :user_id
        """), {"user_id": str(admin_user_id)})
        
        roles = roles_result.fetchall()
        print(f"Admin user now has {len(roles)} role(s):")
        for role in roles:
            print(f"  - {role[0]} @ {role[1]} (Active: {role[2]})")

if __name__ == "__main__":
    asyncio.run(main())









