import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db"

async def main():
    engine = create_async_engine(DATABASE_URL, future=True)
    Session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    async with Session() as session:
        # Simulate what the admin API does
        result = await session.execute(text("""
            SELECT u.id, u.email, u.first_name, u.last_name, u.is_active
            FROM users u
            ORDER BY u.last_name, u.first_name
        """))
        users = result.fetchall()
        
        print(f"Found {len(users)} users:")
        
        for user in users:
            print(f"\nUser: {user[2]} {user[3]} ({user[1]})")
            
            # Get roles for this user
            roles_result = await session.execute(text("""
                SELECT ur.role, ur.school_id, ur.is_active, s.name as school_name
                FROM user_roles ur
                LEFT JOIN schools s ON ur.school_id = s.id
                WHERE ur.user_id = :user_id
            """), {"user_id": str(user[0])})
            
            roles = roles_result.fetchall()
            print(f"  Roles ({len(roles)}):")
            for role in roles:
                print(f"    - {role[0]} @ {role[3]} (Active: {role[2]})")

if __name__ == "__main__":
    asyncio.run(main())










