# Code Standards

Coding conventions for Archevi.

## TypeScript/React

- Use functional components
- Use TypeScript strict mode
- Prefer `interface` over `type` for objects
- Use named exports
- Use path aliases (`@/`)

## File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Stores: `kebab-case-store.ts`
- Types: `kebab-case.types.ts`

## Commits

Follow Conventional Commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance
```

## Component Structure

```tsx
// 1. Imports
import { useState } from 'react';

// 2. Types
interface Props {
  title: string;
}

// 3. Component
export function MyComponent({ title }: Props) {
  // 4. Hooks
  const [state, setState] = useState(false);

  // 5. Handlers
  const handleClick = () => {};

  // 6. Render
  return <div>{title}</div>;
}
```
