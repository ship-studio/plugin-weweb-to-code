---
phase: 03-brief-generation-output
plan: 01
subsystem: brief
tags: [brief, generation, markdown, io, types]
dependency_graph:
  requires: [src/analysis/types.ts, src/design/types.ts, src/assets/types.ts, src/types.ts]
  provides: [src/brief/types.ts, src/brief/generate.ts, src/brief/io.ts]
  affects: [Phase 4 UI integration - will import generateBrief, saveBrief, copyToClipboard]
tech_stack:
  added: []
  patterns:
    - Pure function generateBrief(BriefInput) -> BriefResult with 9 section builders
    - Base64 Unicode-safe encoding via btoa(unescape(encodeURIComponent(markdown))) for shell safety
    - mkdir -p guard before file write to avoid missing directory errors
    - Recursive component tree walker with depth cap (maxDepth=3) using countDescendants fallback
    - COMPONENT_MIGRATION_NOTES lookup table for WeWeb -> HTML/React guidance
key_files:
  created:
    - src/brief/types.ts
    - src/brief/generate.ts
    - src/brief/io.ts
    - src/brief/generate.test.ts
    - src/brief/io.test.ts
  modified: []
decisions:
  - "PreserveOption uses 'interactions' (not 'animations') to match WeWeb's workflow terminology"
  - "BriefStats uses totalComponentCount (from SiteAnalysis) instead of contentPageCount/cmsTemplateCount (Webflow-specific)"
  - "assetCount = images.length + icons.length (no videos or separate fonts in WeWeb asset manifest)"
  - "Component migration guidance iterates unique componentTypes found across all pages (dynamic, not hardcoded)"
  - "estimateTokens computed on final assembled markdown, not per-section (per Research Pitfall 2)"
metrics:
  duration_seconds: 231
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_changed: 5
---

# Phase 3 Plan 1: Brief Generation Module Summary

**One-liner:** WeWeb-specific brief generation with 9 section builders, TDD'd against fixture data, and shell-safe io.ts for file save and clipboard copy.

## What Was Built

Created the complete `src/brief/` module:

- **`types.ts`** — Full type contracts: `BriefMode`, `PreserveOption` (with `interactions` replacing Webflow's `animations`), `PRESERVE_OPTIONS`, `DEFAULT_PRESERVE`, `BriefInput` (includes `designSystem: DesignSystem`), `BriefResult`, `BriefStats`, `TOKEN_WARNING_THRESHOLD`
- **`io.ts`** — `saveBrief` and `copyToClipboard` with Unicode-safe base64 encoding and `mkdir -p` guard before write
- **`generate.ts`** (~414 lines) — `generateBrief` assembling 9 sections: metadata, migration plan, instructions (mode-gated), site overview table, design system (typography/colors/spacing/fonts), shared layout, per-page component trees, asset inventory, and component migration guidance
- **`io.test.ts`** — 10 tests covering all io paths including mkdir guard and error throwing
- **`generate.test.ts`** — 47 tests covering all section builders, depth capping, isShared filtering, breakpoint guards, mode gates, and escapeTableCell

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `interactions` not `animations` | WeWeb uses workflows/interactions terminology; webflow uses animations |
| Dynamic `componentTypes` iteration | Ensures guidance table reflects actual site content, not a hardcoded list |
| `estimateTokens` on final markdown | Per Research Pitfall 2 — per-section estimation gives inaccurate totals |
| `mkdir -p` guard in `saveBrief` | Per Research Pitfall 4 — `.shipstudio/assets/` may not exist on first run |
| `maxDepth=3` cap in component tree | Per Research Pitfall 5 — WeWeb trees can be 10+ levels deep; caps at 3 with "(+N nested)" |

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing functionality] `countDescendants` helper for depth-cap note**
- **Found during:** Task 2 (renderComponentTree implementation)
- **Issue:** Plan specified "(+N nested)" note at maxDepth but didn't specify how to count descendants
- **Fix:** Added `countDescendants(obj): number` recursive helper to produce accurate count
- **Files modified:** src/brief/generate.ts

No other deviations — plan executed as specified.

## Known Stubs

None. All section builders emit real data from their inputs. No placeholder text or hardcoded empty values.

## Test Results

```
Test Files  2 passed (2)
Tests       57 passed (57)
```

- `io.test.ts`: 10 tests — saveBrief (6), copyToClipboard (4)
- `generate.test.ts`: 47 tests — estimateTokens (4), BriefResult shape (6), metadata (3), design system (7), shared layout (3), pages (8), mode gates (4), assets (5), migration guidance (3), escapeTableCell (1), stats (3 embedded)

## Self-Check: PASSED

All files created and committed:
- `src/brief/types.ts` — commit 8fef297
- `src/brief/io.ts` — commit 8fef297
- `src/brief/io.test.ts` — commit 8fef297
- `src/brief/generate.test.ts` — commit 4ad7303
- `src/brief/generate.ts` — commit 30dafea
