# add_assigned_to_migration.py
# Windmill Python script to add assigned_to column for family member document assignment
# Path: f/migrations/add_assigned_to
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx


"""
Migration: Add assigned_to column to family_documents table

This enables documents to be assigned to specific family members for better
organization and filtering (e.g., "Mom's medical records", "Sarah's school docs").

The assigned_to field is optional (nullable) and references family_members.id.
"""

import wmill
import psycopg2


def main(dry_run: bool = True) -> dict:
    """
    Add assigned_to column to family_documents table.

    Args:
        dry_run: If True, only check what would be done without making changes

    Returns:
        dict with migration status
    """

    # Connect to database
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "disable")
        )

    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'family_documents'
            AND column_name = 'assigned_to'
        )
    """)
    column_exists = cursor.fetchone()[0]

    if column_exists:
        cursor.close()
        conn.close()
        return {
            "success": True,
            "message": "Column 'assigned_to' already exists in family_documents table",
            "skipped": True
        }

    # Check if family_members table exists (for the foreign key)
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'family_members'
        )
    """)
    family_members_exists = cursor.fetchone()[0]

    if not family_members_exists:
        cursor.close()
        conn.close()
        return {
            "success": False,
            "error": "family_members table does not exist - cannot create foreign key reference"
        }

    if dry_run:
        cursor.close()
        conn.close()
        return {
            "success": True,
            "message": "Dry run - would add: assigned_to UUID column with FK to family_members(id), plus index",
            "dry_run": True
        }

    # Run the migration
    # Note: family_members.id is INTEGER, not UUID
    migration_sql = """
    -- Add assigned_to column for family member document assignment
    ALTER TABLE family_documents
    ADD COLUMN assigned_to INTEGER REFERENCES family_members(id) ON DELETE SET NULL;

    -- Add index for efficient filtering by assigned family member
    CREATE INDEX IF NOT EXISTS idx_family_documents_assigned_to
    ON family_documents(assigned_to)
    WHERE assigned_to IS NOT NULL;

    -- Add composite index for tenant + assigned_to queries
    CREATE INDEX IF NOT EXISTS idx_family_documents_tenant_assigned
    ON family_documents(tenant_id, assigned_to)
    WHERE assigned_to IS NOT NULL;
    """

    try:
        cursor.execute(migration_sql)
        conn.commit()

        # Verify column was created
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'family_documents'
            AND column_name = 'assigned_to'
        """)
        result = cursor.fetchone()

        if result:
            return {
                "success": True,
                "message": "Migration completed successfully",
                "column_added": {
                    "name": result[0],
                    "type": result[1],
                    "nullable": result[2]
                }
            }
        else:
            return {
                "success": False,
                "error": "Column was not created for unknown reason"
            }

    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        cursor.close()
        conn.close()
