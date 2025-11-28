# API Reference

Archevi exposes a REST API through Windmill for document management and RAG queries.

## Overview

The API is built on [Windmill](https://windmill.dev), an open-source workflow engine. All endpoints are deployed as Windmill scripts.

## Base URL

```
http://localhost/api/w/archevi
```

For managed hosting, replace `localhost` with your instance URL.

## Authentication

API requests require a Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost/api/w/archevi/...
```

Get your token from Windmill's UI under Settings > Tokens.

## Endpoints

### Document Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/u/admin/embed_document` | POST | Upload and embed a document |
| `/jobs/run/p/u/admin/get_document` | POST | Get a single document by ID |
| `/jobs/run/p/u/admin/update_document` | POST | Update an existing document |
| `/jobs/run/p/u/admin/delete_document` | POST | Delete a document |
| `/jobs/run/p/u/admin/search_documents` | POST | Search documents by keyword |
| `/jobs/run/p/u/admin/parse_pdf` | POST | Parse PDF and extract text |

### Query & Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/u/admin/rag_query` | POST | Query documents using RAG |
| `/jobs/run/p/u/admin/get_conversation_history` | POST | Get conversation history |
| `/jobs/run/p/u/admin/get_analytics` | POST | Get usage analytics |

### Family Members

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/u/admin/manage_family_members` | POST | Manage family member accounts |

### Authentication & System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/u/admin/auth_request_password_reset` | POST | Request password reset token |
| `/jobs/run/p/u/admin/health_check` | POST | System health monitoring |

## Quick Examples

### Upload a Document

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Family Recipe - Apple Pie",
    "content": "Grandma'\''s famous apple pie recipe...",
    "category": "personal",
    "family_id": "family-001"
  }' \
  http://localhost/api/w/archevi/jobs/run/p/u/admin/embed_document
```

### Query Documents

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is grandma'\''s apple pie recipe?",
    "family_id": "family-001",
    "conversation_id": "conv-123"
  }' \
  http://localhost/api/w/archevi/jobs/run/p/u/admin/rag_query
```

## Detailed Documentation

- [Windmill Endpoints](/api/windmill-endpoints) - Complete API reference
- [Frontend API](/api/frontend-api) - TypeScript API client
- [Component API](/api/components/) - React component documentation
