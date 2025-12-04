# Perplexity Launch Execution System

Comprehensive system for transforming 20 Perplexity research documents into actionable launch assets for Archevi Q1 2026 launch.

---

## 📁 Files in This System

| File | Purpose | Use When |
|------|---------|----------|
| **Beads_Integration_Guide.md** | Task management with Beads CLI | Daily work (What's next? Update progress) |
| **Execution_Checklist.md** | Step-by-step 4-week plan | Need detailed instructions for each phase |
| **Perplexity_Custom_Instructions.md** | Copy-paste instructions for 8 Spaces | Setting up Spaces in Perplexity Pro |
| **Perplexity_Labs_Prompt_Library.md** | 8 full Labs prompts (copy-paste ready) | Running Labs deliverables |
| **Quick_Reference_Card.md** | One-page cheat sheet | Quick lookups, tips, troubleshooting |
| **Perplexity_Execution_Tracker.csv** | Spreadsheet tracker (5 tabs) | Asset inventory, reference |
| **README.md** | This file - System overview | First-time setup |

---

## 🚀 Quick Start (First Time)

### 1. Verify Beads Tasks
```bash
cd C:\Users\RHudson\Desktop\Claudius\Projects\FamilySecondBrain
bd list --limit 15
```

You should see:
- **FamilySecondBrain-eo9** - Perplexity Launch Execution (Epic)
- **FamilySecondBrain-ocy** - Phase 1: Setup 8 Spaces
- **FamilySecondBrain-636** - Phase 2: Run P0 queries
- **FamilySecondBrain-592** - Lab 1: Competitive Dashboard
- **FamilySecondBrain-jla** - Lab 2: Voice of Customer Toolkit
- **FamilySecondBrain-0mh** - Lab 3: 8-Week Launch Campaign
- **FamilySecondBrain-chv** - Lab 5: Content Marketing System
- **FamilySecondBrain-htl** - Lab 6: Pricing Strategy Toolkit
- **FamilySecondBrain-35l** - Lab 4: Partnership Outreach Kit
- **FamilySecondBrain-1mt** - Lab 7: Technical Messaging Kit
- **FamilySecondBrain-dxo** - Lab 8: Market Timing Toolkit

### 2. Check What's Ready
```bash
bd ready --priority 1
```

Should show: **FamilySecondBrain-ocy** (Phase 1 - Setup 8 Spaces)

### 3. Start Working
```bash
bd update FamilySecondBrain-ocy --status in_progress
```

### 4. Open Reference Docs
- **Execution_Checklist.md** - For step-by-step Phase 1 instructions
- **Perplexity_Custom_Instructions.md** - For Space setup

---

## 📊 Task Hierarchy (Beads)

```
Epic: Perplexity Launch Execution (FamilySecondBrain-eo9)
│
├─ Phase 1: Setup 8 Spaces (FamilySecondBrain-ocy) [Week 1]
│   └─ Phase 2: Run P0 Queries (FamilySecondBrain-636) [Week 1-2]
│       │
│       ├─ Lab 1: Competitive Dashboard (FamilySecondBrain-592) [P0, Week 2]
│       ├─ Lab 2: Voice of Customer (FamilySecondBrain-jla) [P0, Week 2]
│       ├─ Lab 3: Launch Campaign (FamilySecondBrain-0mh) [P0, Week 2] ⭐ CRITICAL
│       ├─ Lab 5: Content System (FamilySecondBrain-chv) [P0, Week 2]
│       └─ Lab 6: Pricing Toolkit (FamilySecondBrain-htl) [P0, Week 2]
│           │
│           ├─ Lab 4: Partnership Kit (FamilySecondBrain-35l) [P1, Week 3]
│           ├─ Lab 7: Technical Messaging (FamilySecondBrain-1mt) [P1, Week 3]
│           └─ Lab 8: Market Timing (FamilySecondBrain-dxo) [P1, Week 3]
```

**Dependencies:**
- Phase 2 depends on Phase 1 (can't run queries until Spaces are set up)
- All P0 Labs depend on Phase 2 (need query insights before generating deliverables)
- P1 Labs depend on P0 Labs (supporting assets come after critical deliverables)

---

## 🎯 Expected Outputs (24+ Assets)

### From Space Queries (10 outputs)
1. Competitive positioning matrix
2. Market gap analysis
3. Top 10 pain point stories
4. ProductHunt launch timeline
5. 20 blog post topics analysis
6. Comparison pages priority list
7. Pricing validation analysis
8. Privacy advantage copy (3 versions)
9. Why Now narrative
10. Additional P1 queries (6 more)

### From Labs Deliverables (8 major toolkits)
1. **Competitive Analysis Dashboard** - Feature matrix, pricing charts, positioning deck
2. **Voice of Customer Toolkit** - Landing copy, ads, emails, objection handling
3. **8-Week Launch Campaign** - Gantt chart, contact lists, checklists, budget tracker ⭐
4. **90-Day Content System** - Editorial calendar, templates, SEO checklist, traffic projections
5. **Pricing Strategy Toolkit** - Comparison charts, calculator, unit economics, experiments
6. **Partnership Outreach Kit** - Email templates, pitch deck, ROI calculator
7. **Technical Messaging Kit** - Privacy explainers, RAG diagrams, FAQ, dev pitch
8. **Market Timing Toolkit** - Why Now deck, trend monitor, press angles, investor slides

**Total:** 24+ actionable launch assets

---

## ⏱️ Time Estimates

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| **Week 1: Foundation** | Setup 8 Spaces + Run P0 queries | 5-7 hours | P0 |
| **Week 2: Critical Labs** | Labs 1,2,3,5,6 | 2.5-3.5 hours | P0 |
| **Week 3: Supporting Labs** | Labs 4,7,8 | 1.5-2 hours | P1 |
| **Week 4: Polish** | Iterate, refine, organize | 1-2 hours | P2 |
| **TOTAL** | | **12-16 hours** | |

**Note:** Labs time is mostly waiting (Perplexity does the work). You can run multiple Labs in parallel.

---

## 🛠️ Recommended Workflow

### Daily Routine
1. **Check what's ready:**
   ```bash
   bd ready --priority 1
   ```

2. **Start working on top task:**
   ```bash
   bd update <task-id> --status in_progress
   ```

3. **Open reference docs:**
   - `Execution_Checklist.md` for step-by-step
   - `Perplexity_Custom_Instructions.md` or `Perplexity_Labs_Prompt_Library.md` for prompts

4. **Do the work** (create Spaces, run queries, run Labs)

5. **Update progress:**
   ```bash
   bd update <task-id> --notes "What you accomplished, next steps"
   ```

6. **Close when done:**
   ```bash
   bd close <task-id> --reason "What was completed"
   ```

7. **Repeat** (bd ready will show next task)

---

## 📖 Document Usage Guide

### When Setting Up Spaces
**Use:**
- `Perplexity_Custom_Instructions.md` - Copy custom instructions for each Space
- `Execution_Checklist.md` - Phase 1 checklist (which files to upload, test queries)

**Track progress:**
```bash
bd update FamilySecondBrain-ocy --notes "Space 1 done, Space 2 done, ..."
```

### When Running Queries
**Use:**
- `Execution_Checklist.md` - Phase 2 query list
- `Perplexity_Execution_Tracker.csv` - Tab 2 (Space Query Checklist) for query text

**Track progress:**
```bash
bd update FamilySecondBrain-636 --notes "Queries 1-3 done, saved to Outputs/"
```

### When Running Labs
**Use:**
- `Perplexity_Labs_Prompt_Library.md` - Full prompts for each Lab (copy-paste entire prompt)
- `Execution_Checklist.md` - Phase 3 Labs checklist

**Track progress:**
```bash
bd update FamilySecondBrain-592 --status in_progress --notes "Lab 1 started, 15 min wait"
# After completion
bd close FamilySecondBrain-592 --reason "Dashboard complete, files saved"
```

### When Stuck
**Use:**
- `Quick_Reference_Card.md` - Troubleshooting section
- `Beads_Integration_Guide.md` - Handling blockers section

**Mark blocked:**
```bash
bd update <task-id> --status blocked --notes "Issue description"
```

---

## 🔍 Progress Tracking

### Check Overall Progress
```bash
bd show FamilySecondBrain-eo9
```
Shows epic with all dependent tasks and their statuses.

### See What's Done
```bash
bd list --status closed
```

### See What's In Progress
```bash
bd list --status in_progress
```

### See What's Ready to Start
```bash
bd ready --priority 1
```

### Statistics
```bash
bd stats
```

---

## 🎓 Learning Curve

**If you're new to Perplexity Spaces/Labs:**
1. Start with `Quick_Reference_Card.md` (one-page overview)
2. Follow `Execution_Checklist.md` step-by-step
3. Reference `Beads_Integration_Guide.md` for task management commands

**If you're experienced with Perplexity:**
1. Use `bd ready` to see what's next
2. Copy prompts from `Perplexity_Labs_Prompt_Library.md`
3. Track progress with `bd update`

---

## ✅ Success Criteria

### After Week 1
- ✅ All 8 Spaces created and tested
- ✅ All 10 P0 queries complete
- ✅ Outputs saved to organized folders

### After Week 2
- ✅ 5 P0 Labs deliverables complete
- ✅ Master launch plan ready (Lab 3)
- ✅ Content calendar populated (Lab 5)
- ✅ Pricing validated (Lab 6)

### After Week 4
- ✅ All 8 Labs deliverables complete
- ✅ 24+ launch assets generated
- ✅ Ready to execute Q1 2026 launch

---

## 🆘 Support Resources

### Beads Help
```bash
bd --help
bd list --help
bd update --help
```

### Perplexity Help
- Official Docs: https://docs.perplexity.ai
- Labs Guide: (check Perplexity Pro app)

### Files to Reference
1. **Beads_Integration_Guide.md** - Full Beads workflow examples
2. **Quick_Reference_Card.md** - Tips, shortcuts, troubleshooting
3. **Execution_Checklist.md** - Detailed step-by-step for each phase

---

## 🔄 Updating This System

If you discover additional work:

```bash
# Create new task
bd create --title "New task title" \
  --description "Detailed description" \
  --issue-type task \
  --priority 1 \
  --deps FamilySecondBrain-eo9

# Link to existing task
bd dep <new-task-id> <existing-task-id>
```

---

## 📝 Notes on File Organization

**Recommended folder structure:**
```
03_Learning/Perplexity Learning/
├── README.md (this file)
├── Beads_Integration_Guide.md
├── Execution_Checklist.md
├── Perplexity_Custom_Instructions.md
├── Perplexity_Labs_Prompt_Library.md
├── Quick_Reference_Card.md
├── Perplexity_Execution_Tracker.csv
├── Outputs/
│   ├── Space_Queries/
│   │   ├── Competitive_Positioning_Matrix.md
│   │   ├── Top_10_Pain_Points.md
│   │   └── [etc.]
│   └── Labs_Deliverables/
│       ├── Competitive_Analysis_Dashboard/
│       ├── Voice_of_Customer_Toolkit/
│       ├── Launch_Campaign/
│       └── [etc.]
```

Create Outputs folder structure:
```bash
mkdir -p "03_Learning/Perplexity Learning/Outputs/Space_Queries"
mkdir -p "03_Learning/Perplexity Learning/Outputs/Labs_Deliverables"
```

---

## 🎯 Next Steps

1. **Verify Beads setup:**
   ```bash
   bd list --limit 15
   ```

2. **Start Phase 1:**
   ```bash
   bd ready --priority 1
   bd update FamilySecondBrain-ocy --status in_progress
   ```

3. **Open reference docs:**
   - `Execution_Checklist.md` - Phase 1 instructions
   - `Perplexity_Custom_Instructions.md` - Space 1 setup

4. **Create first Space** (Competitive Intelligence)

5. **Update progress:**
   ```bash
   bd update FamilySecondBrain-ocy --notes "Space 1 complete"
   ```

6. **Continue** through all 8 Spaces, then move to Phase 2

---

**You now have a complete, integrated system combining:**
- ✅ Beads task management (active tracking)
- ✅ Detailed execution checklists (step-by-step guides)
- ✅ Copy-paste ready prompts (custom instructions, Labs prompts)
- ✅ Quick reference (tips, troubleshooting)
- ✅ Progress tracking (CSV tracker for asset inventory)

**Use `bd ready` to always know what's next. Good luck with your Q1 2026 launch! 🚀**
