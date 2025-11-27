# Frontend API Client

The frontend includes a TypeScript API client for interacting with Windmill.

## Installation

The API client is included in the frontend package:

```typescript
import { windmill } from '@/api/windmill';
```

## Usage

### Query Documents

```typescript
const response = await windmill.query({
  query: "What are mom's allergies?",
  conversationId: 'conv-123' // optional
});

console.log(response.answer);
console.log(response.sources);
```

### Upload Document

```typescript
await windmill.uploadDocument({
  title: 'Medical Records',
  content: 'Document content...',
  category: 'medical'
});
```

### Search Documents

```typescript
const results = await windmill.searchDocuments({
  query: 'insurance',
  category: 'insurance',
  limit: 20
});
```

### Get Analytics

```typescript
const analytics = await windmill.getAnalytics('week');
console.log(analytics.usage.totals);
```

## API Reference

### `windmill.query(params)`

Query documents using RAG.

**Parameters:**
- `query: string` - The question to ask
- `conversationId?: string` - Optional conversation ID for context

**Returns:** `Promise<QueryResponse>`

```typescript
interface QueryResponse {
  answer: string;
  sources: Source[];
  conversationId: string;
}
```

### `windmill.uploadDocument(params)`

Upload a new document.

**Parameters:**
- `title: string` - Document title
- `content: string` - Document content
- `category: DocumentCategory` - Category

**Returns:** `Promise<UploadResponse>`

### `windmill.searchDocuments(params)`

Search documents by keyword.

**Parameters:**
- `query?: string` - Search query
- `category?: DocumentCategory` - Filter by category
- `limit?: number` - Max results
- `offset?: number` - Pagination offset

**Returns:** `Promise<SearchResponse>`

### `windmill.getAnalytics(period)`

Get usage analytics.

**Parameters:**
- `period: 'day' | 'week' | 'month' | 'all'`

**Returns:** `Promise<AnalyticsData>`

## Types

```typescript
type DocumentCategory =
  | 'financial'
  | 'medical'
  | 'legal'
  | 'insurance'
  | 'education'
  | 'personal';

interface Source {
  documentId: string;
  title: string;
  relevanceScore: number;
  snippet: string;
}

interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  createdAt: string;
  preview: string;
}
```

## Error Handling

```typescript
try {
  const response = await windmill.query({ query: '...' });
} catch (error) {
  if (error instanceof WindmillError) {
    console.error(error.code, error.message);
  }
}
```

## Configuration

The API client is configured via environment variables:

```env
VITE_WINDMILL_API_URL=http://localhost/api/w/archevi
VITE_WINDMILL_TOKEN=your_token_here
```

Or configure programmatically:

```typescript
import { configureWindmill } from '@/api/windmill';

configureWindmill({
  baseUrl: 'https://your-instance.com/api/w/archevi',
  token: 'your-token'
});
```
