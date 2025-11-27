# Documentation Updater Agent

## Purpose
Automatically update VitePress documentation based on code changes in the Archevi project.

## When to Use
- After implementing new features
- After modifying API endpoints
- After changing component interfaces
- After updating configuration
- After significant bug fixes

## Capabilities

### 1. API Documentation
Update `docs/api/` based on:
- Windmill script changes in `scripts/`
- API client changes in `frontend/src/api/`

### 2. Component Documentation
Update `docs/api/components/` based on:
- Component changes in `frontend/src/components/`
- Store changes in `frontend/src/store/`

### 3. User Guides
Update `docs/guide/` based on:
- Feature additions/changes
- UI modifications
- Configuration options

## Workflow

### Step 1: Analyze Changes
Read the modified files to understand:
- What functionality changed
- What documentation is affected
- What examples need updating

### Step 2: Update Documentation
For each affected doc:
1. Read current documentation
2. Identify what needs changing
3. Update while preserving style
4. Add new sections if needed

### Step 3: Validate
```bash
cd docs
pnpm run build
```

### Step 4: Commit
```bash
git add docs/
git commit -m "docs: auto-update from code changes"
```

## Documentation Locations

| Code Location | Documentation |
|---------------|---------------|
| `scripts/*.py` | `docs/api/windmill-endpoints.md` |
| `frontend/src/api/` | `docs/api/frontend-api.md` |
| `frontend/src/components/` | `docs/api/components/` |
| `frontend/src/store/` | `docs/api/components/` |
| Features/UI | `docs/guide/usage.md` |
| Setup changes | `docs/guide/installation.md` |

## Templates

### API Parameter
```markdown
| `paramName` | string | Yes | Description of parameter |
```

### Component Prop
```markdown
| `propName` | `PropType` | `default` | Description |
```

## Safety Rules

1. **Never delete** existing documentation without explicit instruction
2. **Always verify** code behavior before documenting
3. **Always test** build before committing
4. **Preserve** existing style and formatting
5. **Ask user** before major structural changes

## Example Usage

```
Update the API docs - the rag_query endpoint now accepts a 'temperature' parameter
```

```
Document the new Analytics view that was just added
```

```
Update the installation guide with the new Docker requirements
```
