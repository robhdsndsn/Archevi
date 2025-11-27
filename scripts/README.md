# Windmill Python Scripts

This folder contains placeholder files for the Windmill Python scripts that will be generated via Claude Code MCP integration.

## Scripts Overview

All scripts will be generated automatically by Claude Code using the prompts in `02_Documentation/Implementation_Guide.md` Phase 3.

### Scripts to Generate

1. **embed_document.py** - Document ingestion and embedding
   - Takes title, content, category, source_file
   - Generates 1024d embeddings via Cohere
   - Stores in PostgreSQL with pgvector

2. **rag_query.py** - Main RAG pipeline
   - Embeds user query
   - Vector search (top 10)
   - Reranks (top 3)
   - Generates answer with Command-R
   - Stores conversation

3. **get_conversation_history.py** - Conversation retrieval
   - Gets chat history by session_id or recent conversations
   - Returns formatted conversation objects

4. **bulk_upload_documents.py** - Batch document processing
   - Processes documents in batches of 10
   - Uses Cohere batch embedding
   - Returns upload summary

5. **search_documents.py** - Testing and debugging
   - Performs semantic search
   - Filters by category
   - Returns relevance scores

## Generation Process

### Prerequisites
1. Windmill instance running
2. Claude Code connected via MCP
3. Windmill resources configured:
   - `f/chatbot/postgres_db` (PostgreSQL connection)
   - `f/chatbot/cohere_api_key` (Cohere API key variable)

### Generation Steps

1. **Connect Claude Code to Windmill:**
   ```bash
   # Get MCP URL from Windmill: Settings → Tokens → Generate MCP URL
   claude mcp add --transport http windmill YOUR_MCP_URL
   ```

2. **Use Prompts from Implementation Guide:**
   - Open `02_Documentation/Implementation_Guide.md`
   - Navigate to Phase 3, Section 3.1
   - Copy each prompt for the 5 scripts
   - Paste into Claude Code conversation
   - Claude Code will generate and deploy scripts via MCP

3. **Verify Deployment:**
   - In Windmill UI, navigate to Scripts → f/chatbot
   - Verify all 5 scripts are present
   - Test each script with sample inputs

## Script Requirements

Each script must include:
- Comprehensive docstrings with parameter descriptions
- Proper error handling
- API usage logging to `api_usage_log` table
- Parameterized SQL queries (prevent injection)
- Type hints where applicable
- Usage examples in docstring

## Testing

After generation, test each script:

```python
# Test embed_document
{
  "title": "Test Document",
  "content": "This is test content for embedding.",
  "category": "general",
  "source_file": "test.txt"
}

# Test rag_query
{
  "query": "What is this about?",
  "session_id": None  # Will generate new UUID
}

# Test get_conversation_history
{
  "session_id": None,  # Get recent conversations
  "limit": 20
}
```

## Important Notes

- **DO NOT** create these scripts manually
- **USE** Claude Code MCP integration for generation
- **FOLLOW** exact prompts from Implementation Guide
- **TEST** each script after deployment
- Scripts will be deployed directly to Windmill workspace (not saved locally)

## Troubleshooting

**If script generation fails:**
1. Verify MCP connection: Test with "List all scripts in my Windmill workspace"
2. Check Windmill resources exist (postgres_db, cohere_api_key)
3. Verify workspace name is correct: "family-brain"
4. Check Windmill logs for errors

**If scripts don't appear in Windmill:**
1. Refresh Windmill UI
2. Check correct folder: f/chatbot/
3. Verify MCP token has correct permissions
4. Check Claude Code output for deployment confirmation
