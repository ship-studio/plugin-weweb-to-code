---
phase: 02-parsing-pipeline
plan: "03"
subsystem: analysis
tags: [parsing, tree-walker, components, tdd]
dependency_graph:
  requires: ["02-01"]
  provides: ["02-04", "02-05"]
  affects: ["src/analysis/"]
tech_stack:
  added: []
  patterns:
    - "3-pronged wwObject tree walker (content.wwObjects + parentSectionId + libraryComponent roots)"
    - "greedy getAllWwRefs for 28+ slot types including array-of-arrays"
    - "isDynamicBinding detection for __wwtype f/js bindings"
    - "lookupComponentType with UUID prefix table + name + custom-component fallback"
    - "TDD RED-GREEN cycle for tree walker"
key_files:
  created:
    - src/analysis/componentLookup.ts
    - src/analysis/parsePages.ts
    - src/analysis/parseObjects.ts
    - src/analysis/parseObjects.test.ts
  modified: []
decisions:
  - "lookupComponentType uses first 8 chars of wwObjectBaseId UUID as lookup key — matches research-verified prefix table"
  - "getAllWwRefs stops recursion at isWwObject refs — prevents false positives from nested content within ref objects"
  - "buildComponentTree prong 3 (libraryComponent roots) is caller responsibility at page level, not per-section"
  - "interactions stored as raw WorkflowSpec[] — Plan 04 (parseWorkflows) will linearize action chains"
  - "imageUrl skips CDN placeholders containing cdn.weweb.app — these are WeWeb-internal default assets"
metrics:
  duration_minutes: 25
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 2 Plan 3: Page Parser and 3-Pronged Tree Walker Summary

**One-liner:** Page discovery with route normalization, 3-pronged recursive wwObject tree walker, and component type lookup table with greedy slot traversal covering all 28 named slot types.

## What Was Built

### Task 1: Component Lookup Table and Route Normalization

**src/analysis/componentLookup.ts** — exports `COMPONENT_LOOKUP` (26 known wwObjectBaseId prefixes → human-readable labels) and `lookupComponentType(wwObjectBaseId, name)` with three-tier fallback: lookup table → name field → `'custom-component'`.

**src/analysis/parsePages.ts** — exports:
- `readJsonFile<T>(shell, filePath)` — base64 shell read pattern for safe JSON loading (handles backticks/special chars in workflow code fields)
- `normalizeRoute(path)` — converts WeWeb `{{param|}}` syntax to `[param]` for standard dynamic route notation
- `parsePageData(pageJson, pageId)` — parses a raw data/*.json into `ParsedPage` with sections (empty components arrays), variables (with isLocalStorage/isPersistentOnNav flags), collections (with config.table reference), and route metadata

### Task 2: 3-Pronged Recursive Tree Walker (TDD)

**src/analysis/parseObjects.ts** — exports:
- `getAllWwRefs(val)` — greedy recursive finder that returns uid strings from `{isWwObject: true, uid: string}` structures at any depth; handles single-ref, array, array-of-arrays, and deeply-nested slots; stops at the ref object (does not recurse into it)
- `isDynamicBinding(val)` — type guard for `{__wwtype: 'f'|'js'}` objects
- `buildComponentTree(section, objectMap, parentSectionIndex, visited)` — implements prong 1 (content.{bp}.wwObjects refs) and prong 2 (parentSectionId fallback for linked/shared sections); returns `ParsedObject[]`

**src/analysis/parseObjects.test.ts** — 14 tests covering all specified scenarios.

## Tests

| Test | Description | Result |
|------|-------------|--------|
| getAllWwRefs - nested | Finds single nested ref | PASS |
| getAllWwRefs - stop at ref | Does not descend into isWwObject objects | PASS |
| getAllWwRefs - array-of-arrays | tabsContent pattern | PASS |
| getAllWwRefs - primitives | Returns [] for null/string/number | PASS |
| getAllWwRefs - empty object | Returns [] | PASS |
| isDynamicBinding - formula | `__wwtype: 'f'` → true | PASS |
| isDynamicBinding - JS | `__wwtype: 'js'` → true | PASS |
| isDynamicBinding - false cases | No __wwtype, null, string, unknown type | PASS (4 tests) |
| buildComponentTree prong 1 | content.wwObjects 2-level tree | PASS |
| buildComponentTree prong 2 | parentSectionId fallback for linked section | PASS |
| buildComponentTree cycle guard | a→b→a terminates without stack overflow | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `interactions` in each `ParsedObject` are stored as raw `WorkflowSpec[]` — Plan 04 (parseWorkflows) will linearize the `firstAction → next` action chains into proper `ActionSpec[]` arrays
- `ParsedPage.workflows` is always `[]` — populated by Plan 04
- Section `components: []` — populated by the orchestrator (analyze.ts, Plan 05) after calling `buildComponentTree` for each section

These stubs are intentional and documented in the plan. They do not prevent this plan's goal (building the tree walker) from being achieved.

## Self-Check: PASSED

All created files verified present. All commits verified in git log:
- `f17fe32` — feat(02-03): component type lookup table and page parser
- `94d6f71` — test(02-03): add failing tests for 3-pronged tree walker
- `3bdf1e7` — feat(02-03): implement 3-pronged recursive tree walker
