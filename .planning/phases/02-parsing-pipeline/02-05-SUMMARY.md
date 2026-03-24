---
phase: 02-parsing-pipeline
plan: 05
subsystem: analysis
tags: [shared-detection, orchestrator, mainview, pipeline]
requires: [02-01, 02-02, 02-03, 02-04]
provides: [analyzeSite, detectSharedSections, full-pipeline]
affects: [src/views/MainView.tsx]
tech-stack:
  added: []
  patterns:
    - sectionBaseId frequency map for shared layout detection
    - base64 shell read for HTML design tokens
    - parentSectionIndex fallback (prong 2) for linked/shared sections
    - library component root walk (prong 3) at page level
key-files:
  created:
    - src/analysis/detectShared.ts
    - src/analysis/analyze.ts
    - src/analysis/detectShared.test.ts
  modified:
    - src/views/MainView.tsx
decisions:
  - "detectSharedSections threshold is pages.length * 0.5 (>= 50%) to correctly count distinct pages not instances"
  - "Library component roots walked at page level (not per-section) using a dummy section wrapper to reuse buildComponentTree"
  - "Element interactions re-parsed from raw wwObjects in analyze.ts (not from parsedObj.interactions which holds raw WorkflowSpec stubs)"
metrics:
  duration: 3m
  completed: "2026-03-24T15:24:45Z"
  tasks: 2
  files: 4
requirements: [PAGE-05, UX-04]
---

# Phase 02 Plan 05: Shared Detection and Analysis Orchestrator Summary

**One-liner:** Full analysis pipeline wiring design tokens + page parsing + tree walking + workflow parsing + shared section detection + asset copy into `analyzeSite()`, with MainView updated for step-by-step progress.

## What Was Built

### Task 1: detectSharedSections (TDD)

`src/analysis/detectShared.ts` — exports `detectSharedSections(pages: ParsedPage[]): Map<string, string>`:

- Builds `Map<sectionBaseId, Set<pageId>>` to count DISTINCT pages per sectionBaseId
- Threshold: `pages.length * 0.5` (>= 50% of pages)
- Mutates `section.isShared = true` on all matching sections
- Returns `Map<sectionBaseId, title>` for downstream use
- Handles: empty pages array, falsy sectionBaseId, multiple sections per page with same baseId

6 vitest tests cover all edge cases including the key pitfall: sections on the same page with the same sectionBaseId must count as 1 page occurrence.

### Task 2: Analysis Orchestrator and MainView Integration

`src/analysis/analyze.ts` — exports `analyzeSite(shell, extractDir, entries, projectPath, onProgress)`:

Pipeline steps in order:
1. Read `index.html` via base64 → `parseDesignTokens` + `extractGoogleFontUrls`
2. Read `manifest.json` → site name
3. Filter entries for `data/*.json` → page IDs
4. For each page: `parsePageData` → parse sections stubs
5. Build `parentSectionIndex` from `wwObjects.parentSectionId` (prong 2 fallback)
6. Walk sections via `buildComponentTree` (prongs 1+2 per section)
7. Walk library component roots (prong 3) at page level
8. `buildVariableIndex` → `parsePageWorkflows(page.page.workflows)` → `parseElementInteractions` for each object
9. `parseVariables` + `parseCollections` on each page
10. `detectSharedSections` across all pages
11. `buildAssetManifest` + `copyAssets`
12. Deduplicate variables/collections by ID, count total components
13. Return `{ siteAnalysis, designSystem, assetManifest }`

`src/views/MainView.tsx` — updated to wire the full pipeline:

- Calls `analyzeSite` after `validateWeWebExport` succeeds
- Stores result in `useState<AnalysisResult | null>`
- Done state shows: page count, component count, token count, asset count
- Full flow: idle → picking → extracting → validating → analyzing (pageCount) → copying → done

## Verification

- `npx tsc --noEmit`: passes (0 errors)
- `npx vitest run src/analysis/detectShared.test.ts`: 6/6 pass
- `npx vitest run src/`: 61/61 pass (no regressions)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Library component root walk via dummy section wrapper**
- **Found during:** Task 2 implementation
- **Issue:** The plan said "Walk libraryComponents[].rootElementId through the same walkObject (Prong 3)" but `buildComponentTree` only accepts a `RawSection` not individual UIDs. There's no public `walkObject` export.
- **Fix:** Constructed a minimal dummy section wrapper `{ uid: '__lib_root__', content: { default: { wwObjects: [{uid: rootUid, isWwObject: true}] } } }` and passed it to `buildComponentTree` with a fresh empty `parentSectionIndex`. This correctly walks the root object and marks it as visited without requiring changes to parseObjects.ts.
- **Files modified:** src/analysis/analyze.ts
- **Commit:** 98ba661

**2. [Rule 2 - Missing functionality] Element interactions re-read from raw wwObjects**
- **Found during:** Task 2 implementation
- **Issue:** `parsedObj.interactions` at tree-walk time holds raw `WorkflowSpec[]` stubs (cast from raw interactions array in parseObjects.ts). The plan requires calling `parseElementInteractions` to properly linearize them.
- **Fix:** In analyze.ts, after building the component tree, re-read `wwObjects[uid]._state.interactions` from the raw page JSON and call `parseElementInteractions` to get properly linearized WorkflowSpec[]. This overwrites the stubs set by the tree walker.
- **Files modified:** src/analysis/analyze.ts
- **Commit:** 98ba661

## Known Stubs

None — all data sources are wired and populated.

## Self-Check: PASSED
