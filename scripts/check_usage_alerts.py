# check_usage_alerts.py
# Windmill Python script for checking usage thresholds and creating alerts
# Path: f/admin/check_usage_alerts
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Check all tenants for usage threshold violations and create alerts.

This script:
1. Iterates through all active tenants
2. Checks AI budget usage against thresholds (75%, 90%, 100%)
3. Checks storage usage against thresholds
4. Checks member limits
5. Creates alerts in usage_alerts table if thresholds exceeded
6. Creates in-app notifications for new alerts

Can be run on a schedule (e.g., hourly or daily) via Windmill.

Args:
    tenant_id (optional): Check specific tenant only. If None, checks all active tenants.
    dry_run (bool): If True, don't create alerts, just report what would be created.

Returns:
    dict: Summary of alerts checked and created
"""

import wmill
import psycopg2
import json
from typing import Optional
from datetime import datetime


def main(
    tenant_id: Optional[str] = None,
    dry_run: bool = False
) -> dict:
    """Check usage thresholds and create alerts."""

    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )
    cursor = conn.cursor()

    # Get tenants to check
    if tenant_id:
        cursor.execute("""
            SELECT id, name, plan, ai_allowance_usd, max_storage_gb, max_members
            FROM tenants
            WHERE id = %s::uuid AND status = 'active'
        """, (tenant_id,))
    else:
        cursor.execute("""
            SELECT id, name, plan, ai_allowance_usd, max_storage_gb, max_members
            FROM tenants
            WHERE status = 'active'
        """)

    tenants = cursor.fetchall()

    summary = {
        "tenants_checked": 0,
        "alerts_created": [],
        "notifications_created": 0,
        "errors": [],
        "dry_run": dry_run
    }

    for tenant_row in tenants:
        t_id, t_name, t_plan, ai_allowance, max_storage, max_members = tenant_row
        t_id_str = str(t_id)
        summary["tenants_checked"] += 1

        try:
            # Get notification preferences for this tenant
            cursor.execute("""
                SELECT
                    ai_budget_warning_percent,
                    ai_budget_critical_percent,
                    storage_warning_percent,
                    storage_critical_percent,
                    receive_budget_alerts,
                    receive_storage_alerts,
                    receive_member_alerts
                FROM notification_preferences
                WHERE tenant_id = %s AND user_id IS NULL
            """, (t_id,))
            prefs_row = cursor.fetchone()

            if prefs_row:
                ai_warning_pct, ai_critical_pct, storage_warning_pct, storage_critical_pct, \
                    recv_budget, recv_storage, recv_member = prefs_row
            else:
                # Default thresholds
                ai_warning_pct, ai_critical_pct = 75, 90
                storage_warning_pct, storage_critical_pct = 75, 90
                recv_budget, recv_storage, recv_member = True, True, True

            # Check AI budget usage (month-to-date)
            if ai_allowance and ai_allowance > 0 and recv_budget:
                cursor.execute("""
                    SELECT COALESCE(SUM(total_cost_cents)::decimal / 100, 0)
                    FROM api_usage_daily
                    WHERE tenant_id = %s
                      AND date >= DATE_TRUNC('month', CURRENT_DATE)
                """, (t_id,))
                mtd_cost = float(cursor.fetchone()[0] or 0)
                usage_pct = (mtd_cost / float(ai_allowance)) * 100

                # Check for exceeded (100%)
                if usage_pct >= 100:
                    alert_result = create_alert_if_needed(
                        cursor, conn, t_id, t_name,
                        'ai_budget_exceeded', 100, usage_pct, mtd_cost, float(ai_allowance),
                        f"AI budget exceeded: ${mtd_cost:.2f} of ${ai_allowance:.2f} ({usage_pct:.0f}%)",
                        dry_run
                    )
                    if alert_result:
                        summary["alerts_created"].append(alert_result)
                # Check for critical (90%)
                elif usage_pct >= ai_critical_pct:
                    alert_result = create_alert_if_needed(
                        cursor, conn, t_id, t_name,
                        'ai_budget_critical', ai_critical_pct, usage_pct, mtd_cost, float(ai_allowance),
                        f"AI budget at {usage_pct:.0f}%: ${mtd_cost:.2f} of ${ai_allowance:.2f}",
                        dry_run
                    )
                    if alert_result:
                        summary["alerts_created"].append(alert_result)
                # Check for warning (75%)
                elif usage_pct >= ai_warning_pct:
                    alert_result = create_alert_if_needed(
                        cursor, conn, t_id, t_name,
                        'ai_budget_warning', ai_warning_pct, usage_pct, mtd_cost, float(ai_allowance),
                        f"AI budget at {usage_pct:.0f}%: ${mtd_cost:.2f} of ${ai_allowance:.2f}",
                        dry_run
                    )
                    if alert_result:
                        summary["alerts_created"].append(alert_result)

            # Check storage usage
            if max_storage and max_storage > 0 and recv_storage:
                cursor.execute("""
                    SELECT COALESCE(SUM(file_size_bytes), 0)
                    FROM documents
                    WHERE tenant_id = %s AND deleted_at IS NULL
                """, (t_id,))
                storage_bytes = int(cursor.fetchone()[0] or 0)
                storage_gb = storage_bytes / (1024 * 1024 * 1024)
                storage_pct = (storage_gb / float(max_storage)) * 100

                # Check for critical (90%)
                if storage_pct >= storage_critical_pct:
                    alert_result = create_alert_if_needed(
                        cursor, conn, t_id, t_name,
                        'storage_critical', storage_critical_pct, storage_pct, storage_gb, float(max_storage),
                        f"Storage at {storage_pct:.0f}%: {storage_gb:.2f}GB of {max_storage}GB",
                        dry_run
                    )
                    if alert_result:
                        summary["alerts_created"].append(alert_result)
                # Check for warning (75%)
                elif storage_pct >= storage_warning_pct:
                    alert_result = create_alert_if_needed(
                        cursor, conn, t_id, t_name,
                        'storage_warning', storage_warning_pct, storage_pct, storage_gb, float(max_storage),
                        f"Storage at {storage_pct:.0f}%: {storage_gb:.2f}GB of {max_storage}GB",
                        dry_run
                    )
                    if alert_result:
                        summary["alerts_created"].append(alert_result)

            # Check member limit
            if max_members and max_members > 0 and recv_member:
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM tenant_memberships
                    WHERE tenant_id = %s AND status = 'active'
                """, (t_id,))
                member_count = int(cursor.fetchone()[0] or 0)

                if member_count >= max_members:
                    alert_result = create_alert_if_needed(
                        cursor, conn, t_id, t_name,
                        'member_limit_reached', 100, 100, float(member_count), float(max_members),
                        f"Member limit reached: {member_count} of {max_members}",
                        dry_run
                    )
                    if alert_result:
                        summary["alerts_created"].append(alert_result)

        except Exception as e:
            summary["errors"].append({
                "tenant_id": t_id_str,
                "tenant_name": t_name,
                "error": str(e)
            })

    if not dry_run:
        conn.commit()

    # Count notifications created
    summary["notifications_created"] = sum(1 for a in summary["alerts_created"] if a.get("notification_created"))

    cursor.close()
    conn.close()

    return summary


def create_alert_if_needed(
    cursor, conn, tenant_id, tenant_name,
    alert_type: str, threshold_pct: int, current_pct: float,
    current_value: float, limit_value: float, message: str,
    dry_run: bool
) -> Optional[dict]:
    """Create an alert if one doesn't already exist for this threshold."""

    tenant_id_str = str(tenant_id)

    # Check if active alert of this type already exists
    cursor.execute("""
        SELECT id FROM usage_alerts
        WHERE tenant_id = %s
          AND alert_type = %s
          AND status = 'active'
          AND triggered_at >= DATE_TRUNC('month', CURRENT_DATE)
    """, (tenant_id, alert_type))

    if cursor.fetchone():
        # Active alert already exists for this month
        return None

    if dry_run:
        return {
            "tenant_id": tenant_id_str,
            "tenant_name": tenant_name,
            "alert_type": alert_type,
            "threshold_percent": threshold_pct,
            "current_percent": round(current_pct, 1),
            "current_value": round(current_value, 4),
            "limit_value": round(limit_value, 4),
            "message": message,
            "dry_run": True
        }

    # Create the alert
    cursor.execute("""
        INSERT INTO usage_alerts (
            tenant_id, alert_type, threshold_percent,
            current_value, limit_value, message, metadata
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        tenant_id, alert_type, threshold_pct,
        current_value, limit_value, message,
        json.dumps({
            "current_percent": round(current_pct, 1),
            "tenant_name": tenant_name
        })
    ))
    alert_id = cursor.fetchone()[0]

    # Create in-app notification
    notification_created = False
    try:
        # Determine notification type based on alert severity
        notif_type = 'warning' if 'warning' in alert_type else 'alert'

        cursor.execute("""
            INSERT INTO in_app_notifications (
                tenant_id, user_id, title, message,
                notification_type, alert_id, action_url
            ) VALUES (%s, NULL, %s, %s, %s, %s, %s)
        """, (
            tenant_id,
            get_alert_title(alert_type),
            message,
            notif_type,
            alert_id,
            '/settings/usage'  # Link to usage settings
        ))
        notification_created = True
    except Exception:
        pass  # Notification table might not exist yet

    return {
        "tenant_id": tenant_id_str,
        "tenant_name": tenant_name,
        "alert_id": alert_id,
        "alert_type": alert_type,
        "threshold_percent": threshold_pct,
        "current_percent": round(current_pct, 1),
        "message": message,
        "notification_created": notification_created
    }


def get_alert_title(alert_type: str) -> str:
    """Get human-readable title for alert type."""
    titles = {
        'ai_budget_warning': 'AI Budget Warning',
        'ai_budget_critical': 'AI Budget Critical',
        'ai_budget_exceeded': 'AI Budget Exceeded',
        'storage_warning': 'Storage Warning',
        'storage_critical': 'Storage Critical',
        'member_limit_reached': 'Member Limit Reached',
        'rate_limit_warning': 'Rate Limit Warning'
    }
    return titles.get(alert_type, 'Usage Alert')
