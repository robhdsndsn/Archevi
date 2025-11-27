# Component API Reference

This section contains documentation for Archevi's React components.

::: info Auto-Generated
This documentation can be auto-generated from TypeScript using TypeDoc. Run `pnpm docs:api` in the frontend directory to regenerate.
:::

## Core Components

### Chat Components

- **ChatContainer** - Main chat interface
- **ChatInput** - Message input with auto-resize
- **ChatMessage** - Individual message display
- **SourcesList** - Document sources display

### Document Components

- **DocumentsView** - Document browser and manager
- **DocumentUpload** - Upload interface
- **DocumentBrowser** - Search and filter documents

### Analytics Components

- **AnalyticsView** - Usage dashboard
- **StatCard** - Metric display cards

### Navigation Components

- **AppSidebar** - Main navigation sidebar
- **NavUser** - User dropdown menu
- **CommandPalette** - Quick actions (Cmd+K)

## UI Components

Archevi uses [shadcn/ui](https://ui.shadcn.com) components:

- Button, Input, Label
- Card, Badge, Avatar
- Dialog, Dropdown Menu
- Sidebar, Tabs
- And more...

See the [shadcn/ui documentation](https://ui.shadcn.com/docs/components) for detailed API reference.

## State Management

### Auth Store

```typescript
import { useAuthStore } from '@/store/auth-store';

const { user, isAuthenticated, login, logout } = useAuthStore();
```

### Chat Store

```typescript
import { useChatStore } from '@/store/chat-store';

const { messages, sessions, sendMessage, switchSession } = useChatStore();
```

## Hooks

### useTheme

```typescript
const { isDark, toggleTheme } = useTheme();
```

### useSidebar

```typescript
const { isOpen, toggle, isMobile } = useSidebar();
```

## Generating Full API Docs

To generate complete API documentation from TypeScript:

```bash
cd frontend
pnpm add -D typedoc typedoc-plugin-markdown
pnpm docs:api
```

This will generate markdown files in this directory automatically.
