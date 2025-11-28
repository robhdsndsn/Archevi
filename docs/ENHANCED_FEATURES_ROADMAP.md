# Archevi Enhanced Features Roadmap

## Overview

This document outlines the enhanced AI features for Archevi, including implementation status and future possibilities.

---

## Implemented Features (v2.3.0)

### 1. Enhanced Document Embedding (`embed_document_enhanced.py`)

**Status:** Backend Complete

| Feature | Description | Cost Impact |
|---------|-------------|-------------|
| Auto-Categorization | Detects document category using keywords + embedding similarity | Free (uses existing embeddings) |
| Smart Tagging | Extracts 3-5 relevant tags from content | ~$0.001/doc (optional LLM call) |
| Expiry Date Detection | Extracts renewal dates, due dates, policy end dates | Free (regex-based) |
| Category Confidence | Returns confidence score for auto-categorization | Free |

**API Endpoint:** `f/chatbot/embed_document_enhanced`

**New Fields Returned:**
```json
{
  "document_id": 123,
  "category": "insurance",
  "suggested_category": "insurance",
  "category_confidence": 0.85,
  "tags": ["insurance", "policy", "auto"],
  "expiry_dates": [
    {"date": "2025-06-15", "type": "renewal", "confidence": 0.8}
  ],
  "ai_features_used": ["auto_categorize:keyword", "smart_tags", "expiry_detection"]
}
```

### 2. Voice Note Transcription (`transcribe_voice_note.py`)

**Status:** Backend Complete

| Feature | Description | Cost |
|---------|-------------|------|
| Groq Whisper | Fast, accurate transcription (whisper-large-v3-turbo) | $0.0028/min |
| Auto-Titling | Generates title from transcript content | ~$0.0005/note |
| Smart Tags | Extracts relevant tags | ~$0.0005/note |
| 80+ Languages | Automatic language detection | Included |

**API Endpoint:** `f/chatbot/transcribe_voice_note`

### 3. OCR for Scanned Documents (`frontend/src/lib/ocr.ts`)

**Status:** Frontend Complete

| Feature | Description | Cost |
|---------|-------------|------|
| Tesseract.js | Client-side OCR (runs in browser) | Free |
| Batch Processing | OCR multiple pages | Free |
| PDF Page Rendering | Convert scanned PDFs to images for OCR | Free |
| Progress Tracking | Real-time progress updates | N/A |

### 4. Database Enhancements (`migrations/004_enhanced_document_features.sql`)

**New Columns:**
- `metadata JSONB` on `family_documents` and `documents` tables
- `voice_notes` table for transcribed audio

**New Functions:**
- `search_documents_by_tag(tag, limit)`
- `get_expiring_documents(days)`
- `get_all_tags()`

**New Views:**
- `documents_expiring_soon` - Documents expiring in next 90 days
- `documents_by_tag` - All documents with their tags

---

## Frontend Integration (COMPLETED v2.3.0)

### Document Upload Enhancements

1. **Enhanced Upload Mode Toggle** - DONE
   - Standard upload (existing)
   - AI-Enhanced upload with toggle switch
   - Advanced options: auto-categorize, extract tags, detect dates

2. **Voice Note Recording** - DONE
   ```tsx
   <VoiceNoteRecorder />
   ```
   - Browser MediaRecorder API
   - Groq Whisper transcription
   - Auto-embedding for RAG

3. **OCR for Images/Scanned PDFs** - DONE
   - Tesseract.js client-side OCR
   - Progress indicator during processing
   - Automatic detection for scanned PDFs

4. **Tag Display and Editing** - PARTIAL
   - Tag Cloud widget displays all tags
   - Click to filter by tag
   - TODO: Tag editing on document view

5. **Expiry Alert Dashboard** - DONE
   - ExpiryAlerts widget on Documents Overview
   - Urgency badges (urgent/soon/upcoming)
   - Document counts by timeframe

---

## Future Premium Features

### Deep Search Mode (Agent-Driven RAG)

**Description:** Multi-step retrieval with verification and cross-referencing.

**Implementation:**
- Toggle in chat UI: "Deep Search"
- Multiple retrieval passes
- Source verification
- Follow-up question generation

**Cost:** 3-5x standard query cost (~$0.003-0.005/query)

**Priority:** High value, medium effort

### Camera Scanning (Mobile PWA)

**Description:** Native camera integration for document capture.

**Implementation Options:**
1. PWA with camera API + client-side edge detection
2. React Native app with `react-native-document-scanner-plugin`
3. Scanbot SDK integration

**Priority:** High for mobile adoption

### Document Expiry Alerts

**Description:** Proactive notifications for expiring documents.

**Implementation:**
1. Daily cron job to check `get_expiring_documents(30)`
2. Email notification via SendGrid/Resend
3. In-app notification bell
4. Optional calendar integration (Google/Apple)

**Cost:** Minimal (email API only)

**Priority:** High user value, low effort

### Ollama Support (Local LLM)

**Description:** Self-hosted LLM alternative for privacy-conscious users.

**Benefits:**
- Zero API costs after setup
- Complete data privacy
- Offline capability

**Challenges:**
- Requires GPU server
- Quality may vary by model
- Setup complexity

**Priority:** Medium (niche audience)

### Multi-Language Support

**Description:** UI and document processing in multiple languages.

**Implementation:**
- i18n library (react-i18next)
- Cohere already supports multilingual embeddings
- Whisper supports 80+ languages

**Priority:** Medium (expands market)

---

## Cost Summary

| Feature | Monthly Cost (Typical Family) |
|---------|-------------------------------|
| Current baseline | ~$2-5 |
| + Voice notes (30 min) | +$0.10 |
| + Smart tagging | +$0.20 |
| + OCR | Free |
| + Auto-categorization | Free |
| + Deep Search (10% queries) | +$0.50 |
| **TOTAL** | ~$3-6/month |

---

## Configuration Required

### Groq API Key

Add to Windmill variables:
- Path: `f/chatbot/groq_api_key`
- Get from: https://console.groq.com/keys

### Database Migration

Run migration 004:
```bash
psql -h localhost -U archevi -d archevi -f migrations/004_enhanced_document_features.sql
```

---

## Testing Checklist

- [x] Enhanced embed with auto-categorization
- [x] Enhanced embed with tag extraction
- [x] Enhanced embed with expiry detection
- [x] Voice note transcription (short clip)
- [x] Voice note transcription (long clip)
- [x] OCR on scanned PDF
- [x] OCR on image file
- [x] Tag search function (get_tags API)
- [x] Expiring documents query (get_expiring_documents API)
- [x] Tag Cloud widget display
- [x] Expiry Alerts widget display
- [ ] Tag editing on document view
- [ ] Deep Search mode in chat

---

**Last Updated:** 2025-11-28
**Version:** 2.3.0
