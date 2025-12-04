# Features

A comprehensive overview of everything Archevi can do for your family.

## AI-Powered Document Intelligence

### Natural Language Search

Ask questions in plain English and get accurate answers:

- "What's our home insurance deductible?"
- "When does Sarah's passport expire?"
- "What did the doctor recommend at my last checkup?"

The AI understands meaning, not just keywords. Ask for "documents about the car" and find insurance policies, maintenance records, and registration - even if they don't contain the word "car".

### AI Workflow Visualization

Watch the AI work in real-time:

1. **Searching** - Finding relevant documents in your knowledge base
2. **Analyzing** - Extracting the most relevant passages
3. **Generating** - Formulating a clear, accurate answer

No black boxes - see exactly what's happening.

### Source Citations

Every answer shows which documents were used:
- Document title and category
- Relevance score (how well it matched your query)
- Click to view the full source

Never wonder where information came from.

### Smart Document Processing

When you upload documents, AI automatically:

| Feature | What It Does |
|---------|--------------|
| **Auto-Categorization** | Suggests the best category (Medical, Financial, etc.) |
| **Smart Tags** | Extracts 3-5 relevant tags from content |
| **Expiry Detection** | Finds renewal dates, due dates, policy expirations |
| **Duplicate Detection** | Warns if you're uploading something that already exists |

### Smart Defaults

Archevi learns your preferences:
- Remembers your most-used category for faster uploads
- Pre-fills common fields based on your patterns
- Suggests relevant tags based on content

---

## Document Management

### Upload Methods

Multiple ways to add documents:

- **File Upload** - Drag & drop PDFs, images, or select from your device
- **Text Entry** - Paste or type directly
- **Voice Notes** - Record and auto-transcribe
- **Camera Capture** - Snap photos on mobile (PWA)

### PDF & OCR Processing

- **PDF extraction** - Automatically extracts text from PDF files
- **OCR for images** - Reads text from scanned documents and photos
- **80+ languages** - Voice transcription supports most languages

### Document Organization

| Feature | Description |
|---------|-------------|
| **Categories** | Financial, Medical, Legal, Insurance, Education, Personal, Recipes |
| **Tags** | Auto-generated or custom tags for flexible organization |
| **Person Assignment** | Assign documents to specific family members |
| **Visibility Controls** | Control who can see each document |

### Visibility Levels

| Level | Who Can See |
|-------|-------------|
| **Everyone** | All family members |
| **Adults Only** | Adults and Admins |
| **Admins Only** | Family administrators |
| **Private** | Only assigned person and admins |

### Bulk Operations

Manage multiple documents at once:
- Multi-select with checkboxes
- Select all on current page
- Bulk delete
- (Coming soon) Bulk category change

### Quick Preview

Hover over any document to see:
- Category badge with icon
- Visibility indicator
- Content preview snippet
- Date and assigned person

No need to open every document to find what you're looking for.

---

## Voice Notes

### Easy Recording

1. Tap the large record button
2. Speak your note
3. Tap stop
4. Review and save

That's it. No complicated setup.

### Mobile-Optimized

- Large touch targets for easy tapping
- Visual feedback while recording
- Playback controls to review
- Delete and re-record if needed

### Fast Transcription

- Powered by Groq Whisper
- 80+ languages supported
- Typically completes in seconds
- Fully searchable once saved

### Audio File Upload

Already have audio files?
- Upload WAV, MP3, M4A, or WebM
- Automatic transcription
- Becomes part of your searchable knowledge base

---

## Chat Experience

### Conversation History

- All chats are saved automatically
- Browse and continue past conversations
- Sessions are titled based on content

### Export to PDF

Save any conversation as a PDF:
- Full conversation with timestamps
- Source citations preserved
- Print-friendly formatting

### Suggestion Chips

New to Archevi? The empty chat shows helpful suggestions:
- "Find my tax documents"
- "Show medical records"
- "Insurance policies"
- "Recent receipts"

Just click to start searching.

---

## Family Collaboration

### Member Management

- Invite family members via email
- Role-based permissions (Owner, Admin, Member, Viewer)
- See who's active and when

### Member Types

Control document visibility by member type:

| Type | Can See |
|------|---------|
| **Admin** | All documents |
| **Adult** | Everyone + Adults Only |
| **Teen** | Everyone only |
| **Child** | Everyone only |

Perfect for:
- Keeping financial docs away from kids
- Sharing recipes with everyone
- Private medical records for individuals

### Person Assignment

Assign documents to specific people:
- "Mom's prescription" shows up when filtering by Mom
- "Dad's tax return" stays organized
- Each person can see their assigned documents

---

## Expiry Tracking

### Dashboard Alerts

Never miss an important date:

| Urgency | Timeline |
|---------|----------|
| **Urgent** | Expires in 7 days or less |
| **Soon** | Expires in 8-30 days |
| **Upcoming** | Expires in 31-90 days |

### Automatic Detection

AI finds expiry dates in:
- Insurance policies
- Passports and IDs
- Subscriptions
- Warranties
- Contracts

---

## Modern Interface

### Mobile-First Design

Works great on any device:
- Responsive layouts
- Touch-optimized controls
- PWA support (install as app)
- Camera integration

### View Modes

Choose how you browse:
- **Grid View** - Visual cards with previews
- **Table View** - Sortable columns for power users

### Dark Mode

Easy on the eyes, day or night.

### Command Palette

Quick access with `Cmd/Ctrl + K`:
- Jump to any section
- Search documents
- Start new chat

### Context Menus

Right-click for quick actions:
- View details
- Edit document
- Delete document

---

## Admin Features

### Instance Overview

For family administrators:
- View all documents across the family
- See usage statistics
- Manage member permissions

### Multi-Tenant Support

- Each family is completely isolated
- No data mixing between families
- Users can belong to multiple families

---

## Security & Privacy

### Data Isolation

Your family gets a dedicated, isolated database:
- No shared infrastructure
- No data mixing with other families
- PIPEDA compliant

### Encryption

- Documents encrypted at rest
- Secure HTTPS connections
- JWT authentication with refresh tokens

### No AI Training

Your documents are never used to train AI models. Your data stays yours.

### Data Portability

Export your documents anytime. You're not locked in.

---

## What's Coming

### v0.4.0 (Coming Soon)
- Two-factor authentication (2FA/MFA)
- Image embedding and photo search
- Document version history
- Calendar integration for expiry dates

### Future Plans
- Email notifications for expiring documents
- Bulk document import (ZIP upload)
- Deep Search mode (multi-step research)
- ElevenLabs audio document support

---

## Get Started

Ready to try Archevi?

[Start Free Trial](/guide/) | [See Pricing](/pricing/)
