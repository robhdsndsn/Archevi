# send_expiry_notifications.py
# Windmill Python script for sending document expiry notification emails
# Path: f/chatbot/send_expiry_notifications
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx
#   - resend

"""
Check for expiring documents and send notification emails to family members.

This script is designed to run on a daily schedule via Windmill.
It sends emails for:
- Documents expiring within 7 days (urgent) - sent daily
- Documents expiring within 30 days (soon) - sent weekly on Mondays

Schedule: Daily at 8am Toronto time

Args:
    dry_run: bool - If True, don't send emails, just return what would be sent
    force_send: bool - If True, send all notifications regardless of schedule

Returns:
    dict: {
        success: bool,
        emails_sent: int,
        notifications: list[{recipient, document_count, urgency}],
        errors: list[str]
    }
"""

import psycopg2
from typing import Optional
import wmill
from datetime import datetime, timedelta


def main(dry_run: bool = False, force_send: bool = False) -> dict:
    """
    Send expiry notification emails to family members.
    """
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    errors = []
    notifications = []
    emails_sent = 0

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

        today = datetime.now().date()
        is_monday = today.weekday() == 0

        # Get expiring documents grouped by urgency
        # Urgent: expires within 7 days
        # Soon: expires within 30 days
        cursor.execute("""
            WITH expiry_data AS (
                SELECT
                    fd.id,
                    fd.title,
                    fd.category,
                    expiry->>'date' as expiry_date,
                    expiry->>'type' as expiry_type,
                    (expiry->>'confidence')::float as confidence,
                    ((expiry->>'date')::date - CURRENT_DATE) as days_until
                FROM family_documents fd,
                     jsonb_array_elements(fd.metadata->'expiry_dates') as expiry
                WHERE fd.metadata->'expiry_dates' IS NOT NULL
                  AND jsonb_array_length(fd.metadata->'expiry_dates') > 0
                  AND (expiry->>'date')::date >= CURRENT_DATE
                  AND (expiry->>'date')::date <= CURRENT_DATE + INTERVAL '30 days'
            )
            SELECT
                id,
                title,
                category,
                expiry_date,
                expiry_type,
                days_until,
                CASE
                    WHEN days_until <= 7 THEN 'urgent'
                    ELSE 'soon'
                END as urgency
            FROM expiry_data
            ORDER BY days_until ASC
        """)

        documents = cursor.fetchall()

        if not documents:
            cursor.close()
            conn.close()
            return {
                "success": True,
                "emails_sent": 0,
                "message": "No documents expiring within 30 days",
                "notifications": [],
                "errors": []
            }

        # Group by urgency
        urgent_docs = [d for d in documents if d[6] == 'urgent']
        soon_docs = [d for d in documents if d[6] == 'soon']

        # Determine what to send based on schedule
        # - Urgent: always send (daily)
        # - Soon: only on Mondays (weekly digest)
        docs_to_notify = []
        if urgent_docs:
            docs_to_notify.extend(urgent_docs)
        if soon_docs and (is_monday or force_send):
            docs_to_notify.extend(soon_docs)

        if not docs_to_notify:
            cursor.close()
            conn.close()
            return {
                "success": True,
                "emails_sent": 0,
                "message": f"No urgent documents today. {len(soon_docs)} documents expiring soon (weekly digest sent on Mondays)",
                "notifications": [],
                "errors": []
            }

        # Get all active family members with admin/owner roles to notify
        cursor.execute("""
            SELECT DISTINCT email, name
            FROM family_members
            WHERE is_active = true
              AND role IN ('admin', 'owner')
              AND password_hash IS NOT NULL
        """)
        recipients = cursor.fetchall()

        cursor.close()
        conn.close()

        if not recipients:
            return {
                "success": True,
                "emails_sent": 0,
                "message": "No active admin/owner members to notify",
                "notifications": [],
                "errors": []
            }

        # Prepare email content
        urgent_count = len(urgent_docs)
        soon_count = len(soon_docs) if (is_monday or force_send) else 0

        # Build HTML email
        email_html = build_notification_email(
            urgent_docs if urgent_docs else [],
            soon_docs if (is_monday or force_send) else [],
            today
        )

        subject = build_subject(urgent_count, soon_count)

        # Send emails via centralized email service
        if not dry_run:
            try:
                from email_service import EmailService

                service = EmailService()

                # Convert document tuples to dicts for email service
                urgent_doc_dicts = [
                    {
                        "title": d[1],
                        "expiry_date": d[3],
                        "expiry_type": d[4],
                        "days_until": d[5]
                    }
                    for d in (urgent_docs if urgent_docs else [])
                ]
                soon_doc_dicts = [
                    {
                        "title": d[1],
                        "expiry_date": d[3],
                        "expiry_type": d[4],
                        "days_until": d[5]
                    }
                    for d in (soon_docs if (is_monday or force_send) else [])
                ]

                for recipient_email, recipient_name in recipients:
                    try:
                        result = service.send_expiry_notification(
                            to=recipient_email,
                            recipient_name=recipient_name or "there",
                            urgent_docs=urgent_doc_dicts,
                            soon_docs=soon_doc_dicts
                        )
                        if result.get("success"):
                            emails_sent += 1
                            notifications.append({
                                "recipient": recipient_email,
                                "name": recipient_name,
                                "urgent_count": urgent_count,
                                "soon_count": soon_count
                            })
                        else:
                            errors.append(f"Failed to send to {recipient_email}: {result.get('error')}")
                    except Exception as e:
                        errors.append(f"Failed to send to {recipient_email}: {str(e)}")
            except ImportError as e:
                errors.append(f"Email service import error: {str(e)}")
        else:
            # Dry run - just record what would be sent
            for recipient_email, recipient_name in recipients:
                notifications.append({
                    "recipient": recipient_email,
                    "name": recipient_name,
                    "urgent_count": urgent_count,
                    "soon_count": soon_count,
                    "dry_run": True
                })

        return {
            "success": len(errors) == 0,
            "emails_sent": emails_sent,
            "dry_run": dry_run,
            "documents": {
                "urgent": urgent_count,
                "soon": len(soon_docs),
                "notified": urgent_count + soon_count
            },
            "notifications": notifications,
            "errors": errors
        }

    except psycopg2.Error as e:
        return {
            "success": False,
            "emails_sent": 0,
            "notifications": [],
            "errors": [f"Database error: {str(e)}"]
        }


def build_subject(urgent_count: int, soon_count: int) -> str:
    """Build email subject line based on document counts."""
    if urgent_count > 0 and soon_count > 0:
        return f"[Archevi] {urgent_count} document{'s' if urgent_count != 1 else ''} expiring soon + weekly digest"
    elif urgent_count > 0:
        return f"[Archevi] {urgent_count} document{'s' if urgent_count != 1 else ''} expiring within 7 days"
    elif soon_count > 0:
        return f"[Archevi] Weekly digest: {soon_count} document{'s' if soon_count != 1 else ''} expiring this month"
    return "[Archevi] Document expiry notification"


def build_notification_email(urgent_docs: list, soon_docs: list, today) -> str:
    """Build HTML email content for expiry notifications."""

    urgent_html = ""
    if urgent_docs:
        urgent_items = ""
        for doc in urgent_docs:
            doc_id, title, category, expiry_date, expiry_type, days_until, urgency = doc
            days_text = "today" if days_until == 0 else f"in {days_until} day{'s' if days_until != 1 else ''}"
            expiry_formatted = format_expiry_type(expiry_type)
            urgent_items += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <strong>{title}</strong>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">
                        {expiry_formatted} expires {days_text}
                    </div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #dc2626; font-weight: 600;">
                    {expiry_date}
                </td>
            </tr>
            """

        urgent_html = f"""
        <div style="margin-bottom: 24px;">
            <h2 style="color: #dc2626; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center;">
                Urgent - Expiring Within 7 Days
            </h2>
            <table style="width: 100%; border-collapse: collapse; background: #fef2f2; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #fee2e2;">
                        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #991b1b;">Document</th>
                        <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #991b1b;">Expiry Date</th>
                    </tr>
                </thead>
                <tbody>
                    {urgent_items}
                </tbody>
            </table>
        </div>
        """

    soon_html = ""
    if soon_docs:
        soon_items = ""
        for doc in soon_docs:
            doc_id, title, category, expiry_date, expiry_type, days_until, urgency = doc
            expiry_formatted = format_expiry_type(expiry_type)
            soon_items += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <strong>{title}</strong>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">
                        {expiry_formatted} expires in {days_until} days
                    </div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #d97706; font-weight: 600;">
                    {expiry_date}
                </td>
            </tr>
            """

        soon_html = f"""
        <div style="margin-bottom: 24px;">
            <h2 style="color: #d97706; font-size: 18px; margin-bottom: 12px;">
                Expiring This Month
            </h2>
            <table style="width: 100%; border-collapse: collapse; background: #fffbeb; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #fef3c7;">
                        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #92400e;">Document</th>
                        <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #92400e;">Expiry Date</th>
                    </tr>
                </thead>
                <tbody>
                    {soon_items}
                </tbody>
            </table>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #111; margin: 0; font-size: 24px;">Archevi</h1>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">Document Expiry Notification</p>
        </div>

        <p>Hi {{{{name}}}},</p>

        <p>This is a reminder about documents in your family vault that are expiring soon:</p>

        {urgent_html}

        {soon_html}

        <div style="margin-top: 24px; text-align: center;">
            <a href="https://archevi.ca"
               style="background: #000; color: #fff; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                View in Archevi
            </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

        <p style="color: #999; font-size: 12px; text-align: center;">
            You're receiving this because you're an admin of your family vault on Archevi.
            <br>
            <a href="https://archevi.ca/settings" style="color: #666;">Manage notification preferences</a>
        </p>
    </body>
    </html>
    """


def format_expiry_type(expiry_type: str) -> str:
    """Format expiry type for display."""
    type_map = {
        "expiry_date": "Document",
        "renewal_date": "Renewal",
        "due_date": "Due date",
        "policy_expiry": "Policy",
        "license_expiry": "License",
        "subscription_renewal": "Subscription",
        "warranty_expiry": "Warranty",
        "contract_end": "Contract"
    }
    return type_map.get(expiry_type, expiry_type.replace("_", " ").title())
