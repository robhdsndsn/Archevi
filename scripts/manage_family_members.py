# manage_family_members.py
# Windmill Python script for managing family members
# Path: f/chatbot/manage_family_members
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Manage family members: list, add, update, remove.

Args:
    action (str): 'list', 'add', 'update', 'remove'
    member_data (dict): Data for the member (for add/update)
    member_id (int): ID for update/remove operations

Returns:
    dict: Result of the operation with members list or status
"""

import psycopg2
from typing import Optional
import wmill


def main(
    action: str = "list",
    member_data: Optional[dict] = None,
    member_id: Optional[int] = None
) -> dict:
    """
    Manage family members in the database.
    """
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

        if action == "list":
            cursor.execute("""
                SELECT id, email, name, role, avatar_url, created_at, last_active, is_active,
                       password_hash IS NOT NULL as has_password,
                       COALESCE(email_verified, false) as email_verified,
                       last_login,
                       invite_token IS NOT NULL AND invite_expires > NOW() as invite_pending
                FROM family_members
                WHERE is_active = true
                ORDER BY
                    CASE role WHEN 'admin' THEN 0 ELSE 1 END,
                    name
            """)
            rows = cursor.fetchall()
            members = [
                {
                    "id": row[0],
                    "email": row[1],
                    "name": row[2],
                    "role": row[3],
                    "avatar_url": row[4],
                    "created_at": row[5].isoformat() if row[5] else None,
                    "last_active": row[6].isoformat() if row[6] else None,
                    "is_active": row[7],
                    "has_password": row[8],
                    "email_verified": row[9],
                    "last_login": row[10].isoformat() if row[10] else None,
                    "invite_pending": row[11]
                }
                for row in rows
            ]
            cursor.close()
            conn.close()
            return {"success": True, "members": members, "count": len(members)}

        elif action == "add":
            if not member_data:
                return {"success": False, "error": "member_data required for add action"}

            email = member_data.get("email")
            name = member_data.get("name")
            role = member_data.get("role", "member")
            avatar_url = member_data.get("avatar_url")

            if not email or not name:
                return {"success": False, "error": "email and name are required"}

            cursor.execute("""
                INSERT INTO family_members (email, name, role, avatar_url)
                VALUES (%s, %s, %s, %s)
                RETURNING id, email, name, role, avatar_url, created_at
            """, (email, name, role, avatar_url))

            row = cursor.fetchone()
            conn.commit()

            new_member = {
                "id": row[0],
                "email": row[1],
                "name": row[2],
                "role": row[3],
                "avatar_url": row[4],
                "created_at": row[5].isoformat() if row[5] else None
            }

            cursor.close()
            conn.close()
            return {"success": True, "member": new_member, "message": "Member added successfully"}

        elif action == "update":
            if not member_id:
                return {"success": False, "error": "member_id required for update action"}
            if not member_data:
                return {"success": False, "error": "member_data required for update action"}

            updates = []
            values = []

            if "name" in member_data:
                updates.append("name = %s")
                values.append(member_data["name"])
            if "email" in member_data:
                updates.append("email = %s")
                values.append(member_data["email"])
            if "role" in member_data:
                updates.append("role = %s")
                values.append(member_data["role"])
            if "avatar_url" in member_data:
                updates.append("avatar_url = %s")
                values.append(member_data["avatar_url"])

            if not updates:
                return {"success": False, "error": "No fields to update"}

            values.append(member_id)

            cursor.execute(f"""
                UPDATE family_members
                SET {', '.join(updates)}
                WHERE id = %s
                RETURNING id, email, name, role, avatar_url
            """, values)

            row = cursor.fetchone()
            if not row:
                return {"success": False, "error": "Member not found"}

            conn.commit()

            updated_member = {
                "id": row[0],
                "email": row[1],
                "name": row[2],
                "role": row[3],
                "avatar_url": row[4]
            }

            cursor.close()
            conn.close()
            return {"success": True, "member": updated_member, "message": "Member updated successfully"}

        elif action == "remove":
            if not member_id:
                return {"success": False, "error": "member_id required for remove action"}

            # Soft delete - set is_active to false
            cursor.execute("""
                UPDATE family_members
                SET is_active = false
                WHERE id = %s
                RETURNING id, name
            """, (member_id,))

            row = cursor.fetchone()
            if not row:
                return {"success": False, "error": "Member not found"}

            conn.commit()
            cursor.close()
            conn.close()
            return {"success": True, "message": f"Member '{row[1]}' removed successfully"}

        else:
            return {"success": False, "error": f"Unknown action: {action}"}

    except psycopg2.IntegrityError as e:
        if "unique" in str(e).lower():
            return {"success": False, "error": "A member with this email already exists"}
        raise
    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")
