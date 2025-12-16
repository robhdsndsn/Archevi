# manage_document_shares.py
# Windmill Python script for managing document sharing between family members
# Path: f/chatbot/manage_document_shares
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Manage document sharing: share, unshare, list_shared_with_me, list_shared_by_me, get_document_shares.

Args:
    action (str): The action to perform
    document_id (str): UUID of the document (for share/unshare/get_document_shares)
    user_id (str): UUID of the current user
    tenant_id (str): UUID of the tenant
    share_data (dict): Data for sharing (shared_with_user_id, permission, message)

Returns:
    dict: Result of the operation
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional
import wmill


def main(
    action: str = "list_shared_with_me",
    document_id: Optional[str] = None,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    share_data: Optional[dict] = None,
) -> dict:
    """
    Manage document sharing in the database.

    Actions:
        - share: Share a document with another user
        - unshare: Remove sharing for a document
        - list_shared_with_me: Get documents shared with the current user
        - list_shared_by_me: Get documents the current user has shared
        - get_document_shares: Get all shares for a specific document
        - mark_notification_read: Mark a share notification as read
    """
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    try:
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "prefer"),
        )

        with conn.cursor(cursor_factory=RealDictCursor) as cursor:

            # ============================================
            # ACTION: share
            # ============================================
            if action == "share":
                if not document_id:
                    return {"success": False, "error": "document_id required"}
                if not user_id:
                    return {"success": False, "error": "user_id required"}
                if not share_data:
                    return {"success": False, "error": "share_data required"}

                shared_with = share_data.get("shared_with_user_id")
                permission = share_data.get("permission", "view")
                message = share_data.get("message")

                if not shared_with:
                    return {"success": False, "error": "shared_with_user_id required in share_data"}

                if permission not in ("view", "edit"):
                    return {"success": False, "error": "permission must be 'view' or 'edit'"}

                # Verify document exists and user can share it
                cursor.execute("""
                    SELECT d.id, d.tenant_id, d.created_by, d.title
                    FROM documents d
                    WHERE d.id = %s
                """, (document_id,))
                doc = cursor.fetchone()

                if not doc:
                    return {"success": False, "error": "Document not found"}

                # Check if user can share (must be creator or admin)
                cursor.execute("""
                    SELECT role FROM tenant_memberships
                    WHERE user_id = %s AND tenant_id = %s AND status = 'active'
                """, (user_id, doc["tenant_id"]))
                membership = cursor.fetchone()

                if not membership:
                    return {"success": False, "error": "User is not a member of this tenant"}

                can_share = (
                    str(doc["created_by"]) == str(user_id) or
                    membership["role"] in ("owner", "admin")
                )

                if not can_share:
                    return {"success": False, "error": "You don't have permission to share this document"}

                # Verify recipient is a member of the same tenant
                cursor.execute("""
                    SELECT u.name, u.email
                    FROM tenant_memberships tm
                    JOIN users u ON tm.user_id = u.id
                    WHERE tm.user_id = %s AND tm.tenant_id = %s AND tm.status = 'active'
                """, (shared_with, doc["tenant_id"]))
                recipient = cursor.fetchone()

                if not recipient:
                    return {"success": False, "error": "Recipient is not a member of this family"}

                # Can't share with yourself
                if str(shared_with) == str(user_id):
                    return {"success": False, "error": "Cannot share document with yourself"}

                # Create or update the share
                cursor.execute("""
                    INSERT INTO document_shares (document_id, shared_by_user_id, shared_with_user_id, permission, share_message)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (document_id, shared_with_user_id)
                    DO UPDATE SET
                        permission = EXCLUDED.permission,
                        share_message = EXCLUDED.share_message,
                        shared_by_user_id = EXCLUDED.shared_by_user_id,
                        created_at = NOW()
                    RETURNING id, created_at
                """, (document_id, user_id, shared_with, permission, message))

                share = cursor.fetchone()

                # Create notification for recipient
                cursor.execute("""
                    INSERT INTO share_notifications (share_id, user_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, (share["id"], shared_with))

                conn.commit()

                return {
                    "success": True,
                    "share_id": str(share["id"]),
                    "document_title": doc["title"],
                    "shared_with_name": recipient["name"],
                    "shared_with_email": recipient["email"],
                    "permission": permission,
                    "message": f"Document shared with {recipient['name']}"
                }

            # ============================================
            # ACTION: unshare
            # ============================================
            elif action == "unshare":
                if not document_id:
                    return {"success": False, "error": "document_id required"}
                if not user_id:
                    return {"success": False, "error": "user_id required"}
                if not share_data or not share_data.get("shared_with_user_id"):
                    return {"success": False, "error": "shared_with_user_id required in share_data"}

                shared_with = share_data["shared_with_user_id"]

                # Verify document exists
                cursor.execute("""
                    SELECT d.id, d.tenant_id, d.created_by, d.title
                    FROM documents d
                    WHERE d.id = %s
                """, (document_id,))
                doc = cursor.fetchone()

                if not doc:
                    return {"success": False, "error": "Document not found"}

                # Check permission to unshare
                cursor.execute("""
                    SELECT role FROM tenant_memberships
                    WHERE user_id = %s AND tenant_id = %s AND status = 'active'
                """, (user_id, doc["tenant_id"]))
                membership = cursor.fetchone()

                # Can unshare if: creator, admin, or original sharer
                cursor.execute("""
                    SELECT shared_by_user_id FROM document_shares
                    WHERE document_id = %s AND shared_with_user_id = %s
                """, (document_id, shared_with))
                existing_share = cursor.fetchone()

                if not existing_share:
                    return {"success": False, "error": "Share not found"}

                can_unshare = (
                    str(doc["created_by"]) == str(user_id) or
                    (membership and membership["role"] in ("owner", "admin")) or
                    str(existing_share["shared_by_user_id"]) == str(user_id)
                )

                if not can_unshare:
                    return {"success": False, "error": "You don't have permission to unshare this document"}

                # Delete the share (cascades to notifications)
                cursor.execute("""
                    DELETE FROM document_shares
                    WHERE document_id = %s AND shared_with_user_id = %s
                    RETURNING id
                """, (document_id, shared_with))

                deleted = cursor.fetchone()
                conn.commit()

                return {
                    "success": True,
                    "unshared": deleted is not None,
                    "message": "Document unshared successfully"
                }

            # ============================================
            # ACTION: list_shared_with_me
            # ============================================
            elif action == "list_shared_with_me":
                if not user_id:
                    return {"success": False, "error": "user_id required"}

                cursor.execute("""
                    SELECT
                        ds.id as share_id,
                        ds.document_id,
                        d.title as document_title,
                        d.category as document_category,
                        d.created_at as document_created_at,
                        SUBSTRING(d.content, 1, 200) as content_preview,
                        ds.shared_by_user_id as sharer_id,
                        sharer.name as sharer_name,
                        sharer.email as sharer_email,
                        ds.permission,
                        ds.share_message,
                        ds.created_at as shared_at,
                        sn.read_at,
                        sn.id as notification_id
                    FROM document_shares ds
                    JOIN documents d ON ds.document_id = d.id
                    JOIN users sharer ON ds.shared_by_user_id = sharer.id
                    LEFT JOIN share_notifications sn ON ds.id = sn.share_id AND sn.user_id = ds.shared_with_user_id
                    WHERE ds.shared_with_user_id = %s
                    ORDER BY ds.created_at DESC
                """, (user_id,))

                shares = cursor.fetchall()

                # Count unread
                unread_count = sum(1 for s in shares if s["read_at"] is None)

                return {
                    "success": True,
                    "shares": [
                        {
                            "share_id": str(s["share_id"]),
                            "document_id": str(s["document_id"]),
                            "document_title": s["document_title"],
                            "document_category": s["document_category"],
                            "document_created_at": s["document_created_at"].isoformat() if s["document_created_at"] else None,
                            "content_preview": s["content_preview"],
                            "sharer_id": str(s["sharer_id"]),
                            "sharer_name": s["sharer_name"],
                            "sharer_email": s["sharer_email"],
                            "permission": s["permission"],
                            "message": s["share_message"],
                            "shared_at": s["shared_at"].isoformat() if s["shared_at"] else None,
                            "is_read": s["read_at"] is not None,
                            "notification_id": str(s["notification_id"]) if s["notification_id"] else None,
                        }
                        for s in shares
                    ],
                    "total": len(shares),
                    "unread_count": unread_count
                }

            # ============================================
            # ACTION: list_shared_by_me
            # ============================================
            elif action == "list_shared_by_me":
                if not user_id:
                    return {"success": False, "error": "user_id required"}

                cursor.execute("""
                    SELECT
                        ds.id as share_id,
                        ds.document_id,
                        d.title as document_title,
                        d.category as document_category,
                        ds.shared_with_user_id as recipient_id,
                        recipient.name as recipient_name,
                        recipient.email as recipient_email,
                        ds.permission,
                        ds.share_message,
                        ds.created_at as shared_at
                    FROM document_shares ds
                    JOIN documents d ON ds.document_id = d.id
                    JOIN users recipient ON ds.shared_with_user_id = recipient.id
                    WHERE ds.shared_by_user_id = %s
                    ORDER BY ds.created_at DESC
                """, (user_id,))

                shares = cursor.fetchall()

                return {
                    "success": True,
                    "shares": [
                        {
                            "share_id": str(s["share_id"]),
                            "document_id": str(s["document_id"]),
                            "document_title": s["document_title"],
                            "document_category": s["document_category"],
                            "recipient_id": str(s["recipient_id"]),
                            "recipient_name": s["recipient_name"],
                            "recipient_email": s["recipient_email"],
                            "permission": s["permission"],
                            "message": s["share_message"],
                            "shared_at": s["shared_at"].isoformat() if s["shared_at"] else None,
                        }
                        for s in shares
                    ],
                    "total": len(shares)
                }

            # ============================================
            # ACTION: get_document_shares
            # ============================================
            elif action == "get_document_shares":
                if not document_id:
                    return {"success": False, "error": "document_id required"}

                cursor.execute("""
                    SELECT
                        ds.id as share_id,
                        ds.shared_with_user_id as user_id,
                        u.name,
                        u.email,
                        ds.permission,
                        ds.share_message,
                        ds.created_at as shared_at,
                        sharer.name as shared_by_name
                    FROM document_shares ds
                    JOIN users u ON ds.shared_with_user_id = u.id
                    JOIN users sharer ON ds.shared_by_user_id = sharer.id
                    WHERE ds.document_id = %s
                    ORDER BY ds.created_at DESC
                """, (document_id,))

                shares = cursor.fetchall()

                return {
                    "success": True,
                    "document_id": document_id,
                    "shares": [
                        {
                            "share_id": str(s["share_id"]),
                            "user_id": str(s["user_id"]),
                            "name": s["name"],
                            "email": s["email"],
                            "permission": s["permission"],
                            "message": s["share_message"],
                            "shared_at": s["shared_at"].isoformat() if s["shared_at"] else None,
                            "shared_by_name": s["shared_by_name"],
                        }
                        for s in shares
                    ],
                    "total": len(shares)
                }

            # ============================================
            # ACTION: mark_notification_read
            # ============================================
            elif action == "mark_notification_read":
                if not share_data or not share_data.get("share_id"):
                    return {"success": False, "error": "share_id required in share_data"}
                if not user_id:
                    return {"success": False, "error": "user_id required"}

                share_id = share_data["share_id"]

                cursor.execute("""
                    UPDATE share_notifications
                    SET read_at = NOW()
                    WHERE share_id = %s AND user_id = %s AND read_at IS NULL
                    RETURNING id
                """, (share_id, user_id))

                updated = cursor.fetchone()
                conn.commit()

                return {
                    "success": True,
                    "marked_read": updated is not None
                }

            # ============================================
            # ACTION: get_tenant_members (helper for share dialog)
            # ============================================
            elif action == "get_tenant_members":
                if not tenant_id:
                    return {"success": False, "error": "tenant_id required"}
                if not user_id:
                    return {"success": False, "error": "user_id required"}

                # Get all active members except current user
                cursor.execute("""
                    SELECT
                        u.id as user_id,
                        u.name,
                        u.email,
                        u.avatar_url,
                        tm.role
                    FROM tenant_memberships tm
                    JOIN users u ON tm.user_id = u.id
                    WHERE tm.tenant_id = %s
                      AND tm.status = 'active'
                      AND tm.user_id != %s
                    ORDER BY u.name
                """, (tenant_id, user_id))

                members = cursor.fetchall()

                return {
                    "success": True,
                    "members": [
                        {
                            "user_id": str(m["user_id"]),
                            "name": m["name"],
                            "email": m["email"],
                            "avatar_url": m["avatar_url"],
                            "role": m["role"],
                        }
                        for m in members
                    ],
                    "total": len(members)
                }

            else:
                return {"success": False, "error": f"Unknown action: {action}"}

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")
    finally:
        conn.close()
