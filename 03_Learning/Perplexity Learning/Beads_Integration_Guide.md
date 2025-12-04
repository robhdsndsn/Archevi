# Beads Integration for Perplexity Workflow

This guide explains how to use **Beads (bd)** task management alongside your Perplexity Spaces & Labs execution.

**Why Beads instead of CSV tracking?**
- Proper task dependencies and workflow
- Command-line tracking (`bd list`, `bd show`, `bd ready`)
- Status updates with notes and blockers
- Better for iterative work (vs static spreadsheet)

---

## Task Hierarchy Created

I've created a full task hierarchy in Beads for your Perplexity execution:

```
FamilySecondBrain-eo9 (Epic): Perplexity Launch Execution
├── FamilySecondBrain-ocy: Phase 1 - Setup 8 Spaces
│   └── FamilySecondBrain-636: Phase 2 - Run P0 queries
│       ├── FamilySecondBrain-592: Lab 1 - Competitive Dashboard
│       ├── FamilySecondBrain-jla: Lab 2 - Voice of Customer Toolkit
│       ├── FamilySecondBrain-0mh: Lab 3 - 8-Week Launch Campaign (CRITICAL)
│       ├── FamilySecondBrain-chv: Lab 5 - Content Marketing System
│       └── FamilySecondBrain-htl: Lab 6 - Pricing Strategy Toolkit
│           ├── FamilySecondBrain-35l: Lab 4 - Partnership Outreach Kit
│           ├── FamilySecondBrain-1mt: Lab 7 - Technical Messaging Kit
│           └── FamilySecondBrain-dxo: Lab 8 - Market Timing Toolkit
```

**Task Count:**
- 1 Epic
- 10 Tasks (3 foundation, 5 P0 Labs, 2 P1 Labs)

---

## Quick Start: Using Beads

### 1. Check What's Ready to Work On
```bash
bd ready --priority 1
```

This shows tasks with no blockers (P0 tasks first).

**Expected output:**
```
FamilySecondBrain-ocy: Phase 1 - Setup 8 Perplexity Spaces
  Priority: 1 | Type: task | Status: open
  Time: 2-3 hours
```

### 2. Start Working on a Task
```bash
bd update FamilySecondBrain-ocy --status in_progress --assignee "YourName"
```

### 3. Add Progress Notes as You Work
```bash
bd update FamilySecondBrain-ocy --notes "Completed Spaces 1-4 (Competitive Intelligence, Market Intelligence, Launch Platform Research, Partnerships). Uploaded all files and set custom instructions. Test queries passed. Space 5-8 next session."
```

### 4. Complete a Task
```bash
bd close FamilySecondBrain-ocy --reason "All 8 Spaces created and validated. Test queries successful."
```

This automatically unblocks dependent tasks (Phase 2 will become ready).

### 5. View Task Details
```bash
bd show FamilySecondBrain-0mh
```

Shows full description, dependencies, notes for Lab 3 (8-Week Launch Campaign).

---

## Workflow by Phase

### Phase 1: Foundation Setup (Week 1)

**Start:**
```bash
bd ready --priority 1
# Shows: FamilySecondBrain-ocy (Phase 1 - Setup 8 Spaces)

bd update FamilySecondBrain-ocy --status in_progress
```

**As you work, add notes for each Space:**
```bash
# After completing Space 1
bd update FamilySecondBrain-ocy --notes "Space 1 (Competitive Intelligence): Created, 3 files uploaded, custom instructions set, test query passed."

# After completing Space 2
bd update FamilySecondBrain-ocy --notes "Space 2 (Market Intelligence): Created, 3 files uploaded, custom instructions set, test query passed."

# Continue for Spaces 3-8
```

**When all 8 Spaces done:**
```bash
bd close FamilySecondBrain-ocy --reason "All 8 Spaces created with files and custom instructions. All test queries validated."
```

---

### Phase 2: P0 Queries (Week 1-2)

**Start:**
```bash
bd ready --priority 1
# Shows: FamilySecondBrain-636 (Phase 2 - Run P0 queries)

bd update FamilySecondBrain-636 --status in_progress
```

**Track query completion in notes:**
```bash
# After each query
bd update FamilySecondBrain-636 --notes "Completed queries:
1. ✅ Competitive positioning matrix → Saved to Outputs/Competitive_Positioning_Matrix.md
2. ✅ Market gap analysis → Saved to Outputs/Market_Gap_Analysis.md
3. ✅ Top 10 pain points → Saved to Outputs/Top_10_Pain_Points.md
4. [ ] ProductHunt timeline (next)
5. [ ] Blog topics analysis
... (continue list)"
```

**When all P0 queries done:**
```bash
bd close FamilySecondBrain-636 --reason "All 10 P0 queries complete. Outputs saved to 03_Learning/Perplexity Learning/Outputs/"
```

This unblocks all 5 P0 Labs deliverables.

---

### Phase 3: Critical Labs Deliverables (Week 2-3)

**Check what's ready:**
```bash
bd ready --priority 1
# Shows 5 P0 Labs tasks (all became ready after Phase 2 closed)
```

**Work on Labs in parallel** (run multiple Labs sessions simultaneously):

**Lab 1:**
```bash
bd update FamilySecondBrain-592 --status in_progress
# Open Space 1, click Labs, paste Lab 1 prompt, wait 15-20 min
bd update FamilySecondBrain-592 --notes "Labs generation started, waiting 15-20 min"
# After completion
bd close FamilySecondBrain-592 --reason "Competitive dashboard complete. Feature matrix, pricing chart, positioning deck downloaded."
```

**Lab 2:**
```bash
bd update FamilySecondBrain-jla --status in_progress
# Open Space 2, click Labs, paste Lab 2 prompt
bd update FamilySecondBrain-jla --notes "Labs generation started for Voice of Customer toolkit"
# After completion
bd close FamilySecondBrain-jla --reason "Messaging toolkit complete. Landing copy (3 versions), ads (9), emails (6) ready."
```

**Lab 3 (MOST IMPORTANT):**
```bash
bd update FamilySecondBrain-0mh --status in_progress --notes "Starting 8-week launch campaign generation (longest prompt, 20-30 min wait)"
# After completion
bd close FamilySecondBrain-0mh --reason "Master launch plan complete. Gantt chart, checklists, 20+ media contacts, budget tracker ready. Imported to project management tool."
```

**Continue for Labs 5 and 6.**

---

### Phase 4: Supporting Assets (Week 3-4)

**After P0 Labs complete, P1 Labs become ready:**
```bash
bd ready --priority 2
# Shows: Lab 4, Lab 7, Lab 8
```

Work through these in any order (not launch-blocking):

```bash
bd update FamilySecondBrain-35l --status in_progress
# Complete Lab 4
bd close FamilySecondBrain-35l --reason "Partnership kit complete. Email templates, pitch deck, ROI calculator ready."
```

---

## Useful Beads Commands

### See All Perplexity Tasks
```bash
bd list --limit 20
```

### See Only In-Progress Tasks
```bash
bd list --status in_progress
```

### See Only Open Tasks
```bash
bd list --status open
```

### See P0 Tasks Only
```bash
bd list --priority 1
```

### See Task Dependencies
```bash
bd show FamilySecondBrain-636
```
Shows which tasks this depends on and which tasks depend on this.

### Statistics
```bash
bd stats
```
Shows total tasks, open, in_progress, closed, etc.

---

## Adding Your Own Tasks

If you discover additional work needed:

```bash
# Example: Need to create Outputs folder structure
bd create --title "Create Outputs folder structure" \
  --description "Create organized folders for Space queries and Labs deliverables:
- 03_Learning/Perplexity Learning/Outputs/Space_Queries/
- 03_Learning/Perplexity Learning/Outputs/Labs_Deliverables/" \
  --issue-type task \
  --priority 1 \
  --deps FamilySecondBrain-eo9
```

---

## Tracking Progress with Notes

**Use notes field to track:**
- Which Spaces/Labs are complete
- File locations of outputs
- Issues encountered
- Next steps

**Example:**
```bash
bd update FamilySecondBrain-0mh --notes "Lab 3 output review:
✅ Gantt chart complete (56 days detailed)
✅ 22 Canadian journalist contacts with emails
✅ Budget tracker under $5K CAD
❌ Need to personalize media pitches
❌ Need to import Gantt to Notion

Next: Personalize top 10 media pitches by end of week."
```

---

## Handling Blockers

If you get stuck:

```bash
bd update FamilySecondBrain-jla --status blocked --notes "Labs is taking >30 minutes, seems stuck. Will retry tomorrow with shorter prompt."
```

When unblocked:

```bash
bd update FamilySecondBrain-jla --status in_progress --notes "Retried with split prompt, working now."
```

---

## Completion Checklist

Use `bd list` to verify completion:

**After Week 1:**
```bash
bd list --status closed
# Should show: FamilySecondBrain-ocy (Phase 1), FamilySecondBrain-636 (Phase 2)
```

**After Week 2:**
```bash
bd list --status closed --priority 1
# Should show: All 5 P0 Labs deliverables closed
```

**After Week 4:**
```bash
bd list --status closed
# Should show: All 10 tasks closed
```

**Final check:**
```bash
bd show FamilySecondBrain-eo9
# Epic should show all 10 dependent tasks as closed
```

---

## Integration with Original Tracking Files

**Use both systems:**
1. **Beads** - Active task management (what am I working on? what's next?)
2. **CSV/Markdown files** - Reference documentation (prompts, instructions)

**Workflow:**
1. Check `bd ready` to see what's next
2. Open `Execution_Checklist.md` for step-by-step instructions
3. Open `Perplexity_Labs_Prompt_Library.md` to copy prompts
4. Use `bd update` to track progress
5. Use `Perplexity_Execution_Tracker.csv` for asset inventory (what files were generated)

---

## Tips for Success

### 1. Update Frequently
```bash
# After each major step
bd update <task-id> --notes "Latest progress here"
```

### 2. Use External References
```bash
bd update FamilySecondBrain-592 --external-ref "https://perplexity.ai/labs/session/abc123"
```
Link to your Labs session URL.

### 3. Close Tasks Immediately
Don't wait until end of week. Close tasks as soon as truly complete:
```bash
bd close <task-id> --reason "What was accomplished"
```

### 4. Check Dependencies Before Starting
```bash
bd show <task-id>
# Look at "dependencies" field - are they all closed?
```

### 5. Use Labels for Organization
```bash
bd update FamilySecondBrain-0mh --labels "week-2,critical-path,launch-campaign"
```

---

## Reporting Progress

**Weekly summary:**
```bash
# See what got done this week
bd list --status closed | grep "2025-12-"

# See what's in progress
bd list --status in_progress

# See what's blocked
bd list --status blocked
```

**Share with team/advisor:**
```bash
bd show FamilySecondBrain-eo9
# Copy the task list with statuses
```

---

## Example: Full Week 1 Workflow

```bash
# Monday morning - Start Phase 1
bd ready --priority 1
bd update FamilySecondBrain-ocy --status in_progress --assignee "Ryan"

# Monday afternoon - 4 Spaces done
bd update FamilySecondBrain-ocy --notes "Completed Spaces 1-4. All files uploaded, custom instructions set."

# Tuesday - Finish Phase 1
bd update FamilySecondBrain-ocy --notes "All 8 Spaces complete. Test queries validated."
bd close FamilySecondBrain-ocy --reason "Foundation setup complete"

# Tuesday - Start Phase 2
bd ready --priority 1
bd update FamilySecondBrain-636 --status in_progress

# Wednesday - Half of queries done
bd update FamilySecondBrain-636 --notes "Completed 5/10 P0 queries. Top pain points and ProductHunt timeline look great."

# Thursday - Finish Phase 2
bd close FamilySecondBrain-636 --reason "All P0 queries complete. Ready for Labs."

# Friday - Start Labs (can run 2-3 in parallel)
bd ready --priority 1
bd update FamilySecondBrain-592 --status in_progress --notes "Lab 1 started"
bd update FamilySecondBrain-jla --status in_progress --notes "Lab 2 started"
bd update FamilySecondBrain-0mh --status in_progress --notes "Lab 3 started (this is the big one)"
```

---

## Beads vs CSV Tracker Comparison

| Feature | Beads | CSV Tracker |
|---------|-------|-------------|
| **Dependencies** | Automatic (close parent, unblock children) | Manual tracking |
| **Notes/History** | Built-in, timestamped | Need to manually add |
| **Status tracking** | open/in_progress/blocked/closed | Manual checkbox |
| **Command line** | `bd ready`, `bd list`, `bd show` | Open Excel/CSV |
| **Search** | `bd list --status blocked` | Manual filtering |
| **Progress reporting** | `bd stats` | Manual counting |
| **Best for** | Active task management | Reference documentation |

**Recommendation:** Use both
- **Beads** for day-to-day work ("What should I do next?")
- **CSV/Markdown** for reference ("What's the full prompt for Lab 3?")

---

## Next Steps

1. **Initialize Beads** (if not already done):
   ```bash
   cd C:\Users\RHudson\Desktop\Claudius\Projects\FamilySecondBrain
   bd init
   ```

2. **Verify tasks exist**:
   ```bash
   bd list --limit 15
   # Should see all 10 Perplexity tasks
   ```

3. **Start Phase 1**:
   ```bash
   bd ready --priority 1
   bd update FamilySecondBrain-ocy --status in_progress
   ```

4. **Open reference docs alongside**:
   - `Execution_Checklist.md` - Step-by-step guide
   - `Perplexity_Custom_Instructions.md` - Space setup
   - `Perplexity_Labs_Prompt_Library.md` - Full prompts

5. **Update as you go**:
   ```bash
   bd update <task-id> --notes "Progress update here"
   ```

---

**You now have a proper task management system for your Perplexity execution. Use `bd ready` to always know what's next!**
