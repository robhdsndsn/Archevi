# Family Second Brain Chatbot - Complete Implementation Guide

**Project Goal:** Build a RAG-powered family knowledge base chatbot using Windmill, Cohere, and pgvector that allows family members to query documentation through natural language.

**Total Implementation Time:** ~4-6 hours (backend automated, UI manual wiring ~15 min)

**Estimated Running Cost:** ~$1.50/month for typical family usage

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Prerequisites](#prerequisites)
4. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
5. [Phase 2: Database Schema](#phase-2-database-schema)
6. [Phase 3: Backend Scripts (Claude Code Automated)](#phase-3-backend-scripts-claude-code-automated)
7. [Phase 4: UI Construction (Manual)](#phase-4-ui-construction-manual)
8. [Phase 5: Testing & Deployment](#phase-5-testing--deployment)
9. [Windmill Platform Details](#windmill-platform-details)
10. [Security & Privacy](#security--privacy)
11. [Cost Breakdown](#cost-breakdown)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Windmill App (Frontend)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Text Input   │→ │ Button       │→ │ Rich Text       │  │
│  │ (user_query) │  │ (Ask/Submit) │  │ (AI Response)   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                           ↓                                  │
└───────────────────────────┼──────────────────────────────────┘
                            ↓
┌───────────────────────────┼──────────────────────────────────┐
│              Windmill Backend Scripts (Python)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  f/chatbot/rag_query.py                                │ │
│  │  1. Embed query (Cohere)                               │ │
│  │  2. Vector search (pgvector)                           │ │
│  │  3. Rerank results (Cohere)                            │ │
│  │  4. Generate answer (Cohere Command-R)                 │ │
│  │  5. Store conversation                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  f/chatbot/embed_document.py                           │ │
│  │  - Ingests family documents                            │ │
│  │  - Generates embeddings                                │ │
│  │  - Stores in pgvector                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  f/chatbot/get_conversation_history.py                 │ │
│  │  - Retrieves recent conversations                      │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────────┘
                            ↓
┌───────────────────────────┼──────────────────────────────────┐
│               PostgreSQL with pgvector Extension             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ family_documents    │  │ conversations                │  │
│  │ - id (PK)           │  │ - id (PK)                    │  │
│  │ - title             │  │ - session_id                 │  │
│  │ - content           │  │ - role (user/assistant)      │  │
│  │ - category          │  │ - content                    │  │
│  │ - embedding (1024d) │  │ - sources (JSONB)            │  │
│  │ - created_at        │  │ - created_at                 │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────┘
                            ↓
                  ┌─────────────────────┐
                  │   Cohere API        │
                  │ - Embeddings        │
                  │ - Reranking         │
                  │ - Generation        │
                  └─────────────────────┘
```

### Data Flow

1. **User submits query** → React frontend chat interface
2. **API call triggers** → `f/chatbot/rag_query` script via Windmill
3. **Script workflow:**
   - Embed query with Cohere (`embed-v4.0`, 1024 dimensions)
   - Search pgvector for top 10 similar documents (cosine similarity)
   - Rerank top 10 using Cohere Rerank v3.5 with YAML-formatted docs
   - Generate answer with Command A (111B params) using retrieved context
   - Calculate weighted confidence score (50% top, 30% second, 20% third)
   - Return `{answer, sources, confidence, session_id}`
4. **Response displays** → React chat UI with relevance percentages
5. **Conversation stored** → PostgreSQL for history

---

## Technology Stack

| Component | Technology | Why This Choice |
|-----------|-----------|-----------------|
| **Workflow Platform** | Windmill (self-hosted) | Free unlimited executions, native Claude Code integration via MCP, built-in UI editor |
| **Embeddings** | Cohere Embed v4.0 (1024d) | $0.10 per 1M tokens, **multimodal**, 128K context, Matryoshka embeddings |
| **Reranking** | Cohere Rerank v3.5 | $2.00 per 1K searches, state-of-the-art multilingual retrieval |
| **Generation** | Cohere Command A | $2.50/1M input, $10/1M output, 111B parameters, 256K context |
| **Vector Database** | PostgreSQL + pgvector | Free, proven reliability, no separate service needed |
| **Frontend** | React + Vite + shadcn/ui | Modern stack with excellent DX and component library |
| **Backend** | Python 3.11+ | Native Windmill support, rich ecosystem |

### Model Upgrades (May 2025)

We upgraded to the latest Cohere models for improved performance:

| Model | Previous | Current | Key Benefits |
|-------|----------|---------|--------------|
| Embeddings | embed-english-v3.0 | **embed-v4.0** | Multimodal, 128K context, 200-page docs |
| Generation | command-r | **command-a-03-2025** | 111B params, 256K context, 150% faster |
| Reranking | rerank-english-v3.0 | **rerank-v3.5** | Best multilingual, YAML-formatted input |

### Why NOT Other Options

- **shadcn-svelte**: Not compatible with Windmill (Svelte app import not ready)
- **Custom React components**: Requires Enterprise plan ($120/month)
- **OpenAI**: More expensive for embeddings/generation (~3x cost)
- **Pinecone/Weaviate**: Additional service costs, PostgreSQL is sufficient

---

## Prerequisites

### Required Accounts & Setup

1. **Windmill Instance**
   - Self-hosted (recommended): Follow setup in Phase 1
   - Cloud trial: https://app.windmill.dev/user/login

2. **Cohere Account**
   - Sign up: https://cohere.com/
   - Get API key: Dashboard → API Keys
   - **CRITICAL**: Use production keys (trial keys prohibit personal data)
   - Consider ZDR (Zero Data Retention) for maximum privacy

3. **PostgreSQL Database**
   - Version 14+ with pgvector extension
   - Can be on same server as Windmill
   - Minimum 2GB RAM, 10GB storage

4. **Claude Code** (for development)
   - Install: https://claude.ai/download
   - MCP setup covered in Phase 1

### Local Development Environment

```bash
# Required tools
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL client tools
- Git
- Node.js 18+ (for Windmill CLI)
```

---

## Phase 1: Infrastructure Setup

### 1.1 Windmill Self-Hosted Setup

**Time: 5 minutes**

```bash
# Create directory
mkdir ~/windmill-family-brain
cd ~/windmill-family-brain

# Download official docker-compose setup
curl -o docker-compose.yml https://raw.githubusercontent.com/windmill-labs/windmill/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/windmill-labs/windmill/main/.env
curl -o Caddyfile https://raw.githubusercontent.com/windmill-labs/windmill/main/Caddyfile

# Start Windmill
docker compose up -d

# Wait ~30 seconds for initialization
# Access at: http://localhost
# Default login: admin@windmill.dev / changeme
```

**First login tasks:**
1. Change admin password immediately
2. Create workspace: "family-brain"
3. Create user accounts for family members

### 1.2 PostgreSQL with pgvector

**Option A: Add to existing Windmill Postgres**

```bash
# Connect to Windmill's postgres container
docker exec -it windmill-db-1 psql -U postgres -d windmill

# Install pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Option B: Separate PostgreSQL instance**

```yaml
# Add to docker-compose.yml
services:
  family-brain-db:
    image: pgvector/pgvector:pg16
    restart: always
    environment:
      POSTGRES_DB: family_brain
      POSTGRES_USER: familyuser
      POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD
    volumes:
      - family_brain_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

volumes:
  family_brain_data:
```

```bash
docker compose up -d family-brain-db
```

### 1.3 Claude Code MCP Connection

**Time: 2 minutes**

```bash
# Step 1: Get Windmill MCP URL
# In Windmill UI:
# 1. Click your profile → Settings
# 2. Navigate to "Tokens" section
# 3. Click "New Token" → Select "Generate MCP URL"
# 4. Copy the URL (format: https://app.windmill.dev/api/mcp/w/WORKSPACE_ID/sse?token=TOKEN)

# Step 2: Connect Claude Code
claude mcp add --transport http windmill YOUR_MCP_URL_HERE

# Step 3: Test connection
# In Claude Code terminal, type:
# "List all scripts in my Windmill workspace"
# Claude should respond with script listings
```

---

## Phase 2: Database Schema

### 2.1 Create Tables

Save this as `schema.sql`:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Family documents table with vector embeddings
CREATE TABLE family_documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- 'recipes', 'medical', 'financial', 'family_history', 'general'
    source_file TEXT,        -- Original filename if uploaded
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT,         -- User who added it
    embedding vector(1024)   -- Cohere embed-english-v3.0 dimension
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON family_documents 
USING hnsw (embedding vector_cosine_ops);

-- Create regular indexes
CREATE INDEX idx_documents_category ON family_documents(category);
CREATE INDEX idx_documents_created_at ON family_documents(created_at DESC);

-- Conversation history table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,           -- Array of source document IDs and snippets
    created_at TIMESTAMP DEFAULT NOW(),
    user_email TEXT
);

-- Indexes for conversation retrieval
CREATE INDEX idx_conversations_session ON conversations(session_id, created_at);
CREATE INDEX idx_conversations_user ON conversations(user_email, created_at DESC);

-- Document metadata for tracking uploads
CREATE TABLE document_metadata (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES family_documents(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    UNIQUE(document_id, key)
);

-- Usage tracking (optional, for monitoring costs)
CREATE TABLE api_usage_log (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL, -- 'embed', 'rerank', 'generate'
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT NOW()
);
```

Apply the schema:

```bash
# If using Windmill's postgres
docker exec -i windmill-db-1 psql -U postgres -d windmill < schema.sql

# If using separate postgres
docker exec -i family-brain-db psql -U familyuser -d family_brain < schema.sql
```

### 2.2 Create Windmill Database Resource

**In Windmill UI:**

1. Go to **Resources** → **+ Add Resource**
2. Select **PostgreSQL**
3. Name it: `f/chatbot/postgres_db`
4. Configure:
   ```json
   {
     "host": "family-brain-db",
     "port": 5432,
     "dbname": "family_brain",
     "user": "familyuser",
     "password": "YOUR_PASSWORD",
     "sslmode": "disable"
   }
   ```
5. Test connection → Save

### 2.3 Create Windmill Variable for Cohere API Key

**In Windmill UI:**

1. Go to **Variables** → **+ Add Variable**
2. Name: `f/chatbot/cohere_api_key`
3. Value: `your-cohere-api-key-here`
4. Mark as **Secret** (🔒)
5. Save

---

## Phase 3: Backend Scripts (Claude Code Automated)

### 3.1 Script Generation Prompts for Claude Code

**IMPORTANT**: After connecting Claude Code via MCP (Phase 1.3), use these exact prompts to generate all backend scripts.

#### Prompt 1: Document Embedding Script

```
Create a Windmill Python script called "embed_document" in folder "f/chatbot" that:

REQUIREMENTS:
- Takes inputs: title (str), content (str), category (str), source_file (str, optional)
- Uses Cohere embed-english-v3.0 to generate 1024-dimensional embedding
- Stores document in family_documents table with embedding
- Uses Windmill resource "f/chatbot/postgres_db" for database connection
- Uses Windmill variable "f/chatbot/cohere_api_key" for API key
- Returns document_id and confirmation message
- Includes proper error handling for API failures and database errors
- Logs token usage to api_usage_log table

TECHNICAL DETAILS:
- Use psycopg2 and pgvector libraries
- Register pgvector type: from pgvector.psycopg2 import register_vector
- Cohere client: import cohere; co = cohere.Client(api_key)
- Embedding call: co.embed(texts=[content], model="embed-english-v3.0", input_type="search_document")
- Database insert with parameterized query to prevent SQL injection

Include comprehensive docstring with parameter descriptions and usage examples.
```

#### Prompt 2: RAG Query Script

```
Create a Windmill Python script called "rag_query" in folder "f/chatbot" that implements a complete RAG pipeline:

REQUIREMENTS:
- Input: query (str), session_id (str, optional, defaults to new UUID)
- Output: JSON with {answer: str, sources: list, confidence: float, session_id: str}

WORKFLOW:
1. Embed user query using Cohere embed-english-v3.0 (input_type="search_query")
2. Vector search in PostgreSQL using cosine similarity (<=> operator), retrieve top 10
3. Rerank top 10 using Cohere rerank-english-v3.0, get top 3
4. Generate answer using Cohere command-r model with retrieved documents as context
5. Store user query and assistant response in conversations table
6. Return formatted response with source citations

TECHNICAL DETAILS:
- Use Windmill resource "f/chatbot/postgres_db" and variable "f/chatbot/cohere_api_key"
- Vector search SQL: 
  SELECT id, title, content, category, embedding <=> %s::vector AS distance
  FROM family_documents
  ORDER BY distance
  LIMIT 10
- Rerank call: co.rerank(query=query, documents=[...], top_n=3, model="rerank-english-v3.0")
- Generation call: co.chat(model="command-r", message=query, documents=[...])
- Log all API calls to api_usage_log with token counts and estimated costs

ERROR HANDLING:
- Handle no documents found (return friendly message)
- Handle Cohere API errors (rate limits, timeouts)
- Handle database connection errors
- Validate inputs

Include comprehensive docstring and usage examples.
```

#### Prompt 3: Conversation History Script

```
Create a Windmill Python script called "get_conversation_history" in folder "f/chatbot" that:

REQUIREMENTS:
- Inputs: session_id (str, optional), limit (int, default=20)
- If session_id provided: return that session's conversations
- If no session_id: return most recent conversations across all sessions
- Output: List of conversation objects with {role, content, sources, timestamp}
- Uses Windmill resource "f/chatbot/postgres_db"
- Orders by timestamp descending (newest first)
- Formats timestamps in ISO 8601 format
- Includes error handling

SQL LOGIC:
- With session_id: 
  SELECT * FROM conversations WHERE session_id = %s ORDER BY created_at DESC LIMIT %s
- Without session_id:
  SELECT * FROM conversations ORDER BY created_at DESC LIMIT %s

Include docstring with usage examples.
```

#### Prompt 4: Bulk Document Upload Script

```
Create a Windmill Python script called "bulk_upload_documents" in folder "f/chatbot" that:

REQUIREMENTS:
- Input: documents (list of dicts with keys: title, content, category)
- Processes documents in batches of 10 to avoid timeout
- Uses Cohere batch embedding for efficiency
- Inserts all documents with embeddings in single transaction
- Returns summary: {uploaded: int, failed: int, errors: list}
- Uses Windmill resource "f/chatbot/postgres_db" and variable "f/chatbot/cohere_api_key"

TECHNICAL DETAILS:
- Batch embed call: co.embed(texts=[doc['content'] for doc in batch], model="embed-english-v3.0", input_type="search_document")
- Use PostgreSQL transaction (BEGIN/COMMIT/ROLLBACK)
- Log total token usage to api_usage_log

ERROR HANDLING:
- Partial failure support (continue on individual document errors)
- Return detailed error messages for debugging

Include comprehensive docstring and usage examples.
```

#### Prompt 5: Search Documents Script (for testing)

```
Create a Windmill Python script called "search_documents" in folder "f/chatbot" that:

REQUIREMENTS:
- Input: search_term (str), category (str, optional), limit (int, default=5)
- Performs semantic search using vector similarity
- Filters by category if provided
- Returns list of matching documents with relevance scores
- Output format: {id, title, content_preview (first 200 chars), category, relevance_score}
- Uses Windmill resource "f/chatbot/postgres_db" and variable "f/chatbot/cohere_api_key"

This script is for testing and debugging the RAG pipeline.

Include comprehensive docstring.
```

### 3.2 Verify Script Deployment

After Claude Code generates and deploys each script:

**In Windmill UI:**
1. Navigate to **Scripts** → **f/chatbot**
2. Verify all 5 scripts are present:
   - `embed_document`
   - `rag_query`
   - `get_conversation_history`
   - `bulk_upload_documents`
   - `search_documents`
3. Click each script → Test with sample inputs

**Example Test for embed_document:**
```json
{
  "title": "Grandma's Apple Pie Recipe",
  "content": "Preheat oven to 425°F. Mix 6 cups sliced apples with 3/4 cup sugar, 2 tbsp flour, 1 tsp cinnamon. Fill pie crust, dot with butter, cover with top crust. Bake 40-50 minutes until golden.",
  "category": "recipes",
  "source_file": "recipes.txt"
}
```

Expected output:
```json
{
  "document_id": 1,
  "message": "Document 'Grandma's Apple Pie Recipe' successfully embedded and stored"
}
```

---

## Phase 4: UI Construction (Manual)

**Time: 15 minutes**

### 4.1 Create New App

1. In Windmill, click **+ App** → **Create from scratch**
2. Name: "Family Second Brain"
3. Path: `f/chatbot/main_app`

### 4.2 Component Layout

#### Main Canvas Structure

**Grid Layout (12 columns):**

```
Row 1 (Height: 40px):
┌────────────────────────────────────────────────────────┐
│  [Text Component - Title]                             │
│  "Family Second Brain"                                 │
│  (Span: 12 cols, Font: 24px, Bold)                    │
└────────────────────────────────────────────────────────┘

Row 2 (Height: 400px):
┌────────────────────────────────────────────────────────┐
│  [Container - Chat History]                           │
│  └─ [List Component] (id: chat_history)               │
│     └─ [Card Component per message]                   │
│        ├─ [Badge] role (user/assistant)                │
│        ├─ [Rich Text] content                          │
│        └─ [Collapse] sources (if assistant)           │
│  (Span: 12 cols)                                       │
└────────────────────────────────────────────────────────┘

Row 3 (Height: 120px):
┌────────────────────────────────────────────────────────┐
│  [Textarea Input] (id: user_query)                    │
│  Placeholder: "Ask about family knowledge..."          │
│  (Span: 10 cols)                                       │
└────────────────────────────────────────────────────────┘
│  [Button] "Ask"                                        │
│  (Span: 2 cols)                                        │
└────────────────────────────────────────────────────────┘

Row 4 (Height: 60px):
┌────────────────────────────────────────────────────────┐
│  [Button] "Upload Document"                            │
│  (Span: 6 cols, Opens modal)                           │
│  [Button] "Clear Conversation"                         │
│  (Span: 6 cols)                                        │
└────────────────────────────────────────────────────────┘
```

### 4.3 Step-by-Step Component Addition

#### Step 1: Add Title

1. From **Component Library** (right panel) → Drag **Text** component
2. Configure:
   - **Text**: "Family Second Brain 🧠"
   - **Style** → Font Size: `24px`
   - **Style** → Font Weight: `Bold`
   - **Style** → Alignment: `Center`

#### Step 2: Add Chat History Container

1. Drag **Container** component
2. ID: `chat_history_container`
3. Inside container, drag **List** component
4. Configure List:
   - **ID**: `chat_history`
   - **Data Source** → Connect to Background Runnable (create later)

#### Step 3: Add Message Card Template

1. Inside List component, drag **Card** component
2. Configure Card:
   - **ID**: `message_card`
3. Inside Card, add:
   - **Badge** component:
     - ID: `role_badge`
     - Text: `{{chat_history.result[$index].role}}`
     - Color: User: Blue, Assistant: Green (conditional)
   - **Rich Text** component:
     - ID: `message_content`
     - Content: `{{chat_history.result[$index].content}}`

#### Step 4: Add Query Input

1. Drag **Textarea** component
2. Configure:
   - **ID**: `user_query`
   - **Placeholder**: "Ask me anything about our family knowledge..."
   - **Rows**: 3
   - **On Enter**: Run script (configure later)

#### Step 5: Add Submit Button

1. Drag **Button** component
2. Configure:
   - **Label**: "Ask"
   - **Color**: Primary
   - **On Click** → **Run Script**
   - Select script: `f/chatbot/rag_query`

### 4.4 Connect Components to Scripts

#### Background Runnable: Load Conversation History

1. Click **Runnables** panel (bottom)
2. Click **+ Background Runnable**
3. Configure:
   - **Type**: Script
   - **Script**: `f/chatbot/get_conversation_history`
   - **Trigger**: On App Load
   - **Inputs**: 
     ```json
     {
       "limit": 50
     }
     ```
4. **Output ID**: `conversation_history`

#### Connect List to Background Runnable

1. Select **List** component (`chat_history`)
2. **Settings** → **Data Source**
3. Click **Connect**
4. Select: `conversation_history.result`

#### Connect Button to RAG Query

1. Select **Button** component
2. **Settings** → **On Click**
3. Select **Run Script** → `f/chatbot/rag_query`
4. **Input Mapping**:
   ```javascript
   {
     "query": user_query.result,
     "session_id": state.current_session_id || null
   }
   ```
5. **After Success** → **Frontend Script**:
   ```javascript
   // Clear input
   user_query.setValue("");
   
   // Refresh history
   conversation_history.refresh();
   
   // Store session ID for continuity
   state.current_session_id = rag_query_result.session_id;
   ```

### 4.5 Add Document Upload Modal

#### Create Modal Component

1. Drag **Modal** component
2. Configure:
   - **ID**: `upload_modal`
   - **Trigger Button Text**: "Upload Document"

#### Inside Modal, Add:

1. **Text Input** (ID: `doc_title`)
   - Label: "Title"
   - Placeholder: "e.g., Mom's Lasagna Recipe"

2. **Select** (ID: `doc_category`)
   - Label: "Category"
   - Options: `["recipes", "medical", "financial", "family_history", "general"]`

3. **Textarea** (ID: `doc_content`)
   - Label: "Content"
   - Rows: 10

4. **Button** (ID: `upload_btn`)
   - Label: "Upload"
   - On Click → Run Script: `f/chatbot/embed_document`
   - Input Mapping:
     ```javascript
     {
       "title": doc_title.result,
       "content": doc_content.result,
       "category": doc_category.result,
       "source_file": null
     }
     ```
   - After Success:
     ```javascript
     // Show success message
     toast.success("Document uploaded successfully!");
     
     // Clear form
     doc_title.setValue("");
     doc_content.setValue("");
     
     // Close modal
     upload_modal.close();
     ```

### 4.6 Styling (Optional)

#### Global Styling

1. Click **⋮** menu (top right) → **Global Styling**
2. Add custom CSS:

```css
/* Chat message styling */
.message-card {
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-message {
  background-color: #e3f2fd;
  margin-left: 20%;
}

.assistant-message {
  background-color: #f5f5f5;
  margin-right: 20%;
}

/* Source citations */
.source-citation {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  padding: 8px;
  background: #fff;
  border-left: 3px solid #4caf50;
}

/* Input area */
#user_query {
  border: 2px solid #2196f3;
  border-radius: 8px;
  font-size: 14px;
}

#user_query:focus {
  border-color: #1976d2;
  outline: none;
}
```

---

## Phase 5: Testing & Deployment

### 5.1 Initial Data Seeding

Use the bulk upload script to add initial family documents:

**In Windmill UI:**
1. Go to **Scripts** → `f/chatbot/bulk_upload_documents`
2. Click **Run**
3. Input:

```json
{
  "documents": [
    {
      "title": "Family Emergency Contacts",
      "content": "Emergency contacts: Dad - 555-0100, Mom - 555-0101, Dr. Smith (Family Doctor) - 555-0200, Hospital - 555-9999",
      "category": "general"
    },
    {
      "title": "Grandma's Chocolate Chip Cookie Recipe",
      "content": "Cream 1 cup butter with 3/4 cup sugar and 3/4 cup brown sugar. Add 2 eggs and 1 tsp vanilla. Mix in 2 1/4 cups flour, 1 tsp baking soda, 1 tsp salt. Fold in 2 cups chocolate chips. Bake at 375°F for 9-11 minutes.",
      "category": "recipes"
    },
    {
      "title": "Home WiFi Password",
      "content": "Home WiFi Network: FamilyNet5G, Password: SecureFamily2024!, Router location: Living room shelf",
      "category": "general"
    },
    {
      "title": "Dad's Medical History",
      "content": "Allergies: Penicillin. Medications: Lisinopril 10mg daily for blood pressure. Last checkup: January 2025, all clear. Blood type: O+",
      "category": "medical"
    },
    {
      "title": "Family Vacation Planning Notes",
      "content": "Favorite destinations: Beach trips in summer (San Diego), skiing in winter (Tahoe). Preferred airlines: Southwest. Hotel loyalty: Marriott Bonvoy. Kids love theme parks and museums.",
      "category": "family_history"
    }
  ]
}
```

4. Verify success: Should return `{"uploaded": 5, "failed": 0}`

### 5.2 Test RAG Pipeline

**Test Query 1: Recipe Retrieval**
1. In the app, type: "What's grandma's cookie recipe?"
2. Expected: Assistant provides recipe with source citation

**Test Query 2: Medical Information**
1. Type: "What are dad's allergies?"
2. Expected: "Dad is allergic to Penicillin" with source

**Test Query 3: No Results**
1. Type: "What's mom's favorite restaurant?"
2. Expected: Polite "I don't have information about that" response

**Test Query 4: Complex Query**
1. Type: "Plan a family vacation based on our preferences"
2. Expected: Assistant synthesizes info from vacation planning notes

### 5.3 Performance Testing

**Vector Search Speed Test:**

```sql
-- Should complete in <50ms
EXPLAIN ANALYZE
SELECT id, title, embedding <=> '[0.1, 0.2, ...]'::vector AS distance
FROM family_documents
ORDER BY distance
LIMIT 10;
```

**Cohere API Latency:**
- Embedding: ~200ms
- Reranking: ~300ms
- Generation: ~1-2 seconds
- **Total pipeline: ~2-3 seconds acceptable**

### 5.4 Deploy to Production

1. **Save Draft** (bottom left in App Editor)
2. **Deploy** → Confirm
3. Share app URL with family:
   - Format: `https://app.windmill.dev/apps/get/f/chatbot/main_app`
   - Or use **Public URL** feature for unauthenticated access

---

## Windmill Platform Details

### Key Concepts

**Workspaces:** Isolated environments for different teams/projects
**Scripts:** Individual Python/TS/Go/Bash code units
**Flows:** Multi-step workflows connecting multiple scripts
**Apps:** Low-code UIs built with drag-and-drop editor
**Resources:** Reusable connection configs (databases, APIs)
**Variables:** Secure storage for API keys and configs

### Built-in Components (60+ Available)

**Inputs:**
- Text Input, Textarea, Number Input
- Select, Multi-select, Date Picker
- File Upload, Toggle, Checkbox
- Rich Text Editor, Code Editor

**Display:**
- Text, Rich Text, Markdown
- Table (with sorting, filtering, pagination)
- Chart (Line, Bar, Pie, Area, Scatter)
- Card, Badge, Avatar, Icon

**Layout:**
- Container, Tabs, Stepper
- Modal, Drawer, Divider
- List (repeating elements), Carousel

**Actions:**
- Button, Button Group
- Form (auto-generated from scripts)

### Component Output Pattern

Every component exposes a `.result` property:
```javascript
// Text Input
user_query.result // → "What's the recipe?"

// Button (after running script)
rag_query.result // → {answer: "...", sources: [...]}

// Background Runnable
conversation_history.result // → [{role: "user", content: "..."}]
```

### State Management

**Frontend State:**
```javascript
// Set state
state.current_session_id = "123-456-789";

// Read state
if (state.theme === "dark") { ... }
```

**Component Communication:**
```javascript
// Component A triggers Component B
component_b.refresh();
component_b.setValue(newValue);
```

### Script Execution Model

**Synchronous (Inline):** Runs in foreground, blocks UI (max 30s)
**Background Runnable:** Runs on app load or input change
**Scheduled:** CRON-based execution
**Webhook:** HTTP endpoint triggers

### Limitations to Remember

**Cloud Free Tier:**
- 10,000 script executions/month
- 3 workspaces
- 10 SSO users

**Self-Hosted (Unlimited):**
- Infinite executions
- Requires own infrastructure
- No built-in auth (use Caddy/reverse proxy)

**Worker Memory:**
- Standard: 2GB RAM per worker
- Heavy scripts may need dedicated workers (Enterprise)

**No Native Features:**
- No built-in WebSocket (use polling for real-time)
- No native file storage (use S3/local filesystem)
- No built-in auth for public apps (manual implementation needed)

---

## Security & Privacy

### Data Protection Measures

**1. Workspace-Level Encryption**
- All variables/secrets encrypted at rest
- AES-256 encryption with workspace-specific keys

**2. Database Access Control**
```sql
-- Create read-only user for app
CREATE ROLE family_app_reader WITH LOGIN PASSWORD 'read_only_password';
GRANT SELECT ON family_documents, conversations TO family_app_reader;
```

**3. Cohere Privacy Settings**
- Use production API keys (not trial)
- Enable Zero Data Retention (ZDR) if available
- Opt out of model training: https://cohere.com/data-usage

**4. Network Security**
```yaml
# docker-compose.yml - restrict database exposure
services:
  family-brain-db:
    ports:
      - "127.0.0.1:5433:5432"  # Only localhost access
```

**5. App Access Control**
- Use Windmill's built-in authentication
- Create family member accounts with unique emails
- Set workspace permissions: Viewer (safe), Developer (risky)

### Sensitive Document Handling

**Tag sensitive categories:**
```sql
-- Add sensitivity flag
ALTER TABLE family_documents ADD COLUMN is_sensitive BOOLEAN DEFAULT FALSE;

-- Mark medical/financial as sensitive
UPDATE family_documents SET is_sensitive = TRUE WHERE category IN ('medical', 'financial');
```

**Restrict access in RAG script:**
```python
# Only admins can query sensitive docs
if user_role != 'admin' and search_sensitive:
    return {"error": "Insufficient permissions"}
```

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
docker exec family-brain-db pg_dump -U familyuser family_brain | gzip > backups/family_brain_$(date +%Y%m%d).sql.gz

# Keep 30 days of backups
find backups/ -name "family_brain_*.sql.gz" -mtime +30 -delete
```

---

## Cost Breakdown

### Monthly Cost Estimate (Typical Family Usage)

**Assumptions:**
- 100 documents in knowledge base
- 30 queries per day (900/month)
- Average query retrieves 10 documents
- Average response: 200 tokens

**Cohere API Costs (Updated May 2025):**

| Operation | Usage | Rate | Cost |
|-----------|-------|------|------|
| Initial Embedding (100 docs @ 500 tokens avg) | 50,000 tokens | $0.10 / 1M | $0.005 |
| Query Embeddings (900 @ 50 tokens) | 45,000 tokens | $0.10 / 1M | $0.0045 |
| Reranking (900 queries × 10 docs) | 9,000 searches | $2.00 / 1K | $0.018 |
| Generation Input (900 × ~1500 tokens context) | 1,350,000 tokens | $2.50 / 1M | $3.38 |
| Generation Output (900 × 200 tokens) | 180,000 tokens | $10.00 / 1M | $1.80 |

**Total Cohere: ~$5.21/month** (with Command A)

**Infrastructure (Self-Hosted):**
- VPS (2 vCPU, 4GB RAM): $10-20/month (DigitalOcean, Hetzner)
- Domain name: $1/month (optional)

**Total Monthly: $15-25/month**

**Cost per Query: ~$0.006** (~0.6 cents)

### Cost Comparison: Old vs New Stack

| Stack | Cost per 1K Queries |
|-------|---------------------|
| Old (command-r, embed-v3, rerank-v3) | ~$2.02 |
| New (command-a, embed-v4, rerank-v3.5) | ~$5.79 |
| **Difference** | +$3.77 (~3x) |

The increased cost is justified by:
- 150% faster generation throughput
- Better answer quality (111B vs smaller model)
- Multimodal embedding capability (future image support)
- Improved relevance scoring

**Cost Optimization Options:**
1. Use Command R for simple queries, Command A for complex ones
2. Reduce context window by limiting document chunks
3. Cache frequent queries/embeddings
4. Self-host on home server (free infrastructure)

---

## Troubleshooting

### Common Issues

**Issue: "No documents found" even after uploading**

**Solution:**
```sql
-- Verify documents exist
SELECT COUNT(*) FROM family_documents;

-- Check embeddings are present
SELECT COUNT(*) FROM family_documents WHERE embedding IS NOT NULL;

-- If embeddings missing, re-run embed_document script
```

---

**Issue: Slow vector search (>500ms)**

**Solution:**
```sql
-- Verify HNSW index exists
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'family_documents';

-- Rebuild index if needed
DROP INDEX IF EXISTS family_documents_embedding_idx;
CREATE INDEX family_documents_embedding_idx ON family_documents 
USING hnsw (embedding vector_cosine_ops);

-- Analyze table for query planner
ANALYZE family_documents;
```

---

**Issue: Claude Code MCP connection fails**

**Solution:**
```bash
# Check MCP URL format
echo "URL should be: https://app.windmill.dev/api/mcp/w/WORKSPACE/sse?token=TOKEN"

# Test MCP endpoint
curl -N -H "Accept: text/event-stream" "YOUR_MCP_URL"

# Should see event stream data, not error

# Reconnect Claude Code
claude mcp remove windmill
claude mcp add --transport http windmill YOUR_MCP_URL
```

---

**Issue: Cohere API errors (rate limit, auth)**

**Solution:**
```python
# Check API key validity
import cohere
co = cohere.Client("your-key")
try:
    co.embed(texts=["test"], model="embed-english-v3.0")
    print("✓ API key valid")
except cohere.CohereAPIError as e:
    print(f"✗ Error: {e}")

# Check rate limits (trial keys: 100 calls/min)
# Production keys: 10,000 calls/min
```

---

**Issue: UI component not updating after script runs**

**Solution:**
```javascript
// In button's "After Success" script:
// Force refresh of dependent components
component_name.refresh();

// Update state explicitly
state.variable_name = new_value;

// If background runnable, trigger manual refresh
background_runnable_name.trigger();
```

---

**Issue: Conversation history not loading**

**Solution:**
```sql
-- Check conversations table
SELECT COUNT(*) FROM conversations;

-- Check session IDs
SELECT DISTINCT session_id FROM conversations ORDER BY created_at DESC LIMIT 10;

-- If empty, test rag_query script manually first
-- It creates conversation entries
```

---

### Debugging Tools

**Windmill Built-in:**
1. **Runs** tab → View execution logs for each script
2. **Debug runs** panel in App Editor → See component interactions
3. **Console** → Frontend JavaScript errors

**PostgreSQL:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- View logs
docker exec windmill-db-1 tail -f /var/lib/postgresql/data/log/postgresql-*.log
```

**Cohere Dashboard:**
- View API usage: https://dashboard.cohere.com/usage
- Check rate limits and quotas

---

## Next Steps & Enhancements

### Phase 6: Advanced Features (Optional)

**1. Multi-Modal Support (Images, PDFs)**
```python
# Use Cohere's multi-modal embedding (when available)
# Or pre-process with OCR (pytesseract, pdf2text)

def extract_pdf_text(file_path: str) -> str:
    import PyPDF2
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        return "\n".join([page.extract_text() for page in reader.pages])
```

**2. Document Versioning**
```sql
ALTER TABLE family_documents ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE family_documents ADD COLUMN supersedes_id INTEGER REFERENCES family_documents(id);

-- Track changes over time
CREATE TABLE document_versions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES family_documents(id),
    version INTEGER,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**3. Semantic Cache**
```python
# Cache embeddings for common queries
import hashlib

def get_cached_embedding(query: str):
    query_hash = hashlib.md5(query.encode()).hexdigest()
    # Check cache table
    cached = db.execute("SELECT embedding FROM query_cache WHERE hash = %s", (query_hash,))
    return cached[0] if cached else None
```

**4. Feedback Loop**
```sql
CREATE TABLE query_feedback (
    id SERIAL PRIMARY KEY,
    query TEXT,
    answer TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add thumbs up/down buttons in UI
```

**5. Voice Interface**
- Add speech-to-text input (Web Speech API)
- Add text-to-speech output (browser native or ElevenLabs MCP)

**6. Scheduled Digests**
```python
# Windmill scheduled flow (daily)
# "Send family digest of new documents added this week"

def send_weekly_digest():
    new_docs = db.execute("""
        SELECT title, category FROM family_documents 
        WHERE created_at > NOW() - INTERVAL '7 days'
    """)
    
    # Format email
    email_body = f"New documents this week:\n{new_docs}"
    
    # Send via SMTP
    send_email(to="family@example.com", subject="Weekly Digest", body=email_body)
```

---

## Maintenance Checklist

### Weekly

- [ ] Check API usage vs budget (Cohere dashboard)
- [ ] Review failed script executions in Windmill
- [ ] Test 2-3 random queries for accuracy

### Monthly

- [ ] Run database backup
- [ ] Review and prune old conversation history (>6 months)
- [ ] Update Windmill to latest version
- [ ] Rotate MCP tokens (security best practice)

### Quarterly

- [ ] Evaluate model upgrades (Cohere releases new versions)
- [ ] Analyze most-asked questions → add more documents in those areas
- [ ] Review and update document categories/taxonomy
- [ ] Performance benchmarking (query latency, search accuracy)

---

## Resources & References

### Official Documentation

- **Windmill Docs:** https://www.windmill.dev/docs/intro
- **Windmill MCP Guide:** https://www.windmill.dev/docs/core_concepts/mcp
- **Cohere API Docs:** https://docs.cohere.com/
- **pgvector Documentation:** https://github.com/pgvector/pgvector
- **Claude Code MCP:** https://claude.ai/docs/mcp

### Community & Support

- **Windmill Discord:** https://discord.gg/V7PM2YHsPB
- **Windmill GitHub:** https://github.com/windmill-labs/windmill
- **Cohere Community:** https://discord.gg/cohere

### Key GitHub Repositories

- **Windmill React Template:** https://github.com/windmill-labs/windmill-react-template
- **Windmill Custom Components:** https://github.com/windmill-labs/windmill-custom-component-template

---

## Appendix: Complete File Reference

### File Structure

```
family-second-brain/
├── docker-compose.yml          # Infrastructure setup
├── .env                        # Environment variables
├── schema.sql                  # Database schema
├── backups/                    # Database backups (auto-generated)
├── scripts/                    # Windmill scripts (auto-generated by Claude Code)
│   ├── embed_document.py
│   ├── rag_query.py
│   ├── get_conversation_history.py
│   ├── bulk_upload_documents.py
│   └── search_documents.py
└── docs/
    └── family-second-brain-complete-guide.md  # This file
```

### Quick Start Commands Reference

```bash
# Start infrastructure
docker compose up -d

# Connect Claude Code
claude mcp add --transport http windmill https://app.windmill.dev/api/mcp/w/WORKSPACE/sse?token=TOKEN

# Apply database schema
docker exec -i family-brain-db psql -U familyuser -d family_brain < schema.sql

# Backup database
docker exec family-brain-db pg_dump -U familyuser family_brain | gzip > backup_$(date +%Y%m%d).sql.gz

# View Windmill logs
docker logs -f windmill-server-1

# View PostgreSQL logs
docker logs -f family-brain-db
```

---

## Final Notes for Claude Code

When implementing this project:

1. **Generate scripts exactly as specified** in Phase 3 prompts
2. **Use the exact resource and variable names** (f/chatbot/postgres_db, f/chatbot/cohere_api_key)
3. **Include comprehensive error handling** in all scripts
4. **Add detailed docstrings** with usage examples
5. **Test each script** after deployment before moving to next
6. **Follow Python best practices**: type hints, parameterized queries, proper exception handling
7. **Log all API calls** to api_usage_log for cost tracking
8. **Return consistent JSON structures** across all scripts

The human will handle UI construction in Phase 4 manually, as Claude Code cannot access Windmill's visual App Editor. Focus your automation efforts on perfecting the backend scripts and workflows.

---

---

## Changelog

### v2.0 - May 2025 (Cohere Model Upgrades)

**Backend Improvements:**
- Upgraded embedding model from `embed-english-v3.0` to `embed-v4.0`
  - Multimodal support (text + images)
  - 128K context window (can process 200-page documents)
  - Matryoshka embeddings (variable dimensions: 256, 512, 1024, 1536)
- Upgraded generation model from `command-r` to `command-a-03-2025`
  - 111B parameters (vs Command R's smaller size)
  - 256K context window
  - 150% higher throughput
- Upgraded rerank model from `rerank-english-v3.0` to `rerank-v3.5`
  - State-of-the-art multilingual retrieval
  - YAML-formatted document input for better ranking

**Scoring Improvements:**
- Implemented weighted confidence calculation (50% top, 30% second, 20% third result)
- Improved fallback similarity formula: `1.0 / (1.0 + distance)` for better score spread
- Added relevance percentages to source citations in UI

**Frontend Improvements:**
- Client-side PDF parsing using PDF.js (pdfjs-dist)
- No longer requires backend PDF parsing script
- Supports PDFs up to 200 pages with text extraction

**Windmill Deployment Hashes:**
- `embed_document`: `b11bcf2f9b9cd4ff` (Embed 4)
- `rag_query`: `60b894f5184c0d70` (Adaptive model selection + Embed 4 + Rerank v3.5)

**Adaptive Model Selection (Cost Optimization):**
- High relevance (>0.7) → `command-r` (cheap: $0.15/$0.60 per 1M tokens)
- Low relevance (≤0.7) → `command-a` (powerful: $2.50/$10 per 1M tokens)
- Response now includes `model_used` and `top_relevance` for monitoring
- Expected savings: ~60% at scale (assuming 70% of queries are simple lookups)

### v1.0 - November 2025 (Initial Implementation)

- Basic RAG pipeline with Cohere embed-english-v3.0, rerank-english-v3.0, command-r
- PostgreSQL + pgvector for vector storage
- React frontend with shadcn/ui components
- Document upload with PDF/TXT/MD support

---

**Document Version:** 2.0
**Last Updated:** May 2025
**Author:** Generated for Claude Code implementation
**License:** Internal use only (family project)
