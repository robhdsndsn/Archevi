# Windmill AI Agent Setup Guide

## Overview

This guide explains how to set up the Archevi AI Agent using Windmill's native AI Agents feature. This provides:

- **Streaming responses** (SSE) - Users see tokens as they generate
- **Built-in conversation memory** - No manual session management
- **Tool calling** - AI decides when to search documents
- **Multi-provider support** - Can use Anthropic, OpenAI, or others

## Architecture Comparison

### Current: rag_query.py (Monolithic)
```
Query → Embed → Search → Rerank → Generate → Response
         ↓        ↓        ↓          ↓
       Cohere   pgvector  Cohere    Cohere
```
- Single script handles everything
- No streaming (wait for full response)
- Cohere-only for generation

### New: Windmill AI Agent (Modular)
```
Query → AI Agent (Anthropic/OpenAI)
              ↓ (tool call)
         search_documents_tool
              ↓
         Cohere Embed → pgvector → Cohere Rerank
              ↓
         Return docs to Agent
              ↓
         Stream response (SSE)
```
- AI Agent handles conversation + generation
- Search is a tool the AI can call
- Streaming built-in
- Choice of generation models

## Setup Steps

### 1. Create Anthropic API Resource

In Windmill UI:
1. Go to **Resources** → **Add Resource**
2. Type: `anthropic`
3. Path: `f/chatbot/anthropic_api`
4. Add your Anthropic API key

Or via API:
```bash
curl -X POST "http://localhost/api/w/family-brain/resources/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "f/chatbot/anthropic_api",
    "resource_type": "anthropic",
    "value": {
      "api_key": "sk-ant-YOUR-KEY"
    }
  }'
```

### 2. Deploy the Search Tool

The `search_documents_tool.py` script is already deployed at `f/chatbot/search_documents_tool`.

It provides:
- Cohere Embed v4 for query embedding
- pgvector for similarity search
- Cohere Rerank v3.5 for relevance scoring
- Visibility filtering for member types

### 3. Create the AI Agent Flow

Option A: Via Windmill UI
1. Go to **Flows** → **New Flow**
2. Add an **AI Agent** step
3. Configure:
   - Provider: Anthropic
   - Model: claude-sonnet-4-20250514
   - Enable streaming
   - Set messages_context_length: 10
   - Add tool: `f/chatbot/search_documents_tool`

Option B: Deploy flow file (if supported)
```bash
# From scripts/flows directory
wmill flow push archevi_ai_agent.flow.yaml
```

### 4. Configure Flow Inputs

The flow accepts:
```json
{
  "user_message": "What's my car insurance policy number?",
  "tenant_id": "5302d94d-4c08-459d-b49f-d211abdb4047",
  "user_member_type": "admin",  // optional
  "user_member_id": 1,          // optional
  "session_id": "uuid"          // optional, for conversation continuity
}
```

## API Usage

### Non-Streaming (Wait for Result)
```bash
curl -X POST "http://localhost/api/w/family-brain/jobs/run_wait_result/f/chatbot/archevi_ai_agent" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "What documents do I have about insurance?",
    "tenant_id": "5302d94d-4c08-459d-b49f-d211abdb4047"
  }'
```

### Streaming (SSE)
```bash
curl -X POST "http://localhost/api/w/family-brain/jobs/run/f/chatbot/archevi_ai_agent?memory_id=550e8400e29b41d4a716446655440000" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "user_message": "What documents do I have about insurance?",
    "tenant_id": "5302d94d-4c08-459d-b49f-d211abdb4047"
  }'
```

### Streaming Response Format
```json
{"type": "token_delta", "content": "Based"}
{"type": "token_delta", "content": " on"}
{"type": "token_delta", "content": " your"}
{"type": "tool_call", "call_id": "call_123", "function_name": "search_documents"}
{"type": "tool_result", "call_id": "call_123", "function_name": "search_documents", "result": "{...}", "success": true}
{"type": "token_delta", "content": " documents"}
// ... more tokens
```

## Frontend Integration

### React Hook for Streaming
```typescript
// hooks/useAIAgentStream.ts
import { useState, useCallback } from 'react';

interface StreamEvent {
  type: 'token_delta' | 'tool_call' | 'tool_result';
  content?: string;
  function_name?: string;
  result?: string;
}

export function useAIAgentStream() {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState<string[]>([]);

  const sendMessage = useCallback(async (
    message: string,
    tenantId: string,
    sessionId?: string
  ) => {
    setIsStreaming(true);
    setResponse('');
    setToolCalls([]);

    const memoryId = sessionId || crypto.randomUUID().replace(/-/g, '');

    const response = await fetch(
      `/api/w/family-brain/jobs/run/f/chatbot/archevi_ai_agent?memory_id=${memoryId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          user_message: message,
          tenant_id: tenantId,
        }),
      }
    );

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const event: StreamEvent = JSON.parse(line);

          if (event.type === 'token_delta' && event.content) {
            setResponse(prev => prev + event.content);
          } else if (event.type === 'tool_call') {
            setToolCalls(prev => [...prev, event.function_name || '']);
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      }
    }

    setIsStreaming(false);
  }, []);

  return { response, isStreaming, toolCalls, sendMessage };
}
```

## Cost Comparison

### Current rag_query.py (Cohere)
| Operation | Model | Cost |
|-----------|-------|------|
| Embed | embed-v4.0 | $0.10/1M tokens |
| Rerank | rerank-v3.5 | $2.00/1M searches |
| Generate (high rel) | command-r | $0.15/$0.60 per 1M in/out |
| Generate (low rel) | command-a | $2.50/$10.00 per 1M in/out |

**Typical query cost**: ~$0.003-0.01

### New AI Agent (Anthropic + Cohere)
| Operation | Model | Cost |
|-----------|-------|------|
| Embed | embed-v4.0 | $0.10/1M tokens |
| Rerank | rerank-v3.5 | $2.00/1M searches |
| Generate | claude-sonnet-4 | $3.00/$15.00 per 1M in/out |

**Typical query cost**: ~$0.005-0.02

Trade-off: Slightly higher cost for streaming + better reasoning.

## Fallback Strategy

Keep `rag_query.py` as fallback:
1. Try AI Agent first (streaming)
2. If streaming fails, fall back to rag_query.py
3. Both use same search_documents_tool for consistency

## Benchmark Results (December 2025)

Testing `rag_query_agent.py` (Groq Llama 3.3 70B) vs `rag_query.py` (Cohere Command-A):

| Test | rag_query.py | rag_query_agent |
|------|-------------|-----------------|
| Insurance query | 2.56s | 2.56s |
| Recipe query | 5.81s | 2.78s |
| Greeting (no search needed) | N/A | 2.06s |

### Key Findings

1. **Speed**: Groq is ~2x faster on longer queries
2. **Cost**: Groq FREE tier vs Cohere ~$0.003-0.01/query
3. **Intelligence**: AI Agent skips search for greetings/clarifications
4. **Tool Calling**: AI reformulates search queries for better results

### Recommendation

**Use `rag_query_agent.py` as the new default:**
- Zero cost during testing/MVP phase
- Better latency for most queries
- More natural conversation handling
- Still uses Cohere for embeddings/reranking (best in class)

**Keep `rag_query.py` for:**
- Fallback if Groq has issues
- A/B testing for quality comparison
- Future Anthropic/OpenAI integration

## Next Steps

1. [x] Create Groq resource in Windmill
2. [x] Deploy rag_query_agent script
3. [x] Test tool calling and search
4. [x] Benchmark vs original
5. [x] Update frontend to use new endpoint
6. [x] Add tool call visibility in UI (shows "Searched: query" indicator)
7. [x] Add Cohere fallback when Groq rate limited (command-r-08-2024)
8. [x] Add per-tenant rate limiting (30 req/min, PostgreSQL-backed)
9. [ ] Add streaming support to frontend (SSE)
10. [ ] Implement conversation memory persistence

## Sources

- [Windmill AI Agents](https://www.windmill.dev/docs/core_concepts/ai_agents)
- [AI Agent Steps in Flows](https://www.windmill.dev/blog/ai-agents)
- [Streaming Changelog](https://www.windmill.dev/changelog/ai-agents)
