# FamilySecondBrain - Claude Code Project

## Project Overview
RAG-powered family knowledge base chatbot using Windmill, Cohere, and pgvector

## Location
C:/Users/RHudson/Desktop/Claudius/Projects/FamilySecondBrain

## Created
2025-11-26 by RHudson

## Project Structure

This project follows Master_Claude_Project_Instructions.md standards:

```
FamilySecondBrain/
├── 00_PROJECT_OVERVIEW.md      # Project details and technical stack
├── Claude_Session_Log.md       # Active session log (current status)
├── Claude_Session_Archive.md   # Complete historical record
├── CLAUDE.md                   # This file (Claude Code instructions)
├── README.md                   # Project documentation
├── .claude/                    # Claude Code configuration
│   ├── agents/                 # Project-specific subagents
│   └── commands/               # Custom slash commands
├── 01_Planning/                # Requirements and planning
├── 02_Development/             # Code notes and development
├── 03_Learning/                # Key insights and learnings
└── 04_Output/                  # Deliverables and output
```

## File Boundaries

**Safe to edit:**
- All project files within C:/Users/RHudson/Desktop/Claudius/Projects/FamilySecondBrain
- All markdown documentation
- All source code and scripts

**Never touch:**
- venv/ (if exists)
- __pycache__/ (if exists)
- .git/ (git internals)
- node_modules/ (if exists)

## Obsidian Integration

This project is part of the Claudius Obsidian vault:
- **Active Log:** Claude_Session_Log.md (current status, recent sessions, next actions)
- **Complete Archive:** Claude_Session_Archive.md (full historical record)
- **Project Overview:** 00_PROJECT_OVERVIEW.md (technical details, context)

## Communication Standards

**From Master_Claude_Project_Instructions.md:**

- **NO EMOJIS** - Never use emojis in any communication, documentation, or code
- **Professional Tone** - Technical, clear, professional communication
- **Absolute Paths** - Always use absolute paths for file operations
- **Append-Only Logging** - Add deltas to session logs, never duplicate content
- **Context References** - Begin responses with project context reference

## Logging System

### Two-Tier Architecture

**Active Session Log (Claude_Session_Log.md):**
- Current "working on" status
- Last 2-3 major sessions (outcomes only)
- Immediate next actions
- Current blockers/issues
- Max 100 lines or 50KB

**Complete Session Archive (Claude_Session_Archive.md):**
- Full historical record of all sessions
- Complete technical decisions and debugging
- Architecture changes and rationale
- All learnings and insights
- Unlimited length

### Archival Triggers

**Auto-archive when:**
- Active log exceeds 100 lines
- Active log exceeds 50KB
- Major milestone completed
- Phase transition occurs
- End of month

## Session Workflow

**On every session start:**
1. Read Claude_Session_Log.md for current status
2. Check Claude_Session_Archive.md for historical context
3. Review 00_PROJECT_OVERVIEW.md for project details
4. Reference Master_Claude_Project_Instructions.md for standards

**During session:**
- Work on current tasks
- Track progress and decisions

**On session end:**
- Append summary to Claude_Session_Log.md (delta only)
- Archive to Claude_Session_Archive.md if triggers met
- Update next actions

## Shell and Execution

**Shell Restrictions (Cylance Security):**
- Cylance blocks PowerShell execution completely
- Never use PowerShell or PowerShell syntax
- Avoid && syntax in PowerShell contexts

**Preferred Shells:**
- **Primary:** Git Bash (C:\Program Files\Git\bin\bash.exe)
- **Fallback:** CMD for Windows commands
- **Always specify shell explicitly** when using Desktop Commander MCP

## FILE MANAGEMENT RULES (MANDATORY)

**Reference:** C:\Users\RHudson\Desktop\Claudius\NAMING_CONVENTIONS.md

### Before Creating ANY File:

1. **CHECK**: Does file already exist? → Edit it, don't duplicate
2. **VALIDATE**: Does name follow standards? → No versions, no "new"/"updated"
3. **SEARCH**: Similar files exist? → Reuse or archive old first
4. **ASK**: Unsure? → Ask user before creating

### Validation Command:
```bash
python C:\Users\RHudson\Desktop\Claudius\Scripts\validate_filename.py "filepath"
```

### Forbidden Patterns:
❌ filename_v2.py       # Version suffixes
❌ config_new.json      # "new" marker
❌ script_updated.py    # "updated" marker
❌ temp_file.txt        # "temp" files
❌ file_backup.md       # "backup" marker
❌ file1.py             # Generic numbered names
❌ data.csv             # Non-descriptive names

### Required Patterns:
✅ process_bank_statements.py     # Descriptive, specific
✅ categorization_engine.py       # Clear purpose
✅ october_2025_transactions.json # Includes date/context
✅ BankStatementParser.py         # PascalCase for classes

### Version Control Strategy:
- **USE GIT** for versioning: `git commit`, `git tag v1.0.0`
- **DON'T USE** filename suffixes: ❌ script_v2.py
- **USE BRANCHES** for experiments: `git checkout -b experiment/feature-name`
- **ARCHIVE OLD FILES**: Move to `archive/` folder with git

### File Creation Checklist:
```
Before creating [filename]:

□ Searched project for existing files with similar purpose
□ Confirmed name is descriptive (not generic like "file1", "temp")
□ Confirmed name follows language/framework conventions
□ Confirmed no version suffix (v1, v2, new, updated, etc.)
□ Confirmed not duplicating existing file content
□ If similar file exists, editing that file instead
□ If replacing old file, archiving old file first

If all checked ✅, proceed with creation.
If any ❌, STOP and re-evaluate.
```

### When to Archive:
```bash
# Create archive folder if needed
mkdir -p archive/

# Move old file with git (preserves history)
git mv old_version.py archive/
git commit -m "archive: replaced by new_version.py"
```

### Emergency Fix:
If you realize you created a duplicate file:
1. Consolidate unique content into canonical file
2. Delete duplicate
3. Update any references
4. Commit: `git commit -m "fix: remove duplicate file"`

## Project-Specific Notes

[Add project-specific instructions, tech stack, dependencies, etc.]

## Key Resources

- Session Log: [[Claude_Session_Log.md]]
- Session Archive: [[Claude_Session_Archive.md]]
- Project Overview: [[00_PROJECT_OVERVIEW.md]]
- Master Instructions: [[Master_Claude_Project_Instructions.md]]
- User Profile: [[00_USER_PROFILE.md]]

---

**This file is the authoritative guide for Claude Code when working on this project.**
