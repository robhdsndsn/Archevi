# get_expiring_documents.py
# Windmill Python script for retrieving documents with upcoming expiry dates
# Path: f/chatbot/get_expiring_documents
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Get documents with expiry dates within a specified number of days.

Args:
    days: int - Number of days to look ahead (default 90)

Returns:
    dict: {
        success: bool,
        documents: list[{
            id: int,
            title: str,
            category: str,
            expiry_date: str,
            expiry_type: str,
            days_until_expiry: int,
            confidence: float
        }],
        total: int
    }
"""

import psycopg2
import wmill
from datetime import datetime, timedelta


def main(days: int = 90) -> dict:
    """Get documents expiring within the specified number of days."""
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
        cursor = conn.cursor()

        # Calculate date range
        today = datetime.now().date()
        end_date = today + timedelta(days=days)

        # Query documents with expiry dates in metadata
        cursor.execute("""
            WITH expiry_data AS (
                SELECT
                    fd.id,
                    fd.title,
                    fd.category,
                    expiry->>'date' as expiry_date,
                    expiry->>'type' as expiry_type,
                    (expiry->>'confidence')::float as confidence
                FROM family_documents fd,
                     jsonb_array_elements(fd.metadata->'expiry_dates') as expiry
                WHERE fd.metadata->'expiry_dates' IS NOT NULL
                  AND jsonb_array_length(fd.metadata->'expiry_dates') > 0
            )
            SELECT
                id,
                title,
                category,
                expiry_date,
                expiry_type,
                confidence,
                (expiry_date::date - CURRENT_DATE) as days_until
            FROM expiry_data
            WHERE expiry_date::date >= CURRENT_DATE
              AND expiry_date::date <= %s
            ORDER BY expiry_date::date ASC
        """, (end_date,))

        rows = cursor.fetchall()
        documents = []
        for row in rows:
            documents.append({
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "expiry_date": row[3],
                "expiry_type": row[4],
                "confidence": row[5] or 0.5,
                "days_until_expiry": row[6]
            })

        cursor.close()
        conn.close()

        # Group by urgency
        urgent = [d for d in documents if d["days_until_expiry"] <= 7]
        soon = [d for d in documents if 7 < d["days_until_expiry"] <= 30]
        upcoming = [d for d in documents if d["days_until_expiry"] > 30]

        return {
            "success": True,
            "documents": documents,
            "total": len(documents),
            "by_urgency": {
                "urgent": len(urgent),
                "soon": len(soon),
                "upcoming": len(upcoming)
            }
        }

    except psycopg2.Error as e:
        return {
            "success": False,
            "documents": [],
            "total": 0,
            "error": str(e)
        }
