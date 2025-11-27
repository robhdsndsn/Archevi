# Architecture

Overview of Archevi's technical architecture.

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Windmill     │────▶│   PostgreSQL    │
│  React + Vite   │     │   (Backend)     │     │   + pgvector    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Cohere API    │
                        │  (Embed + RAG)  │
                        └─────────────────┘
```

## Components

### Frontend
- React 18 with TypeScript
- Vite for building
- Tailwind CSS + shadcn/ui
- Zustand for state management

### Backend (Windmill)
- Python scripts for business logic
- REST API endpoints
- Job scheduling and execution

### Database
- PostgreSQL with pgvector extension
- Vector embeddings for semantic search
- JSON storage for documents and metadata

### AI Layer
- Cohere Embed for vectorization
- Cohere Command for RAG generation

## Data Flow

### Document Upload
1. User uploads document via frontend
2. Frontend calls Windmill API
3. Windmill script chunks document
4. Cohere embeds chunks
5. Vectors stored in pgvector
6. Metadata stored in PostgreSQL

### Query Processing
1. User asks question
2. Cohere embeds query
3. pgvector finds similar chunks
4. Context assembled from chunks
5. Cohere generates answer
6. Response returned with sources
