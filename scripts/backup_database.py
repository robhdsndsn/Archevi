# backup_database.py
# Windmill Python script for automated PostgreSQL backups
# Path: f/admin/backup_database
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - boto3

"""
Automated database backup with retention policy.

Creates SQL backups using psycopg2 and stores them locally with optional S3 upload.
Implements retention policy:
- Daily backups: Keep last 7 days
- Weekly backups: Keep last 4 weeks (Sundays)
- Monthly backups: Keep last 12 months (1st of month)

Args:
    backup_type: "daily", "weekly", "monthly", or "manual"
    upload_to_s3: Whether to upload to S3 (requires s3_config resource)
    cleanup_old: Whether to cleanup old backups based on retention policy

Returns:
    dict: Backup result with filename, size, and status
"""

import os
from datetime import datetime, timedelta
import wmill
import gzip
import io
import psycopg2


def main(
    backup_type: str = "daily",
    upload_to_s3: bool = False,
    cleanup_old: bool = True,
    dry_run: bool = False
) -> dict:
    """Run database backup with retention policy."""

    # Get database connection
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    # Configuration
    backup_dir = "/tmp/backups"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Retention policy (in days)
    retention = {
        "daily": 7,
        "weekly": 28,
        "monthly": 365,
        "manual": 30
    }

    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)

    # Generate backup filename
    db_name = postgres_db['dbname']
    filename = f"{db_name}_{backup_type}_{timestamp}.sql"
    filepath = os.path.join(backup_dir, filename)
    compressed_filepath = f"{filepath}.gz"

    if dry_run:
        return {
            "status": "dry_run",
            "would_create": compressed_filepath,
            "backup_type": backup_type,
            "cleanup_old": cleanup_old
        }

    try:
        # Connect to database
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Get list of tables to backup
        cursor.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        tables = [row[0] for row in cursor.fetchall()]

        # Build SQL backup
        sql_content = io.StringIO()
        sql_content.write(f"-- Family Brain Database Backup\n")
        sql_content.write(f"-- Generated: {datetime.now().isoformat()}\n")
        sql_content.write(f"-- Backup Type: {backup_type}\n")
        sql_content.write(f"-- Database: {db_name}\n\n")
        sql_content.write("SET statement_timeout = 0;\n")
        sql_content.write("SET client_encoding = 'UTF8';\n\n")

        table_rows = {}

        for table in tables:
            # Get table structure
            cursor.execute(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = %s AND table_schema = 'public'
                ORDER BY ordinal_position
            """, (table,))
            columns = cursor.fetchall()

            if not columns:
                continue

            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            table_rows[table] = row_count

            sql_content.write(f"\n-- Table: {table} ({row_count} rows)\n")

            # Export data using COPY
            if row_count > 0:
                sql_content.write(f"COPY {table} FROM stdin;\n")

                # Use COPY TO to get tab-separated data
                output = io.StringIO()
                cursor.copy_to(output, table)
                output.seek(0)
                sql_content.write(output.read())
                sql_content.write("\\.\n")

        cursor.close()
        conn.close()

        # Write compressed backup
        sql_bytes = sql_content.getvalue().encode('utf-8')
        with gzip.open(compressed_filepath, 'wb') as f:
            f.write(sql_bytes)

        # Get file size
        file_size = os.path.getsize(compressed_filepath)
        file_size_mb = round(file_size / (1024 * 1024), 2)

        backup_result = {
            "status": "success",
            "filename": os.path.basename(compressed_filepath),
            "filepath": compressed_filepath,
            "size_bytes": file_size,
            "size_mb": file_size_mb,
            "backup_type": backup_type,
            "timestamp": timestamp,
            "database": db_name,
            "tables_backed_up": len(tables),
            "total_rows": sum(table_rows.values()),
            "table_details": table_rows
        }

        # Upload to S3 if configured
        if upload_to_s3:
            s3_result = upload_backup_to_s3(compressed_filepath, backup_type)
            backup_result["s3"] = s3_result

        # Cleanup old backups
        if cleanup_old:
            cleanup_result = cleanup_old_backups(backup_dir, backup_type, retention[backup_type])
            backup_result["cleanup"] = cleanup_result

        # Log the backup
        log_backup(postgres_db, backup_result)

        return backup_result

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "backup_type": backup_type
        }


def upload_backup_to_s3(filepath: str, backup_type: str) -> dict:
    """Upload backup to S3 bucket."""
    try:
        import boto3

        # Get S3 configuration (optional resource)
        try:
            s3_config = wmill.get_resource("f/admin/s3_backup_config")
        except Exception:
            return {"status": "skipped", "reason": "S3 config not found"}

        s3_client = boto3.client(
            's3',
            aws_access_key_id=s3_config.get('access_key_id'),
            aws_secret_access_key=s3_config.get('secret_access_key'),
            region_name=s3_config.get('region', 'us-east-1')
        )

        bucket = s3_config['bucket']
        key = f"backups/{backup_type}/{os.path.basename(filepath)}"

        s3_client.upload_file(filepath, bucket, key)

        return {
            "status": "uploaded",
            "bucket": bucket,
            "key": key
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


def cleanup_old_backups(backup_dir: str, backup_type: str, retention_days: int) -> dict:
    """Remove backups older than retention period."""
    cutoff = datetime.now() - timedelta(days=retention_days)
    deleted = []
    kept = []

    for filename in os.listdir(backup_dir):
        if not filename.endswith('.sql.gz'):
            continue
        if backup_type not in filename:
            continue

        filepath = os.path.join(backup_dir, filename)
        file_time = datetime.fromtimestamp(os.path.getmtime(filepath))

        if file_time < cutoff:
            os.remove(filepath)
            deleted.append(filename)
        else:
            kept.append(filename)

    return {
        "deleted_count": len(deleted),
        "deleted_files": deleted,
        "kept_count": len(kept),
        "retention_days": retention_days
    }


def log_backup(postgres_db: dict, backup_result: dict):
    """Log backup to system_logs table."""
    import psycopg2

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

        cursor.execute("""
            INSERT INTO system_logs (level, source, message, details)
            VALUES ('info', 'backup', %s, %s)
        """, (
            f"Database backup completed: {backup_result.get('filename', 'unknown')}",
            str(backup_result)
        ))

        conn.commit()
        cursor.close()
        conn.close()
    except Exception:
        # Don't fail backup if logging fails
        pass
