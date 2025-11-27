# Update Documentation

Analyze recent code changes and update the VitePress documentation accordingly.

## Instructions

1. **Check recent changes**:
   - Run `git diff HEAD~5` to see recent changes
   - Identify which files were modified

2. **Determine affected documentation**:
   - API changes → Update `docs/api/`
   - Component changes → Update `docs/api/components/`
   - Feature changes → Update `docs/guide/`
   - Breaking changes → Highlight in docs

3. **Update documentation**:
   - Read current docs to understand existing style
   - Make necessary updates while preserving formatting
   - Add examples where helpful

4. **Validate**:
   - Run `cd docs && pnpm run build` to verify docs build
   - Check that links work

5. **Report**:
   - List what documentation was updated
   - Note any manual updates that may be needed

## Focus Areas

Priority order for documentation updates:
1. API endpoint changes (user-facing)
2. New features (user-facing)
3. Component API changes (developer-facing)
4. Configuration changes
5. Bug fixes that affect behavior

Use the docs-updater agent guidelines from `.claude/agents/docs-updater/agent.md`.
