# list_backups.py
# Windmill Python script for listing available backups
# Path: f/admin/list_backups
#
# requirements:
#   - wmill
#   - boto3

"""
List available database backups.

Shows local backups and optionally S3 backups with metadata.

Args:
    include_s3: Whether to include S3 backups in listing
    backup_type: Filter by type ("daily", "weekly", "monthly", "manual", or "all")

Returns:
    dict: Available backups grouped by type and location
"""

import os
from datetime import datetime
from typing import Optional
import wmill


def main(
    include_s3: bool = False,
    backup_type: str = "all"
) -> dict:
    """List available backups."""

    backup_dir = "/tmp/backups"
    result = {
        "local_backups": [],
        "s3_backups": [],
        "summary": {}
    }

    # List local backups
    if os.path.exists(backup_dir):
        for filename in sorted(os.listdir(backup_dir), reverse=True):
            if not filename.endswith('.sql.gz'):
                continue

            # Parse backup info from filename
            # Format: dbname_type_timestamp.sql.gz (e.g., family_brain_manual_20251208_024537.sql.gz)
            parts = filename.replace('.sql.gz', '').split('_')
            btype = 'unknown'
            for part in parts:
                if part in ['daily', 'weekly', 'monthly', 'manual', 'pre']:
                    btype = part
                    break

            if backup_type != "all" and btype != backup_type:
                continue

            filepath = os.path.join(backup_dir, filename)
            stat = os.stat(filepath)

            result["local_backups"].append({
                "filename": filename,
                "type": btype,
                "size_bytes": stat.st_size,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "created": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "location": "local"
            })

    # List S3 backups
    if include_s3:
        s3_backups = list_s3_backups(backup_type)
        result["s3_backups"] = s3_backups

    # Summary
    local_count = len(result["local_backups"])
    s3_count = len(result["s3_backups"])
    local_size = sum(b["size_bytes"] for b in result["local_backups"])
    s3_size = sum(b.get("size_bytes", 0) for b in result["s3_backups"])

    result["summary"] = {
        "local_count": local_count,
        "s3_count": s3_count,
        "total_count": local_count + s3_count,
        "local_size_mb": round(local_size / (1024 * 1024), 2),
        "s3_size_mb": round(s3_size / (1024 * 1024), 2),
        "filter": backup_type
    }

    return result


def list_s3_backups(backup_type: str) -> list:
    """List backups from S3."""
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
        backups = []

        # List from each backup type folder
        types_to_check = ['daily', 'weekly', 'monthly', 'manual'] if backup_type == "all" else [backup_type]

        for btype in types_to_check:
            prefix = f"backups/{btype}/"
            try:
                response = s3_client.list_objects_v2(
                    Bucket=bucket,
                    Prefix=prefix
                )

                for obj in response.get('Contents', []):
                    key = obj['Key']
                    filename = key.split('/')[-1]
                    if not filename:
                        continue

                    backups.append({
                        "filename": filename,
                        "type": btype,
                        "size_bytes": obj['Size'],
                        "size_mb": round(obj['Size'] / (1024 * 1024), 2),
                        "created": obj['LastModified'].isoformat(),
                        "location": "s3",
                        "s3_key": key
                    })
            except Exception:
                continue

        return sorted(backups, key=lambda x: x['created'], reverse=True)

    except Exception as e:
        return [{"error": str(e)}]
