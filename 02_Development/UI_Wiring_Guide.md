# Family Second Brain - UI Wiring Guide

## Quick Setup (~10-15 minutes)

The app structure already exists. You just need to wire the inputs correctly.

### Access the App Editor
URL: http://localhost/apps/edit/u/admin2/family_second_brain

---

## Step 1: Wire the Button to the RAG Query Script

### 1.1 Select the Button Component
1. In the left panel under **Components**, click on `a` (Button)
2. The right panel should show "Button" configuration

### 1.2 Configure the Runnable Inputs
The button is already connected to `f/chatbot/rag_query`. You need to wire these inputs:

| Input | Type | How to Wire |
|-------|------|-------------|
| `query` | string | Connect to text input `b` value |
| `session_id` | string | Leave empty (auto-generates UUID) |
| `user_email` | string | Optional - can use `ctx.email` |
| `postgres_db` | object | Select resource: `f/chatbot/postgres_db` |
| `cohere_api_key` | string | Select variable: `f/chatbot/cohere_api_key` |

### 1.3 Wire the Query Input
1. Click the **pencil icon** next to `query`
2. Click **Connect** (chain link icon)
3. Select: `b` → `result` (this is the text input's value)
4. The expression should be: `b.result`

### 1.4 Wire the Database Resource
1. Click the **pencil icon** next to `postgres_db`
2. Click the **resource icon** (database symbol)
3. Select: `f/chatbot/postgres_db`

### 1.5 Wire the Cohere API Key
1. Click the **pencil icon** next to `cohere_api_key`
2. Click the **variable icon** ($ symbol)
3. Select: `f/chatbot/cohere_api_key`

---

## Step 2: Display the Response

### 2.1 Replace the Table with Rich Text
The current table (`c` - AgGrid Table) shows dummy data. Replace it with a component to display AI responses.

1. Click on `c` (AgGrid Table) in Components
2. Delete it (right-click → Delete, or press Delete key)
3. From right panel, drag **Rich Text** or **Text** component to the canvas
4. Rename it to `response`

### 2.2 Wire Response Display
1. Select the new text/rich text component
2. In configuration, set the content source to: `a.result.answer`
   - `a` is the button
   - `result` is what the script returns
   - `answer` is the answer field from the RAG response

---

## Step 3: Add Sources Display (Optional)

### 3.1 Add a List Component
1. Drag **List** component below the response
2. Rename it to `sources`

### 3.2 Wire Sources Data
1. Set the list data source to: `a.result.sources`
2. Configure the list item template to show:
   - `item.title` - Document title
   - `item.category` - Category
   - `item.relevance` - Relevance score

---

## Step 4: Improve the Layout

### Suggested Layout Structure:
```
┌─────────────────────────────────────────┐
│           Family Second Brain           │  ← Title (in topbar)
├─────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────┐ │
│ │ Ask a question...       │ │   Ask   │ │  ← Text Input + Button
│ └─────────────────────────┘ └─────────┘ │
├─────────────────────────────────────────┤
│                                         │
│  AI Response appears here...            │  ← Rich Text (answer)
│                                         │
├─────────────────────────────────────────┤
│  Sources:                               │
│  • Recipe Title (recipes) - 0.95        │  ← List (sources)
│  • Document 2 (general) - 0.87          │
└─────────────────────────────────────────┘
```

### UI Improvements:
1. Change button text from "Press me" to "Ask" or "Search"
2. Change text input placeholder from "Type..." to "Ask a question about family knowledge..."
3. Add loading state: The button shows `a.loading` while query runs
4. Add conditional display: Only show response when `a.result` exists

---

## Step 5: Test the App

### 5.1 Add a Test Document First
Before testing queries, add a document via the script:

1. Go to: http://localhost/scripts/get/f/chatbot/embed_document
2. Run with test data:
```json
{
  "title": "Grandma's Apple Pie Recipe",
  "content": "Ingredients: 6 large apples (Granny Smith), 1 cup sugar, 2 tbsp flour, 1 tsp cinnamon, 1/4 tsp nutmeg, 2 pie crusts. Instructions: Preheat oven to 425°F. Peel and slice apples. Mix with sugar, flour, and spices. Place in pie crust, cover with top crust. Bake 45-50 minutes until golden.",
  "category": "recipes",
  "postgres_db": "$res:f/chatbot/postgres_db",
  "cohere_api_key": "$var:f/chatbot/cohere_api_key"
}
```

### 5.2 Test a Query
1. Click **Preview** in the app editor (top right)
2. Type: "How do I make apple pie?"
3. Click the Ask button
4. Verify you get a response with sources

---

## Step 6: Deploy

### 6.1 Save Draft
- Click **Draft** (Ctrl+S) to save your changes

### 6.2 Deploy the App
- Click **Deploy** (green button, top right)
- The app will be available at: http://localhost/apps/get/u/admin2/family_second_brain

### 6.3 Share with Family
- Create user accounts for family members in Windmill
- Share the app URL
- They can access via: http://localhost/apps/get/u/admin2/family_second_brain

---

## Troubleshooting

### "Failed to fetch" Error
- Check that `postgres_db` resource is wired correctly
- Check that `cohere_api_key` variable is wired correctly
- Verify Windmill workers are running: `docker ps | grep windmill`

### No Results Returned
- Ensure documents exist in the database
- Check the PostgreSQL connection from Windmill to family-brain-db
- The containers must be on the same Docker network

### Script Errors
- Check Debug runs panel (top toolbar)
- View job logs for detailed error messages

---

## Expression Reference

Common expressions you'll use:

| Expression | Description |
|------------|-------------|
| `b.result` | Text input value |
| `a.result` | Button script result (full response) |
| `a.result.answer` | AI-generated answer |
| `a.result.sources` | Array of source documents |
| `a.result.confidence` | Confidence score (0-1) |
| `a.result.session_id` | Session ID for conversation |
| `a.loading` | True while script is running |
| `ctx.email` | Current user's email |

---

## Next Steps After UI is Working

1. **Add Document Upload Modal**
   - Add Modal component
   - Add form fields: title, content, category dropdown
   - Connect to `f/chatbot/embed_document` script

2. **Add Conversation History**
   - Add Background Runnable for `f/chatbot/get_conversation_history`
   - Display in a sidebar or collapsible panel

3. **Styling**
   - Customize colors, fonts, spacing
   - Add loading spinners
   - Make it mobile-responsive

---

**Created:** 2025-11-26
**For:** FamilySecondBrain Phase 4 UI Construction
