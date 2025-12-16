"""
Create a new version of an existing document.

Used when updating a document to preserve history.
"""

from typing import TypedDict, Optional
import wmill


class CreateVersionResult(TypedDict):
    success: bool
    document_id: str
    version_number: int
    message: str


def main(
    document_id: str,
    title: str,
    content: str,
    tenant_id: str,
    user_id: str,
    change_summary: Optional[str] = None,
    change_type: str = 'update',
    file_size_bytes: Optional[int] = None,
    storage_path: Optional[str] = None,
    postgres_db: dict = None
) -> CreateVersionResult:
    """
    Create a new version of an existing document.

    Args:
        document_id: UUID of the document to version
        title: New title (or same as before)
        content: New content
        tenant_id: UUID of the tenant (for access control)
        user_id: UUID of the user making the change
        change_summary: Description of what changed
        change_type: One of 'update', 'correction', 'major_revision'
        file_size_bytes: Size of the new file
        storage_path: Path to the new file in storage
        postgres_db: PostgreSQL connection details

    Returns:
        CreateVersionResult with new version number
    """
    import psycopg2
    import hashlib
    from psycopg2.extras import RealDictCursor

    if postgres_db is None:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db.get('port', 5432),
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Verify document belongs to tenant
        cursor.execute("""
            SELECT id, title, content, content_hash, current_version
            FROM family_documents
            WHERE id = %s AND tenant_id = %s
        """, (document_id, tenant_id))

        doc = cursor.fetchone()
        if not doc:
            return {
                'success': False,
                'document_id': document_id,
                'version_number': 0,
                'message': 'Document not found or access denied'
            }

        # Compute new content hash
        normalized = ' '.join(content.lower().split())
        normalized_title = title.lower().strip()
        combined = f"{normalized_title}||{normalized}"
        new_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()

        # Check if content actually changed
        if new_hash == doc['content_hash']:
            return {
                'success': False,
                'document_id': document_id,
                'version_number': doc['current_version'] or 1,
                'message': 'Content unchanged - no new version created'
            }

        # Get next version number
        cursor.execute("""
            SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
            FROM document_versions
            WHERE document_id = %s
        """, (document_id,))

        next_version = cursor.fetchone()['next_version']

        # Auto-generate change summary if not provided
        if not change_summary:
            if title != doc['title']:
                change_summary = f"Title changed from '{doc['title']}' to '{title}'"
            else:
                change_summary = f"Content updated"

        # Create version record
        cursor.execute("""
            INSERT INTO document_versions (
                document_id, version_number, title, content, content_hash,
                file_size_bytes, storage_path, change_summary, change_type, created_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            document_id,
            next_version,
            title,
            content,
            new_hash,
            file_size_bytes,
            storage_path,
            change_summary,
            change_type,
            user_id
        ))

        # Update the main document
        cursor.execute("""
            UPDATE family_documents
            SET title = %s,
                content = %s,
                content_hash = %s,
                file_size_bytes = COALESCE(%s, file_size_bytes),
                source_file = COALESCE(%s, source_file),
                current_version = %s,
                version_count = %s,
                updated_at = NOW(),
                updated_by = %s
            WHERE id = %s
        """, (
            title,
            content,
            new_hash,
            file_size_bytes,
            storage_path,
            next_version,
            next_version,
            user_id,
            document_id
        ))

        conn.commit()

        return {
            'success': True,
            'document_id': document_id,
            'version_number': next_version,
            'message': f'Created version {next_version}'
        }

    except Exception as e:
        conn.rollback()
        return {
            'success': False,
            'document_id': document_id,
            'version_number': 0,
            'message': f'Failed to create version: {str(e)}'
        }

    finally:
        conn.close()
