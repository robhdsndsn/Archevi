# Archevi

**Your Family's AI-Powered Memory** — Privately stored, instantly accessible, 90% cheaper than alternatives.

[![Documentation](https://img.shields.io/badge/docs-online-blue)](https://robhdsndsn.github.io/Archevi/)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)
[![Status](https://img.shields.io/badge/status-beta-orange)]()

---

## What is Archevi?

Archevi is an open-source, self-hosted family knowledge base powered by AI. It uses RAG (Retrieval-Augmented Generation) to let you ask natural language questions about your family's documents and get instant, accurate answers.

**Stop losing important information. Stop paying $240/year for Notion. Stop digging through folders.**

### Ask Questions Like:
- 🍪 *"What's grandma's cookie recipe?"*
- 💊 *"What medications is dad taking?"*
- 📄 *"Where's the home insurance policy?"*
- 🔐 *"What's the WiFi password?"*
- 📅 *"When does the car registration expire?"*

## Why Archevi?

| Feature | Archevi (Self-Hosted) | Notion | Google Drive |
|---------|----------------------|--------|--------------|
| **AI Search** | ✅ Natural language | ❌ Keywords only | ❌ Keywords only |
| **Privacy** | ✅ Your servers | ❌ Cloud storage | ❌ Google servers |
| **Monthly Cost** | ~$2 CAD | $20-40 | Free (no AI) |
| **Data Ownership** | ✅ 100% yours | ❌ Vendor lock-in | ❌ Google's terms |

## Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| **RAG-Powered Chat** | Ask questions in natural language, get answers with sources |
| **Document Management** | Upload, categorize, and search documents |
| **7 Categories** | Financial, Medical, Legal, Insurance, Education, Personal, General |
| **Semantic Search** | Find documents by meaning, not just keywords |
| **Multi-Session Chat** | Maintain conversation history across sessions |
| **Dark Mode** | System preference detection + manual toggle |
| **Command Palette** | Quick actions with `Cmd+K` / `Ctrl+K` |
| **Admin View Toggle** | Switch between admin and user perspectives |
| **VitePress Documentation** | Complete docs at [robhdsndsn.github.io/Archevi](https://robhdsndsn.github.io/Archevi/) |

### 🚧 In Development

| Feature | Status | Description |
|---------|--------|-------------|
| **Multi-User Auth** | Planned | Family member accounts with roles |
| **File Upload** | Planned | PDF, images with OCR |
| **Mobile App** | Planned | iOS/Android native apps |
| **Voice Queries** | Planned | Ask questions by voice |

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 18+ and pnpm
- [Cohere API Key](https://dashboard.cohere.com/) (free tier available)
- 4GB RAM minimum

### Installation

```bash
# Clone the repository
git clone https://github.com/robhdsndsn/Archevi.git
cd Archevi

# Start database (PostgreSQL + pgvector)
cd Infrastructure
cp .env.example .env
# Edit .env and add your Cohere API key
docker compose up -d

# Start Windmill (workflow engine)
cd ../windmill-setup
docker compose up -d

# Start frontend
cd ../frontend
pnpm install
pnpm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Windmill Admin: http://localhost
- API: http://localhost/api/w/archevi

📖 **[Full Installation Guide](https://robhdsndsn.github.io/Archevi/guide/installation)**

## Technology Stack

### Backend
- **[Windmill](https://windmill.dev)** — Workflow orchestration platform
- **[Cohere](https://cohere.com)** — AI embeddings, reranking, and generation
- **[PostgreSQL](https://postgresql.org) + [pgvector](https://github.com/pgvector/pgvector)** — Vector database
- **[Docker](https://docker.com)** — Containerized deployment
- **Python 3.11+** — Backend scripts

### Frontend
- **[React 19](https://react.dev) + [Vite](https://vitejs.dev)** — Fast modern React
- **[TypeScript](https://typescriptlang.org)** — Type-safe development
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com)** — Beautiful accessible components
- **[Zustand](https://zustand-demo.pmnd.rs)** — Lightweight state management

## Project Structure

```
Archevi/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── api/             # Windmill API client
│   │   └── store/           # Zustand state
│   └── package.json
├── scripts/                  # Windmill Python scripts
│   ├── rag_query.py         # Main RAG endpoint
│   ├── embed_document.py    # Document embedding
│   ├── search_documents.py  # Semantic search
│   └── auth_*.py            # Authentication scripts
├── Infrastructure/           # Database setup
│   ├── docker-compose.yml
│   ├── schema.sql
│   └── .env.example
├── windmill-setup/           # Windmill Docker config
├── docs/                     # VitePress documentation
└── README.md
```

## Cost Breakdown

### Self-Hosted (~$2 CAD/month)

| Component | Cost |
|-----------|------|
| Cohere API (embeddings + queries) | ~$2/month |
| Docker (on your hardware) | Free |
| PostgreSQL | Free |
| **Total** | **~$2/month** |

### Managed Service (Coming Soon)

We're planning a managed hosting option at **$14.99 CAD/month** for families who want zero setup.

## Roadmap

### Phase 1: Foundation ✅
- [x] RAG backend with Cohere + pgvector
- [x] React frontend with chat interface
- [x] Document upload and categorization
- [x] Semantic search
- [x] VitePress documentation site

### Phase 2: Multi-User (Next)
- [ ] User authentication (JWT)
- [ ] Family member management
- [ ] Role-based permissions (Admin/Member/Guest)
- [ ] Per-user conversation history

### Phase 3: Enhanced Documents
- [ ] PDF upload with text extraction
- [ ] Image upload with OCR
- [ ] Bulk document import
- [ ] Document versioning

### Phase 4: Mobile & Voice
- [ ] Progressive Web App (PWA)
- [ ] iOS native app
- [ ] Android native app
- [ ] Voice query support

### Phase 5: Advanced Features
- [ ] Automated document categorization
- [ ] Smart reminders (expiring documents)
- [ ] Family calendar integration
- [ ] Multi-language support (French first)

## Use Cases

- **Medical Records** — Track medications, allergies, doctor visits
- **Recipes** — Store and search family recipes
- **Financial Documents** — Insurance policies, tax records, warranties
- **Estate Planning** — Wills, important contacts, account information
- **Family History** — Stories, genealogy, traditions

📖 **[Explore All Use Cases](https://robhdsndsn.github.io/Archevi/use-cases/)**

## Contributing

We welcome contributions! See our [Contributing Guide](https://robhdsndsn.github.io/Archevi/contributing/) for details.

```bash
# Development setup
git clone https://github.com/robhdsndsn/Archevi.git
cd Archevi/frontend
pnpm install
pnpm run dev
```

## Documentation

- 📖 **[Full Documentation](https://robhdsndsn.github.io/Archevi/)**
- 🚀 **[Getting Started](https://robhdsndsn.github.io/Archevi/guide/)**
- 🔧 **[API Reference](https://robhdsndsn.github.io/Archevi/api/)**
- ❓ **[FAQ](https://robhdsndsn.github.io/Archevi/guide/faq)**

## License

Apache 2.0 — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for families who value privacy and simplicity.</strong>
</p>

<p align="center">
  <a href="https://robhdsndsn.github.io/Archevi/">Documentation</a> •
  <a href="https://github.com/robhdsndsn/Archevi/issues">Report Bug</a> •
  <a href="https://github.com/robhdsndsn/Archevi/issues">Request Feature</a>
</p>
