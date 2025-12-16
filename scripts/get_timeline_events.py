# get_timeline_events.py
# Windmill Python script for fetching timeline events
# Path: f/chatbot/get_timeline_events
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Fetch timeline events for a tenant with optional filters.

Args:
    tenant_id (str): Tenant UUID for multi-tenant isolation
    start_date (str, optional): Filter events on or after this date (YYYY-MM-DD)
    end_date (str, optional): Filter events on or before this date (YYYY-MM-DD)
    event_types (list[str], optional): Filter by event types
    family_member_id (int, optional): Filter by family member
    document_id (str, optional): Filter by source document (UUID)
    limit (int): Maximum events to return (default 100)
    offset (int): Pagination offset (default 0)

Returns:
    dict: {
        success: bool,
        events: list[dict],
        total_count: int,
        summary: dict (event counts by type/year),
        error: str (if failed)
    }
"""

import psycopg2
import psycopg2.extras
from typing import Optional
import wmill


def main(
    tenant_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_types: Optional[list] = None,
    family_member_id: Optional[int] = None,
    document_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> dict:
    """Fetch timeline events with optional filters."""

    if not tenant_id:
        return {"success": False, "error": "tenant_id is required"}

    # Validate limit
    limit = min(max(1, limit), 500)
    offset = max(0, offset)

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

        # Build query with filters
        query = """
            SELECT
                te.id,
                te.event_date,
                te.event_end_date,
                te.event_time,
                te.event_type,
                te.title,
                te.description,
                te.document_id,
                d.title AS document_title,
                te.family_member_id,
                COALESCE(te.family_member_name, fm.name) AS family_member_name,
                te.source,
                te.confidence,
                te.created_at
            FROM timeline_events te
            LEFT JOIN family_documents d ON te.document_id = d.id
            LEFT JOIN family_members fm ON te.family_member_id = fm.id
            WHERE te.tenant_id = %s
        """
        params = [tenant_id]

        # Add filters
        if start_date:
            query += " AND te.event_date >= %s"
            params.append(start_date)

        if end_date:
            query += " AND te.event_date <= %s"
            params.append(end_date)

        if event_types and len(event_types) > 0:
            query += " AND te.event_type = ANY(%s)"
            params.append(event_types)

        if family_member_id:
            query += " AND te.family_member_id = %s"
            params.append(family_member_id)

        if document_id:
            query += " AND te.document_id = %s"
            params.append(document_id)

        # Count total before pagination
        count_query = f"SELECT COUNT(*) FROM ({query}) AS filtered"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['count']

        # Add ordering and pagination
        query += " ORDER BY te.event_date DESC, te.event_time DESC NULLS LAST"
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        events = cursor.fetchall()

        # Format events for JSON serialization
        formatted_events = []
        for event in events:
            formatted_event = dict(event)
            # Convert dates/times to strings
            if formatted_event.get('event_date'):
                formatted_event['event_date'] = str(formatted_event['event_date'])
            if formatted_event.get('event_end_date'):
                formatted_event['event_end_date'] = str(formatted_event['event_end_date'])
            if formatted_event.get('event_time'):
                formatted_event['event_time'] = str(formatted_event['event_time'])
            if formatted_event.get('created_at'):
                formatted_event['created_at'] = formatted_event['created_at'].isoformat()
            formatted_events.append(formatted_event)

        # Get summary (event counts by type and year)
        summary_query = """
            SELECT
                EXTRACT(YEAR FROM event_date)::INTEGER AS year,
                event_type,
                COUNT(*)::INTEGER AS count
            FROM timeline_events
            WHERE tenant_id = %s
            GROUP BY EXTRACT(YEAR FROM event_date), event_type
            ORDER BY year DESC, count DESC
        """
        cursor.execute(summary_query, (tenant_id,))
        summary_rows = cursor.fetchall()

        # Organize summary by year
        summary = {
            'by_year': {},
            'by_type': {},
            'total': total_count,
        }

        for row in summary_rows:
            year = row['year']
            event_type = row['event_type']
            count = row['count']

            # By year
            if year not in summary['by_year']:
                summary['by_year'][year] = {'total': 0, 'types': {}}
            summary['by_year'][year]['total'] += count
            summary['by_year'][year]['types'][event_type] = count

            # By type
            if event_type not in summary['by_type']:
                summary['by_type'][event_type] = 0
            summary['by_type'][event_type] += count

        cursor.close()
        conn.close()

        return {
            "success": True,
            "events": formatted_events,
            "total_count": total_count,
            "summary": summary,
            "limit": limit,
            "offset": offset,
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to fetch events: {str(e)}"}
