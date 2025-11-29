# API Reference

Archevi exposes a REST API through Windmill for document management and RAG queries.

::: info Version 0.3.0
All endpoints now support multi-tenant isolation. Include `tenant_id` in requests to scope data to a specific family.
:::

## Overview

The API is built on [Windmill](https://windmill.dev), an open-source workflow engine. All endpoints are deployed as Windmill scripts.

## Base URL

```
https://your-instance.archevi.ca/api/w/archevi
```

For local development, use `http://localhost/api/w/archevi`.

## Authentication

API requests require a Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-instance.archevi.ca/api/w/archevi/...
```

Get your token from Windmill's UI under Settings > Tokens.

## Endpoints

### Document Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/f/chatbot/embed_document` | POST | Upload and embed a document |
| `/jobs/run/p/f/chatbot/embed_document_enhanced` | POST | Upload with AI enhancement (tags, expiry) |
| `/jobs/run/p/f/chatbot/get_document` | POST | Get a single document by ID |
| `/jobs/run/p/f/chatbot/update_document` | POST | Update an existing document |
| `/jobs/run/p/f/chatbot/delete_document` | POST | Delete a document |
| `/jobs/run/p/f/chatbot/search_documents` | POST | Search documents by keyword |
| `/jobs/run/p/f/chatbot/parse_pdf` | POST | Parse PDF and extract text |
| `/jobs/run/p/f/chatbot/get_tags` | POST | Get all document tags |
| `/jobs/run/p/f/chatbot/get_expiring_documents` | POST | Get documents with upcoming expiry |

### Query & Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/f/chatbot/rag_query` | POST | Query documents using RAG |
| `/jobs/run/p/f/chatbot/get_conversation_history` | POST | Get conversation history |
| `/jobs/run/p/f/chatbot/get_analytics` | POST | Get usage analytics |
| `/jobs/run/p/f/chatbot/transcribe_voice_note` | POST | Transcribe voice recording |

### Tenant Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/f/tenant/get_user_tenants` | POST | Get user's families |
| `/jobs/run/p/f/tenant/switch_tenant` | POST | Switch active family |
| `/jobs/run/p/f/tenant/invite_to_tenant` | POST | Invite member to family |

### Admin (System Administrators)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/f/admin/list_tenants` | POST | List all tenants |
| `/jobs/run/p/f/admin/get_tenant_details` | POST | Get tenant details |

### Authentication & System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/run/p/f/chatbot/auth_login` | POST | User login |
| `/jobs/run/p/f/chatbot/auth_verify` | POST | Verify JWT token |
| `/jobs/run/p/f/chatbot/auth_request_password_reset` | POST | Request password reset |
| `/jobs/run/p/f/chatbot/health_check` | POST | System health monitoring |

## Quick Examples

### Upload a Document

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-uuid",
    "user_id": "your-user-uuid",
    "title": "Family Recipe - Apple Pie",
    "content": "Grandma'\''s famous apple pie recipe...",
    "category": "personal"
  }' \
  https://your-instance.archevi.ca/api/w/archevi/jobs/run/p/f/chatbot/embed_document
```

### Query Documents

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-uuid",
    "user_id": "your-user-uuid",
    "query": "What is grandma'\''s apple pie recipe?",
    "conversation_id": "conv-123"
  }' \
  https://your-instance.archevi.ca/api/w/archevi/jobs/run/p/f/chatbot/rag_query
```

### Switch Active Family

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-uuid",
    "tenant_id": "new-tenant-uuid"
  }' \
  https://your-instance.archevi.ca/api/w/archevi/jobs/run/p/f/tenant/switch_tenant
```

## Detailed Documentation

- [Windmill Endpoints](/api/windmill-endpoints) - Complete API reference
- [Frontend API](/api/frontend-api) - TypeScript API client
- [Component API](/api/components/) - React component documentation
- [Multi-Tenant Architecture](/architecture/multi-tenant-design) - Data isolation design
