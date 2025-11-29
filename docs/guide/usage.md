# Using Archevi

Learn how to get the most out of your family knowledge base.

## Uploading Documents

### From the Documents View

1. Click **Documents** in the sidebar
2. Click **Upload Document**
3. Fill in the details:
   - **Title**: Give your document a clear name
   - **Category**: Choose from Financial, Medical, Legal, etc.
   - **Content**: Paste the document text, upload a PDF, or record a voice note
4. Click **Upload**

### AI-Enhanced Upload Mode

Toggle **AI Enhanced** mode to unlock smart features:
- **Auto-Categorization** - AI suggests the best category
- **Smart Tags** - Automatically extracts 3-5 relevant tags
- **Expiry Detection** - Finds renewal dates, due dates, policy expirations

### Supported Content

Archevi works with many content types:
- **Text documents** - Medical records, prescriptions, recipes, contracts
- **PDF files** - Automatically extracts text content
- **Scanned documents** - OCR extracts text from images (Tesseract.js)
- **Voice notes** - Record and auto-transcribe with Groq Whisper

::: tip Best Practice
Break large documents into smaller, focused pieces. "Dad's Medical History" is better than "All Family Medical Records".
:::

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

### Viewing Past Conversations

1. Click **Chat History** in the sidebar
2. Browse previous sessions
3. Click to continue any conversation

### Session Management

- Sessions auto-save every few minutes
- Start a new chat by clicking **New Chat**
- Old sessions remain searchable

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
4. Choose role

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

1. Click **Voice Note** in the upload panel
2. Click **Record** and speak your note
3. Click **Stop** when finished
4. Review the transcript
5. Add tags and save

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

## Tags and Filtering

### Tag Cloud

The **Tag Cloud** widget shows all your document tags:
- Click any tag to filter documents
- Larger tags = more documents
- Tags are auto-generated in AI Enhanced mode

### Browsing by Tag

1. Go to **Documents**
2. Use the tag filter dropdown
3. Select one or more tags
4. View matching documents

## Next Steps

- [Explore use cases](/use-cases/)
- [View API documentation](/api/)
- [Set up BYOK for maximum privacy](/guide/byok-setup)
