<p align="center">
  <h1 align="center">Archevi</h1>
  <p align="center">
    <strong>Your family's AI-powered knowledge vault</strong>
  </p>
  <p align="center">
    Store, search, and understand your important documents with natural language
  </p>
</p>

<p align="center">
  <a href="https://archevi.ca">Website</a> |
  <a href="#features">Features</a> |
  <a href="#how-it-works">How It Works</a> |
  <a href="#pricing">Pricing</a> |
  <a href="#roadmap">Roadmap</a>
</p>

---

## Why Archevi?

Every family accumulates important documents - insurance policies, medical records, tax returns, warranties, legal papers. When you need to find something specific, you're stuck digging through folders or searching file names.

**Archevi changes that.** Ask questions in plain English and get answers grounded in your actual documents:

> "What's our home insurance deductible?"
> "When does Sarah's passport expire?"
> "What did the doctor recommend at my last checkup?"

No more hunting through PDFs. No more forgotten expiration dates. Your documents become a searchable knowledge base that actually understands what's inside them.

---

## Features

### AI-Powered Document Intelligence
- **Natural language queries** - Ask questions, get answers with source citations
- **Semantic search** - Find documents by meaning, not just keywords
- **AI-powered extraction** - Automatic tags, categories, and expiration dates
- **Duplicate detection** - Prevents uploading the same document twice
- **Smart category defaults** - Remembers your preferences for faster uploads

### Document Management
- **PDF upload** with automatic text extraction
- **OCR support** for scanned documents
- **Bulk operations** - Multi-select with checkboxes, bulk delete
- **Document preview on hover** - Quick preview without opening
- **Edit inline** - Update title, content, category, visibility
- **Person assignment** - Assign documents to specific family members
- **Visibility controls** - Everyone, Adults Only, Admins Only, or Private
- **Expiry tracking** with dashboard alerts (urgent/soon/upcoming)
- **Tag cloud** for browsing by topic
- **Advanced filtering** - By date range, category, person, tags

### Voice Notes
- **Browser recording** - Capture thoughts directly in the app
- **Mobile-optimized** - Large touch targets for easy recording
- **Fast transcription** - 80+ languages supported via Groq Whisper
- **Searchable** - Voice notes become part of your knowledge base

### Enhanced Chat Experience
- **Workflow visualization** - See AI thinking process in real-time
- **Source citations** - Every answer shows which documents were used
- **Confidence scores** - Know how certain the AI is
- **Chat export** - Export conversations to PDF
- **Suggestion chips** - Quick-start queries on empty state

### Family Collaboration
- **Family accounts** - Each household gets isolated, private storage
- **Member management** - Invite family members via email
- **Role-based access** - Admin and member permissions
- **Member types** - Admin, Adult, Teen, Child with visibility controls
- **Document visibility** - Control who sees what based on member type
- **Person taxonomy** - Assign documents to specific people

### Modern UI/UX
- **Mobile-first design** - Works great on phones and tablets
- **PWA support** - Install as an app, use camera for scanning
- **Dark mode** - Easy on the eyes
- **Command palette** - Quick access with Cmd/Ctrl+K
- **Responsive tables** - Grid and table views
- **Context menus** - Right-click for quick actions
- **Hover cards** - Preview documents without opening
- **Drawer navigation** - Mobile-friendly document details

### Analytics & Insights
- **Usage tracking** - Monitor queries and document activity
- **Document statistics** - See your knowledge base at a glance
- **Expiry dashboard** - Never miss an important renewal date
- **Admin views** - Instance-wide document management

---

## How It Works

1. **Upload your documents** - PDFs, scanned images, or type directly
2. **AI processes everything** - Automatic categorization, tagging, and expiry detection
3. **Ask questions naturally** - "When does my car insurance expire?"
4. **Get cited answers** - Responses reference your actual documents

Your documents are encrypted and stored securely. Each family's data is completely isolated.

---

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $14.99 CAD/month | 5 members, 10GB storage, ~150 queries/month included |
| **Family** | $24.99 CAD/month | Unlimited members, 50GB storage, ~400 queries/month included |
| **Family Office** | Custom | Dedicated infrastructure, unlimited everything, priority support |

All plans include:
- AI-powered document search (AI cost included)
- Automatic expiry tracking
- Voice note transcription
- Mobile-friendly interface
- 14-day free trial

---

## Security & Privacy

- **Tenant isolation** - Each family's data is completely separate
- **Encrypted storage** - Documents encrypted at rest
- **Secure authentication** - JWT tokens with refresh rotation
- **No training on your data** - Your documents are never used to train AI models
- **Data portability** - Export your documents anytime

---

## Roadmap

### Now Available (v0.3.0)
- Core RAG pipeline with source citations
- Document upload, search, and management
- Voice note recording and transcription
- AI-enhanced document processing (auto-tags, categories, expiry detection)
- OCR for scanned documents
- Expiry alerts dashboard
- Multi-tenant family accounts
- Member invitation system
- Analytics and usage tracking
- **NEW** Export chat history as PDF
- **NEW** Mobile PWA with camera scanning
- **NEW** Document visibility/privacy controls
- **NEW** Person assignment (assign docs to family members)
- **NEW** Duplicate detection on upload
- **NEW** Smart category defaults
- **NEW** Bulk document operations (multi-select, bulk delete)
- **NEW** Document preview on hover
- **NEW** AI workflow visualization in chat
- **NEW** Admin document management views
- **NEW** Member type system (Admin/Adult/Teen/Child)

### Coming Soon (v0.4.0)
- Two-factor authentication (2FA/MFA)
- Image embedding and photo search
- Document version history
- Calendar integration for expiry dates

### Future Plans
- Email notifications for expiring documents
- Bulk document import (ZIP upload)
- Deep Search mode (multi-step research)
- ElevenLabs audio document support
- S3 direct upload for bulk import

---

## Tech Stack

Built with modern, reliable technologies:

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript + Vite |
| **UI** | shadcn/ui + Tailwind CSS |
| **Backend** | Windmill (workflow orchestration) |
| **Database** | PostgreSQL + pgvector |
| **AI** | Cohere (embeddings, generation, reranking) |
| **Voice** | Groq Whisper |

---

## Enterprise

For organizations managing documents across multiple families or requiring custom deployment:

- **White-label options** - Your branding, your domain
- **On-premise deployment** - Keep data on your infrastructure
- **Custom integrations** - Connect to existing systems
- **SLA guarantees** - 99.9% uptime commitment
- **Dedicated support** - Direct access to engineering team

[Contact us for enterprise pricing](mailto:enterprise@archevi.ca)

---

## Support

- **Documentation**: [docs.archevi.ca](https://docs.archevi.ca)
- **Email**: support@archevi.ca
- **Status**: [status.archevi.ca](https://status.archevi.ca)

---

<p align="center">
  <a href="https://archevi.ca">Get Started</a> |
  <a href="https://archevi.ca/demo">Try the Demo</a>
</p>

<p align="center">
  <sub>Built in Canada</sub>
</p>
