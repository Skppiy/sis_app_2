import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        # Check admin user
        result = await session.execute(text("SELECT id, email, first_name, last_name, is_active FROM users WHERE email = 'admin@example.com'"))
        admin_user = result.fetchone()
        
        if not admin_user:
            print("❌ Admin user not found!")
            return
        
        print(f"✅ Admin user found: {admin_user[1]} ({admin_user[2]} {admin_user[3]}) - Active: {admin_user[4]}")
        
        # Check user roles
        roles_result = await session.execute(text("""
            SELECT ur.role, ur.school_id, ur.is_active, s.name as school_name
            FROM user_roles ur
            LEFT JOIN schools s ON ur.school_id = s.id
            WHERE ur.user_id = :user_id
        """), {"user_id": str(admin_user[0])})
        
        roles = roles_result.fetchall()
        
        if not roles:
            print("❌ No roles found for admin user!")
            return
        
        print(f"✅ Found {len(roles)} role(s) for admin user:")
        for role in roles:
            print(f"  - {role[0]} at {role[3]} (Active: {role[2]})")
        
        # Check if any are admin roles
        admin_roles = [r for r in roles if 'admin' in r[0].lower()]
        if admin_roles:
            print("✅ Admin roles found!")
        else:
            print("❌ No admin roles found!")

if __name__ == "__main__":
    asyncio.run(main())









