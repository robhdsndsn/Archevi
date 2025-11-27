# API Reference

Archevi exposes a REST API through Windmill for document management and RAG queries.

## Overview

The API is built on [Windmill](https://windmill.dev), an open-source workflow engine. All endpoints are deployed as Windmill scripts.

## Base URL

```
http://localhost/api/w/family-brain
```

For managed hosting, replace `localhost` with your instance URL.

## Authentication

API requests require a Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost/api/w/family-brain/...
```

Get your token from Windmill's UI under Settings > Tokens.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/u/admin/embed_document` | POST | Upload and embed a document |
| `/jobs/run/p/u/admin/rag_query` | POST | Query documents using RAG |
| `/jobs/run/p/u/admin/search_documents` | POST | Search documents by keyword |
| `/jobs/run/p/u/admin/get_analytics` | POST | Get usage analytics |

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
  http://localhost/api/w/family-brain/jobs/run/p/u/admin/embed_document
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
  http://localhost/api/w/family-brain/jobs/run/p/u/admin/rag_query
```

## Detailed Documentation

- [Windmill Endpoints](/api/windmill-endpoints) - Complete API reference
- [Frontend API](/api/frontend-api) - TypeScript API client
- [Component API](/api/components/) - React component documentation
