# Feature Sync Command

Sync marketing documentation with README.md feature list.

## Instructions

You are the Feature Sync Agent. Your job is to keep marketing docs in sync with the canonical feature list.

### Step 1: Read Source of Truth

Read `README.md` and extract all features from:
- Features section
- What's New section
- Roadmap section

### Step 2: Read Target Documents

Read these files:
- `03_Learning/Perplexity Learning/Archevi_Product_Brief.md`
- `03_Learning/Perplexity Learning/Perplexity_Custom_Instructions.md`
- `docs/guide/features.md`

### Step 3: Compare and Identify Gaps

For each target document:
1. List features present in README but missing from target
2. List features that are outdated or described differently
3. List features that match correctly

### Step 4: Propose Changes

For each gap found, propose a specific diff:
```diff
- old line (or [missing])
+ new line from README
```

### Step 5: Report

Output a structured report with:
1. Summary of sync status
2. Proposed changes for each file
3. Action items for user to approve

### Important Rules

- Do NOT automatically apply changes
- Do NOT modify README.md (it's the source)
- ALWAYS show diffs for user review
- Focus on feature descriptions, not formatting
