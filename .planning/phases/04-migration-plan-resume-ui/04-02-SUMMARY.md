---
phase: 04-migration-plan-resume-ui
plan: "02"
subsystem: ui
tags: [react, migration-progress, polling, tree-view, resume-prompt, main-view]
dependency_graph:
  requires:
    - src/plan/types.ts (MigrationPlan, PlanItem, PlanStatus)
    - src/plan/read.ts (loadMigrationPlan, computeProgress, computePageProgress)
    - src/plan/generate.ts (generateMigrationPlan)
    - src/plan/io.ts (saveMigrationPlan)
    - src/plan/resumePrompt.ts (buildResumePrompt)
    - src/brief/io.ts (copyToClipboard)
    - src/context.ts (usePluginContext)
  provides:
    - src/components/MigrationProgress.tsx (MigrationProgress component)
    - src/views/MainView.tsx (updated with plan detection + plan generation)
    - src/styles.ts (ww2c-progress-bar, ww2c-progress-fill CSS)
  affects:
    - End-to-end migration plan flow in Ship Studio plugin
tech_stack:
  added: []
  patterns:
    - React useEffect + setInterval for 30s polling
    - useRef(hadPlan) for error detection (only show error if plan was previously loaded)
    - Inline styles for tree layout (matching webflow-to-code pattern)
    - CSS classes (ww2c-prefix) for progress bar and buttons
    - onStartFresh callback added to MigrationProgress (WeWeb addition over webflow-to-code)
key_files:
  created:
    - src/components/MigrationProgress.tsx
  modified:
    - src/views/MainView.tsx
    - src/styles.ts
decisions:
  - "onStartFresh callback prop added to MigrationProgress (not in webflow-to-code) — per UX-10 requirement for WeWeb plugin"
  - "existingPlan state initialized to 'checking' to show spinner on mount before plan check resolves"
  - "Progress bar uses CSS classes (ww2c-progress-bar/fill) not inline styles — allows theming; fill width passed as inline style only"
metrics:
  duration: "~18 min"
  completed_date: "2026-03-24"
  tasks_completed: 1
  files_created: 1
  files_modified: 2
---

# Phase 4 Plan 02: Migration Plan UI Summary

MigrationProgress React component with 30s polling, status-symbol tree view, resume prompt copy, and start-fresh flow; MainView updated to detect existing plans on mount and auto-generate migration plan after brief creation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | MigrationProgress component and MainView integration | f38fe60 | src/components/MigrationProgress.tsx, src/views/MainView.tsx, src/styles.ts |

## What Was Built

**src/components/MigrationProgress.tsx** — Ported from webflow-to-code with WeWeb adaptations. Props: `{ shell, projectPath, onStartFresh }`. Polls `loadMigrationPlan` every 30s via `setInterval`. Renders: "Migration Progress" label, `N/M items (X%)` summary, CSS progress bar, expand/collapse tree (shared first, then pages), "Copy Resume Prompt" button (shows 2s confirmation), "Start Fresh" button calling `onStartFresh`. All buttons use `ww2c-btn-ghost` class. Sub-components: `ChildItem` (renders leaf with status symbol + name + notes), `PlanRow` (top-level with toggle arrow + progress count). Status symbols: `○` pending, `◆` in-progress, `✓` complete. Status colors: muted/accent/green.

**src/views/MainView.tsx** — Added `existingPlan` state (`MigrationPlan | null | 'checking'`), initialized to `'checking'`. Mount-time `useEffect` calls `loadMigrationPlan` and sets state. Renders `<MigrationProgress>` when `existingPlan !== null && step.kind === 'idle'`. Shows "Checking for existing migration..." spinner while checking. `handleStartFresh` sets `existingPlan` to `null` and resets step to idle. After brief generation: calls `generateMigrationPlan` then `saveMigrationPlan` to persist plan. Done-state shows "Migration plan saved to .shipstudio/migration-plan.json" note.

**src/styles.ts** — Added `.ww2c-progress-bar` (6px height, green bg, overflow hidden) and `.ww2c-progress-fill` (height 100%, #4caf50, transition width 0.3s).

## Verification

- TypeScript: `tsc --noEmit` clean (0 errors)
- Tests: 143/143 passing (`npx vitest run`)
- Build: `npm run build` exits 0 (60.68 kB bundle)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. `onStartFresh` was specified in the plan as a required WeWeb addition over the webflow-to-code reference.

## Known Stubs

None — component is fully wired to real plan/ module functions. No hardcoded or placeholder data.

## Awaiting Human Verification

Task 2 is a `checkpoint:human-verify` — human verification of the UI in Ship Studio is required before this plan is fully complete.

## Self-Check: PASSED

- f38fe60 exists: `git log --oneline | grep f38fe60`
- src/components/MigrationProgress.tsx: created
- src/views/MainView.tsx: modified with all required imports and state
- src/styles.ts: modified with progress bar CSS
