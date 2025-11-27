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
