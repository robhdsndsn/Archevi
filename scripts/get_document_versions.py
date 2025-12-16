"""
Get version history for a document.

Returns all versions of a document with metadata, sorted by version number descending.
"""

from typing import TypedDict, Optional
import wmill


class VersionInfo(TypedDict):
    version_number: int
    title: str
    content_preview: str
    content_hash: str
    file_size_bytes: Optional[int]
    change_summary: Optional[str]
    change_type: str
    created_by_name: Optional[str]
    created_at: str
    is_current: bool


class DocumentVersionsResult(TypedDict):
    document_id: str
    document_title: str
    current_version: int
    version_count: int
    versions: list[VersionInfo]


def main(
    document_id: str,
    tenant_id: str,
    postgres_db: dict = None
) -> DocumentVersionsResult:
    """
    Get version history for a document.

    Args:
        document_id: UUID of the document
        tenant_id: UUID of the tenant (for access control)
        postgres_db: PostgreSQL connection details

    Returns:
        DocumentVersionsResult with version history
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

        # First, verify document exists and belongs to tenant
        cursor.execute("""
            SELECT id, title, current_version, version_count
            FROM family_documents
            WHERE id = %s AND tenant_id = %s
        """, (document_id, tenant_id))

        doc = cursor.fetchone()
        if not doc:
            raise ValueError(f"Document {document_id} not found or access denied")

        # Get version history
        # Note: created_by stores email/name directly (TEXT), not a user ID
        cursor.execute("""
            SELECT
                dv.version_number,
                dv.title,
                LEFT(dv.content, 200) as content_preview,
                dv.content_hash,
                dv.file_size_bytes,
                dv.change_summary,
                dv.change_type,
                dv.created_by as created_by_name,
                dv.created_at::text as created_at
            FROM document_versions dv
            WHERE dv.document_id = %s
            ORDER BY dv.version_number DESC
        """, (document_id,))

        versions = cursor.fetchall()

        # Mark current version
        result_versions = []
        for v in versions:
            version_info: VersionInfo = {
                'version_number': v['version_number'],
                'title': v['title'],
                'content_preview': v['content_preview'] or '',
                'content_hash': v['content_hash'],
                'file_size_bytes': v['file_size_bytes'],
                'change_summary': v['change_summary'],
                'change_type': v['change_type'] or 'update',
                'created_by_name': v['created_by_name'],
                'created_at': v['created_at'],
                'is_current': v['version_number'] == doc['current_version']
            }
            result_versions.append(version_info)

        return {
            'document_id': str(doc['id']),
            'document_title': doc['title'],
            'current_version': doc['current_version'] or 1,
            'version_count': doc['version_count'] or len(result_versions),
            'versions': result_versions
        }

    finally:
        conn.close()
