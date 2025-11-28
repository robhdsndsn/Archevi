"""Check current database state"""
import wmill
import psycopg2

def main() -> dict:
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "disable")
        )

    cursor = conn.cursor()

    # Get all tables
    cursor.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = [row[0] for row in cursor.fetchall()]

    # Check for specific columns in documents if exists
    doc_columns = []
    if 'documents' in tables:
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'documents'
            ORDER BY ordinal_position
        """)
        doc_columns = [row[0] for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return {
        "tables": tables,
        "documents_columns": doc_columns
    }
