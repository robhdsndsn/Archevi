# get_calendar_settings.py
# Windmill Python script for getting/updating calendar feed settings
# Path: f/chatbot/get_calendar_settings
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Get or update calendar feed settings for a tenant.

Args:
    tenant_id (str): UUID of the tenant
    action (str): "get", "update", or "regenerate_token"
    settings (dict, optional): For "update" action - new settings to apply

Returns:
    dict: Calendar feed settings including the feed URL
"""

import wmill
import psycopg2
from typing import TypedDict, Optional, List
from datetime import datetime


class CalendarSettings(TypedDict):
    feed_id: str
    feed_url: str
    is_enabled: bool
    reminder_days: List[int]
    include_categories: List[str]
    last_accessed_at: Optional[str]
    access_count: int
    created_at: str


class CalendarSettingsResult(TypedDict):
    success: bool
    settings: Optional[CalendarSettings]
    message: str


# Base URL for calendar feeds - this should match your deployment
FEED_BASE_URL = "https://archevi.ca/api/calendar"


def main(
    tenant_id: str,
    action: str = "get",
    is_enabled: bool = None,
    reminder_days: List[int] = None,
    include_categories: List[str] = None
) -> CalendarSettingsResult:
    """Get or update calendar feed settings."""

    if not tenant_id:
        return {
            "success": False,
            "settings": None,
            "message": "tenant_id is required"
        }

    if action not in ["get", "update", "regenerate_token"]:
        return {
            "success": False,
            "settings": None,
            "message": "action must be 'get', 'update', or 'regenerate_token'"
        }

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

    try:
        if action == "regenerate_token":
            # Generate new token
            cursor.execute("""
                UPDATE calendar_feeds
                SET feed_token = encode(gen_random_bytes(32), 'hex'),
                    updated_at = NOW()
                WHERE tenant_id = %s
                RETURNING feed_token
            """, (tenant_id,))

            result = cursor.fetchone()
            if not result:
                # Create new feed if doesn't exist
                cursor.execute("""
                    INSERT INTO calendar_feeds (tenant_id, feed_token)
                    VALUES (%s, encode(gen_random_bytes(32), 'hex'))
                    RETURNING feed_token
                """, (tenant_id,))
                result = cursor.fetchone()

            conn.commit()

        elif action == "update":
            # Build update query
            updates = []
            params = []

            if is_enabled is not None:
                updates.append("is_enabled = %s")
                params.append(is_enabled)

            if reminder_days is not None:
                updates.append("reminder_days = %s")
                params.append(reminder_days)

            if include_categories is not None:
                updates.append("include_categories = %s")
                params.append(include_categories)

            if updates:
                updates.append("updated_at = NOW()")
                params.append(tenant_id)

                cursor.execute(f"""
                    UPDATE calendar_feeds
                    SET {', '.join(updates)}
                    WHERE tenant_id = %s
                """, params)
                conn.commit()

        # Get current settings
        cursor.execute("""
            SELECT
                cf.id::text,
                cf.feed_token,
                cf.is_enabled,
                cf.reminder_days,
                cf.include_categories,
                cf.last_accessed_at::text,
                cf.access_count,
                cf.created_at::text
            FROM calendar_feeds cf
            WHERE cf.tenant_id = %s
        """, (tenant_id,))

        row = cursor.fetchone()

        if not row:
            # Auto-create feed for tenant
            cursor.execute("""
                INSERT INTO calendar_feeds (tenant_id, feed_token)
                VALUES (%s, encode(gen_random_bytes(32), 'hex'))
                RETURNING
                    id::text,
                    feed_token,
                    is_enabled,
                    reminder_days,
                    include_categories,
                    last_accessed_at::text,
                    access_count,
                    created_at::text
            """, (tenant_id,))
            row = cursor.fetchone()
            conn.commit()

        if not row:
            return {
                "success": False,
                "settings": None,
                "message": "Failed to get or create calendar feed"
            }

        (feed_id, feed_token, is_enabled, reminder_days_db,
         include_categories_db, last_accessed_at, access_count, created_at) = row

        # Build feed URL
        feed_url = f"{FEED_BASE_URL}/{feed_token}.ics"

        settings: CalendarSettings = {
            "feed_id": feed_id,
            "feed_url": feed_url,
            "is_enabled": is_enabled,
            "reminder_days": reminder_days_db or [7, 30],
            "include_categories": include_categories_db or ['insurance', 'legal', 'medical', 'financial'],
            "last_accessed_at": last_accessed_at,
            "access_count": access_count,
            "created_at": created_at
        }

        return {
            "success": True,
            "settings": settings,
            "message": "Calendar settings retrieved successfully" if action == "get" else f"Calendar settings {action}d successfully"
        }

    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "settings": None,
            "message": f"Error: {str(e)}"
        }

    finally:
        cursor.close()
        conn.close()
