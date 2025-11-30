<p align="center">
  <h1 align="center">Archevi</h1>
  <p align="center">
    <strong>Your family's AI-powered knowledge vault</strong>
  </p>
  <p align="center">
    Store, search, and understand your important documents with natural language
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="#self-hosting">Self-Hosting</a> |
  <a href="#tech-stack">Tech Stack</a> |
  <a href="#roadmap">Roadmap</a>
</p>

---

## Why Archevi?

Every family accumulates important documents - insurance policies, medical records, tax returns, warranties, legal papers. When you need to find something specific, you're stuck digging through folders or searching file names.

**Archevi changes that.** Ask questions in plain English and get answers grounded in your actual documents:

> "What's our home insurance deductible?"
> "When does Sarah's passport expire?"
> "What did the doctor recommend at my last checkup?"

No more hunting through PDFs. No more forgotten expiration dates. Your documents become a searchable knowledge base that actually understands what's inside them.

---

## Features

### Intelligent Document Search
- **Natural language queries** - Ask questions, get answers with source citations
- **Semantic search** - Find documents by meaning, not just keywords
- **AI-powered extraction** - Automatic tags, categories, and expiration dates

### Document Management
- **PDF upload** with automatic text extraction
- **OCR support** for scanned documents (client-side Tesseract.js)
- **Expiry tracking** with dashboard alerts (urgent/soon/upcoming)
- **Tag cloud** for browsing by topic

### Voice Notes
- **Browser recording** - Capture thoughts directly in the app
- **Fast transcription** - Groq Whisper for 80+ languages
- **Searchable** - Voice notes become part of your knowledge base

### Multi-User & Multi-Tenant
- **Family accounts** - Each household gets isolated, private storage
- **Member management** - Invite family members via email
- **Role-based access** - Admin and member permissions
- **Tenant switching** - Manage multiple family vaults

### Analytics & Insights
- **Usage tracking** - Monitor queries and API costs
- **Document statistics** - See your knowledge base at a glance
- **Cost transparency** - Know exactly what you're spending

---

## Quick Start

### Prerequisites

- Node.js 18+
- **Docker Desktop** (must be running for backend services)
- API keys: [Cohere](https://cohere.com/) (embeddings/chat), [Groq](https://groq.com/) (voice)

> **Note:** Windmill and PostgreSQL run in Docker containers. Start Docker Desktop before running the backend.

### 1. Clone and Configure

```bash
git clone https://github.com/robhdsndsn/Archevi.git
cd Archevi

# Start backend services
docker compose up -d

# Configure frontend
cd frontend
cp .env.example .env.local
# Edit .env.local with your Windmill URL and token
```

### 2. Install and Run

```bash
pnpm install
pnpm dev
```

### 3. Configure Windmill

1. Access Windmill at `http://localhost:8000`
2. Add your API keys as variables:
   - `f/chatbot/cohere_api_key` - Cohere API key
   - `f/chatbot/groq_api_key` - Groq API key
3. Deploy scripts from the `scripts/` folder

### 4. Run Migrations

```bash
docker exec -it family-brain-db psql -U familyuser -d family_brain

\i Infrastructure/migrations/001_initial_schema.sql
\i Infrastructure/migrations/002_conversation_history.sql
\i Infrastructure/migrations/003_multi_tenant.sql
\i Infrastructure/migrations/004_enhanced_document_features.sql
```

---

## Self-Hosting

Archevi is designed to be self-hosted. Your documents stay on your infrastructure.

### Production Deployment

```yaml
# docker-compose.prod.yml (example)
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: family_brain
      POSTGRES_USER: familyuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  windmill:
    image: ghcr.io/windmill-labs/windmill:main
    environment:
      DATABASE_URL: postgres://familyuser:${DB_PASSWORD}@db/family_brain
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    environment:
      VITE_WINDMILL_URL: ${WINDMILL_URL}
    ports:
      - "3000:80"

volumes:
  pgdata:
```

### Cost Estimates

| Component | Monthly Cost |
|-----------|--------------|
| Cohere API (typical family) | $2-5 |
| Groq Whisper (30 min voice) | $0.10 |
| Self-hosted infrastructure | Your choice |
| **Total** | **~$3-6/month** |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **State** | Zustand |
| **Backend** | Windmill (workflow orchestration) |
| **Database** | PostgreSQL + pgvector |
| **AI - Embeddings** | Cohere Embed v4 (1024-dim) |
| **AI - Generation** | Cohere Command A/R |
| **AI - Reranking** | Cohere Rerank v3 |
| **AI - Voice** | Groq Whisper large-v3-turbo |
| **OCR** | Tesseract.js (client-side) |

---

## Project Structure

```
Archevi/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/       # Tenant & user management
│   │   │   ├── analytics/   # Usage statistics
│   │   │   ├── auth/        # Login, password reset
│   │   │   ├── chat/        # RAG chat interface
│   │   │   ├── documents/   # Upload, browser, expiry
│   │   │   ├── family/      # Member management
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── api/             # Windmill API client
│   │   ├── lib/             # OCR, utilities
│   │   └── store/           # Zustand stores
│   └── package.json
├── scripts/                  # Windmill Python scripts
│   ├── rag_query.py         # Main RAG pipeline
│   ├── embed_document*.py   # Document processing
│   ├── auth_*.py            # Authentication
│   ├── *_tenant.py          # Multi-tenant ops
│   └── transcribe_*.py      # Voice processing
├── Infrastructure/
│   └── migrations/          # PostgreSQL migrations
└── docs/                    # VitePress documentation
```

---

## API Reference

### Core Endpoints (Windmill)

| Endpoint | Description |
|----------|-------------|
| `f/chatbot/rag_query` | RAG query pipeline |
| `f/chatbot/embed_document_enhanced` | AI-enhanced document embedding |
| `f/chatbot/transcribe_voice_note` | Voice note transcription |
| `f/chatbot/search_documents_advanced` | Advanced document search |

### Authentication

| Endpoint | Description |
|----------|-------------|
| `f/chatbot/auth_login` | User login |
| `f/chatbot/auth_verify` | Token verification |
| `f/chatbot/auth_refresh` | Token refresh |
| `f/chatbot/auth_set_password` | Set/reset password |

### Multi-Tenant

| Endpoint | Description |
|----------|-------------|
| `f/chatbot/create_tenant` | Create new tenant |
| `f/chatbot/invite_to_tenant` | Invite family member |
| `f/chatbot/switch_tenant` | Switch active tenant |
| `f/chatbot/manage_family_members` | Member management |

---

## Roadmap

### Completed
- [x] Core RAG pipeline with source citations
- [x] Document upload, search, and management
- [x] Voice note recording and transcription
- [x] AI-enhanced embedding (tags, categories, expiry detection)
- [x] OCR for scanned documents
- [x] Expiry alerts dashboard
- [x] Multi-tenant architecture
- [x] Member invitation system
- [x] Analytics and usage tracking

### In Progress
- [ ] Email notifications for expiring documents
- [ ] Mobile-responsive improvements
- [ ] Production Docker Compose config

### Planned
- [ ] Bulk document import (ZIP upload)
- [ ] Document sharing between members
- [ ] Export chat history as PDF
- [ ] Deep Search mode (multi-step RAG)
- [ ] Mobile PWA with camera scanning

---

## Contributing

Contributions are welcome! Please open an issue to discuss proposed changes before submitting a PR.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with <a href="https://claude.ai/claude-code">Claude Code</a> and <a href="https://windmill.dev">Windmill</a>
</p>
