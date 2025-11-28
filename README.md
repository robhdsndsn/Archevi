# Archevi

AI-powered family knowledge base with RAG search, voice notes, and smart document management.

## Overview

Archevi is a private family archive that uses AI to help you store, search, and retrieve important documents and information. Built with modern RAG (Retrieval-Augmented Generation) technology, it provides intelligent answers grounded in your actual documents.

## Features

### Document Management
- **PDF Upload** - Extract text from PDF documents automatically
- **AI Enhanced Mode** - Auto-categorization, smart tagging, and expiry date detection
- **OCR Support** - Process scanned documents and images with client-side Tesseract.js
- **Semantic Search** - Find documents by meaning, not just keywords

### Voice Notes
- **Browser Recording** - Record voice memos directly in the app
- **Groq Whisper Transcription** - Fast, accurate transcription (80+ languages)
- **Auto-Embedding** - Voice notes are searchable via RAG queries

### Smart Features
- **Expiry Alerts** - Dashboard widget showing documents expiring soon
- **Tag Cloud** - Browse and filter by AI-extracted tags
- **Usage Analytics** - Track API costs and query patterns

### Chat Interface
- **Natural Language Queries** - Ask questions about your documents
- **Source Citations** - Answers include references to source documents
- **Conversation History** - Review and continue past sessions

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Windmill (workflow orchestration) |
| Database | PostgreSQL + pgvector |
| AI - Embeddings | Cohere Embed v4 (1024-dim) |
| AI - Generation | Cohere Command A/R |
| AI - Reranking | Cohere Rerank v3 |
| AI - Voice | Groq Whisper large-v3-turbo |
| Frontend | React + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| OCR | Tesseract.js (client-side) |

## Project Structure

\`\`\`
Archevi/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── api/windmill/    # Windmill API client
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Login, password reset
│   │   │   ├── chat/        # Chat interface
│   │   │   ├── documents/   # Document management
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── lib/             # Utilities (OCR, etc.)
│   │   └── store/           # Zustand state management
│   └── package.json
├── scripts/                  # Windmill Python scripts
│   ├── embed_document.py
│   ├── embed_document_enhanced.py
│   ├── transcribe_voice_note.py
│   ├── get_tags.py
│   ├── get_expiring_documents.py
│   └── rag_query.py
├── Infrastructure/
│   └── migrations/          # PostgreSQL migrations
├── docs/                    # VitePress documentation
└── CLAUDE.md               # Claude Code instructions
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for Windmill and PostgreSQL)
- Cohere API key
- Groq API key (for voice transcription)

### Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/robhdsndsn/Archevi.git
   cd Archevi
   \`\`\`

2. **Start Windmill and PostgreSQL**
   \`\`\`bash
   docker compose up -d
   \`\`\`

3. **Configure environment**
   \`\`\`bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your Windmill URL and token
   \`\`\`

4. **Install dependencies and run**
   \`\`\`bash
   pnpm install
   pnpm dev
   \`\`\`

5. **Configure Windmill**
   - Add Cohere API key as variable: \`f/chatbot/cohere_api_key\`
   - Add Groq API key as variable: \`f/chatbot/groq_api_key\`
   - Deploy scripts from \`scripts/\` folder

### Database Migrations

Run migrations to set up the database schema:

\`\`\`bash
# Connect to PostgreSQL container
docker exec -it family-brain-db psql -U familyuser -d family_brain

# Run migrations in order
\i Infrastructure/migrations/001_initial_schema.sql
\i Infrastructure/migrations/002_conversation_history.sql
\i Infrastructure/migrations/003_multi_tenant.sql
\i Infrastructure/migrations/004_enhanced_document_features.sql
\`\`\`

## API Endpoints (Windmill)

| Endpoint | Description |
|----------|-------------|
| \`f/chatbot/rag_query\` | Main RAG query pipeline |
| \`f/chatbot/embed_document\` | Basic document embedding |
| \`f/chatbot/embed_document_enhanced\` | AI-enhanced embedding |
| \`f/chatbot/transcribe_voice_note\` | Voice note transcription |
| \`f/chatbot/get_tags\` | Get all document tags |
| \`f/chatbot/get_expiring_documents\` | Get documents by expiry |
| \`f/chatbot/auth_login\` | User authentication |
| \`f/chatbot/auth_verify\` | Token verification |

## Cost Estimates

| Feature | Monthly Cost (Typical Family) |
|---------|-------------------------------|
| Base usage (queries + embeddings) | ~\$2-5 |
| Voice notes (30 min) | +\$0.10 |
| Smart tagging | +\$0.20 |
| OCR | Free (client-side) |
| **Total** | ~\$3-6/month |

## Roadmap

- [x] Core RAG pipeline
- [x] Document upload and search
- [x] Voice note transcription
- [x] AI-enhanced embedding (tags, categories, expiry)
- [x] OCR for scanned documents
- [x] Expiry alerts dashboard
- [x] Tag cloud widget
- [ ] Deep Search mode (multi-step RAG)
- [ ] Email notifications for expiring documents
- [ ] Mobile PWA with camera scanning
- [ ] Multi-language UI support

## Contributing

This is a private project. Contact the repository owner for access.

## License

Proprietary - All rights reserved.

---

Built with Claude Code and Windmill.
