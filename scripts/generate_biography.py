# generate_biography.py
# Windmill Python script for AI-powered biography generation
# Path: f/chatbot/generate_biography
#
# requirements:
#   - groq
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
Generate an AI-powered biography for a family member using documents from the knowledge base.

This searches for all documents mentioning the person and uses AI to weave their story
into an engaging narrative biography with historical context.

Args:
    person_name (str): Name of the family member to generate biography for
    tenant_id (str): Tenant UUID for data isolation
    style (str): Writing style - 'narrative' (default), 'formal', 'casual', 'children'
    max_words (int): Target word count (default 500)
    include_historical_context (bool): Add era-appropriate historical context (default True)

Returns:
    dict: {
        success: bool,
        biography: str (markdown formatted),
        person_name: str,
        sources: list[{id, title, category, relevance}],
        word_count: int,
        style: str,
        error: str (if failed)
    }
"""

import json
import time
from typing import Optional
import wmill
from groq import Groq
import cohere
import psycopg2
from pgvector.psycopg2 import register_vector


def log_api_usage(
    tenant_id: str,
    provider: str,
    endpoint: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    latency_ms: int = None,
    success: bool = True,
    operation: str = None
):
    """Log API usage to PostgreSQL. Fire-and-forget."""
    try:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Pricing (cents per million tokens)
        PRICING = {
            'groq': {
                'llama-3.3-70b-versatile': {'input': 59, 'output': 79},
            },
            'cohere': {
                'embed-v4.0': {'input': 10, 'output': 0},
                'rerank-v3.5': {'per_request': 2},
            }
        }

        cost_cents = 0
        if provider in PRICING and model in PRICING[provider]:
            pricing = PRICING[provider][model]
            if 'per_request' in pricing:
                cost_cents = pricing['per_request']
            else:
                cost_cents = int(
                    (input_tokens / 1_000_000) * pricing.get('input', 0) * 100 +
                    (output_tokens / 1_000_000) * pricing.get('output', 0) * 100
                )

        cursor.execute("""
            INSERT INTO api_usage (
                tenant_id, provider, endpoint, model,
                input_tokens, output_tokens, cost_cents,
                latency_ms, success, operation
            ) VALUES (
                %s::uuid, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
        """, (
            tenant_id, provider, endpoint, model,
            input_tokens, output_tokens, cost_cents,
            latency_ms, success, operation
        ))

        conn.commit()
        cursor.close()
        conn.close()
    except Exception:
        pass


def search_documents_for_person(
    person_name: str,
    tenant_id: str,
    co: cohere.ClientV2,
    top_k: int = 10
) -> list:
    """Search for documents mentioning a person using semantic search."""
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    # Create search query focused on the person
    search_query = f"documents about {person_name}, mentions of {person_name}, {person_name}'s life events"

    # Embed the query
    try:
        embed_start = time.time()
        embed_response = co.embed(
            texts=[search_query],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=1024
        )
        embed_latency = int((time.time() - embed_start) * 1000)
        query_embedding = embed_response.embeddings.float_[0]

        log_api_usage(
            tenant_id=tenant_id,
            provider="cohere",
            endpoint="embed",
            model="embed-v4.0",
            input_tokens=len(search_query.split()),
            latency_ms=embed_latency,
            success=True,
            operation="biography_search_embed"
        )
    except Exception as e:
        print(f"[Biography] Embed error: {e}")
        return []

    # Vector search
    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        register_vector(conn)
        cursor = conn.cursor()

        # Enable iterative scans for filtered queries
        cursor.execute("SET hnsw.iterative_scan = strict_order;")

        # Search with person name filter in content
        cursor.execute("""
            SELECT id, title, content, category, extracted_data,
                   embedding <=> %s::vector AS distance
            FROM family_documents
            WHERE tenant_id = %s::uuid
              AND embedding IS NOT NULL
              AND (
                  LOWER(content) LIKE LOWER(%s)
                  OR LOWER(title) LIKE LOWER(%s)
              )
            ORDER BY distance
            LIMIT %s
        """, (query_embedding, tenant_id, f'%{person_name}%', f'%{person_name}%', top_k * 2))

        results = cursor.fetchall()

        # If no results with name filter, try pure semantic search
        if not results:
            cursor.execute("""
                SELECT id, title, content, category, extracted_data,
                       embedding <=> %s::vector AS distance
                FROM family_documents
                WHERE tenant_id = %s::uuid AND embedding IS NOT NULL
                ORDER BY distance
                LIMIT %s
            """, (query_embedding, tenant_id, top_k))
            results = cursor.fetchall()

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[Biography] DB error: {e}")
        return []

    if not results:
        return []

    # Rerank for relevance to the person
    try:
        documents_for_rerank = []
        for r in results:
            doc_text = f"About {person_name}: title: {r[1]}\ncategory: {r[3]}\ncontent: {r[2][:3000]}"
            documents_for_rerank.append({
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:6000],
                "category": r[3],
                "extracted_data": r[4] if r[4] else {},
                "rerank_text": doc_text
            })

        rerank_start = time.time()
        rerank_response = co.rerank(
            query=f"Information about {person_name}, their life, events, and relationships",
            documents=[d["rerank_text"] for d in documents_for_rerank],
            top_n=top_k,
            model="rerank-v3.5",
            return_documents=False
        )
        rerank_latency = int((time.time() - rerank_start) * 1000)

        log_api_usage(
            tenant_id=tenant_id,
            provider="cohere",
            endpoint="rerank",
            model="rerank-v3.5",
            latency_ms=rerank_latency,
            success=True,
            operation="biography_rerank"
        )

        documents = []
        for result in rerank_response.results:
            if result.relevance_score > 0.1:  # Filter low relevance
                doc = documents_for_rerank[result.index]
                documents.append({
                    "id": doc["id"],
                    "title": doc["title"],
                    "content": doc["content"],
                    "category": doc["category"],
                    "extracted_data": doc["extracted_data"],
                    "relevance": round(float(result.relevance_score), 3)
                })

        return documents

    except Exception as e:
        print(f"[Biography] Rerank error: {e}")
        # Return unranked results
        return [
            {
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:6000],
                "category": r[3],
                "extracted_data": r[4] if r[4] else {},
                "relevance": 0.5
            }
            for r in results[:top_k]
        ]


def format_extracted_data(extracted_data: dict) -> str:
    """Format extracted data for the biography prompt."""
    if not extracted_data:
        return ""

    parts = []

    # V2 format
    if 'items' in extracted_data:
        for item in extracted_data.get('items', [])[:10]:
            if isinstance(item, dict) and item.get('label') and item.get('value'):
                parts.append(f"  - {item['label']}: {item['value']}")
    else:
        # V1 format
        for key, value in extracted_data.items():
            if value and value != 'null':
                if isinstance(value, list):
                    filtered = [v for v in value if v and v != 'null']
                    if filtered:
                        parts.append(f"  - {key}: {', '.join(str(v) for v in filtered)}")
                else:
                    parts.append(f"  - {key}: {value}")

    return "\n".join(parts) if parts else ""


def build_biography_prompt(
    person_name: str,
    documents: list,
    style: str,
    max_words: int,
    include_historical_context: bool
) -> str:
    """Build the prompt for biography generation."""

    style_instructions = {
        'narrative': "Write in a warm, engaging narrative style that tells their story like a novel.",
        'formal': "Write in a formal, documentary style suitable for official records or memorials.",
        'casual': "Write in a casual, conversational style as if telling stories to friends.",
        'children': "Write in a simple, accessible style suitable for children to understand their family history."
    }

    style_guide = style_instructions.get(style, style_instructions['narrative'])

    historical_instruction = ""
    if include_historical_context:
        historical_instruction = """
When you mention dates or time periods, add brief historical context to help readers understand
what was happening in the world at that time (e.g., "during the Great Depression", "as World War II ended",
"during the post-war economic boom")."""

    # Build document context
    doc_context_parts = []
    for i, doc in enumerate(documents[:8], 1):  # Limit to 8 docs to fit context
        doc_part = f"""
--- Document {i}: {doc['title']} (Category: {doc['category']}, Relevance: {doc['relevance']}) ---
{doc['content'][:2500]}
"""
        extracted = format_extracted_data(doc.get('extracted_data', {}))
        if extracted:
            doc_part += f"\nExtracted Data:\n{extracted}\n"
        doc_context_parts.append(doc_part)

    documents_context = "\n".join(doc_context_parts)

    return f"""You are a skilled family historian and biographer. Your task is to write an engaging biography
for {person_name} based on the family documents provided below.

## Writing Style
{style_guide}

## Guidelines
1. Focus on {person_name} - extract and weave together information specifically about them
2. Include specific dates, places, and events mentioned in the documents
3. Describe relationships with other family members mentioned
4. Highlight achievements, milestones, and memorable moments
5. If documents mention multiple people, focus on {person_name}'s perspective and role
6. Use direct quotes from documents when they add authenticity
7. If information is limited, acknowledge this gracefully rather than inventing details
{historical_instruction}

## Target Length
Approximately {max_words} words.

## Output Format
Write in Markdown format with:
- A compelling opening that introduces {person_name}
- Organized sections using ## headings for different life periods or themes
- A thoughtful conclusion

## Source Documents About {person_name}
{documents_context}

---

Now write the biography for {person_name}. Remember to cite specific documents when referencing facts.
Begin the biography:"""


def generate_biography_with_ai(
    prompt: str,
    tenant_id: str,
    groq_client: Groq
) -> tuple[str, int, int]:
    """Generate the biography using Groq."""

    start_time = time.time()

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert family historian who writes compelling, accurate biographies based on documentary evidence. You write with warmth and respect for the subject."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,  # Slightly creative for narrative
            max_tokens=2048
        )

        latency_ms = int((time.time() - start_time) * 1000)

        biography = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0

        # Log usage
        log_api_usage(
            tenant_id=tenant_id,
            provider="groq",
            endpoint="chat",
            model="llama-3.3-70b-versatile",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            success=True,
            operation="generate_biography"
        )

        return biography, input_tokens, output_tokens

    except Exception as e:
        print(f"[Biography] Generation error: {e}")
        raise


def main(
    person_name: str,
    tenant_id: str,
    style: str = "narrative",
    max_words: int = 500,
    include_historical_context: bool = True
) -> dict:
    """Generate an AI-powered biography for a family member."""

    if not person_name or not person_name.strip():
        return {
            "success": False,
            "error": "person_name is required"
        }

    if not tenant_id:
        return {
            "success": False,
            "error": "tenant_id is required"
        }

    person_name = person_name.strip()

    # Validate style
    valid_styles = ['narrative', 'formal', 'casual', 'children']
    if style not in valid_styles:
        style = 'narrative'

    # Clamp max_words
    max_words = max(200, min(2000, max_words))

    print(f"[Biography] Generating for '{person_name}' in {style} style ({max_words} words)")

    # Initialize clients
    groq_api_key = wmill.get_variable("f/chatbot/groq_api_key")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    groq_client = Groq(api_key=groq_api_key)
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Step 1: Search for relevant documents
    print(f"[Biography] Searching documents for '{person_name}'...")
    documents = search_documents_for_person(person_name, tenant_id, co, top_k=10)

    if not documents:
        return {
            "success": False,
            "error": f"No documents found mentioning '{person_name}'. Upload some documents about this person first.",
            "person_name": person_name,
            "sources": []
        }

    print(f"[Biography] Found {len(documents)} relevant documents")

    # Step 2: Build prompt
    prompt = build_biography_prompt(
        person_name=person_name,
        documents=documents,
        style=style,
        max_words=max_words,
        include_historical_context=include_historical_context
    )

    # Step 3: Generate biography
    print(f"[Biography] Generating biography...")
    try:
        biography, input_tokens, output_tokens = generate_biography_with_ai(
            prompt=prompt,
            tenant_id=tenant_id,
            groq_client=groq_client
        )
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to generate biography: {str(e)}",
            "person_name": person_name,
            "sources": [{"id": d["id"], "title": d["title"], "category": d["category"], "relevance": d["relevance"]} for d in documents]
        }

    # Count words
    word_count = len(biography.split())

    print(f"[Biography] Generated {word_count} words")

    return {
        "success": True,
        "biography": biography,
        "person_name": person_name,
        "style": style,
        "word_count": word_count,
        "sources": [
            {
                "id": d["id"],
                "title": d["title"],
                "category": d["category"],
                "relevance": d["relevance"]
            }
            for d in documents
        ],
        "tokens_used": {
            "input": input_tokens,
            "output": output_tokens
        }
    }
