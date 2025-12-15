# Database Backup and Restore Guide

## Overview

Family Second Brain uses PostgreSQL with pgvector for storing family documents, embeddings, and user data. This guide covers the automated backup system and restore procedures.

## Backup Scripts

Three Windmill scripts handle backup operations:

| Script | Path | Purpose |
|--------|------|---------|
| `backup_database` | `f/admin/backup_database` | Create database backups |
| `restore_database` | `f/admin/restore_database` | Restore from backup |
| `list_backups` | `f/admin/list_backups` | List available backups |

## Backup Types and Retention

| Type | Schedule | Cron (6-field) | Retention |
|------|----------|----------------|-----------|
| Daily | 2:00 AM ET | `0 0 2 * * *` | 7 days |
| Weekly | Sundays 3:00 AM ET | `0 0 3 * * 7` | 4 weeks |
| Monthly | 1st of month 4:00 AM ET | `0 0 4 1 * *` | 12 months |
| Manual | On-demand | - | 30 days |

**Note**: Windmill uses 6-field cron format (seconds, minutes, hours, day, month, weekday). Day of week uses 1-7 (Monday-Sunday).

## Running Manual Backups

### Via Windmill UI

1. Go to `http://localhost/scripts`
2. Find `f/admin/backup_database`
3. Click "Run"
4. Set parameters:
   - `backup_type`: "manual"
   - `upload_to_s3`: false (unless S3 configured)
   - `cleanup_old`: true
   - `dry_run`: false
5. Click "Run"

### Via API

```bash
curl -X POST "http://localhost/api/w/family-brain/jobs/run_wait_result/p/f/admin/backup_database" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backup_type": "manual", "dry_run": false}'
```

### Backup Output

Successful backup returns:

```json
{
  "status": "success",
  "filename": "family_brain_manual_20251208_023807.sql.gz",
  "size_mb": 0.22,
  "tables_backed_up": 29,
  "total_rows": 3089,
  "table_details": {
    "tenants": 5,
    "users": 5,
    "family_documents": 37,
    ...
  }
}
```

## Restore Procedures

### Prerequisites

1. Identify the backup file to restore from
2. Understand this is a DESTRUCTIVE operation
3. Have database admin access

### Restore Steps

1. **List available backups**:
```bash
curl -X POST "http://localhost/api/w/family-brain/jobs/run_wait_result/p/f/admin/list_backups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"include_s3": true}'
```

2. **Run restore** (creates pre-restore backup automatically):
```bash
curl -X POST "http://localhost/api/w/family-brain/jobs/run_wait_result/p/f/admin/restore_database" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "backup_filename": "family_brain_daily_20251208_020000.sql.gz",
    "backup_source": "s3",
    "confirm_restore": true,
    "create_pre_restore_backup": true
  }'
```

3. **Verify restore**:
   - Check the response for verification results
   - Test application functionality
   - Check key data (tenants, users, documents)

### Rollback

If restore fails or causes issues:

1. Note the `pre_restore_backup` filename from the restore response
2. Run restore again with the pre-restore backup

## S3 Configuration (Production)

For production, configure S3 storage:

1. Create Windmill resource `f/admin/s3_backup_config`:
```json
{
  "bucket": "family-brain-backups",
  "region": "us-east-1",
  "access_key_id": "AKIA...",
  "secret_access_key": "..."
}
```

2. Update backup calls with `upload_to_s3: true`

## Scheduled Backups (Pre-Configured)

The following schedules are already configured and enabled:

| Schedule Path | Cron | Script | Description |
|---------------|------|--------|-------------|
| `f/admin/schedule_daily_backup` | `0 0 2 * * *` | `f/admin/backup_database` | Daily at 2 AM ET |
| `f/admin/schedule_weekly_backup` | `0 0 3 * * 7` | `f/admin/backup_database` | Sundays at 3 AM ET |
| `f/admin/schedule_monthly_backup` | `0 0 4 1 * *` | `f/admin/backup_database` | 1st of month at 4 AM ET |

All schedules run in America/Toronto timezone.

### Modifying Schedules

To modify schedules via Windmill UI:
1. Go to `http://localhost/schedules`
2. Find the schedule to modify
3. Update cron expression, arguments, or enabled state

## Database Schema

Key tables backed up:

| Table | Description |
|-------|-------------|
| `tenants` | Family accounts |
| `users` | Login users |
| `family_members` | Family member profiles |
| `family_documents` | Documents with embeddings (vector data) |
| `chat_sessions` | Chat history |
| `chat_messages` | Individual messages |
| `ai_usage` | API usage tracking |

## Troubleshooting

### Backup Fails

1. Check database connectivity
2. Verify Windmill worker has network access to database
3. Check disk space

### Restore Fails

1. Check backup file integrity
2. Verify database permissions
3. Check for schema compatibility

### Missing Backups

1. Check Windmill schedule is enabled
2. Verify S3 credentials if using S3
3. Check retention policy hasn't deleted them

## Monitoring

Monitor backups via:

1. Windmill job history
2. `system_logs` table entries with source='backup'
3. S3 bucket contents

## Emergency Recovery

If all backups are lost:

1. Check Docker volumes: `docker volume ls | grep family-brain`
2. Check for PostgreSQL WAL files
3. Contact cloud provider for snapshot recovery (if applicable)

## Contact

For backup issues, check:
- Windmill job logs
- PostgreSQL container logs: `docker logs family-brain-db`
