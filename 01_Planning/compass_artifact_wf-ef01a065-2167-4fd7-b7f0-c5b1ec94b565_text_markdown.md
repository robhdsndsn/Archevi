# Optimal Windows development setup for React + Windmill chatbot

**VSCode with Claude Code CLI is the best setup for your family "second brain" chatbot.** Use Vite for lightning-fast development, shadcn/ui for the chat interface, and v0.dev to rapidly prototype UI components before refining with Claude Code. This combination delivers exceptional developer experience on Windows with TypeScript throughout—the right choice for a project connecting to Windmill's RAG backend.

The development stack I recommend prioritizes speed of iteration and AI-assisted workflows: **fnm** for Node version management, **pnpm** for package management, **Zustand** for conversation state, and **MSW** for mocking Windmill API locally. Deploy to Vercel or Cloudflare Pages with automatic PR previews.

---

## Claude Code works natively on Windows without WSL

Claude Code is Anthropic's **CLI-based agentic coding tool** that runs in your terminal and understands entire codebases. As of 2025, it supports native Windows installation—no WSL required.

**Installation via PowerShell:**
```powershell
# Install Claude Code natively
irm https://claude.ai/install.ps1 | iex

# Or via npm if Node.js is installed
npm install -g @anthropic-ai/claude-code
```

The official **VS Code extension** (currently in beta) adds a graphical panel with inline diffs and plan mode. Access it via the Spark icon in your sidebar after installing from the VS Code Marketplace.

**Critical limitation:** Claude Code generates code but doesn't provide real-time UI preview. You'll run `npm run dev` alongside Claude Code sessions, watching changes hot-reload in your browser. The workflow is: describe → Claude generates → save → see result in browser → iterate.

For React component generation, Claude Code excels at creating JSX with hooks, TypeScript interfaces, Tailwind styling, and comprehensive tests. Example workflow:
```bash
cd my-chatbot
claude
> "Create a ChatMessage component with user/assistant variants, markdown rendering, and syntax highlighting. Use Tailwind CSS and shadcn/ui Card."
```

Claude Code vs **Cursor IDE**: Use both together. Claude Code handles architecture decisions, multi-file refactoring, and autonomous tasks from the terminal. Cursor provides real-time autocomplete and inline suggestions while coding. Claude Code runs perfectly inside Cursor's integrated terminal.

---

## The fastest local dev setup with hot reload

**Vite wins decisively** over Create React App (essentially deprecated) and Next.js (unnecessary SSR overhead for your SPA). Vite delivers ~50ms hot module replacement versus 20-30 second startup times with CRA.

**Complete project initialization:**
```bash
# Install fnm (fast Node version manager)
winget install Schniz.fnm

# Configure PowerShell for auto-switching
fnm env --use-on-cd | Out-String | Invoke-Expression

# Install pnpm globally
npm install -g pnpm

# Create Vite React TypeScript project
pnpm create vite@latest family-chatbot -- --template react-ts
cd family-chatbot

# Install core dependencies
pnpm add zustand react-markdown react-syntax-highlighter react-dropzone remark-gfm
pnpm add -D @types/react-syntax-highlighter tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Initialize shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card scroll-area avatar

# Start development server
pnpm dev
```

**Why pnpm over npm/yarn?** It's **2-3x faster** and saves gigabytes of disk space through symlinks. Windows-specific gotcha: enable long paths with `git config --system core.longpaths true`.

---

## AI tools design chat interfaces before you write code

**v0.dev by Vercel** is the fastest path to a chat UI. It generates React components using shadcn/ui and Tailwind CSS—exactly your stack—from natural language prompts.

**Effective prompt for your chatbot:**
```
Create a ChatGPT-style chat interface with:
- Left sidebar with conversation history list
- Main chat area with user/assistant message bubbles
- Markdown rendering with code syntax highlighting
- Input bar with send button and file attachment icon
- Typing indicator animation
- Dark mode support
- Use shadcn/ui Card, Button, Input, ScrollArea
- Tailwind CSS for all styling
```

Export directly to your project: `npx v0 add [component-id]` pulls the generated code into your codebase. The free tier provides **$5 monthly credits**—sufficient for prototyping multiple chat layouts.

**bolt.new** differs by generating full-stack applications in-browser. Use it if you want to prototype the complete React + API structure, then export the ZIP and refine locally. It supports Supabase integration if you later want real-time features beyond Windmill.

**Recommended workflow:**
1. Design core UI in v0.dev (10-30 minutes)
2. Export via CLI to local project
3. Refine with Claude Code for business logic and Windmill integration
4. Use Cursor for daily coding and autocomplete

---

## Chat UI components that work with AI-assisted development

**shadcn/ui** is ideal because components live in your codebase (not node_modules), giving Claude Code full access to modify them. For dedicated chat primitives, **@chatscope/chat-ui-kit-react** provides battle-tested components:

```tsx
import {
  MainContainer, ChatContainer, MessageList,
  Message, MessageInput, TypingIndicator
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

function ChatInterface() {
  const { messages, isTyping, sendMessage } = useChatStore();
  
  return (
    <MainContainer>
      <ChatContainer>
        <MessageList typingIndicator={isTyping && <TypingIndicator />}>
          {messages.map(msg => (
            <Message 
              key={msg.id}
              model={{ 
                message: msg.content, 
                sender: msg.role,
                direction: msg.role === 'user' ? 'outgoing' : 'incoming' 
              }} 
            />
          ))}
        </MessageList>
        <MessageInput placeholder="Ask anything..." onSend={sendMessage} />
      </ChatContainer>
    </MainContainer>
  );
}
```

**Markdown rendering** is essential for RAG responses with code blocks:

```tsx
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const ChatMessage = ({ content }: { content: string }) => (
  <Markdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ inline, className, children }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter style={oneDark} language={match[1]}>
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className}>{children}</code>
        );
      }
    }}
  >
    {content}
  </Markdown>
);
```

**Zustand** manages conversation state with minimal boilerplate:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatStore {
  messages: Message[];
  isTyping: boolean;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  setTyping: (typing: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isTyping: false,
      addMessage: (msg) => set((state) => ({
        messages: [...state.messages, {
          ...msg,
          id: crypto.randomUUID(),
          timestamp: new Date()
        }]
      })),
      setTyping: (isTyping) => set({ isTyping }),
      clearChat: () => set({ messages: [] })
    }),
    { name: 'chat-storage' }
  )
);
```

---

## Windmill API integration patterns for React

Windmill exposes every script as REST endpoints. For your RAG chatbot, use **synchronous endpoints** for quick queries and **SSE streaming** for longer responses.

**Type-safe Windmill client:**

```typescript
// src/lib/windmill-client.ts
const WINDMILL_URL = import.meta.env.VITE_WINDMILL_URL;
const WINDMILL_TOKEN = import.meta.env.VITE_WINDMILL_TOKEN;
const WORKSPACE = import.meta.env.VITE_WINDMILL_WORKSPACE;

export class WindmillClient {
  async runScript<TArgs, TResult>(
    scriptPath: string,
    args: TArgs
  ): Promise<TResult> {
    const response = await fetch(
      `${WINDMILL_URL}/api/w/${WORKSPACE}/jobs/run_wait_result/p/${scriptPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WINDMILL_TOKEN}`,
        },
        body: JSON.stringify(args),
      }
    );
    
    if (!response.ok) throw new Error(`Windmill error: ${response.status}`);
    return response.json();
  }

  async runAsync(scriptPath: string, args: unknown): Promise<string> {
    const response = await fetch(
      `${WINDMILL_URL}/api/w/${WORKSPACE}/jobs/run/p/${scriptPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WINDMILL_TOKEN}`,
        },
        body: JSON.stringify(args),
      }
    );
    return response.json(); // Returns job UUID
  }
}

export const windmill = new WindmillClient();
```

**Chat query hook with SSE for streaming responses:**

```typescript
// src/hooks/useChatQuery.ts
export function useChatQuery() {
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const addMessage = useChatStore(s => s.addMessage);
  const setTyping = useChatStore(s => s.setTyping);

  const sendQuery = async (query: string) => {
    setIsLoading(true);
    setTyping(true);
    addMessage({ content: query, role: 'user' });
    
    try {
      // Start async job
      const jobId = await windmill.runAsync('f/rag/chat_query', { query });
      
      // Connect to SSE for streaming updates
      const eventSource = new EventSource(
        `${WINDMILL_URL}/api/w/${WORKSPACE}/jobs_u/getupdate_sse/${jobId}?token=${WINDMILL_TOKEN}`
      );
      
      eventSource.onmessage = (event) => {
        const update = JSON.parse(event.data);
        if (update.new_result_stream) {
          setStreamingText(prev => prev + update.new_result_stream);
        }
        if (update.completed) {
          addMessage({ content: update.job.result.response, role: 'assistant' });
          eventSource.close();
          setIsLoading(false);
          setTyping(false);
        }
      };
    } catch (error) {
      setIsLoading(false);
      setTyping(false);
    }
  };

  return { sendQuery, streamingText, isLoading };
}
```

**Environment configuration** (create `.env.local`, never commit):
```env
VITE_WINDMILL_URL=https://your-windmill-instance.com
VITE_WINDMILL_TOKEN=your_token_here
VITE_WINDMILL_WORKSPACE=your_workspace
```

⚠️ **Security warning:** `VITE_` prefixed variables are exposed in the browser bundle. For production, route requests through a serverless proxy function (Vercel/Netlify Edge Functions) that keeps the token server-side.

---

## Mock Windmill API locally with MSW

**MSW (Mock Service Worker)** intercepts network requests at the browser level, enabling realistic testing without hitting your Windmill backend.

**Setup:**
```bash
pnpm add -D msw
npx msw init public/ --save
```

**Mock handlers for Windmill endpoints:**

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

const WINDMILL_URL = import.meta.env.VITE_WINDMILL_URL;

export const handlers = [
  // Mock sync job execution
  http.post(`${WINDMILL_URL}/api/w/:workspace/jobs/run_wait_result/*`, async ({ request }) => {
    await delay(500); // Simulate network latency
    const body = await request.json();
    
    return HttpResponse.json({
      response: `Mock RAG response to: "${body.query}"`,
      sources: [
        { title: 'Family Recipe Book', relevance: 0.92 },
        { title: 'Travel Planning Notes', relevance: 0.78 }
      ]
    });
  }),

  // Mock async job submission
  http.post(`${WINDMILL_URL}/api/w/:workspace/jobs/run/*`, async () => {
    return HttpResponse.json('mock-job-' + Date.now());
  }),
];
```

**Enable in development:**

```typescript
// src/main.tsx
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});
```

Set `VITE_ENABLE_MSW=true` in `.env.development` to activate mocking.

---

## Project structure separating UI from API logic

```
src/
├── api/
│   └── windmill/
│       ├── client.ts          # Windmill API client class
│       ├── hooks.ts           # React hooks (useChatQuery, useDocumentUpload)
│       └── types.ts           # TypeScript interfaces for API
│
├── components/
│   ├── ui/                    # shadcn/ui components (auto-generated)
│   └── chat/
│       ├── ChatContainer.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       ├── TypingIndicator.tsx
│       └── FileUpload.tsx
│
├── store/
│   └── chat-store.ts          # Zustand store
│
├── mocks/
│   ├── handlers.ts
│   ├── browser.ts
│   └── server.ts
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## TypeScript is the clear choice for this project

TypeScript provides **type safety for Windmill API responses**, catches errors at compile time, and enables better autocomplete in Claude Code and Cursor. Define interfaces matching your Windmill scripts:

```typescript
// src/api/windmill/types.ts
export interface ChatQueryArgs {
  query: string;
  conversation_id?: string;
  max_tokens?: number;
}

export interface ChatQueryResult {
  response: string;
  sources: Array<{
    document_id: string;
    title: string;
    relevance_score: number;
  }>;
  tokens_used: number;
}

export interface IngestDocumentArgs {
  filename: string;
  content_base64: string;
  content_type: string;
}
```

---

## Testing strategy with Vitest and Playwright

**Vitest** (not Jest) for unit tests—it's 10-20x faster with native Vite integration:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**Playwright** for E2E tests (better Windows support than Cypress):

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('sends message and receives AI response', async ({ page }) => {
  await page.route('**/jobs/run_wait_result/**', route => 
    route.fulfill({ json: { response: 'Test response' } })
  );
  
  await page.goto('/');
  await page.fill('[data-testid="chat-input"]', 'What is RAG?');
  await page.click('[data-testid="send-button"]');
  
  await expect(page.locator('[data-testid="ai-response"]')).toContainText('Test response');
});
```

---

## Deploy to Vercel with automatic previews

**Vercel** offers the best developer experience for React apps: instant preview deployments on every PR, automatic HTTPS, and environment variable management.

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy from project root
vercel
```

Configure environment variables in Vercel dashboard (Settings → Environment Variables). For production security, create a Vercel Edge Function as a proxy:

```typescript
// api/windmill/[...path].ts (Vercel serverless function)
export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const windmillPath = url.pathname.replace('/api/windmill', '');
  
  const response = await fetch(`${process.env.WINDMILL_URL}${windmillPath}`, {
    method: request.method,
    headers: {
      'Authorization': `Bearer ${process.env.WINDMILL_TOKEN}`, // Server-side only
      'Content-Type': 'application/json',
    },
    body: request.body,
  });
  
  return response;
}
```

**Alternative: Cloudflare Pages** if you want the fastest global CDN with unlimited free bandwidth.

---

## Conclusion

The optimal Windows development setup combines **VS Code + Claude Code CLI** for AI-assisted coding, **Vite** for sub-100ms hot reload, and **v0.dev** for rapid UI prototyping. Your chat interface should use **shadcn/ui components** (or @chatscope for faster implementation) with **Zustand** managing conversation state. Connect to Windmill via typed REST endpoints, using **SSE streaming** for real-time RAG responses.

Key workflow: Design in v0.dev → Export to local project → Refine with Claude Code → Test with MSW mocks → Deploy to Vercel. This setup maximizes iteration speed while maintaining type safety throughout the Windmill integration.

Start with `pnpm create vite@latest family-chatbot -- --template react-ts`, install the core dependencies listed above, and generate your initial chat layout in v0.dev. You'll have a functional prototype connecting to Windmill within a few hours.