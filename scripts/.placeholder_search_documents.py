# TODO: Generate this script using Claude Code MCP integration
#
# Script Name: search_documents.py
# Location: f/chatbot/search_documents in Windmill
#
# Purpose: Semantic search for testing/debugging
#
# Prompt to use: See 02_Documentation/Implementation_Guide.md
#                Phase 3, Section 3.1, Prompt 5
#
# This script will:
# - Input: search_term, category (optional), limit (default=5)
# - Perform vector similarity search
# - Filter by category if provided
# - Return matches with relevance scores
# - Format: {id, title, content_preview, category, relevance_score}
