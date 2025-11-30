# Code Notes - FamilySecondBrain (Archevi)

## Architecture Overview

Archevi is a **multi-tenant RAG-powered family document management system** built on a modern, scalable architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React/Vite) │
│ - TypeScript, shadcn/ui, TailwindCSS │
│ - Chat interface with streaming responses │
│ - Document management with upload/OCR │
│ - Analytics dashboard with Recharts │
│ - Admin tenant management panel │
└─────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ WINDMILL (Workflow Platform) │
│ - Python scripts for all backend logic │
│ - Job queuing and execution │
│ - Built-in API gateway │
│ - Resource management (credentials, configs) │
└─────────────────────────────────────────────────────────────────────┘
 │
 ┌───────────────┼───────────────┐
 ▼ ▼ ▼
 ┌────────────┐ ┌────────────┐ ┌────────────────┐
 │ PostgreSQL │ │ Cohere AI │ │ pgvector │
 │ (archevi) │ │ API │ │ Embeddings │
 │ │ │ │ │ (1024-dim) │
 └────────────┘ └────────────┘ └────────────────┘
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19, Vite 7, TypeScript | SPA with modern DX |
| UI | shadcn/ui, TailwindCSS, Radix | Accessible component library |
| Backend | Windmill (Python scripts) | Workflow automation, API |
| AI | Cohere (embed-v4.0, command-a/r) | Embeddings, generation, reranking |
| Database | PostgreSQL + pgvector | Data storage + vector search |
| Auth | JWT with HTTP-only cookies | Secure authentication |

## Directory Structure

```
FamilySecondBrain/
├── frontend/ # React SPA
│ ├── src/
│ │ ├── api/windmill/ # API client + types
│ │ ├── components/ # React components
│ │ │ ├── admin/ # Admin dashboard (NEW)
│ │ │ ├── analytics/ # Usage analytics
│ │ │ ├── auth/ # Login, password reset
│ │ │ ├── chat/ # RAG chat interface
│ │ │ ├── documents/ # Document management
│ │ │ ├── family/ # Family member management
│ │ │ ├── settings/ # User settings
│ │ │ └── ui/ # shadcn components
│ │ ├── lib/ # Utilities (OCR, PDF parsing)
│ │ └── store/ # Zustand state stores
│ └── package.json
├── scripts/ # Windmill Python scripts
│ ├── rag_query.py # Core RAG pipeline
│ ├── embed_document.py # Document embedding
│ ├── list_tenants.py # Admin: list tenants
│ ├── get_tenant_details.py # Admin: tenant details
│ └── deploy_*.py # Deployment helpers
├── Infrastructure/
│ └── migrations/ # Database migrations
│ ├── 001_initial.sql
│ ├── 002_auth_enhancement.sql
│ └── 003_multi_tenant_schema.sql # Multi-tenant (NEW)
└── docs/ # VitePress documentation site
```

## Key Components

### Multi-Tenant Architecture (CRITICAL)

**Purpose:** Complete data isolation between families/tenants
**Location:** `Infrastructure/migrations/003_multi_tenant_schema.sql`
**Status:** VERIFIED WORKING (Nov 28, 2025)

Key tables:
- `tenants` - Tenant configuration (plans, limits, settings)
- `tenant_memberships` - User-to-tenant relationships with roles
- `documents` - Tenant-scoped documents with embeddings
- `ai_usage` - Per-tenant AI cost tracking
- `chat_sessions` - Tenant-scoped conversation history

**Isolation Testing Results:**
| Test | Result |
|------|--------|
| Hudson queries own insurance docs | Returns Hudson docs only |
| Chen queries own investment docs | Returns Chen docs only |
| Hudson queries for Chen's AAPL data | BLOCKED (no results) |
| Chen queries for Hudson's State Farm | BLOCKED (no results) |

### RAG Pipeline

**Purpose:** Retrieval-Augmented Generation for document Q&A
**Location:** `scripts/rag_query.py`
**Dependencies:** Cohere API, pgvector

Pipeline stages:
1. **Embed Query** - embed-v4.0 (1024-dim vectors)
2. **Vector Search** - pgvector similarity search with tenant filter
3. **Rerank** - rerank-v3.5 for precision
4. **Generate** - Adaptive model selection (command-a or command-r)

### Admin Dashboard

**Purpose:** System-wide tenant management for admins
**Location:** `frontend/src/components/admin/AdminView.tsx`
**Dependencies:** Windmill admin scripts

Features:
- List all tenants with member/document counts
- View tenant details (usage, members, documents)
- Plan and status indicators

### Authentication System

**Purpose:** Secure JWT-based auth with tenant context
**Location:** `scripts/auth_*.py`, `frontend/src/store/auth-store.ts`

Flow:
1. Login with email/password
2. Receive JWT token (includes user_id, tenant_id, role)
3. Token stored in HTTP-only cookie
4. All API calls include tenant_id for isolation

## Code Standards

### Style Guide
- TypeScript with strict mode
- ESLint + Prettier
- React functional components with hooks
- Python scripts follow Windmill conventions

### Naming Conventions
- Components: PascalCase (`AppSidebar.tsx`)
- Utilities: camelCase (`auth-store.ts`)
- Python: snake_case (`rag_query.py`)
- Database: snake_case (`tenant_memberships`)

### Comments
- JSDoc for public APIs
- Inline comments for complex logic
- Python docstrings for Windmill scripts

## Testing Strategy

### Unit Tests
- Vitest for frontend (excluded from build)
- Manual testing for Windmill scripts

### Integration Tests
- Curl-based API testing
- Multi-tenant isolation verification

### Test Coverage
- Critical paths: Auth, RAG, Document CRUD
- Tenant isolation: Cross-tenant query blocking

## Build & Deployment

### Build Process
```bash
# Frontend
cd frontend
npm install
npm run build # Outputs to dist/

# Windmill Scripts
cd scripts
python deploy_admin_scripts.py
```

### Deployment Process
```bash
# Docker (development)
docker compose up -d

# Windmill scripts auto-deploy via API
```

## Dependencies

### Production
- React 19, React DOM
- TailwindCSS, shadcn/ui
- Zustand (state management)
- Recharts (analytics charts)
- Tesseract.js (OCR)
- pdfjs-dist (PDF parsing)

### Development
- Vite 7
- TypeScript 5.9
- ESLint, Prettier
- Vitest

## Environment Variables

```env
# Frontend (.env)
VITE_WINDMILL_URL=http://localhost/api/w/family-brain
VITE_WINDMILL_TOKEN=your_token

# Windmill Resources
postgres_db: # PostgreSQL connection
cohere_api_key: # Cohere API key
```

## API Documentation

### Windmill Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/f/chatbot/rag_query` | POST | RAG query with sources |
| `/f/chatbot/embed_document` | POST | Embed and store document |
| `/f/chatbot/get_documents` | POST | List documents (paginated) |
| `/f/admin/list_tenants` | POST | List all tenants (admin) |
| `/f/admin/get_tenant_details` | POST | Tenant details (admin) |
| `/f/chatbot/auth_login` | POST | User authentication |
| `/f/chatbot/auth_verify` | POST | Token verification |

## Database Schema

### Core Tables

```sql
-- Tenants (multi-tenant root)
tenants (
 id UUID PRIMARY KEY,
 name TEXT,
 slug TEXT UNIQUE,
 plan TEXT, -- starter, family, family_office
 status TEXT, -- active, suspended
 ai_allowance_usd DECIMAL,
 max_members INTEGER,
 max_storage_gb INTEGER
)

-- Tenant Memberships
tenant_memberships (
 tenant_id UUID REFERENCES tenants,
 user_id UUID REFERENCES users,
 role TEXT, -- owner, admin, member, viewer
 status TEXT -- active, pending, suspended
)

-- Documents (tenant-scoped)
documents (
 id UUID PRIMARY KEY,
 tenant_id UUID NOT NULL,
 title TEXT,
 content TEXT,
 category TEXT,
 embedding vector(1024),
 created_by UUID
)
```

## Known Issues

- Chunk size warning on build (>500KB) - expected with charting libs
- PDF.js worker needs manual bundling config
- Test files excluded from build (global type issues)

## Future Improvements (TODO)

### High Priority
- [ ] Tenant creation/editing UI in admin dashboard
- [ ] Invite system for adding family members
- [ ] Document expiry notifications
- [ ] Mobile-responsive improvements

### Medium Priority
- [ ] Bulk document import
- [ ] Advanced search filters (date range, uploader)
- [ ] Document sharing between tenant members
- [ ] Export chat history as PDF

### Low Priority / Nice-to-Have
- [ ] OCR language selection
- [ ] Document versioning
- [ ] AI model selection per query
- [ ] Usage alerts and notifications
- [ ] Audit log for admin actions

### Infrastructure
- [ ] Production deployment (Docker Compose → K8s)
- [ ] CI/CD pipeline
- [ ] Automated backup strategy
- [ ] Rate limiting per tenant

---

**Created:** 2025-11-26
**Last Updated:** 2025-11-28
**Version:** 0.3.0 (Multi-Tenant)
