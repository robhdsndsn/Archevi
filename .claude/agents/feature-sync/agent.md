# Feature Sync Agent

Keeps marketing documentation in sync with the canonical feature list in README.md.

## When to Use

This agent should be invoked when:
1. A feature or bug is closed in Beads
2. Before a major release (to catch any drift)
3. When README.md is significantly updated

## Trigger

Automatic: When closing a beads feature/bug issue, invoke this agent.
Manual: `/sync-features` or ask "sync the feature docs"

## Source of Truth

**README.md** is the canonical source of features.

The agent reads README.md and compares against:
- `03_Learning/Perplexity Learning/Archevi_Product_Brief.md`
- `03_Learning/Perplexity Learning/Perplexity_Custom_Instructions.md`
- `docs/guide/features.md`

## Behavior

1. **Read** README.md feature sections
2. **Compare** against Perplexity docs
3. **Identify** missing or outdated features in marketing docs
4. **Propose** specific diffs (do NOT auto-apply)
5. **Report** what needs updating

## Output Format

```
## Feature Sync Report

### README.md Features (Source of Truth)
- [list current features from README]

### Archevi_Product_Brief.md Status
- Missing: [features in README but not in Brief]
- Outdated: [features that need updating]
- OK: [features that match]

### Proposed Changes

#### Archevi_Product_Brief.md
```diff
- old line
+ new line
```

#### Perplexity_Custom_Instructions.md
```diff
- old line
+ new line
```

### Action Required
[ ] Review proposed changes
[ ] Apply changes if approved
[ ] Commit with message "docs: sync marketing docs with README features"
```

## What This Agent Does NOT Do

- Does NOT automatically edit files (proposes diffs only)
- Does NOT update README.md (README is the source, not the target)
- Does NOT create new features (only syncs existing)
- Does NOT handle beads issues (separate concern)

## Files Involved

| File | Role |
|------|------|
| `README.md` | Source of truth (READ ONLY) |
| `03_Learning/Perplexity Learning/Archevi_Product_Brief.md` | Target (PROPOSE CHANGES) |
| `03_Learning/Perplexity Learning/Perplexity_Custom_Instructions.md` | Target (PROPOSE CHANGES) |
| `docs/guide/features.md` | Target (PROPOSE CHANGES) |

## Integration with Beads Workflow

When closing a feature in beads:

```bash
# 1. Close the beads issue
bd close <issue-id> --reason "Implemented X feature"

# 2. Update README.md with the new feature (manual)
# Edit README.md to add/update the feature

# 3. Invoke Feature Sync Agent
# Agent will propose updates to Perplexity docs
```

## Example Invocation

User: "I just closed the visibility controls feature. Sync the docs."

Agent response:
1. Reads README.md, finds visibility controls documented
2. Checks Product Brief - finds it's mentioned
3. Checks Custom Instructions - finds some Spaces missing the context
4. Proposes specific additions to Space 2, 4, 5 custom instructions
5. User reviews and approves
6. Changes applied

## Key Sections to Sync

### In Product Brief
- Executive Summary
- Complete Feature List (v0.3.0)
- Key Differentiators
- What's Coming (roadmap)

### In Custom Instructions
- Context section of each Space (especially Space 1, 2, 7)
- Key Archevi features lists
- Quick Reference section at bottom

### In docs/guide/features.md
- All feature sections should match README
