# Family Second Brain - Admin Dashboard

A comprehensive administration dashboard for managing the Family Second Brain multi-tenant application. Built with React, TypeScript, Vite, and shadcn/ui.

## Features

### Dashboard
- **Overview**: System metrics including total tenants, active users, documents, and recent activity
- **Activity Feed**: Real-time feed of system events and user actions

### System Health
- **Services Status**: Real-time health monitoring of all backend services
  - Windmill (workflow engine)
  - PostgreSQL (primary database)
  - Cohere Embeddings, Rerank, and Chat (AI services)
- **API Performance**: Latency tracking and response time metrics
- **Error Logs**: System error monitoring and debugging

### Tenant Management
- **All Families**: Complete list of tenant accounts with filtering and pagination
- **Create Family**: Onboard new tenant accounts with plan selection
- **Edit Tenant**: Modify tenant settings (plan, status, AI budget)
- **View Details**: Comprehensive tenant view with:
  - Overview tab: Slug, status, plan, API mode, quotas
  - Members tab: User list with roles and join dates
  - Activity tab: Recent conversations and usage
- **Usage Stats**: Per-tenant resource utilization and costs
- **Suspend/Activate**: Tenant lifecycle management

### Windmill Integration
- **Jobs**: View and monitor Windmill job execution
- **Scripts**: Manage Python scripts deployed to Windmill
- **Flows**: Workflow management
- **Schedules**: Cron-based scheduled tasks

### RAG System
- **Documents**: Browse and search all documents across tenants
- **Embeddings**: Vector database statistics
  - pgvector health status
  - Total vectors and dimensions
  - Coverage percentage by tenant and category
  - Recent embedding activity
- **Query Stats**: RAG query analytics
  - Total queries, response times, success rates
  - Queries by tenant and daily trends
  - Recent query log

### Database
- **PostgreSQL**: Database health and metrics
  - Version, size, connection pool status
  - Table statistics with row counts and sizes
  - Extension list (pgvector, uuid-ossp, pg_trgm)
- **Vector Indexes**: HNSW/IVFFlat index information
- **Migrations**: Schema version tracking

### Billing
- **API Costs**: Usage-based cost tracking
  - MTD costs with monthly projections
  - Breakdown by provider (Groq, Cohere)
  - Breakdown by tenant
  - Daily cost trends
- **Usage Tracking**: Token and operation metrics
- **Projections**: Cost forecasting

### Logs
- **Application Logs**: System event logging
- **Audit Trail**: User action tracking from Windmill

### Settings
- **General**: System-wide configuration
- **API Keys**: Manage service credentials
- **Integrations**: Third-party service connections
- **Branding**: Theme customization
  - Brand name and logos
  - Color scheme (primary, secondary, accent)
  - Theme presets (Ocean Blue, Forest Green, etc.)
  - Custom CSS support

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Routing**: Hash-based client-side routing
- **Icons**: Lucide React
- **API Client**: Custom Windmill client with typed interfaces

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Running Windmill instance
- PostgreSQL with pgvector extension

### Installation

```bash
cd admin
pnpm install
```

### Configuration

Create `.env.local` with your Windmill credentials:

```env
VITE_WINDMILL_TOKEN=your_windmill_token
VITE_WINDMILL_WORKSPACE=family-brain
VITE_WINDMILL_URL=http://localhost  # Optional, uses proxy in dev
```

### Development

```bash
pnpm dev
```

The admin dashboard runs on http://localhost:5174 (separate from main frontend on 5173).

### Production Build

```bash
pnpm build
pnpm preview
```

## API Endpoints

The admin dashboard uses Windmill scripts as its backend. Key scripts:

| Script | Purpose |
|--------|---------|
| `f/chatbot/list_tenants` | List all tenant accounts |
| `f/chatbot/get_tenant_details` | Full tenant info with members/usage |
| `f/chatbot/create_tenant` | Create new tenant |
| `f/chatbot/update_tenant` | Modify tenant settings |
| `f/chatbot/health_check` | Backend service health |
| `f/chatbot/admin_list_documents` | Document listing with pagination |
| `f/chatbot/get_api_costs` | Usage cost breakdown |
| `f/chatbot/get_tenant_branding` | Theme configuration |
| `f/chatbot/update_tenant_branding` | Save theme changes |
| `f/chatbot/list_theme_presets` | Available color schemes |
| `f/chatbot/apply_theme_preset` | Apply preset to tenant |
| `f/chatbot/get_embedding_stats` | Vector database metrics |
| `f/chatbot/get_query_stats` | RAG query analytics |
| `f/chatbot/get_database_stats` | PostgreSQL/pgvector info |

Native Windmill APIs are also used for jobs, workers, scripts, flows, schedules, and audit logs.

## Project Structure

```
admin/
├── src/
│   ├── api/
│   │   └── windmill.ts        # Windmill API client with types
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── dashboard/         # Overview, SystemHealth
│   │   ├── tenants/           # TenantList, dialogs
│   │   ├── windmill/          # JobsList
│   │   ├── rag/               # DocumentsList, EmbeddingsStats, QueryStats
│   │   ├── database/          # DatabaseStatsPage
│   │   ├── billing/           # APICosts
│   │   ├── logs/              # ActivityLog
│   │   └── settings/          # SystemSettings, BrandingSettings
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── App.tsx                # Main app with routing
│   ├── App.css                # Global styles
│   └── main.tsx               # Entry point
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Security Notes

- This dashboard is for internal administration only
- Not intended for public deployment
- Requires valid Windmill API token
- All data operations go through Windmill's authorization layer

## Recent Updates (Dec 2025)

- Added Embeddings Stats page with pgvector monitoring
- Added Query Stats page with RAG analytics
- Added Database Stats page with PostgreSQL metrics
- Fixed embedding stats to use correct `family_documents` table
- Added tenant branding and theme presets
- Implemented comprehensive API testing suite
- All "Coming Soon" pages now display real data
