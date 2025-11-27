# get_conversation_history.py
# Windmill Python script for retrieving conversation history
# Path: f/chatbot/get_conversation_history
#
# requirements:
#   - psycopg2-binary

"""
Retrieve conversation history from the Family Second Brain chatbot.

This script fetches past conversations, either for a specific session
or the most recent conversations across all sessions.

Args:
    session_id (str, optional): Specific session to retrieve. If None, returns recent conversations.
    limit (int): Maximum number of messages to return (default: 20)
    user_email (str, optional): Filter by user email

Returns:
    list: List of conversation objects with {role, content, sources, timestamp, session_id}

Example:
    # Get specific session
    history = await f.chatbot.get_conversation_history(
        session_id="abc-123",
        limit=50
    )

    # Get recent conversations
    recent = await f.chatbot.get_conversation_history(limit=10)
"""

import psycopg2
import json
from typing import Optional, List
from datetime import datetime


def main(
    session_id: Optional[str] = None,
    limit: int = 20,
    user_email: Optional[str] = None,
    postgres_db: dict = None,  # Windmill resource: f/chatbot/postgres_db
) -> List[dict]:
    """
    Retrieve conversation history from the database.
    """
    # Validate limit
    if limit < 1:
        limit = 1
    elif limit > 100:
        limit = 100

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

        # Build query based on parameters
        if session_id:
            # Get specific session's conversations
            if user_email:
                cursor.execute("""
                    SELECT session_id, role, content, sources, created_at, user_email
                    FROM conversations
                    WHERE session_id = %s AND user_email = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (session_id, user_email, limit))
            else:
                cursor.execute("""
                    SELECT session_id, role, content, sources, created_at, user_email
                    FROM conversations
                    WHERE session_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (session_id, limit))
        else:
            # Get recent conversations across all sessions
            if user_email:
                cursor.execute("""
                    SELECT session_id, role, content, sources, created_at, user_email
                    FROM conversations
                    WHERE user_email = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (user_email, limit))
            else:
                cursor.execute("""
                    SELECT session_id, role, content, sources, created_at, user_email
                    FROM conversations
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")

    # Format results
    conversations = []
    for row in rows:
        session, role, content, sources, created_at, email = row

        # Parse sources JSON if present
        parsed_sources = None
        if sources:
            try:
                parsed_sources = json.loads(sources) if isinstance(sources, str) else sources
            except json.JSONDecodeError:
                parsed_sources = None

        # Format timestamp in ISO 8601
        timestamp = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)

        conversations.append({
            "session_id": str(session),
            "role": role,
            "content": content,
            "sources": parsed_sources,
            "timestamp": timestamp,
            "user_email": email
        })

    # Reverse to show oldest first (chronological order)
    conversations.reverse()

    return conversations
