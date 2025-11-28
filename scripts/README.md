# Windmill Python Scripts

This folder contains the Windmill Python scripts deployed to the `f/chatbot/` folder.

## Scripts Overview

### Core RAG Scripts

1. **embed_document.py** - Basic document embedding
   - Takes title, content, category, source_file
   - Generates 1024d embeddings via Cohere Embed v4
   - Stores in PostgreSQL with pgvector

2. **embed_document_enhanced.py** - AI-enhanced embedding (NEW)
   - Auto-categorization using keywords + embedding similarity
   - Smart tag extraction (3-5 relevant tags)
   - Expiry date detection (renewal, due dates, policy end)
   - Returns confidence scores

3. **rag_query.py** - Main RAG pipeline
   - Embeds user query
   - Vector search (top 10)
   - Reranks with Cohere Rerank v3 (top 3)
   - Generates answer with Command-R
   - Stores conversation history

4. **search_documents.py** - Semantic search
   - Performs vector similarity search
   - Filters by category
   - Returns relevance scores

### Voice & Media Scripts

5. **transcribe_voice_note.py** - Voice transcription (NEW)
   - Groq Whisper large-v3-turbo
   - 80+ language support
   - Auto-generates title and tags
   - Embeds transcript for RAG

6. **parse_pdf.py** - PDF text extraction
   - Extracts text from PDF documents
   - Returns page count and content

### Query Scripts

7. **get_tags.py** - Tag aggregation (NEW)
   - Returns all unique tags with document counts
   - Sorted by frequency

8. **get_expiring_documents.py** - Expiry tracking (NEW)
   - Returns documents expiring within N days
   - Groups by urgency (urgent/soon/upcoming)

9. **get_conversation_history.py** - Chat history
   - Gets chat history by session_id
   - Returns formatted conversation objects

### Analytics & Auth Scripts

10. **get_analytics.py** - Usage analytics
    - API cost tracking
    - Query patterns
    - Document statistics

11. **auth_login.py** - User authentication
12. **auth_verify.py** - Token verification
13. **auth_refresh.py** - Token refresh
14. **auth_logout.py** - Session logout

## Deployment

Scripts are deployed to Windmill workspace `family-brain` in the `f/chatbot/` folder.

### Required Windmill Resources

- `f/chatbot/postgres_db` - PostgreSQL connection string
- `f/chatbot/cohere_api_key` - Cohere API key
- `f/chatbot/groq_api_key` - Groq API key (for voice transcription)

### Deployment Methods

1. **Via Windmill UI:**
   - Navigate to Scripts -> f/chatbot
   - Create new script, paste code
   - Set lock file dependencies

2. **Via Claude Code:**
   - Scripts can be deployed via Windmill MCP
   - Ensure lock file includes required dependencies

### Lock File Dependencies

Most scripts need this minimal lock file:
```
anyio
certifi
h11
httpcore
httpx
idna
psycopg2-binary
sniffio
wmill
```

For Cohere scripts, add:
```
cohere
```

## Testing Examples

```python
# Test embed_document_enhanced
{
  "title": "Home Insurance Policy",
  "content": "Policy effective 2024-01-01 to 2025-01-01...",
  "auto_categorize_enabled": true,
  "extract_tags_enabled": true,
  "extract_dates_enabled": true
}

# Test transcribe_voice_note
{
  "audio_content": "<base64-encoded-wav>",
  "filename": "memo.wav"
}

# Test get_tags
{}

# Test get_expiring_documents
{
  "days": 90
}
```

## API Response Examples

### get_tags Response
```json
{
  "success": true,
  "tags": [
    {"tag": "insurance", "document_count": 5},
    {"tag": "medical", "document_count": 3}
  ],
  "total_tags": 15
}
```

### get_expiring_documents Response
```json
{
  "success": true,
  "documents": [
    {
      "id": 123,
      "title": "Car Insurance",
      "expiry_date": "2025-01-15",
      "expiry_type": "renewal",
      "days_until_expiry": 48
    }
  ],
  "by_urgency": {"urgent": 1, "soon": 2, "upcoming": 3}
}
```
