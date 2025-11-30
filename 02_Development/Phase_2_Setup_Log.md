# Phase 2: Database Schema Setup - Progress Log

**Date:** 2025-11-26
**Status:** Phase 3 Complete - All backend scripts deployed, ready for Phase 4 (UI Construction)

---

## Completed Tasks 

### 1. Environment Configuration (Completed)
- **Created:** `Infrastructure/.env`
- **Database Password:** FamilyBrain2024!SecurePassword
- **Cohere API Key:** Test key configured (A1nG9RGkUwGZduNFYWbKdJbngczhdG1JK1AV1KaE)
- **Note:** Using test key for initial setup, will need production key for real data

### 2. PostgreSQL Database (Completed)
- **Container:** family-brain-db
- **Image:** pgvector/pgvector:pg16
- **Status:** Running and healthy
- **Port:** 127.0.0.1:5433 (localhost only)
- **Database:** family_brain
- **User:** familyuser

**Verification Results:**
```bash
docker ps --filter "name=family-brain-db"
# Container ID: 1faf209c7335
# Status: Up (healthy)
```

### 3. Database Schema (Completed)
All tables created successfully via schema.sql auto-initialization:

**Tables Created:**
1. `family_documents` - Documents with 1024d vector embeddings
2. `conversations` - Chat history with sources
3. `document_metadata` - Upload tracking
4. `api_usage_log` - Cost monitoring

**pgvector Extension:**
- Version: 0.8.1
- Enabled and verified

**Vector Column:**
- Type: vector(1024)
- Column: family_documents.embedding
- Index: HNSW (hnsw) with vector_cosine_ops

**Additional Indexes:**
- Primary key on id
- Category index (btree)
- Created_at index (DESC, btree)

**Verification Commands Used:**
```sql
-- List tables
\dt

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Show table structure
\d family_documents
```

### 4. Windmill Installation (Completed)
- **Setup Location:** `C:\Users\RHudson\Desktop\Claudius\Projects\FamilySecondBrain\windmill-setup`
- **Files Downloaded:**
 - docker-compose.yml (6710 bytes)
 - .env (479 bytes)
 - Caddyfile (378 bytes)
- **Status:** All 8 containers running successfully
- **Access URL:** http://localhost

**Windmill Components Running:**
1. windmill_server - Main API and web interface
2. windmill_worker (x3) - Script execution engines
3. windmill_worker_native - Native language support
4. db - PostgreSQL for Windmill data
5. lsp - Language Server Protocol
6. multiplayer - Real-time collaboration
7. windmill_indexer - Search indexing
8. caddy - Reverse proxy (port 80)

**Admin Credentials Created:**
- **Email:** admin@familybrain.com
- **Password:** FamilyBrain2025!Admin
- **Note:** Changed from default admin@windmill.dev / changeme during initial setup

### 5. Windmill Workspace (Completed)
- **Workspace Name:** Family Brain
- **Workspace ID:** family-brain
- **URL:** http://localhost/w/family-brain
- **Created by:** admin@familybrain.com
- **Status:** Active and ready for scripts

### 6. Windmill MCP Integration (Completed)
- **MCP Token:** `oCtiDUVTlVfzJWqAyQAb5wseem1Qgmd3` (limited scope for MCP operations)
- **MCP URL:** http://localhost/api/mcp/w/family-brain/sse?token=oCtiDUVTlVfzJWqAyQAb5wseem1Qgmd3
- **Integration Type:** Server-Sent Events (SSE)
- **Added to Projects:**
 - Claudius_Master (master project)
 - FamilySecondBrain
- **Status:** Ready for use after Claude Code reload

### 6b. Windmill User Token (For Script Deployment)
- **User Token:** `t8u4sIJRGhaHPqLn0VuUPUPbWSa9uTyi` (full admin permissions)
- **Used For:** Deploying scripts via REST API, administrative operations
- **Scope:** No restrictions (full access)

**Token Types Explained:**
| Token Type | Scope | Use Case |
|------------|-------|----------|
| MCP Token | Limited (variables, resources, run scripts) | Claude Code MCP integration |
| User Token | Full admin | Script deployment, API automation |

---

## Phase 3 Tasks (Completed)

### 7. Windmill Resource Configuration (Completed via MCP)
- [x] Created PostgreSQL database resource: `f/chatbot/postgres_db`
- [x] Created Cohere API key variable: `f/chatbot/cohere_api_key`

**Database Resource Configuration:**
```json
{
 "host": "family-brain-db",
 "port": 5432,
 "dbname": "family_brain",
 "user": "familyuser",
 "password": "FamilyBrain2024!SecurePassword",
 "sslmode": "disable"
}
```

### 8. Backend Python Scripts (All Deployed)
All 5 scripts deployed to Windmill via REST API:

| Script | Path | Hash | Description |
|--------|------|------|-------------|
| embed_document | f/chatbot/embed_document | 291901f65c1dd175 | Document embedding and storage |
| rag_query | f/chatbot/rag_query | 1a382b71d25173f7 | RAG pipeline (embed, search, rerank, generate) |
| get_conversation_history | f/chatbot/get_conversation_history | dfbc9819c4e8487b | Chat history retrieval |
| bulk_upload_documents | f/chatbot/bulk_upload_documents | 1204adf695d931dd | Batch document processing |
| search_documents | f/chatbot/search_documents | 1a77a71412ab1abe | Semantic search (testing) |

**Local script files:** `FamilySecondBrain/scripts/*.py`

---

## Technical Details

### PostgreSQL Connection Info
```bash
Host: localhost (127.0.0.1)
Port: 5433
Database: family_brain
User: familyuser
Password: FamilyBrain2024!SecurePassword

# Connection string (from host):
postgresql://familyuser:FamilyBrain2024!SecurePassword@localhost:5433/family_brain

# Connection from Windmill (Docker network):
Host: family-brain-db
Port: 5432

# Docker exec command:
docker exec -it family-brain-db psql -U familyuser -d family_brain
```

### Windmill Access Info
```bash
# Web UI
URL: http://localhost
Email: admin@familybrain.com
Password: FamilyBrain2025!Admin

# Workspace
Name: Family Brain
ID: family-brain
URL: http://localhost/w/family-brain

# MCP Integration (for Claude Code)
MCP URL: http://localhost/api/mcp/w/family-brain/sse?token=oCtiDUVTlVfzJWqAyQAb5wseem1Qgmd3
Transport: SSE (Server-Sent Events)
MCP Token: oCtiDUVTlVfzJWqAyQAb5wseem1Qgmd3

# User Token (for script deployment)
User Token: t8u4sIJRGhaHPqLn0VuUPUPbWSa9uTyi
Scope: Full admin (no restrictions)
```

### File Locations
```
FamilySecondBrain/
├── Infrastructure/
│ ├── docker-compose.yml # PostgreSQL setup
│ ├── schema.sql # Database schema (auto-applied)
│ ├── .env # Environment variables
│ └── .env.example # Template
├── windmill-setup/
│ ├── docker-compose.yml # Windmill setup
│ ├── .env # Windmill config
│ └── Caddyfile # Proxy config
├── .mcp.json # Windmill MCP configuration
└── 02_Development/
 └── Phase_2_Setup_Log.md # This file

Claudius_Master/ (master project)
└── .mcp.json # Windmill MCP configuration (shared)
```

### Docker Containers Status
```bash
# PostgreSQL (family-brain-db)
CONTAINER ID: 1faf209c7335
IMAGE: pgvector/pgvector:pg16
STATUS: Up (healthy)
PORTS: 127.0.0.1:5433->5432/tcp

# Windmill (8 containers)
STATUS: All running successfully
- windmill-server-1 (API/Web)
- windmill-worker-1, 2, 3 (Execution)
- windmill-worker-native-1 (Native)
- windmill-db-1 (Database)
- windmill-lsp-1 (LSP)
- windmill-caddy-1 (Proxy on port 80)
```

---

## Troubleshooting Notes

### PostgreSQL Issues
If database connection fails:
```bash
# Check container status
docker ps --filter "name=family-brain-db"

# Check logs
docker logs family-brain-db

# Restart container
docker restart family-brain-db

# Verify network
docker network ls | grep family-brain-network
```

### Windmill Issues
If Windmill doesn't start:
```bash
# Check all containers
docker ps --filter "name=windmill"

# Check logs
docker logs windmill-server-1
docker logs windmill-db-1

# Restart all services
cd windmill-setup
docker compose restart
```

---

## Next Steps (Phase 4 - UI Construction)

Phase 3 is complete. Proceed to Phase 4:

1. **Build Windmill UI (manual drag-and-drop ~15 min):**
 - Create new App: "Family Second Brain"
 - Add Text Input component for user queries
 - Add Button to trigger RAG query
 - Add Rich Text component for AI responses
 - Add Table/List for conversation history
 - Add Modal for document upload

2. **Connect Components to Backend Scripts:**
 - Button onClick → run `f/chatbot/rag_query`
 - Pass query input value to script
 - Display result in Rich Text component
 - Load history from `f/chatbot/get_conversation_history`

3. **Test the Complete Flow:**
 - Add sample documents via `f/chatbot/embed_document`
 - Run test queries
 - Verify responses and sources

4. **Deploy and Share:**
 - Set app permissions
 - Share URL with family members

---

## Cost Tracking

**Infrastructure Costs:**
- PostgreSQL: Free (Docker container)
- Windmill: Free (self-hosted)
- Cohere API: Test key (no cost during testing)

**When Moving to Production:**
- Cohere API: ~$0.05/month for typical family usage
- VPS (if hosting remotely): $10-20/month
- Total: ~$10-20/month

---

## Key Learnings

1. **pgvector Auto-Installation:** Schema.sql runs automatically via Docker's init system
2. **Docker Health Checks:** family-brain-db uses health checks for proper startup sequencing
3. **Localhost Binding:** PostgreSQL bound to 127.0.0.1:5433 for security
4. **Test API Keys:** Using Cohere test key for development, will upgrade to production key
5. **Multi-Container Setup:** Windmill requires 8 containers, takes 2-5 min first install
6. **Docker Volume Conflicts:** Initial Windmill setup failed due to pre-existing volumes; resolved with `docker compose down -v`
7. **Windmill Admin Setup:** Creating custom admin account during setup sometimes shows errors but succeeds anyway
8. **Windmill MCP Integration:** Use SSE transport for Windmill MCP; requires project-specific .mcp.json configuration
9. **Docker Networking:** Windmill containers communicate with PostgreSQL via Docker network name (family-brain-db), not localhost
10. **Workspace Isolation:** Each Windmill user account sees only workspaces they created; MCP tokens are workspace-specific

---

**Last Updated:** 2025-11-26 12:35 PM EST
**Status:** Phase 3 Complete - All 5 backend scripts deployed to Windmill, ready for Phase 4 (UI)
