---
phase: 03-brief-generation-output
plan: "02"
subsystem: ui
tags: [react, mode-selection, brief-generation, ui-wiring]
dependency_graph:
  requires: ["03-01"]
  provides: ["complete brief generation UI flow"]
  affects: ["src/zip/types.ts", "src/views/MainView.tsx"]
tech_stack:
  added: []
  patterns:
    - "Mode state captured at call time (not via ref) to avoid stale closure in async startPickFlow"
    - "PreserveCheckbox as local function component defined above MainView"
    - "briefResult field on ZipStep done variant — single source of truth for results panel"
key_files:
  created: []
  modified:
    - src/zip/types.ts
    - src/views/MainView.tsx
decisions:
  - "Mode captured at startPickFlow call time via const currentMode = mode to avoid stale async closure"
  - "result state removed from done state — step.briefResult is now the authoritative source for all done-state display"
  - "setResult(null) removed from startPickFlow — AnalysisResult state no longer needed as briefResult in step carries all required data"
metrics:
  duration: "1m 48s"
  completed: "2026-03-24"
  tasks_completed: 1
  tasks_total: 2
  files_modified: 2
---

# Phase 3 Plan 02: Brief Generation UI Wiring Summary

Mode selection UI, brief generation integration, and done-state results panel wired into MainView; build and all 118 tests pass.

## What Was Built

Task 1 completed and committed. Task 2 is a human-verify checkpoint — awaiting user verification in Ship Studio.

### src/zip/types.ts
- Added `import type { BriefResult } from '../brief/types'`
- Updated `done` variant to include `briefResult: BriefResult` field

### src/views/MainView.tsx
- Added imports for `BriefMode`, `PreserveOption`, `PRESERVE_OPTIONS`, `DEFAULT_PRESERVE`, `TOKEN_WARNING_THRESHOLD`, `generateBrief`, `saveBrief`, `copyToClipboard`
- Added state: `mode` (BriefMode), `preserve` (Set<PreserveOption>), `customNotes`, `copying`
- Added `PreserveCheckbox` local function component with SVG checkmark
- Mode selection cards render at idle state (Pixel Perfect / Best Site)
- Best Site mode reveals preserve checkboxes and custom notes textarea
- `startPickFlow` captures mode/preserve/customNotes at call time (stale closure prevention)
- After `analyzeSite`: calls `generateBrief` then `saveBrief`, then sets `done` step with `briefResult`
- Done state replaced with results panel: stats line, token warning (>12K), saved-to path, Copy Brief to Clipboard button, Select Another button
- `result` state (`AnalysisResult`) removed — `step.briefResult` is the authoritative source

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 7306e52 | feat(03-02): wire brief generation into MainView UI |

## Verification Results

- TypeScript: `npx tsc --noEmit` — exits 0, no errors
- Tests: 118/118 passed (`npx vitest run`)
- Build: `npm run build` — dist/index.js 40.95 kB, built successfully
- All 14 acceptance criteria passed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale result state usage in done block**
- **Found during:** Task 1
- **Issue:** Original done-state used `result &&` guard with `AnalysisResult` state — with `briefResult` now on `step`, the old `result` state is no longer needed and the `setResult(null)` in startPickFlow was removed
- **Fix:** Removed `result` state, `setResult` calls, and `AnalysisResult` import from MainView — done state now uses `step.briefResult` exclusively
- **Files modified:** src/views/MainView.tsx
- **Commit:** 7306e52

## Known Stubs

None — all data flows from `step.briefResult` which is populated from live `generateBrief` output.

## Self-Check: PASSED

- src/zip/types.ts exists and contains `briefResult: BriefResult`
- src/views/MainView.tsx exists and contains all required patterns
- Commit 7306e52 exists in git log
