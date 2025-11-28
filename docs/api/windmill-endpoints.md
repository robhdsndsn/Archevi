# Windmill API Endpoints

Complete reference for all Windmill-based API endpoints.

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

Query documents using RAG (Retrieval-Augmented Generation).

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

### Example Request

```json
{
  "query": "What medications is dad currently taking?",
  "family_id": "family-001",
  "conversation_id": "conv-456"
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
  "conversation_id": "conv-456",
  "tokens_used": 1250
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
