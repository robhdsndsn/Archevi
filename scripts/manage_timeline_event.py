# manage_timeline_event.py
# Windmill Python script for creating, updating, and deleting timeline events
# Path: f/chatbot/manage_timeline_event
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Create, update, or delete timeline events.

Args:
    action (str): 'create', 'update', or 'delete'
    tenant_id (str): Tenant UUID for multi-tenant isolation
    event_id (int, optional): Required for update/delete
    event_date (str, optional): Event date (YYYY-MM-DD)
    event_end_date (str, optional): End date for periods
    event_time (str, optional): Time of day (HH:MM)
    event_type (str, optional): Event type
    title (str, optional): Event title
    description (str, optional): Event description
    document_id (str, optional): Associated document (UUID)
    family_member_id (int, optional): Associated family member
    family_member_name (str, optional): Name if no member ID
    user_id (int, optional): User performing the action

Returns:
    dict: {
        success: bool,
        event: dict (for create/update),
        message: str,
        error: str (if failed)
    }
"""

import psycopg2
import psycopg2.extras
from typing import Optional
import wmill


VALID_EVENT_TYPES = [
    'birth', 'death', 'wedding', 'anniversary', 'graduation',
    'medical', 'legal', 'financial', 'insurance', 'purchase',
    'travel', 'milestone', 'photo', 'other'
]


def main(
    action: str,
    tenant_id: str,
    event_id: Optional[int] = None,
    event_date: Optional[str] = None,
    event_end_date: Optional[str] = None,
    event_time: Optional[str] = None,
    event_type: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    document_id: Optional[str] = None,
    family_member_id: Optional[int] = None,
    family_member_name: Optional[str] = None,
    user_id: Optional[int] = None,
) -> dict:
    """Manage timeline events (create, update, delete)."""

    if not tenant_id:
        return {"success": False, "error": "tenant_id is required"}

    if action not in ['create', 'update', 'delete']:
        return {"success": False, "error": "action must be 'create', 'update', or 'delete'"}

    if action in ['update', 'delete'] and not event_id:
        return {"success": False, "error": "event_id is required for update/delete"}

    if action == 'create':
        if not event_date:
            return {"success": False, "error": "event_date is required for create"}
        if not event_type:
            return {"success": False, "error": "event_type is required for create"}
        if not title:
            return {"success": False, "error": "title is required for create"}

    # Validate event_type
    if event_type and event_type not in VALID_EVENT_TYPES:
        return {"success": False, "error": f"Invalid event_type. Must be one of: {', '.join(VALID_EVENT_TYPES)}"}

    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if action == 'create':
            cursor.execute("""
                INSERT INTO timeline_events (
                    tenant_id, event_date, event_end_date, event_time,
                    event_type, title, description, document_id,
                    family_member_id, family_member_name, source, created_by
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, event_date, event_type, title, created_at
            """, (
                tenant_id, event_date, event_end_date, event_time,
                event_type, title, description, document_id,
                family_member_id, family_member_name, 'manual', user_id
            ))

            result = cursor.fetchone()
            conn.commit()

            return {
                "success": True,
                "event": {
                    "id": result['id'],
                    "event_date": str(result['event_date']),
                    "event_type": result['event_type'],
                    "title": result['title'],
                    "created_at": result['created_at'].isoformat(),
                },
                "message": "Event created successfully"
            }

        elif action == 'update':
            # Verify event belongs to tenant
            cursor.execute("""
                SELECT id FROM timeline_events
                WHERE id = %s AND tenant_id = %s
            """, (event_id, tenant_id))

            if not cursor.fetchone():
                return {"success": False, "error": "Event not found or access denied"}

            # Build dynamic update
            updates = []
            params = []

            if event_date is not None:
                updates.append("event_date = %s")
                params.append(event_date)

            if event_end_date is not None:
                updates.append("event_end_date = %s")
                params.append(event_end_date if event_end_date else None)

            if event_time is not None:
                updates.append("event_time = %s")
                params.append(event_time if event_time else None)

            if event_type is not None:
                updates.append("event_type = %s")
                params.append(event_type)

            if title is not None:
                updates.append("title = %s")
                params.append(title)

            if description is not None:
                updates.append("description = %s")
                params.append(description)

            if document_id is not None:
                updates.append("document_id = %s")
                params.append(document_id if document_id else None)

            if family_member_id is not None:
                updates.append("family_member_id = %s")
                params.append(family_member_id if family_member_id > 0 else None)

            if family_member_name is not None:
                updates.append("family_member_name = %s")
                params.append(family_member_name if family_member_name else None)

            if not updates:
                return {"success": False, "error": "No fields to update"}

            params.extend([event_id, tenant_id])
            query = f"""
                UPDATE timeline_events
                SET {', '.join(updates)}
                WHERE id = %s AND tenant_id = %s
                RETURNING id, event_date, event_type, title, updated_at
            """

            cursor.execute(query, params)
            result = cursor.fetchone()
            conn.commit()

            return {
                "success": True,
                "event": {
                    "id": result['id'],
                    "event_date": str(result['event_date']),
                    "event_type": result['event_type'],
                    "title": result['title'],
                    "updated_at": result['updated_at'].isoformat(),
                },
                "message": "Event updated successfully"
            }

        elif action == 'delete':
            cursor.execute("""
                DELETE FROM timeline_events
                WHERE id = %s AND tenant_id = %s
                RETURNING id, title
            """, (event_id, tenant_id))

            result = cursor.fetchone()

            if not result:
                return {"success": False, "error": "Event not found or access denied"}

            conn.commit()

            return {
                "success": True,
                "message": f"Event '{result['title']}' deleted successfully"
            }

        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Operation failed: {str(e)}"}
