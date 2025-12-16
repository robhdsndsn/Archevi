# Windmill API Endpoints

Complete reference for all Windmill-based API endpoints.

::: info Version 2.6.0
This documentation reflects the multi-tenant architecture. All endpoints now require `tenant_id` for data isolation.

**Embedding Model:** Cohere Embed v4 (embed-v4.0) with 1024-dimension Matryoshka embeddings.

**New in v2.6.0:** Secure Links endpoints, PDF Visual Search via RAG agent.
:::

## embed_document

Upload and embed a new document into the knowledge base.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/embed_document
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Document title |
| `content` | string | Yes | Full text content |
| `category` | string | Yes | One of: financial, medical, legal, insurance, education, personal |
| `family_id` | string | Yes | Family identifier |
| `user_id` | string | No | User who uploaded |
| `metadata` | object | No | Additional metadata |

### Example Request

```json
{
  "title": "2024 Tax Return",
  "content": "Tax return content here...",
  "category": "financial",
  "family_id": "family-001",
  "user_id": "user-001",
  "metadata": {
    "year": 2024,
    "type": "tax_return"
  }
}
```

### Response

```json
{
  "success": true,
  "document_id": "doc_abc123",
  "chunks_created": 5,
  "message": "Document embedded successfully"
}
```

---

## rag_query

Query documents using RAG (Retrieval-Augmented Generation). The agent automatically decides whether to use text search (`search_documents`) or visual search (`search_pdf_pages`) based on the query.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/rag_query
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Natural language question |
| `family_id` | string | Yes | Family identifier |
| `conversation_id` | string | No | For conversation continuity |
| `max_sources` | number | No | Max source docs (default: 5) |
| `model` | string | No | AI model to use (default: groq_llama_3_3_70b) |

### Supported Models

| Provider | Model ID | Description |
|----------|----------|-------------|
| Groq | `groq_llama_3_3_70b` | Fast, general queries (default) |
| Groq | `groq_llama_4_scout` | Vision/document understanding |
| Groq | `groq_llama_4_maverick` | Complex reasoning |
| Cohere | `cohere_command_a` | Tool use, structured data |
| Cohere | `cohere_command_r_plus` | High quality answers |
| Cohere | `cohere_command_r` | Fast responses |

### Example Request

```json
{
  "query": "What medications is dad currently taking?",
  "family_id": "family-001",
  "conversation_id": "conv-456",
  "model": "groq_llama_3_3_70b"
}
```

### Response

```json
{
  "answer": "Based on the medical records, dad is currently taking...",
  "sources": [
    {
      "document_id": "doc_med123",
      "title": "Dad's Medical Records 2024",
      "relevance_score": 0.95,
      "snippet": "Current medications: Metformin 500mg..."
    }
  ],
  "page_sources": [],
  "conversation_id": "conv-456",
  "tokens_used": 1250
}
```

### Visual Search Response

When the agent uses visual search (e.g., "show me the page with the budget chart"):

```json
{
  "answer": "I found a budget chart on page 3 of the Financial Report...",
  "sources": [],
  "page_sources": [
    {
      "page_id": 45,
      "document_id": 123,
      "document_title": "Financial Report Q4",
      "page_number": 3,
      "similarity": 0.89,
      "page_image": "base64-encoded-thumbnail...",
      "ocr_text": "Budget breakdown for Q4..."
    }
  ],
  "conversation_id": "conv-456",
  "tokens_used": 1500
}
```

---

## search_documents

Search documents by keyword or filter.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/search_documents
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `family_id` | string | Yes | Family identifier |
| `query` | string | No | Search query |
| `category` | string | No | Filter by category |
| `limit` | number | No | Max results (default: 20) |
| `offset` | number | No | Pagination offset |

### Example Request

```json
{
  "family_id": "family-001",
  "query": "insurance",
  "category": "insurance",
  "limit": 10
}
```

### Response

```json
{
  "documents": [
    {
      "id": "doc_ins123",
      "title": "Home Insurance Policy",
      "category": "insurance",
      "created_at": "2024-01-15T10:30:00Z",
      "preview": "Policy number: ABC123..."
    }
  ],
  "total": 3,
  "has_more": false
}
```

---

## get_analytics

Get usage analytics (admin only).

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/get_analytics
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | day, week, month, all (default: week) |

### Response

```json
{
  "usage": {
    "totals": {
      "requests": 150,
      "tokens": 75000,
      "cost": 0.15
    },
    "by_operation": [
      { "operation": "rag_query", "count": 120, "tokens": 60000 },
      { "operation": "embed_document", "count": 30, "tokens": 15000 }
    ]
  },
  "documents": {
    "total": 45,
    "by_category": [
      { "category": "medical", "count": 15 },
      { "category": "financial", "count": 12 }
    ]
  },
  "projections": {
    "monthly_estimate": 0.45,
    "daily_avg_cost": 0.015
  }
}
```

---

## get_document

Get a single document by ID.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/get_document
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | number | Yes | Document ID to retrieve |

### Example Request

```json
{
  "document_id": 123
}
```

### Response

```json
{
  "success": true,
  "document": {
    "id": 123,
    "title": "Home Insurance Policy",
    "content": "Policy details...",
    "category": "insurance",
    "source_file": "insurance.pdf",
    "created_by": "user-001",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## update_document

Update an existing document. If content is changed, the embedding will be regenerated.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/update_document
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | number | Yes | Document ID to update |
| `title` | string | No | New title |
| `content` | string | No | New content (triggers re-embedding) |
| `category` | string | No | New category |

At least one field to update is required.

### Example Request

```json
{
  "document_id": 123,
  "title": "Home Insurance Policy 2024",
  "category": "insurance"
}
```

### Response

```json
{
  "success": true,
  "message": "Document 'Home Insurance Policy 2024' has been updated",
  "document_id": 123,
  "re_embedded": false,
  "tokens_used": 0
}
```

---

## delete_document

Delete a document from the knowledge base.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/delete_document
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | number | Yes | Document ID to delete |

### Example Request

```json
{
  "document_id": 123
}
```

### Response

```json
{
  "success": true,
  "message": "Document 'Home Insurance Policy' has been deleted",
  "deleted_title": "Home Insurance Policy",
  "deleted_id": 123
}
```

---

## parse_pdf

Parse a PDF file and extract its text content.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/parse_pdf
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_content` | string | Yes | Base64-encoded PDF content |
| `filename` | string | No | Original filename (default: "document.pdf") |

### Example Request

```json
{
  "file_content": "JVBERi0xLjQKJeLjz9M...",
  "filename": "invoice.pdf"
}
```

### Response

```json
{
  "success": true,
  "text": "--- Page 1 ---\nInvoice content here...",
  "page_count": 3,
  "filename": "invoice.pdf"
}
```

---

## health_check

Monitor system health of all components (database, Cohere APIs).

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/health_check
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `store_results` | boolean | No | Store check results in database (default: true) |
| `verbose` | boolean | No | Include detailed error messages (default: false) |

### Example Request

```json
{
  "store_results": true,
  "verbose": false
}
```

### Response

```json
{
  "status": "healthy",
  "services": {
    "postgres": {
      "status": "up",
      "response_time_ms": 15,
      "error": null
    },
    "cohere_embed": {
      "status": "up",
      "response_time_ms": 234,
      "error": null
    },
    "cohere_chat": {
      "status": "up",
      "response_time_ms": 456,
      "error": null
    },
    "cohere_rerank": {
      "status": "up",
      "response_time_ms": 123,
      "error": null
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## manage_family_members

Manage family member accounts (list, add, update, remove, generate invite).

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/manage_family_members
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of: list, add, update, remove, generate_invite |
| `member_data` | object | Conditional | Member details (required for add/update) |
| `member_id` | number | Conditional | Member ID (required for update/remove/generate_invite) |

### Example Request (List)

```json
{
  "action": "list"
}
```

### Example Request (Add)

```json
{
  "action": "add",
  "member_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Response

```json
{
  "success": true,
  "members": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## get_conversation_history

Retrieve conversation history for a session or recent conversations.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/get_conversation_history
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | No | Specific session to retrieve. If omitted, returns recent conversations |
| `limit` | number | No | Max messages to return (default: 20) |
| `user_email` | string | No | Filter by user email |

### Example Request

```json
{
  "session_id": "abc-123",
  "limit": 50
}
```

### Response

```json
[
  {
    "role": "user",
    "content": "What medications is dad taking?",
    "timestamp": "2024-01-15T10:30:00Z",
    "session_id": "abc-123"
  },
  {
    "role": "assistant",
    "content": "Based on the medical records...",
    "sources": [
      {
        "document_id": 123,
        "title": "Medical Records"
      }
    ],
    "timestamp": "2024-01-15T10:30:15Z",
    "session_id": "abc-123"
  }
]
```

---

## auth_request_password_reset

Request a password reset token for a user.

### Request

```http
POST /api/w/archevi/jobs/run/p/u/admin/auth_request_password_reset
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email address |

### Example Request

```json
{
  "email": "user@example.com"
}
```

### Response

```json
{
  "success": true,
  "reset_token": "abc123...",
  "email": "user@example.com",
  "name": "John Doe",
  "expires_at": "2024-01-15T11:30:00Z",
  "message": "Password reset token generated for John Doe. Valid for 1 hour."
}
```

---

---

## Admin Endpoints

The following endpoints are available to system administrators for tenant management.

---

## list_tenants

List all tenants in the system (admin only).

### Request

```http
POST /api/w/archevi/jobs/run/p/f/admin/list_tenants
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

No parameters required.

### Response

```json
{
  "success": true,
  "tenants": [
    {
      "id": "uuid-123",
      "name": "The Hudson Family",
      "slug": "hudson",
      "plan": "family",
      "status": "active",
      "member_count": 4,
      "document_count": 127,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 3
}
```

---

## get_tenant_details

Get detailed information about a specific tenant (admin only).

### Request

```http
POST /api/w/archevi/jobs/run/p/f/admin/get_tenant_details
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string | Yes | UUID of the tenant |

### Example Request

```json
{
  "tenant_id": "uuid-123"
}
```

### Response

```json
{
  "success": true,
  "tenant": {
    "id": "uuid-123",
    "name": "The Hudson Family",
    "slug": "hudson",
    "plan": "family",
    "status": "active",
    "ai_allowance_usd": 8.00,
    "max_members": 10,
    "max_storage_gb": 50,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "members": [
    {
      "user_id": "user-001",
      "email": "dad@example.com",
      "name": "Dad Hudson",
      "role": "owner",
      "status": "active"
    }
  ],
  "documents": [
    {
      "id": "doc-001",
      "title": "Home Insurance Policy",
      "category": "insurance",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "usage": {
    "current_month_usd": 2.45,
    "total_queries": 89,
    "total_embeddings": 127
  }
}
```

---

## embed_document_enhanced

Upload a document with AI-enhanced processing (auto-categorization, smart tags, expiry detection).

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/embed_document_enhanced
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string | Yes | Tenant UUID |
| `user_id` | string | Yes | User UUID |
| `title` | string | Yes | Document title |
| `content` | string | Yes | Full text content |
| `category` | string | No | Will be auto-detected if not provided |

### Response

```json
{
  "success": true,
  "document_id": "doc_abc123",
  "ai_enhanced": {
    "suggested_category": "insurance",
    "tags": ["home", "policy", "state-farm", "renewal"],
    "expiry_date": "2025-06-15",
    "confidence": 0.92
  },
  "tokens_used": 1250
}
```

---

## transcribe_voice_note

Transcribe a voice recording and optionally embed it.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/transcribe_voice_note
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string | Yes | Tenant UUID |
| `user_id` | string | Yes | User UUID |
| `audio_base64` | string | Yes | Base64-encoded audio file |
| `language` | string | No | Language code (default: auto-detect) |
| `embed` | boolean | No | Auto-embed as document (default: true) |

### Response

```json
{
  "success": true,
  "transcript": "Remember to renew the car insurance by June 15th...",
  "language": "en",
  "duration_seconds": 45,
  "document_id": "doc_voice123",
  "tokens_used": 500
}
```

---

## get_tags

Get all unique document tags with counts for a tenant.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/get_tags
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string | Yes | Tenant UUID |

### Response

```json
{
  "success": true,
  "tags": [
    { "tag": "insurance", "count": 12 },
    { "tag": "medical", "count": 8 },
    { "tag": "recipe", "count": 5 }
  ]
}
```

---

## get_expiring_documents

Get documents with upcoming expiry dates.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/get_expiring_documents
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string | Yes | Tenant UUID |
| `days_ahead` | number | No | Days to look ahead (default: 90) |

### Response

```json
{
  "success": true,
  "documents": [
    {
      "id": "doc-001",
      "title": "Car Insurance Policy",
      "expiry_date": "2025-01-20",
      "days_until_expiry": 5,
      "urgency": "urgent"
    },
    {
      "id": "doc-002",
      "title": "Home Insurance",
      "expiry_date": "2025-02-15",
      "days_until_expiry": 31,
      "urgency": "upcoming"
    }
  ],
  "summary": {
    "urgent": 1,
    "soon": 2,
    "upcoming": 5
  }
}
```

---

## Tenant Management Endpoints

### get_user_tenants

Get all tenants a user belongs to.

```http
POST /api/w/archevi/jobs/run/p/f/tenant/get_user_tenants
```

### switch_tenant

Switch the active tenant context for a user.

```http
POST /api/w/archevi/jobs/run/p/f/tenant/switch_tenant
```

### invite_to_tenant

Invite a new member to a tenant.

```http
POST /api/w/archevi/jobs/run/p/f/tenant/invite_to_tenant
```

---

## get_search_suggestions

Get intelligent autocomplete suggestions for search queries. Returns suggestions from documents, people, tags, recent queries, extracted entities, and categories - all filtered by tenant for data isolation.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/get_search_suggestions
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query_prefix` | string | Yes | Partial search query (minimum 2 characters) |
| `tenant_id` | string | Yes | Tenant UUID for data isolation |
| `user_email` | string | No | User email for recent query suggestions |
| `limit` | number | No | Max suggestions to return (default: 10) |

### Example Request

```json
{
  "query_prefix": "insur",
  "tenant_id": "5302d94d-4c08-459d-b49f-d211abdb4047",
  "user_email": "user@example.com",
  "limit": 10
}
```

### Response

```json
{
  "success": true,
  "suggestions": [
    {
      "type": "document",
      "value": "Home Insurance Policy",
      "label": "Home Insurance Policy (insurance)",
      "document_id": 123,
      "score": 1.0
    },
    {
      "type": "person",
      "value": "John Smith",
      "label": "Person: John Smith",
      "document_id": null,
      "score": 0.9
    },
    {
      "type": "tag",
      "value": "insurance",
      "label": "Tag: insurance (12 docs)",
      "document_id": null,
      "score": 0.75
    },
    {
      "type": "recent",
      "value": "what is my insurance deductible",
      "label": "Recent: what is my insurance deductible",
      "document_id": null,
      "score": 0.65
    },
    {
      "type": "entity",
      "value": "State Farm",
      "label": "Provider: State Farm",
      "document_id": 123,
      "score": 0.7
    },
    {
      "type": "category",
      "value": "category:insurance",
      "label": "Category: insurance (15 docs)",
      "document_id": null,
      "score": 0.6
    }
  ]
}
```

### Suggestion Types

| Type | Description | Score Range |
|------|-------------|-------------|
| `document` | Document titles matching the query | 0.8-1.0 |
| `person` | Family member names | 0.7-0.9 |
| `tag` | Document tags with usage counts | 0.75 |
| `recent` | User's recent search queries | 0.65 |
| `entity` | Extracted data fields (policy numbers, providers, etc.) | 0.7 |
| `category` | Document categories with counts | 0.6 |

### Notes

- Suggestions are deduplicated by value
- Results are sorted by score (highest first)
- All queries filter by `tenant_id` for complete data isolation
- Recent queries are filtered by `user_email` (user's own history only)
- Prefix matching prioritizes results that start with the query

---

## suggest_tags

Get AI-powered tag and category suggestions before document upload.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/suggest_tags
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Document text content (first 3000 chars used) |
| `title` | string | No | Document title for context |
| `tenant_id` | string | Yes | Tenant UUID for fetching existing tags |
| `include_existing_tags` | boolean | No | Include existing tenant tags (default: true) |

### Example Request

```json
{
  "content": "Home Insurance Policy\nPolicy Number: HI-2024...",
  "title": "Home Insurance Policy 2024",
  "tenant_id": "5302d94d-4c08-459d-b49f-d211abdb4047"
}
```

### Response

```json
{
  "suggested_category": "insurance",
  "category_confidence": 0.95,
  "suggested_tags": ["insurance", "policy-2024", "home-insurance", "property"],
  "existing_tags_matched": ["insurance"],
  "new_tags_suggested": ["policy-2024", "home-insurance", "property"],
  "expiry_dates": [
    {"date": "2024-12-15", "type": "renewal", "confidence": 0.85}
  ],
  "tokens_used": 450
}
```

### Notes

- Call this endpoint before `embed_document_enhanced` to get suggestions
- Frontend can display suggestions for user confirmation
- `existing_tags_matched` shows tags already in the tenant's collection
- `new_tags_suggested` shows AI-generated tags not yet in collection

---

## Document Versioning Endpoints

### get_document_versions

Get version history for a document.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/get_document_versions
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | string | Yes | Document UUID |
| `tenant_id` | string | Yes | Tenant UUID |

### Example Request

```json
{
  "document_id": "doc-uuid-123",
  "tenant_id": "tenant-uuid-456"
}
```

### Response

```json
{
  "document_id": "doc-uuid-123",
  "document_title": "Home Insurance Policy",
  "current_version": 3,
  "version_count": 3,
  "versions": [
    {
      "version_number": 3,
      "title": "Home Insurance Policy",
      "content_preview": "Policy details...",
      "content_hash": "sha256:abc123...",
      "file_size_bytes": 15420,
      "change_summary": null,
      "change_type": "update",
      "created_by_name": "John Doe",
      "created_at": "2024-12-08T10:30:00Z",
      "is_current": true
    },
    {
      "version_number": 2,
      "title": "Home Insurance Policy",
      "content_preview": "Previous version...",
      "content_hash": "sha256:def456...",
      "file_size_bytes": 14200,
      "change_summary": "Updated coverage amount",
      "change_type": "update",
      "created_by_name": "John Doe",
      "created_at": "2024-11-15T14:20:00Z",
      "is_current": false
    },
    {
      "version_number": 1,
      "title": "Home Insurance Policy",
      "content_preview": "Original content...",
      "content_hash": "sha256:ghi789...",
      "file_size_bytes": 12000,
      "change_summary": null,
      "change_type": "initial",
      "created_by_name": "John Doe",
      "created_at": "2024-01-15T10:30:00Z",
      "is_current": false
    }
  ]
}
```

---

### rollback_document_version

Rollback a document to a previous version. Creates a new version with the old content (preserves history).

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/rollback_document_version
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | string | Yes | Document UUID |
| `target_version` | number | Yes | Version number to rollback to |
| `tenant_id` | string | Yes | Tenant UUID |
| `user_id` | string | Yes | User performing the rollback |

### Example Request

```json
{
  "document_id": "doc-uuid-123",
  "target_version": 1,
  "tenant_id": "tenant-uuid-456",
  "user_id": "user-uuid-789"
}
```

### Response

```json
{
  "success": true,
  "document_id": "doc-uuid-123",
  "new_version_number": 4,
  "rolled_back_from": 3,
  "rolled_back_to": 1,
  "message": "Document rolled back to version 1. New version 4 created."
}
```

---

### create_document_version

Create a new version of a document (used internally when documents are updated).

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/create_document_version
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | string | Yes | Document UUID |
| `title` | string | Yes | Document title |
| `content` | string | Yes | Document content |
| `tenant_id` | string | Yes | Tenant UUID |
| `user_id` | string | Yes | User creating the version |
| `change_summary` | string | No | Description of changes |
| `change_type` | string | No | One of: initial, update, correction, major_revision |
| `file_size_bytes` | number | No | File size in bytes |
| `storage_path` | string | No | Path in storage bucket |

### Response

```json
{
  "success": true,
  "document_id": "doc-uuid-123",
  "version_number": 4,
  "message": "Version 4 created successfully"
}
```

---

## Secure Links Endpoints

### create_secure_link

Create a password-protected shareable link for a document.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/create_secure_link
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_id` | number | Yes | Document ID to share |
| `tenant_id` | string | Yes | Tenant UUID |
| `user_id` | string | Yes | User creating the link |
| `password` | string | No | Optional password protection |
| `max_views` | number | No | View limit (null = unlimited) |
| `expires_in` | string | No | Expiration: 1_hour, 24_hours, 7_days, 30_days, 1_year, never |

### Example Request

```json
{
  "document_id": 123,
  "tenant_id": "tenant-uuid-456",
  "user_id": "user-uuid-789",
  "password": "secret123",
  "max_views": 5,
  "expires_in": "7_days"
}
```

### Response

```json
{
  "success": true,
  "link_id": "link-uuid-123",
  "token": "abc123xyz...",
  "url": "https://archevi.ca/share/abc123xyz",
  "expires_at": "2025-12-17T10:30:00Z",
  "max_views": 5,
  "has_password": true
}
```

---

### access_secure_link

Access a document via secure link (validates token, password, view limits).

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/access_secure_link
Content-Type: application/json
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Secure link token |
| `password` | string | Conditional | Required if link has password |

### Example Request

```json
{
  "token": "abc123xyz...",
  "password": "secret123"
}
```

### Response

```json
{
  "success": true,
  "document": {
    "id": 123,
    "title": "Home Insurance Policy",
    "content": "Policy details...",
    "category": "insurance"
  },
  "views_remaining": 4,
  "expires_at": "2025-12-17T10:30:00Z"
}
```

### Error Response (Invalid Password)

```json
{
  "success": false,
  "error": "Invalid password",
  "code": "INVALID_PASSWORD"
}
```

---

### list_secure_links

List all secure links for a tenant.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/list_secure_links
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | string | Yes | Tenant UUID |
| `document_id` | number | No | Filter by specific document |
| `include_expired` | boolean | No | Include expired links (default: false) |

### Response

```json
{
  "success": true,
  "links": [
    {
      "id": "link-uuid-123",
      "document_id": 123,
      "document_title": "Home Insurance Policy",
      "token": "abc123xyz...",
      "url": "https://archevi.ca/share/abc123xyz",
      "has_password": true,
      "max_views": 5,
      "view_count": 2,
      "expires_at": "2025-12-17T10:30:00Z",
      "is_active": true,
      "created_at": "2025-12-10T10:30:00Z",
      "created_by_name": "John Doe"
    }
  ],
  "count": 1
}
```

---

### revoke_secure_link

Revoke an active secure link.

### Request

```http
POST /api/w/archevi/jobs/run/p/f/chatbot/revoke_secure_link
Content-Type: application/json
Authorization: Bearer {token}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `link_id` | string | Yes | Secure link UUID |
| `tenant_id` | string | Yes | Tenant UUID |

### Response

```json
{
  "success": true,
  "link_id": "link-uuid-123",
  "message": "Secure link revoked successfully"
}
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": true,
  "message": "Description of what went wrong",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing token |
| `NOT_FOUND` | Document or resource not found |
| `VALIDATION_ERROR` | Invalid request parameters |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
