# generate_calendar_feed.py
# Windmill Python script for generating iCal feeds of document expiry dates
# Path: f/chatbot/generate_calendar_feed
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Generate an iCal feed of document expiry dates for calendar subscription.

This is a PUBLIC endpoint that doesn't require authentication.
Security is provided by the unique feed_token in the URL.

Args:
    feed_token (str): Unique token identifying the calendar feed

Returns:
    dict: {
        ics_content: str,  # The ICS file content
        content_type: str, # "text/calendar"
        event_count: int,
        tenant_name: str
    }
"""

import wmill
import psycopg2
from datetime import datetime, timedelta
from typing import TypedDict, Optional
import hashlib


class CalendarFeedResult(TypedDict):
    ics_content: str
    content_type: str
    event_count: int
    tenant_name: str
    error: Optional[str]


def generate_uid(document_id: int, expiry_date: str, expiry_type: str) -> str:
    """Generate a unique, stable UID for an iCal event."""
    # Create a stable hash so the same event always has the same UID
    unique_str = f"{document_id}-{expiry_date}-{expiry_type}"
    return hashlib.md5(unique_str.encode()).hexdigest() + "@archevi.ca"


def escape_ical(text: str) -> str:
    """Escape special characters for iCal format."""
    if not text:
        return ""
    # iCal requires escaping backslash, semicolon, comma, and newlines
    text = text.replace("\\", "\\\\")
    text = text.replace(";", "\\;")
    text = text.replace(",", "\\,")
    text = text.replace("\n", "\\n")
    return text


def format_ical_date(date_str: str) -> str:
    """Format a date string as iCal DATE (YYYYMMDD)."""
    # Handle various date formats
    try:
        if isinstance(date_str, str):
            # Try ISO format first
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            return dt.strftime("%Y%m%d")
    except (ValueError, TypeError):
        pass
    return date_str.replace("-", "")[:8]


def main(feed_token: str) -> CalendarFeedResult:
    """Generate iCal feed for a given feed token."""

    if not feed_token or not feed_token.strip():
        return {
            "ics_content": "",
            "content_type": "text/plain",
            "event_count": 0,
            "tenant_name": "",
            "error": "Feed token is required"
        }

    feed_token = feed_token.strip()

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
        # Get calendar feed settings and verify token
        cursor.execute("""
            SELECT
                cf.id,
                cf.tenant_id,
                cf.is_enabled,
                cf.reminder_days,
                cf.include_categories,
                t.name as tenant_name
            FROM calendar_feeds cf
            JOIN tenants t ON t.id = cf.tenant_id
            WHERE cf.feed_token = %s
        """, (feed_token,))

        feed = cursor.fetchone()
        if not feed:
            return {
                "ics_content": "",
                "content_type": "text/plain",
                "event_count": 0,
                "tenant_name": "",
                "error": "Invalid feed token"
            }

        feed_id, tenant_id, is_enabled, reminder_days, include_categories, tenant_name = feed

        if not is_enabled:
            return {
                "ics_content": "",
                "content_type": "text/plain",
                "event_count": 0,
                "tenant_name": tenant_name,
                "error": "Calendar feed is disabled"
            }

        # Default reminder days if not set
        if not reminder_days:
            reminder_days = [7, 30]

        # Default categories if not set
        if not include_categories:
            include_categories = ['insurance', 'legal', 'medical', 'financial']

        # Get documents with expiry dates
        cursor.execute("""
            SELECT
                d.id as document_id,
                d.title as document_title,
                d.category,
                exp_date->>'date' as expiry_date,
                COALESCE(exp_date->>'type', 'expiry') as expiry_type,
                COALESCE(exp_date->>'label', exp_date->>'type', 'Expiry') as expiry_label
            FROM family_documents d,
                 jsonb_array_elements(COALESCE(d.metadata->'expiry_dates', '[]'::jsonb)) as exp_date
            WHERE d.tenant_id = %s
              AND d.metadata->'expiry_dates' IS NOT NULL
              AND jsonb_array_length(d.metadata->'expiry_dates') > 0
              AND (exp_date->>'date')::DATE >= CURRENT_DATE
              AND d.category = ANY(%s)
            ORDER BY (exp_date->>'date')::DATE
        """, (str(tenant_id), include_categories))

        events = cursor.fetchall()

        # Update access stats
        cursor.execute("""
            UPDATE calendar_feeds
            SET last_accessed_at = NOW(),
                access_count = access_count + 1
            WHERE id = %s
        """, (feed_id,))
        conn.commit()

        # Generate iCal content
        now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            f"PRODID:-//Archevi//{tenant_name}//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:{escape_ical(tenant_name)} - Document Expiry Dates",
            f"X-WR-CALDESC:Document expiry reminders from Archevi",
        ]

        for doc_id, doc_title, category, expiry_date, expiry_type, expiry_label in events:
            if not expiry_date:
                continue

            # Format the date for iCal (all-day event)
            ical_date = format_ical_date(expiry_date)

            # Generate unique ID
            uid = generate_uid(doc_id, expiry_date, expiry_type)

            # Create event title
            event_title = f"{escape_ical(doc_title)} - {escape_ical(expiry_label)}"

            # Create event description
            description = f"{expiry_label} for {doc_title}\\n\\nCategory: {category}\\n\\nView in Archevi: https://archevi.ca/documents/{doc_id}"

            ics_lines.extend([
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTAMP:{now}",
                f"DTSTART;VALUE=DATE:{ical_date}",
                f"SUMMARY:{event_title}",
                f"DESCRIPTION:{escape_ical(description)}",
                f"CATEGORIES:{category.upper()}",
                f"URL:https://archevi.ca/documents/{doc_id}",
                "TRANSP:TRANSPARENT",  # Don't show as busy
            ])

            # Add reminder alarms
            for days in reminder_days:
                ics_lines.extend([
                    "BEGIN:VALARM",
                    f"TRIGGER:-P{days}D",
                    "ACTION:DISPLAY",
                    f"DESCRIPTION:Reminder: {event_title} in {days} days",
                    "END:VALARM",
                ])

            ics_lines.append("END:VEVENT")

        ics_lines.append("END:VCALENDAR")

        ics_content = "\r\n".join(ics_lines)

        return {
            "ics_content": ics_content,
            "content_type": "text/calendar; charset=utf-8",
            "event_count": len(events),
            "tenant_name": tenant_name,
            "error": None
        }

    except Exception as e:
        return {
            "ics_content": "",
            "content_type": "text/plain",
            "event_count": 0,
            "tenant_name": "",
            "error": f"Failed to generate calendar: {str(e)}"
        }

    finally:
        cursor.close()
        conn.close()
