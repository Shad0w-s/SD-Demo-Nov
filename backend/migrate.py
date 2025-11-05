"""
Database migration script to create all tables
Run with: python migrate.py
"""
from models import BaseModel, engine, init_db
import sys

def migrate():
    """Create all database tables"""
    try:
        print("Creating database tables...")
        init_db()
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

if __name__ == '__main__':
    migrate()

