#!/usr/bin/env python3
"""
Run migration 006: Tenant Branding & Theming
"""

import psycopg2
import os

# Database connection
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "windmill",
    "user": "postgres",
    "password": "changeme",
}

MIGRATION_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "Infrastructure",
    "migrations",
    "006_tenant_branding.sql"
)


def run_migration():
    print(f"Running migration: {MIGRATION_FILE}")

    # Read migration SQL
    with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
        migration_sql = f.read()

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            # Check if migration already applied by checking if table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'tenant_branding'
                )
            """)
            exists = cur.fetchone()[0]

            if exists:
                print("Migration already applied (tenant_branding table exists)")
                print("Skipping...")
                return True

            print("Applying migration...")

            # Split by semicolons and execute each statement
            # This handles the migration better than executing all at once
            statements = migration_sql.split(';')

            for i, stmt in enumerate(statements):
                stmt = stmt.strip()
                if stmt and not stmt.startswith('--'):
                    try:
                        cur.execute(stmt)
                        print(f"  Statement {i+1}: OK")
                    except Exception as e:
                        # Some statements might fail if objects already exist
                        error_msg = str(e)
                        if "already exists" in error_msg:
                            print(f"  Statement {i+1}: Skipped (already exists)")
                        elif "does not exist" in error_msg and "DROP" in stmt.upper():
                            print(f"  Statement {i+1}: Skipped (doesn't exist)")
                        else:
                            print(f"  Statement {i+1}: ERROR - {e}")
                            raise

            conn.commit()
            print("\nMigration completed successfully!")
            return True

    except Exception as e:
        conn.rollback()
        print(f"\nMigration failed: {e}")
        return False

    finally:
        conn.close()


def verify_migration():
    """Verify the migration was applied correctly"""
    print("\nVerifying migration...")

    conn = psycopg2.connect(**DB_CONFIG)

    try:
        with conn.cursor() as cur:
            # Check tables
            tables = ['tenant_branding', 'system_branding', 'theme_presets']
            for table in tables:
                cur.execute(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = %s
                    )
                """, (table,))
                exists = cur.fetchone()[0]
                status = "OK" if exists else "MISSING"
                print(f"  Table {table}: {status}")

            # Check theme presets
            cur.execute("SELECT COUNT(*) FROM theme_presets")
            count = cur.fetchone()[0]
            print(f"  Theme presets: {count} records")

            # Check system branding
            cur.execute("SELECT COUNT(*) FROM system_branding")
            count = cur.fetchone()[0]
            print(f"  System branding: {count} records")

            # Check functions
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM pg_proc
                    WHERE proname = 'get_tenant_branding'
                )
            """)
            exists = cur.fetchone()[0]
            status = "OK" if exists else "MISSING"
            print(f"  Function get_tenant_branding: {status}")

    finally:
        conn.close()


if __name__ == "__main__":
    success = run_migration()
    if success:
        verify_migration()
