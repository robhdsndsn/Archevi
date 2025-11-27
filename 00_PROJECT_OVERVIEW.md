# Archevi - Project Overview

## Created
2025-11-26

## Description
RAG-powered family knowledge base chatbot using Windmill, Cohere, and pgvector. Enables family members to query documentation through natural language, with semantic search and AI-generated responses.

**Brand Name:** Archevi (formerly FamilySecondBrain)

## Project Goal
Build a centralized family knowledge base that can answer questions about:
- Recipes and cooking instructions
- Medical history and health information
- Financial documents and procedures
- Family history and stories
- General household information
- WiFi passwords, emergency contacts, etc.

## Project Path
```
C:/Users/RHudson/Desktop/Claudius/Projects/FamilySecondBrain
```

## Current Phase
**Phase 4: Monitoring & Analytics** (Next)

**Implementation Timeline:**
- Phase 1: Infrastructure Setup ✓ Complete
- Phase 2: Database Schema Setup ✓ Complete
- Phase 3: Backend Scripts ✓ Complete (5 scripts deployed)
- Phase 4: Windmill UI Construction ✓ Complete
- **Phase 1 Frontend:** React App ✓ Complete (v2.0)
- **Phase 2 Frontend:** Multi-user Accounts (Requires backend auth - deferred)
- **Phase 3 Frontend:** Categories & Documents ✓ Complete (v2.1)
- **Phase 4 Frontend:** Monitoring & Analytics (Next)

## Project Structure
```
FamilySecondBrain/
├── frontend/                     # React frontend (v2.1)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # ShadCN components (25+ components)
│   │   │   ├── chat/            # Chat UI components
│   │   │   ├── documents/       # Document management (NEW)
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── DocumentBrowser.tsx
│   │   │   │   └── DocumentsView.tsx
│   │   │   ├── AppSidebar.tsx   # Navigation sidebar
│   │   │   ├── CommandPalette.tsx # Cmd+K palette
│   │   │   └── ChatHistory.tsx  # Session history
│   │   ├── store/
│   │   │   └── chat-store.ts    # Zustand state management
│   │   ├── api/
│   │   │   └── windmill/        # Backend API client
│   │   │       ├── client.ts    # API methods
│   │   │       ├── types.ts     # TypeScript types
│   │   │       └── index.ts     # Exports
│   │   ├── lib/
│   │   │   └── utils.ts         # Utility functions
│   │   └── App.tsx              # Main application
│   ├── components.json          # ShadCN configuration
│   ├── tailwind.config.js       # Tailwind + sidebar colors
│   ├── package.json
│   └── vite.config.ts
├── Infrastructure/               # Docker, database, setup files
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── .env                      # (Not in git)
│   ├── schema.sql
│   └── README.md
├── windmill-setup/               # Windmill Docker setup
│   ├── docker-compose.yml
│   ├── .env
│   └── Caddyfile
├── scripts/                      # Windmill Python scripts
│   ├── embed_document.py
│   ├── rag_query.py
│   ├── get_conversation_history.py
│   ├── bulk_upload_documents.py
│   └── search_documents.py
├── backups/                      # Database backups
├── 01_Planning/
│   └── Requirements.md
├── 02_Development/
│   └── Code_Notes.md
├── 02_Documentation/             # Implementation guides
│   └── Implementation_Guide.md
├── 03_Learning/
│   └── Key_Insights.md
├── 04_Output/
│   └── Deliverables.md
├── .gitignore
├── 00_PROJECT_OVERVIEW.md        # This file
├── CLAUDE.md                     # Claude Code instructions
├── Claude_Session_Archive.md
├── Claude_Session_Log.md
└── README.md
```

## Technical Stack

### Frontend (v2.0 - NEW)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Build Tool** | Vite 7.2 | Fast dev server with HMR |
| **Framework** | React 19 | UI framework |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **Components** | ShadCN/ui | Accessible, customizable components |
| **State** | Zustand | Lightweight state management |
| **Command Palette** | cmdk | Keyboard-first navigation |
| **Icons** | Lucide React | Modern icon library |

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Workflow Platform** | Windmill (self-hosted) | Free unlimited executions, MCP integration |
| **Embeddings** | Cohere Embed English v3.0 (1024d) | Semantic search |
| **Reranking** | Cohere Rerank English v3.0 | Improves retrieval accuracy |
| **Generation** | Cohere Command-R7B | Cost-effective chat |
| **Vector Database** | PostgreSQL + pgvector | Proven reliability |
| **Backend** | Python 3.11+ | Native Windmill support |

### Development Environment
- Platform: Windows 11
- Node.js: 18+
- Package Manager: pnpm
- Shell: Git Bash / CMD
- Database: PostgreSQL 16 with pgvector
- Container Runtime: Docker Desktop

## Frontend Architecture (v2.0)

### Component Hierarchy
```
App
├── SidebarProvider
│   ├── CommandPalette (global, Cmd+K)
│   ├── AppSidebar
│   │   ├── SidebarHeader (Archevi branding)
│   │   ├── SidebarContent
│   │   │   ├── Quick Actions (Upload, Search -> Documents)
│   │   │   ├── Navigation (Chat, Documents, History, Family)
│   │   │   └── Categories (Financial, Medical, Legal, etc.)
│   │   └── SidebarFooter (Settings, Help)
│   └── SidebarInset
│       ├── Header (with SidebarTrigger)
│       └── Main Content
│           ├── ChatContainer (when view='chat')
│           ├── ChatHistory (when view='history')
│           └── DocumentsView (when view='documents')
│               ├── Tabs (Search / Upload)
│               ├── DocumentBrowser (semantic search)
│               └── DocumentUpload (form with category select)
```

### State Management (Zustand)
```typescript
interface ChatStore {
  // Current session
  currentSessionId: string | null;
  sessions: ChatSession[];
  isLoading: boolean;

  // Actions
  addMessage(): void;
  createNewSession(): string;
  switchSession(id: string): void;
  deleteSession(id: string): void;
  clearChat(): void;
}
```

### Key Features Implemented
1. **Command Palette** - Cmd+K for quick access to all features
2. **Dark Mode** - System preference detection + localStorage persistence
3. **Sidebar Navigation** - Collapsible with categories
4. **Chat History** - Multi-session with titles, timestamps, delete
5. **Session Persistence** - localStorage via Zustand persist
6. **Document Upload** - Form with title, category, content (text or file)
7. **Document Search** - Semantic search with category filtering
8. **Document Browser** - Grid display with relevance scores and metadata

## Key Resources

- **Session Log:** [[Claude_Session_Log.md]] - Current status and recent work
- **Session Archive:** [[Claude_Session_Archive.md]] - Complete historical context
- **CLAUDE.md:** [[CLAUDE.md]] - Claude Code project instructions
- **Implementation Guide:** [[02_Documentation/Implementation_Guide.md]] - Complete setup guide
- **Infrastructure README:** [[Infrastructure/README.md]] - Setup and troubleshooting

## Access & Credentials

### Frontend
- **Dev Server:** http://localhost:5173
- **Build Output:** frontend/dist/

### Windmill
- **Self-hosted URL:** http://localhost
- **Admin Login:** admin@familybrain.com / FamilyBrain2025!Admin
- **Workspace:** family-brain
- **Workspace URL:** http://localhost/w/family-brain

### PostgreSQL
- **Host (from host):** localhost:5433
- **Host (from Docker):** family-brain-db:5432
- **Database:** family_brain
- **User:** familyuser

## Implementation Status

### Backend (Completed)
- [x] Infrastructure Setup (Docker, PostgreSQL, pgvector)
- [x] Database Schema (4 tables with vector index)
- [x] Backend Scripts (5 Python scripts in Windmill)
- [x] Windmill UI (App Editor interface)

### Frontend Phase 1: Foundation (Completed ✓)
- [x] Vite + React + TypeScript setup
- [x] Tailwind CSS with CSS variables
- [x] ShadCN/ui component library (20+ components)
- [x] Zustand state management
- [x] Windmill API client integration
- [x] Command Palette (Cmd+K)
- [x] Dark mode with system preference
- [x] Collapsible sidebar navigation
- [x] Chat History with multi-session support
- [x] Rebranding to "Archevi"

### Frontend Phase 2: Multi-user (Deferred - Requires Backend)
- [ ] User authentication UI
- [ ] Login/Signup forms
- [ ] User profile management
- [ ] Family roles (Admin/Member/Guest)
- [ ] User preferences

### Frontend Phase 3: Categories & Documents (Completed)
- [x] Document upload interface with form validation
- [x] Category selection (7 categories with Lucide icons)
- [x] Document browser component with search
- [x] Semantic search with relevance scores
- [x] File upload support (.txt, .md)
- [x] Windmill API integration (embedDocument, searchDocuments)

### Frontend Phase 4: Monitoring (Next)
- [ ] ELK stack integration
- [ ] Usage analytics dashboard
- [ ] Cost tracking visualization
- [ ] Performance monitoring

## Security & Privacy

### Data Protection
- Self-hosted (all data stays local)
- PostgreSQL bound to localhost only
- Cohere production keys with optional ZDR
- Frontend state persisted to localStorage only

### Future Authentication (Phase 2)
- Family member accounts
- Role-based access control
- Sensitive document restrictions

## Notes

### Design Decisions
- **Why React + Vite:** Modern DX, fast HMR, TypeScript support
- **Why ShadCN/ui:** Accessible, customizable, copy-paste components
- **Why Zustand:** Simpler than Redux, built-in persist middleware
- **Why cmdk:** Battle-tested command palette used by Vercel, Linear

### Future Enhancements
- Voice interface (speech-to-text)
- Document OCR for scanned documents
- Mobile-responsive design improvements
- PWA support for offline access

---

**Last Updated:** 2025-11-27
**Status:** Frontend Phase 3 Complete (v2.1) - Documents view with upload and search
