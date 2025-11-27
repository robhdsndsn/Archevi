# TODO: Generate this script using Claude Code MCP integration
#
# Script Name: rag_query.py
# Location: f/chatbot/rag_query in Windmill
#
# Purpose: Main RAG pipeline (Retrieval-Augmented Generation)
#
# Prompt to use: See 02_Documentation/Implementation_Guide.md
#                Phase 3, Section 3.1, Prompt 2
#
# This script will:
# - Embed user query via Cohere
# - Vector search in PostgreSQL (cosine similarity, top 10)
# - Rerank results via Cohere (top 3)
# - Generate answer via Cohere Command-R
# - Store conversation in database
# - Return {answer, sources, confidence, session_id}
