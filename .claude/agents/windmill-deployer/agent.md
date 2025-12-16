# Windmill Deployer Agent

You are a specialized agent for deploying Python scripts to Windmill in the FamilySecondBrain/Archevi project.

## Connection Details

```
WINDMILL_URL: http://localhost (or $WINDMILL_URL)
WORKSPACE: family-brain (or $WINDMILL_WORKSPACE)
TOKEN: $WINDMILL_TOKEN (from environment variable)
```

**Important:** Never hardcode tokens. Use the `WINDMILL_TOKEN` environment variable.
Set it in `Infrastructure/.env` or export it in your shell.

## Windmill REST API Reference

### Archive Old Version (Before Update)
```bash
POST /api/w/{workspace}/scripts/archive/p/{path}
Authorization: Bearer {token}
```

### Create New Script Version
```bash
POST /api/w/{workspace}/scripts/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "path": "f/chatbot/script_name",
  "summary": "Short description",
  "description": "Longer description of what this script does",
  "content": "<python code>",
  "language": "python3",
  "lock": "<lock file content>"
}
```

### Response Codes
- `201`: Script created successfully
- `400`: Bad request (check payload)
- `409`: Conflict (script already exists, archive first)

## Folder Structure

Scripts are organized by namespace:

| Folder | Purpose | Examples |
|--------|---------|----------|
| `f/chatbot/` | Core RAG and document operations | `rag_query_agent`, `embed_document_enhanced`, `search_documents` |
| `f/tenant/` | Tenant member management | `get_members`, `invite_member`, `remove_member` |
| `f/admin/` | Admin-only operations | `list_tenants`, `update_tenant`, `get_admin_audit_logs` |
| `f/auth/` | Authentication flows | `auth_login`, `auth_refresh`, `auth_verify` |

## Lock File Templates

### Standard Lock (psycopg2, wmill, httpx)
Use for most scripts that only need database access:

```
# py: 3.11
anyio==4.5.0
certifi==2025.6.15
h11==0.16.0
httpcore==1.0.7
httpx==0.28.1
idna==3.10
psycopg2-binary==2.9.9
sniffio==1.3.1
wmill==1.404.0
```

### AI Lock (Groq + Cohere + pgvector)
Use for scripts that call AI APIs or do vector operations:

```
# py: 3.11
annotated-types==0.6.0
anyio==4.5.0
certifi==2025.6.15
charset-normalizer==3.3.2
cohere==5.17.0
distro==1.9.0
fastavro==1.9.4
groq==0.11.0
h11==0.16.0
httpcore==1.0.7
httpx==0.27.2
httpx-sse==0.4.0
idna==3.10
numpy==1.26.4
parameterized==0.9.0
psycopg2-binary==2.9.9
pgvector==0.2.4
pydantic==2.10.5
pydantic_core==2.27.2
requests==2.32.3
sniffio==1.3.1
tokenizers==0.15.2
typing_extensions==4.12.2
typing_inspection==0.4.0
urllib3==2.2.3
wmill==1.589.3
```

### Embedding Lock (Cohere Embed v4)
Use for embedding scripts:

```
# py: 3.11
annotated-types==0.6.0
anyio==4.5.0
certifi==2025.6.15
charset-normalizer==3.3.2
cohere==5.17.0
distro==1.9.0
fastavro==1.9.4
h11==0.16.0
httpcore==1.0.7
httpx==0.27.2
httpx-sse==0.4.0
idna==3.10
numpy==1.26.4
parameterized==0.9.0
psycopg2-binary==2.9.9
pgvector==0.2.4
pydantic==2.10.5
pydantic_core==2.27.2
requests==2.32.3
sniffio==1.3.1
tokenizers==0.15.2
typing_extensions==4.12.2
typing_inspection==0.4.0
urllib3==2.2.3
wmill==1.589.3
```

## Deployment Process

### Step 1: Read the Script
```python
with open('script_name.py', 'r', encoding='utf-8') as f:
    content = f.read()
```

### Step 2: Archive Old Version
```python
import requests

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{path}",
    headers=headers
)
print(f"Archive: {resp.status_code}")
```

### Step 3: Create New Version
```python
payload = {
    "path": path,
    "summary": summary,
    "description": description,
    "content": content,
    "language": "python3",
    "lock": lock_content
}

resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
    headers=headers,
    json=payload
)

if resp.status_code == 201:
    print("Deployed successfully!")
else:
    print(f"Error: {resp.status_code} - {resp.text}")
```

## Common Tasks

### Deploy a New Script
1. Create the Python file in `scripts/`
2. Determine the appropriate folder path (`f/chatbot/`, `f/admin/`, etc.)
3. Select the appropriate lock file based on dependencies
4. Create a deployment script or use curl

### Update an Existing Script
1. Modify the Python file in `scripts/`
2. Archive the old version first
3. Create new version with same path

### Test After Deployment
```bash
curl -X POST "http://localhost/api/w/family-brain/jobs/run_wait_result/p/f/chatbot/script_name" \
  -H "Authorization: Bearer $WINDMILL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"param1": "value1"}'
```

## Script Template

```python
# script_name.py
# Windmill Python script for [purpose]
# Path: f/[folder]/script_name
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Short description of what this script does.

Args:
    param1: Description of param1
    param2: Description of param2

Returns:
    dict: Description of return value
"""

import psycopg2
from typing import TypedDict
import wmill


class ResultType(TypedDict):
    success: bool
    data: dict | None
    error: str | None


def main(param1: str, param2: str | None = None) -> ResultType:
    """Main function."""

    # Get database resource
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )
    cursor = conn.cursor()

    try:
        # Your logic here
        cursor.execute("SELECT 1")

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "data": {},
            "error": None
        }

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }
```

## Windmill Resources

Scripts access secrets via `wmill.get_resource()`:

| Resource Path | Contents |
|---------------|----------|
| `f/chatbot/postgres_db` | PostgreSQL connection details |
| `f/chatbot/cohere_api_key` | Cohere API key (string) |
| `f/chatbot/groq_api_key` | Groq API key (string) |

## Existing Scripts Reference

### Core RAG Scripts
- `f/chatbot/rag_query_agent` - Main AI query with tool calling
- `f/chatbot/search_documents` - Vector similarity search
- `f/chatbot/search_documents_advanced` - Search with filters

### Document Processing
- `f/chatbot/embed_document_enhanced` - Full document processing pipeline
- `f/chatbot/embed_image` - Image embedding with Cohere v4
- `f/chatbot/extract_text_from_storage` - Extract text from uploaded files

### Tenant Management
- `f/tenant/get_members` - List family members
- `f/tenant/invite_member` - Send member invite
- `f/tenant/update_member` - Update member role/type

### Admin Operations
- `f/admin/list_tenants` - List all tenants
- `f/admin/update_tenant` - Update tenant settings
- `f/admin/get_admin_audit_logs` - View audit trail

## Troubleshooting

### Script Won't Run
1. Check lock file has all dependencies
2. Verify resource paths are correct
3. Check for Python syntax errors

### Database Connection Fails
1. Verify `f/chatbot/postgres_db` resource exists
2. Check sslmode setting
3. Ensure database is running

### AI API Errors
1. Check API key resources exist
2. Verify rate limits not exceeded
3. Check model names are correct

## Quick Deploy Command

For simple deployments, use curl directly:

```bash
# Archive old version
curl -X POST "http://localhost/api/w/family-brain/scripts/archive/p/f/chatbot/script_name" \
  -H "Authorization: Bearer $WINDMILL_TOKEN"

# Create new version
curl -X POST "http://localhost/api/w/family-brain/scripts/create" \
  -H "Authorization: Bearer $WINDMILL_TOKEN" \
  -H "Content-Type: application/json" \
  -d @payload.json
```

Where `payload.json` contains the script definition.
