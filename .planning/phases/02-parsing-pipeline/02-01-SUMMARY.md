---
phase: 02-parsing-pipeline
plan: 01
subsystem: design-tokens
tags: [types, design-system, css-parsing, tdd]
dependency_graph:
  requires: []
  provides:
    - src/design/types.ts (DesignToken, DesignSystem)
    - src/analysis/types.ts (ParsedPage, ParsedSection, ParsedObject, SiteAnalysis, WorkflowSpec, ActionSpec, VariableEntry, CollectionEntry)
    - src/assets/types.ts (AssetManifest, AssetEntry)
    - src/design/parseTokens.ts (parseDesignTokens)
    - src/design/mapFonts.ts (extractGoogleFontUrls)
  affects: []
tech_stack:
  added: []
  patterns:
    - UUID-regex CSS token extraction via TOKEN_REGEX
    - Font classification by composite value pattern
    - Color deduplication by hex.toLowerCase()
    - Hex-to-HSL for semantic color labeling
key_files:
  created:
    - src/design/types.ts
    - src/analysis/types.ts
    - src/assets/types.ts
    - src/design/parseTokens.ts
    - src/design/mapFonts.ts
    - src/design/parseTokens.test.ts
  modified: []
decisions:
  - TOKEN_REGEX targets UUID-keyed vars only (not --ww-* or named vars) to avoid false matches
  - Color semantic labels assigned via hex-to-HSL with saturation < 10% threshold for gray detection
  - googleFontUrls returned as empty array from parseDesignTokens; populated separately by extractGoogleFontUrls
metrics:
  duration_minutes: 2
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 02 Plan 01: Type Contracts and Design Token Extraction Summary

**One-liner:** Three Phase 2 type contracts plus CSS token extractor with UUID regex, font/color/dimension classification, h1-h6 semantic ranking, hex deduplication, and Google Font URL extraction.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create Phase 2 type contracts (design, analysis, assets) | 227e7d7 | src/design/types.ts, src/analysis/types.ts, src/assets/types.ts |
| 2 (RED) | Add failing tests for parseDesignTokens and extractGoogleFontUrls | ae9f5cf | src/design/parseTokens.test.ts |
| 2 (GREEN) | Implement design token parser and Google Font extractor | bd04dc7 | src/design/parseTokens.ts, src/design/mapFonts.ts |

## What Was Built

**Type contracts (6 new files):**
- `src/design/types.ts`: `DesignToken` (uuid, value, type, fontSizePx, fontWeight, lineHeight, semanticLabel) and `DesignSystem` (fonts, colors, dimensions, raw, googleFontUrls)
- `src/analysis/types.ts`: `ParsedPage`, `ParsedSection`, `ParsedObject` (with `children: ParsedObject[]` recursive tree), `WorkflowSpec`, `ActionSpec`, `VariableEntry`, `CollectionEntry`, `SiteAnalysis` (with `sharedSections: Map<string, string>`)
- `src/assets/types.ts`: `AssetEntry`, `AssetManifest`

**Parsing implementation:**
- `src/design/parseTokens.ts`: `parseDesignTokens(html)` — extracts UUID-keyed CSS vars, classifies by value pattern, sorts fonts by size descending, deduplicates colors, assigns h1-h6/gray-N/primary/secondary/accent semantic labels
- `src/design/mapFonts.ts`: `extractGoogleFontUrls(html)` — extracts and deduplicates Google Fonts CSS2 API URLs

**Tests:** 20 passing vitest tests covering all classification paths, deduplication, semantic labels, and edge cases.

## Verification

- `npx tsc --noEmit` — passes (no errors)
- `npx vitest run src/design/` — 20/20 tests pass

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all exports are fully implemented with no placeholder values or TODOs.

## Self-Check: PASSED

Files verified:
- FOUND: src/design/types.ts
- FOUND: src/analysis/types.ts
- FOUND: src/assets/types.ts
- FOUND: src/design/parseTokens.ts
- FOUND: src/design/mapFonts.ts
- FOUND: src/design/parseTokens.test.ts

Commits verified:
- FOUND: 227e7d7 (feat(02-01): create Phase 2 type contracts)
- FOUND: ae9f5cf (test(02-01): add failing tests)
- FOUND: bd04dc7 (feat(02-01): implement design token parser)
