# Archevi - RAG-Powered Family Knowledge Base

A self-hosted family knowledge base chatbot using RAG (Retrieval-Augmented Generation) that enables family members to query documentation through natural language.

**Version:** 2.1.0 (Phase 3 Frontend Complete)
**Status:** Documents View Complete - Upload and Search working
**Brand Name:** Archevi

## What Is This?

Archevi is an AI-powered chatbot that helps families centralize and access their collective knowledge:
- **Recipes:** "What's grandma's cookie recipe?"
- **Medical:** "What are dad's allergies?"
- **Financial:** "Where's the home insurance policy?"
- **Family History:** "Tell me about our vacation preferences"
- **General:** "What's the WiFi password?"

## Technology Stack

### Backend
- **Windmill:** Workflow platform with built-in UI editor
- **Cohere:** AI embeddings, reranking, and text generation
- **PostgreSQL + pgvector:** Vector database for semantic search
- **Docker:** Containerized infrastructure
- **Python 3.11+:** Backend scripts

### Frontend (NEW - v2.0)
- **Vite + React 19:** Fast modern React setup
- **TypeScript:** Type-safe development
- **Tailwind CSS v3.4:** Utility-first styling with CSS variables
- **ShadCN/ui:** Beautiful accessible components
- **Zustand:** Lightweight state management
- **cmdk:** Command palette (Cmd+K)

## Quick Start

### Prerequisites

- Docker Desktop installed
- Node.js 18+ and pnpm
- Cohere account with production API key (https://dashboard.cohere.com/)
- 4GB RAM minimum
- Windows 11 / Linux / macOS

### 1. Start Backend Infrastructure

```bash
cd Infrastructure
cp .env.example .env
# Edit .env and add your Cohere API key
docker compose up -d
```

### 2. Start Windmill

```bash
cd windmill-setup
docker compose up -d
# Access at: http://localhost
```

### 3. Start Frontend

```bash
cd frontend
pnpm install
pnpm run dev
# Access at: http://localhost:5173
```

## Frontend Features (v2.0)

### Implemented (Phase 1 + Phase 3)

| Feature | Description | Shortcut |
|---------|-------------|----------|
| **Command Palette** | Quick actions and navigation | `Cmd+K` / `Ctrl+K` |
| **Dark Mode** | System preference detection + toggle | Via Command Palette |
| **Sidebar Navigation** | Collapsible sidebar with all sections | `Cmd+B` / `Ctrl+B` |
| **Chat History** | Multi-session support with persistence | Sidebar → Chat History |
| **Session Management** | Create, switch, delete conversations | Via Chat History |
| **Document Upload** | Upload documents with category selection | Sidebar → Documents |
| **Document Search** | Semantic search with relevance scores | Sidebar → Documents |

### Navigation Sections

- **Quick Actions:** Upload Document, Search Documents
- **Navigation:** Chat, Documents, Chat History, Family Members
- **Categories:** Financial, Medical, Legal, Insurance, Education, Personal
- **Settings:** Theme toggle, Settings, Help

### Coming Soon (Phase 2 + Phase 4)

- Multi-user family accounts with roles (Admin/Member/Guest)
- ELK monitoring dashboard
- Usage analytics and cost tracking

## Project Structure

```
Archevi/
├── frontend/                   # React frontend (NEW)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # ShadCN components
│   │   │   ├── chat/          # Chat components
│   │   │   ├── AppSidebar.tsx # Main navigation
│   │   │   ├── CommandPalette.tsx
│   │   │   └── ChatHistory.tsx
│   │   ├── store/
│   │   │   └── chat-store.ts  # Zustand state
│   │   ├── api/
│   │   │   └── windmill.ts    # Backend integration
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── Infrastructure/             # Docker, database setup
│   ├── docker-compose.yml
│   ├── schema.sql
│   └── .env.example
├── windmill-setup/             # Windmill Docker setup
├── scripts/                    # Windmill Python scripts
├── 02_Documentation/           # Implementation guides
└── README.md
```

## Implementation Phases

### Phase 1: Frontend Foundation (Completed ✓)
- [x] Vite + React + TypeScript setup
- [x] ShadCN/ui component library
- [x] Zustand state management
- [x] Command Palette (Cmd+K)
- [x] Dark mode with system preference
- [x] Collapsible sidebar navigation
- [x] Chat History with multi-session support
- [x] Rebranded to "Archevi"

### Phase 2: Multi-user Family Accounts (Deferred - Requires Backend)
- [ ] User authentication system
- [ ] Family roles (Admin/Member/Guest)
- [ ] User preferences storage
- [ ] Session-per-user isolation

### Phase 3: Categories & Document Browser (Completed)
- [x] Document upload interface with form validation
- [x] Category-based filtering (7 categories)
- [x] Semantic document search
- [x] Document browser with relevance scores
- [x] File upload support (.txt, .md)

### Phase 4: Monitoring & Analytics (Next)
- [ ] ELK stack integration
- [ ] Usage analytics dashboard
- [ ] Cost tracking
- [ ] Performance monitoring

### Backend Phases (Previously Completed)
- [x] Infrastructure Setup (Docker, PostgreSQL)
- [x] Database Schema (pgvector, tables)
- [x] Backend Scripts (5 Python scripts in Windmill)

## Development

### Frontend Development

```bash
cd frontend
pnpm run dev      # Start dev server (http://localhost:5173)
pnpm run build    # Production build
pnpm run preview  # Preview production build
```

### Adding ShadCN Components

```bash
cd frontend
npx shadcn@latest add [component-name]
```

### State Management

The app uses Zustand for state management with localStorage persistence:

```typescript
// Chat store features
- currentSessionId: string | null
- sessions: ChatSession[]
- isLoading: boolean
- addMessage()
- createNewSession()
- switchSession()
- deleteSession()
```

## API Integration

The frontend connects to Windmill backend via REST API:

```typescript
// api/windmill.ts
const WINDMILL_BASE_URL = 'http://localhost/api/w/archevi';

windmill.ragQuery({ query, session_id })  // Main RAG endpoint
```

## Cost Estimate

### Backend (Cohere API)
- Embeddings: ~$0.005/month
- Queries: ~$0.05/month
- **Total: ~$0.10/month**

### Infrastructure
- VPS: $10-20/month (or free on home server)

## Security & Privacy

- Self-hosted (data stays local)
- PostgreSQL bound to localhost
- Optional Cohere ZDR (Zero Data Retention)
- Family member authentication (Phase 2)
- Daily automated backups

## Resources

- Windmill: https://www.windmill.dev/docs
- Cohere: https://docs.cohere.com/
- ShadCN/ui: https://ui.shadcn.com/
- pgvector: https://github.com/pgvector/pgvector

---

**Created:** 2025-11-26
**Frontend Added:** 2025-11-27
**Phase 3 Complete:** 2025-11-27
**Repository:** https://github.com/robhdsndsn/Archevi

*This project follows Claudius workspace standards and uses Claude Code for development automation.*
