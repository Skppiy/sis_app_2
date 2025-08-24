# backend/check_admin_user.py
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_admin_user():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5433/sis_db')
    async with engine.begin() as conn:
        try:
            # Check if admin user exists
            result = await conn.execute(text("""
                SELECT id, email, first_name, last_name, is_active
                FROM users 
                WHERE email = 'admin@springfield.edu'
            """))
            user = result.fetchone()
            
            if user:
                print(f"✅ Admin user found:")
                print(f"   ID: {user[0]}")
                print(f"   Email: {user[1]}")
                print(f"   Name: {user[2]} {user[3]}")
                print(f"   Active: {user[4]}")
                
                # Check user roles
                role_result = await conn.execute(text("""
                    SELECT role, school_id, is_active
                    FROM user_roles 
                    WHERE user_id = :user_id
                """), {"user_id": str(user[0])})
                roles = role_result.fetchall()
                
                print(f"   Roles ({len(roles)}):")
                for role in roles:
                    print(f"     - {role[0]} (School: {role[1]}, Active: {role[2]})")
                    
            else:
                print("❌ Admin user not found!")
                
                # Show all users
                all_users = await conn.execute(text("SELECT email, first_name, last_name FROM users"))
                users = all_users.fetchall()
                print(f"\nAll users in database ({len(users)}):")
                for u in users:
                    print(f"  - {u[0]} ({u[1]} {u[2]})")
                    
        except Exception as e:
            print(f"Error: {e}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_admin_user())