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

### Related Documents

AI-powered recommendations show you documents similar to what you're viewing:
- Based on semantic content similarity
- Helps discover connections you might miss
- Available in document detail view

### Multi-Model Selection

Choose the AI model that best fits your needs:

| Provider | Model | Best For |
|----------|-------|----------|
| Fast Model | General queries, quick answers |
| Vision Model | Document understanding, charts, diagrams |
| Reasoning Model | Complex analysis, multi-step thinking |
| Structured Model | Data extraction, tool use |
| Quality Model | High quality, detailed answers |
| Speed Model | Fast responses for simple questions |

Your preference is saved and remembered across sessions.

### Smart Document Processing

When you upload documents, AI automatically:

| Feature | What It Does |
|---------|--------------|
| **Auto-Categorization** | Suggests the best category (Medical, Financial, etc.) |
| **Smart Tags** | Extracts 3-5 relevant tags from content |
| **Expiry Detection** | Finds renewal dates, due dates, policy expirations |
| **Duplicate Detection** | Warns if you're uploading something that already exists |

### AI Data Extraction

Click "Extract Data" on any document to have AI pull out key information:

| Category | Extracted Fields |
|----------|------------------|
| **Insurance** | Policy number, provider, coverage amount, deductible, expiry date |
| **Medical** | Patient name, diagnosis, medications, next appointment |
| **Financial** | Institution, account number, balance, statement period |
| **Invoices** | Vendor, invoice number, total, due date, items |
| **Recipes** | Ingredients, prep time, cook time, servings, dietary tags |

Data is extracted on-demand and saved for future reference.

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
- **Multi-language OCR** - 20 languages supported for document scanning
- **80+ languages** - Voice transcription supports most languages

### Visual Search (Image Embedding)

Search for images by describing their visual content:

| Feature | Description |
|---------|-------------|
| **Visual Search Toggle** | Opt-in when uploading images |
| **Describe to Find** | Search "receipt with coffee shop logo" or "handwritten note" |
| **OCR + Visual** | Text extraction is automatic; visual search adds image understanding |
| **Cost-Effective** | ~$0.001 per image, only pay when you enable it |

**When to use Visual Search:**
- Receipts with distinctive logos
- Handwritten notes and sketches
- Photos with important visual elements
- Documents where layout matters more than text

**When OCR is enough:**
- Typed documents and forms
- PDFs with selectable text
- Screenshots of text
- Standard business documents

Visual search is complementary to OCR, not a replacement. OCR extracts text for free; visual search adds the ability to find images by their visual appearance.

### PDF Visual Search (Page-Level)

Find specific pages within PDF documents by describing their visual content:

| Feature | Description |
|---------|-------------|
| **Page-Level Embeddings** | Each PDF page is individually embedded for visual search |
| **Visual Content Queries** | Search "page with pie chart" or "handwritten signature" |
| **Thumbnail Previews** | See matching pages with thumbnail and similarity score |
| **OCR Text Overlay** | View extracted text alongside visual results |
| **Real-Time Feedback** | See "Searching PDF pages..." status in chat |

**Example queries:**
- "Show me the page with the budget chart"
- "Find the page with my handwritten notes"
- "Where is the signature page in the contract?"

The AI automatically decides when to use visual search based on your query.

### Document Organization

| Feature | Description |
|---------|-------------|
| **Categories** | Financial, Medical, Legal, Insurance, Education, Personal, Recipes |
| **Tags** | Auto-generated or custom tags for flexible organization |
| **Person Assignment** | Assign documents to specific family members |
| **Visibility Controls** | Control who can see each document |
| **Document Sharing** | Share documents between family accounts |
| **Secure Links** | Password-protected sharing with external parties |

### Visibility Levels

| Level | Who Can See |
|-------|-------------|
| **Everyone** | All family members |
| **Adults Only** | Adults and Admins |
| **Admins Only** | Family administrators |
| **Private** | Only assigned person and admins |

### Secure Links

Share documents securely with people outside your family:

| Feature | Description |
|---------|-------------|
| **Password Protection** | Optional password requirement for access |
| **View Limits** | Limit to 1, 5, 10, 25, or unlimited views |
| **Expiration** | Auto-expire after 1 hour to 1 year, or never |
| **Revocation** | Instantly revoke access to any link |
| **View Tracking** | See when and how many times a link was accessed |

**How it works:**
1. Click the secure link icon on any document
2. Configure password, view limit, and expiration
3. Copy the unique URL to share
4. Recipient enters password (if set) to view
5. Revoke anytime from the Secure Links dialog

**Security features:**
- Cryptographically random tokens (secrets.token_urlsafe)
- Passwords stored as bcrypt hashes
- Server-side validation before document access
- Automatic expiration and view limit enforcement

### Bulk Operations

Manage multiple documents at once:
- Multi-select with checkboxes
- Select all on current page
- Bulk delete
- Bulk ZIP upload (upload multiple files at once)

### Document Version History

Track changes to your documents over time:

| Feature | Description |
|---------|-------------|
| **Automatic Versioning** | New version created when document is re-uploaded |
| **Version Timeline** | Visual timeline showing all versions |
| **Change Types** | Initial, Update, Correction, Major Revision |
| **Rollback** | Restore any previous version with one click |
| **Audit Trail** | See who made changes and when |

**How it works:**
1. Upload a document normally
2. If you upload with the same title, a new version is created
3. View History tab in document details to see all versions
4. Click "Restore this version" to rollback (creates a new version preserving history)

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

- AI-powered transcription
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

### Admin Dashboard

Full system administration tools:
- **System Health** - Real-time service status monitoring
- **Tenant Management** - Create, edit, suspend tenant accounts
- **API Costs** - Track AI usage by provider and tenant
- **Usage Alerts** - Threshold-based notifications for quota management
- **Audit Logging** - Complete trail of admin actions for compliance
- **Database Backups** - Automated daily/weekly/monthly with retention

### Rate Limiting

Plan-based usage limits protect against abuse:
- Trial: 15 requests/minute
- Starter: 30 requests/minute
- Family: 60 requests/minute
- Family Office: 120 requests/minute

### Multi-Tenant Support

- Each family is completely isolated
- No data mixing between families
- Users can belong to multiple families

---

## Family Stories

### Family Timeline

Visualize your family's history chronologically:

| Feature | Description |
|---------|-------------|
| **Visual Timeline** | Vertical timeline with color-coded event types |
| **Event Types** | Birth, death, wedding, medical, legal, achievement, travel, education |
| **AI Extraction** | Automatically extract events from uploaded documents |
| **Manual Events** | Create events with date picker and type selector |
| **Filtering** | Filter by year and event type |
| **Document Links** | Events link back to source documents |
| **Family Members** | Associate events with specific people |

**How to use:**
1. Navigate to Timeline in the sidebar
2. Click "Generate from Documents" to have AI extract events
3. Or click "Add Event" to create manually
4. Use filters to focus on specific years or event types

### Biography Generator

Create AI-powered narratives about family members:

| Feature | Description |
|---------|-------------|
| **Writing Styles** | Narrative, Chronological, Achievements, Personal |
| **Word Count** | Slider from 500 to 3,000 words |
| **Historical Context** | Toggle to include period-specific details |
| **Source Citations** | See which documents contributed to the narrative |
| **Export** | Copy to clipboard or download as text file |

**Example use cases:**
- Generate obituary drafts from collected documents
- Create family history summaries for reunions
- Document achievements for awards or applications
- Preserve stories for future generations

### Text-to-Speech

Listen to your documents:

| Feature | Description |
|---------|-------------|
| **Browser TTS** | Free, uses Web Speech API |
| **Voice Selection** | Choose from system voices |
| **Speed Control** | Adjust playback rate (0.5x to 2x) |
| **Pitch Control** | Adjust voice pitch |
| **Progress Bar** | Visual progress indicator |
| **Play/Pause** | Control playback anytime |

Available in the Text tab when viewing document details.

---

## Billing & Subscription

### Plan Tiers

| Plan | Price | Storage | AI Budget | Members |
|------|-------|---------|-----------|---------|
| **Trial** | Free (14 days) | 1 GB | $5/mo | 2 |
| **Starter** | $9/month | 5 GB | $15/mo | 5 |
| **Family** | $19/month | 25 GB | $25/mo | 10 |
| **Family Office** | $49/month | 100 GB | $75/mo | 50 |

Annual billing saves up to 22%.

### Usage Tracking

Monitor your usage in Settings > Billing:
- **Storage** - Documents, voice notes, images
- **AI Spend** - Queries, embeddings, extraction
- **Documents** - Total document count
- **AI Queries** - Monthly query count
- **Members** - Active family members

Progress bars show usage percentage with warnings at 80% and alerts at 100%.

### Subscription Management

- **Change Plan** - Upgrade or downgrade anytime
- **Cancel/Resume** - Cancel with access until period end
- **Payment Method** - Update credit card details
- **Billing History** - View past invoices
- **Overage Alerts** - Notifications when approaching limits

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

### Recently Added (v0.5.0)
- **Marketing Website** - SEO-optimized Next.js site at archevi.ca
  - Landing page with hero, features, testimonials, CTAs
  - Pricing page with plan comparison and billing toggle
  - Blog with Strapi CMS integration
  - FAQ page with category tabs, accordion, and search
  - Responsive design with mobile-first approach
- **Strapi CMS Integration** - Content management for marketing
  - 7 content types: Blog Posts, FAQs, Announcements, Changelog, Testimonials, Features, Legal Pages
  - REST API client with type-safe TypeScript interfaces
  - ISR (Incremental Static Regeneration) for content updates
- **Self-Service Signup** - Complete tenant provisioning flow
  - SignupForm with email, password strength indicator, family name
  - Automatic tenant creation 
  - Cross-domain authentication using URL fragment tokens
- **Cross-Domain Auth** - Seamless login flow between marketing site and dashboard

### Previous Release (v0.4.9)
- **Billing & Subscription UI** - Complete subscription management in Settings
- **Biography Generator** - AI-powered family member narratives
- **Browser Text-to-Speech** - Free document reading with Web Speech API
- **Family Timeline** - Visual chronological view of family events
- **Two-factor authentication (2FA)** - TOTP with backup codes
- **PDF visual search** - Page-level visual search with thumbnail previews
- **Secure links** - Password-protected sharing with view limits and expiration
- **Calendar integration** - iCal subscription for expiry dates
- **Document version history** with rollback support
- Multi-model AI selection, Admin dashboard, Rate limiting, and more

### v0.6.0 (Coming Soon)
- Browser extension (Chrome Web Clipper)
- Email notifications for expiring documents
- Payment processing integration (Stripe)

### Future Plans
- Deep Search mode (multi-step research)
- ElevenLabs premium audio voices
- Gmail deep integration

---

## Get Started

Ready to try Archevi?

[Start Free Trial](/guide/) | [See Pricing](/pricing/)
