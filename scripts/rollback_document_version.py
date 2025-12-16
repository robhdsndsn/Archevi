"""
Rollback a document to a previous version.

Creates a new version from an older version's content, preserving history.
"""

from typing import TypedDict, Optional
import wmill


class RollbackResult(TypedDict):
    success: bool
    document_id: str
    new_version_number: int
    rolled_back_from: int
    rolled_back_to: int
    message: str


def main(
    document_id: str,
    target_version: int,
    tenant_id: str,
    user_id: str,
    postgres_db: dict = None
) -> RollbackResult:
    """
    Rollback a document to a previous version.

    Args:
        document_id: UUID of the document
        target_version: Version number to rollback to
        tenant_id: UUID of the tenant (for access control)
        user_id: UUID of the user performing the rollback
        postgres_db: PostgreSQL connection details

    Returns:
        RollbackResult with operation status
    """
    import psycopg2
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
            SELECT id, title, current_version
            FROM family_documents
            WHERE id = %s AND tenant_id = %s
        """, (document_id, tenant_id))

        doc = cursor.fetchone()
        if not doc:
            return {
                'success': False,
                'document_id': document_id,
                'new_version_number': 0,
                'rolled_back_from': 0,
                'rolled_back_to': target_version,
                'message': 'Document not found or access denied'
            }

        current_version = doc['current_version'] or 1

        # Can't rollback to current version
        if target_version == current_version:
            return {
                'success': False,
                'document_id': document_id,
                'new_version_number': current_version,
                'rolled_back_from': current_version,
                'rolled_back_to': target_version,
                'message': f'Already at version {target_version}'
            }

        # Get the target version content
        cursor.execute("""
            SELECT version_number, title, content, content_hash,
                   file_size_bytes, storage_path
            FROM document_versions
            WHERE document_id = %s AND version_number = %s
        """, (document_id, target_version))

        target = cursor.fetchone()
        if not target:
            return {
                'success': False,
                'document_id': document_id,
                'new_version_number': 0,
                'rolled_back_from': current_version,
                'rolled_back_to': target_version,
                'message': f'Version {target_version} not found'
            }

        # Create new version with the old content (preserves history)
        cursor.execute("""
            INSERT INTO document_versions (
                document_id, version_number, title, content, content_hash,
                file_size_bytes, storage_path, change_summary, change_type, created_by
            )
            SELECT
                %s,
                COALESCE(MAX(version_number), 0) + 1,
                %s, %s, %s, %s, %s,
                %s,
                'correction',
                %s
            FROM document_versions
            WHERE document_id = %s
            RETURNING version_number
        """, (
            document_id,
            target['title'],
            target['content'],
            target['content_hash'],
            target['file_size_bytes'],
            target['storage_path'],
            f'Rolled back to version {target_version}',
            user_id,
            document_id
        ))

        new_version = cursor.fetchone()['version_number']

        # Update the main document
        cursor.execute("""
            UPDATE family_documents
            SET title = %s,
                content = %s,
                content_hash = %s,
                file_size_bytes = %s,
                source_file = %s,
                current_version = %s,
                version_count = %s,
                updated_at = NOW(),
                updated_by = %s
            WHERE id = %s
        """, (
            target['title'],
            target['content'],
            target['content_hash'],
            target['file_size_bytes'],
            target['storage_path'],
            new_version,
            new_version,
            user_id,
            document_id
        ))

        conn.commit()

        return {
            'success': True,
            'document_id': document_id,
            'new_version_number': new_version,
            'rolled_back_from': current_version,
            'rolled_back_to': target_version,
            'message': f'Successfully rolled back to version {target_version}'
        }

    except Exception as e:
        conn.rollback()
        return {
            'success': False,
            'document_id': document_id,
            'new_version_number': 0,
            'rolled_back_from': 0,
            'rolled_back_to': target_version,
            'message': f'Rollback failed: {str(e)}'
        }

    finally:
        conn.close()
