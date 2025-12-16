# restore_database.py
# Windmill Python script for database restoration
# Path: f/admin/restore_database
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - boto3

"""
Restore database from backup file.

WARNING: This is a destructive operation that will replace the current database.
Always verify the backup file before restoring.

The backup format uses PostgreSQL COPY commands:
  COPY tablename FROM stdin;
  [tab-separated data]
  \.

Args:
    backup_source: "local" or "s3"
    backup_filename: Name of the backup file to restore
    confirm_restore: Must be True to proceed (safety check)
    create_pre_restore_backup: Create a backup before restoring (recommended)

Returns:
    dict: Restore result with status and details
"""

import os
from datetime import datetime
import gzip
import io
import wmill
import psycopg2


def main(
    backup_filename: str,
    backup_source: str = "local",
    confirm_restore: bool = False,
    create_pre_restore_backup: bool = True
) -> dict:
    """Restore database from backup."""

    # Safety check
    if not confirm_restore:
        return {
            "status": "aborted",
            "error": "confirm_restore must be True to proceed. This is a destructive operation.",
            "backup_filename": backup_filename
        }

    # Get database connection
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    backup_dir = "/tmp/backups"
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    try:
        # Step 1: Get the backup file
        if backup_source == "s3":
            filepath = download_from_s3(backup_filename, backup_dir)
            if filepath is None:
                return {
                    "status": "error",
                    "error": "Failed to download backup from S3"
                }
        else:
            filepath = os.path.join(backup_dir, backup_filename)
            if not os.path.exists(filepath):
                # List available backups
                available = [f for f in os.listdir(backup_dir) if f.endswith('.sql.gz')]
                return {
                    "status": "error",
                    "error": f"Backup file not found: {backup_filename}",
                    "available_backups": available[:10]  # Show first 10
                }

        # Step 2: Create pre-restore backup using psycopg2
        pre_restore_backup = None
        if create_pre_restore_backup:
            pre_restore_result = create_backup_before_restore(postgres_db, backup_dir, timestamp)
            if pre_restore_result["status"] == "success":
                pre_restore_backup = pre_restore_result["filename"]
            else:
                return {
                    "status": "error",
                    "error": "Failed to create pre-restore backup",
                    "details": pre_restore_result
                }

        # Step 3: Read and decompress the backup
        with gzip.open(filepath, 'rt', encoding='utf-8') as f:
            sql_content = f.read()

        # Step 4: Connect to database
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        conn.autocommit = False
        cursor = conn.cursor()

        # Step 5: Parse and execute restore
        restore_stats = {
            "tables_truncated": [],
            "tables_restored": [],
            "rows_restored": {}
        }

        # Get list of existing tables
        cursor.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        existing_tables = [row[0] for row in cursor.fetchall()]

        # Parse the backup file
        lines = sql_content.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Look for COPY commands
            if line.startswith('COPY ') and 'FROM stdin' in line:
                # Parse table name: COPY tablename FROM stdin;
                parts = line.split()
                table_name = parts[1]

                # Truncate the table first if it exists
                if table_name in existing_tables:
                    cursor.execute(f"TRUNCATE TABLE {table_name} CASCADE")
                    restore_stats["tables_truncated"].append(table_name)

                # Collect data lines until we hit \.
                i += 1
                data_lines = []
                while i < len(lines) and lines[i] != '\\.':
                    data_lines.append(lines[i])
                    i += 1

                # Use COPY to load data
                if data_lines and table_name in existing_tables:
                    data_io = io.StringIO('\n'.join(data_lines))
                    try:
                        cursor.copy_from(data_io, table_name)
                        restore_stats["tables_restored"].append(table_name)
                        restore_stats["rows_restored"][table_name] = len(data_lines)
                    except Exception as e:
                        # Log error but continue
                        restore_stats["rows_restored"][table_name] = f"ERROR: {str(e)}"

            i += 1

        # Commit the transaction
        conn.commit()
        cursor.close()
        conn.close()

        # Step 6: Verify restore
        verify_result = verify_database(postgres_db)

        return {
            "status": "success",
            "restored_from": backup_filename,
            "pre_restore_backup": pre_restore_backup,
            "timestamp": timestamp,
            "restore_stats": restore_stats,
            "verification": verify_result
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "pre_restore_backup": pre_restore_backup if 'pre_restore_backup' in dir() else None
        }


def download_from_s3(filename: str, backup_dir: str) -> str | None:
    """Download backup from S3."""
    try:
        import boto3

        s3_config = wmill.get_resource("f/admin/s3_backup_config")
        s3_client = boto3.client(
            's3',
            aws_access_key_id=s3_config.get('access_key_id'),
            aws_secret_access_key=s3_config.get('secret_access_key'),
            region_name=s3_config.get('region', 'us-east-1')
        )

        bucket = s3_config['bucket']
        # Search in all backup type folders
        for backup_type in ['daily', 'weekly', 'monthly', 'manual']:
            key = f"backups/{backup_type}/{filename}"
            try:
                filepath = os.path.join(backup_dir, filename)
                s3_client.download_file(bucket, key, filepath)
                return filepath
            except Exception:
                continue

        return None
    except Exception:
        return None


def create_backup_before_restore(postgres_db: dict, backup_dir: str, timestamp: str) -> dict:
    """Create a backup before restoring using psycopg2 COPY."""
    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Get list of tables
        cursor.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        tables = [row[0] for row in cursor.fetchall()]

        # Build SQL backup
        sql_content = io.StringIO()
        sql_content.write(f"-- Family Brain Pre-Restore Backup\n")
        sql_content.write(f"-- Generated: {datetime.now().isoformat()}\n")
        sql_content.write(f"-- Database: {postgres_db['dbname']}\n\n")
        sql_content.write("SET statement_timeout = 0;\n")
        sql_content.write("SET client_encoding = 'UTF8';\n\n")

        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]

            sql_content.write(f"\n-- Table: {table} ({row_count} rows)\n")

            if row_count > 0:
                sql_content.write(f"COPY {table} FROM stdin;\n")
                output = io.StringIO()
                cursor.copy_to(output, table)
                output.seek(0)
                sql_content.write(output.read())
                sql_content.write("\\.\n")

        cursor.close()
        conn.close()

        # Write compressed backup
        filename = f"{postgres_db['dbname']}_pre_restore_{timestamp}.sql.gz"
        filepath = os.path.join(backup_dir, filename)

        sql_bytes = sql_content.getvalue().encode('utf-8')
        with gzip.open(filepath, 'wb') as f:
            f.write(sql_bytes)

        return {
            "status": "success",
            "filename": filename,
            "filepath": filepath
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}


def verify_database(postgres_db: dict) -> dict:
    """Verify database is accessible after restore."""
    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Check key tables exist and have data
        checks = {}

        tables_to_check = ['tenants', 'users', 'family_members', 'family_documents']
        for table in tables_to_check:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                checks[table] = {"exists": True, "row_count": count}
            except Exception as e:
                checks[table] = {"exists": False, "error": str(e)}

        cursor.close()
        conn.close()

        return {
            "status": "verified",
            "tables": checks
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
