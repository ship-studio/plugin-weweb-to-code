---
phase: 04-migration-plan-resume-ui
plan: "01"
subsystem: plan
tags: [plan-generation, file-io, base64, progress-tracking, tdd]
dependency_graph:
  requires:
    - src/analysis/types.ts (SiteAnalysis, ParsedPage, ParsedSection, SharedSectionInfo)
    - src/brief/io.ts (base64 encoding pattern)
  provides:
    - src/plan/types.ts (PlanStatus, PlanItem, MigrationPlan)
    - src/plan/generate.ts (generateMigrationPlan)
    - src/plan/read.ts (loadMigrationPlan, computeProgress, computePageProgress)
    - src/plan/io.ts (saveMigrationPlan)
    - src/plan/resumePrompt.ts (buildResumePrompt)
  affects:
    - Phase 04 Plan 02 (UI imports all plan/* exports)
tech_stack:
  added: []
  patterns:
    - TDD red-green for all 5 source files
    - base64 shell encoding (btoa/atob) for safe JSON file writes via shell.exec
    - ShellLike interface kept module-local (not imported from src/types.ts)
    - SharedSectionInfo.type used for deterministic sort order (nav/header first, footer last)
key_files:
  created:
    - src/plan/types.ts
    - src/plan/generate.ts
    - src/plan/generate.test.ts
    - src/plan/io.ts
    - src/plan/io.test.ts
    - src/plan/read.ts
    - src/plan/read.test.ts
    - src/plan/resumePrompt.ts
    - src/plan/resumePrompt.test.ts
  modified: []
decisions:
  - "Sort order for shared sections: nav=0, header=1, sidebar=2, shared=3, footer=4 — deterministic ordering using SHARED_TYPE_ORDER map"
  - "buildResumePrompt embeds projectPath in both file paths (unlike webflow-to-code which ignored the param) — tests require it"
  - "ShellLike kept module-local in io.ts and read.ts (not imported from src/types.ts) — mirrors webflow-to-code pattern for self-contained modules"
metrics:
  duration: "977s (~16 min)"
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 9
---

# Phase 4 Plan 01: Plan Types and Generation Summary

Created the complete `src/plan/` data layer module for the migration plan feature: types, WeWeb-adapted plan generation, file I/O (save/load via base64 shell), progress computation, and resume prompt builder. Ported from webflow-to-code with WeWeb-specific adaptations for `sharedSections` Map and `ParsedSection.isShared`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Plan types and generation with tests | 181edb8 | src/plan/types.ts, generate.ts, generate.test.ts |
| 2 | Plan I/O, read, and resume prompt with tests | b097901 | src/plan/io.ts, io.test.ts, read.ts, read.test.ts, resumePrompt.ts, resumePrompt.test.ts |

## What Was Built

**src/plan/types.ts** — Port of PlanStatus, PlanItem, MigrationPlan type contracts (identical to webflow-to-code).

**src/plan/generate.ts** — `generateMigrationPlan(SiteAnalysis): MigrationPlan`. WeWeb-specific: iterates `sharedSections` Map (vs webflow's boolean flags), sorts shared items by type (nav→header→sidebar→shared→footer), iterates pages filtering sections by `isShared===false`. Uses `section.title ?? section.uid` for section names.

**src/plan/io.ts** — `saveMigrationPlan(shell, projectPath, plan)`. Encodes JSON via `btoa(unescape(encodeURIComponent(...)))`, writes to `.shipstudio/migration-plan.json` via `mkdir -p && echo '...' | base64 -d`. Throws on non-zero exit.

**src/plan/read.ts** — `loadMigrationPlan` reads via `cat | base64`, decodes via `decodeURIComponent(escape(atob(...)))`, returns null on missing file or invalid JSON. `computeProgress` and `computePageProgress` count leaf items (children if present, else item itself).

**src/plan/resumePrompt.ts** — `buildResumePrompt(projectPath)` returns copy-pasteable prompt with both `.shipstudio/migration-plan.json` and `.shipstudio/assets/brief.md` paths embedded.

## Test Coverage

- 8 tests in generate.test.ts (6 required behaviors + 2 additional)
- 17 tests across io.test.ts, read.test.ts, resumePrompt.test.ts
- Total: 25 new tests; full suite 143/143 passing
- TypeScript: `tsc --noEmit` clean

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. The only adaptation was in `buildResumePrompt`: the webflow-to-code version ignored `projectPath` (used relative paths), but the plan's test spec requires projectPath embedded in both file paths, so the implementation embeds it. This was a WeWeb-specific requirement stated in the plan.

## Known Stubs

None — all functions are fully implemented with no placeholder values.

## Self-Check: PASSED
