# Using Archevi

Learn how to get the most out of your family knowledge base.

## Uploading Documents

### From the Add Document Tab

1. Click **Add** in the sidebar or use the quick access button
2. Choose your input method:
   - **Upload File** - Drag & drop or select a PDF/image
   - **Voice Note** - Record or upload audio to transcribe
3. Fill in the details:
   - **Title**: Give your document a clear name
   - **Category**: Choose from Financial, Medical, Legal, etc. (remembers your last choice!)
   - **Assigned To**: Optionally assign to a specific family member
   - **Visibility**: Control who can see this document
   - **Content**: Paste text, upload a PDF, or record audio
4. Click **Upload**

### Smart Features

Archevi automatically enhances your uploads:
- **Auto-Categorization** - AI suggests the best category
- **Smart Tags** - Automatically extracts 3-5 relevant tags
- **Expiry Detection** - Finds renewal dates, due dates, policy expirations
- **Duplicate Detection** - Warns if you're uploading something that already exists
- **Smart Defaults** - Remembers your most-used category

### Document Visibility

Control who can see each document:

| Visibility | Who Can See |
|------------|-------------|
| **Everyone** | All family members |
| **Adults Only** | Adults and Admins only |
| **Admins Only** | Family administrators only |
| **Private** | Only the assigned person and admins |

### Person Assignment

Assign documents to specific family members:
- Medical records to specific person (Mom's prescription, Dad's lab results)
- School documents to specific child
- Employment docs to working parent
- Personal IDs and passports per person

This enables queries like "Show me all of Sarah's documents".

### Supported Content

Archevi works with many content types:
- **Text documents** - Medical records, prescriptions, recipes, contracts
- **PDF files** - Automatically extracts text content
- **Scanned documents** - OCR extracts text from images (Tesseract.js)
- **Voice notes** - Record and auto-transcribe with Groq Whisper (80+ languages)
- **Photos** - Use the PWA camera feature on mobile

::: tip Best Practice
Break large documents into smaller, focused pieces. "Dad's Medical History" is better than "All Family Medical Records".
:::

### Success Feedback

After uploading:
- View your newly uploaded document immediately
- Or click "Upload Another" to continue adding documents
- Your category preference is saved for faster future uploads

## Asking Questions

### Natural Language Queries

Just type your question like you'd ask a family member:

- "What are mom's current medications?"
- "Where did we put the insurance claim from last year?"
- "What's the recipe for grandma's apple pie?"
- "When does our car insurance expire?"

### Query Tips

**Be specific** - "What are dad's allergies?" is better than "Medical info"

**Ask about recent documents** - The AI considers document relevance and recency

**Follow up** - Ask clarifying questions in the same chat session

## Managing Chat History

### AI Workflow Visualization

When you ask a question, watch the AI work in real-time:
1. **Searching documents** - Querying your knowledge base
2. **Analyzing context** - Extracting relevant passages
3. **Generating response** - Formulating your answer

Each step shows progress so you know exactly what's happening.

### Viewing Past Conversations

1. Click **Chat History** in the sidebar
2. Browse previous sessions
3. Click to continue any conversation

### Session Management

- Sessions auto-save every few minutes
- Start a new chat by clicking **New Chat**
- Old sessions remain searchable

### Export to PDF

Save your conversations for reference:
1. Open any chat session with messages
2. Click **Export PDF** in the header
3. A print-friendly version opens
4. Save as PDF or print

Exports include:
- Full conversation with timestamps
- Source citations for each answer
- Relevance scores and categories

## Category Organization

Documents are organized into categories:

| Category | Examples |
|----------|----------|
| Financial | Bank statements, tax returns, investments |
| Medical | Prescriptions, lab results, doctor notes |
| Legal | Wills, contracts, property deeds |
| Insurance | Policies, claims, coverage details |
| Education | Transcripts, certifications, courses |
| Personal | Recipes, photos, family stories |

## Search Tips

### Finding Specific Documents

Use the **Search** feature to find documents by:
- Title keywords
- Content keywords
- Category filter
- Date range

### Understanding AI Responses

When you ask a question, Archevi:
1. Searches your document library
2. Finds relevant passages
3. Generates an answer using AI
4. Shows source citations

Click on **Sources** to see which documents were used.

## Family Members

### Adding Members

Owners and Admins can invite family members:
1. Go to **Family Members**
2. Click **Invite Member**
3. Enter email address
4. Choose role and member type

### Role Permissions

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| View documents | Yes | Yes | Yes | Yes |
| Upload documents | Yes | Yes | Yes | No |
| Delete documents | Yes | Yes | No | No |
| Manage members | Yes | Yes | No | No |
| View analytics | Full | Full | Limited | No |
| Billing access | Yes | No | No | No |
| Delete family | Yes | No | No | No |

### Member Types

Control document visibility by member type:

| Member Type | Can View Documents With Visibility |
|-------------|-----------------------------------|
| **Admin** | All documents (Everyone, Adults Only, Admins Only, Private) |
| **Adult** | Everyone, Adults Only |
| **Teen** | Everyone only |
| **Child** | Everyone only |

::: tip Privacy for Sensitive Documents
Use "Adults Only" for financial documents, "Admins Only" for legal matters, and "Private" for personal medical records.
:::

### Multi-Family Support

Users can belong to multiple families with different roles in each:

- **Switch families** using the family selector in the sidebar
- **Different roles** - You might be an Owner of your own family and a Member of your parents' family
- **Separate data** - Each family's documents and chats are completely isolated

Use cases:
- Adult children helping elderly parents
- Blended families with separate knowledge bases
- Professional organizers managing multiple clients

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + /` | Toggle sidebar |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |

## Voice Notes

Record voice memos and have them automatically transcribed:

### Recording

1. Go to **Add** > **Voice Note**
2. Tap the large **Record** button (optimized for mobile)
3. Speak your note clearly
4. Tap **Stop** when finished
5. Review the transcript
6. Optionally add a title
7. Click **Transcribe & Save**

### Mobile-Optimized Experience

- **Large touch targets** - Easy to tap on any device
- **Visual feedback** - Pulsing indicator while recording
- **Playback controls** - Review before saving
- **Delete option** - Start over if needed

### Upload Existing Audio

Already have an audio file?
1. Click **Upload audio file**
2. Select your WAV, MP3, M4A, or WebM file
3. Transcription starts automatically

Voice notes are transcribed using Groq Whisper (80+ languages supported) and become fully searchable in your knowledge base.

## Expiry Alerts

Never miss an important deadline again:

### Viewing Expiring Documents

1. Check the **Expiry Alerts** widget on your dashboard
2. Documents are grouped by urgency:
   - **Urgent** - Expires in 7 days or less
   - **Soon** - Expires in 8-30 days
   - **Upcoming** - Expires in 31-90 days

### How Expiry Detection Works

When you upload documents with AI Enhanced mode, Archevi automatically detects:
- Policy renewal dates
- Document expiration dates
- Due dates and deadlines
- Subscription renewals

## Browsing Documents

### View Modes

Switch between viewing styles:
- **Grid View** - Card layout with previews
- **Table View** - Sortable columns for power users

### Quick Preview

Hover over any document to see:
- Category and visibility badges
- Content preview snippet
- Date and assigned person
- Click to open full details

### Bulk Operations

Select multiple documents at once:
1. Click checkboxes to select
2. Use "Select All" for the current page
3. Click **Delete Selected** for bulk removal

### Filtering Options

Find documents quickly with advanced filters:
- **Category** - Filter by document type
- **Person** - Show only documents assigned to specific family member
- **Date Range** - Filter by upload date
- **Search** - Full-text search across titles and content

### Context Menu

Right-click any document for quick actions:
- View details
- Edit document
- Delete document

## Tags and Filtering

### Tag Cloud

The **Tag Cloud** widget shows all your document tags:
- Click any tag to filter documents
- Larger tags = more documents
- Tags are auto-generated in AI Enhanced mode

### Browsing by Tag

1. Go to **All Docs**
2. Use the tag filter dropdown
3. Select one or more tags
4. View matching documents

## Mobile PWA

### Installing the App

Add Archevi to your home screen:

**iOS Safari:**
1. Open archevi.ca
2. Tap the Share button
3. Tap "Add to Home Screen"

**Android Chrome:**
1. Open archevi.ca
2. Tap the menu (three dots)
3. Tap "Add to Home screen"

### Camera Scanning

Use your phone's camera to capture documents:
1. Open the PWA on mobile
2. Go to **Add** > **Upload File**
3. Select "Take Photo" when prompted
4. Snap a picture of your document
5. OCR extracts the text automatically

## Next Steps

- [Explore use cases](/use-cases/)
- [View API documentation](/api/)
- [Set up BYOK for maximum privacy](/guide/byok-setup)
