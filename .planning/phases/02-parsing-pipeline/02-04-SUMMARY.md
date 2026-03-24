---
phase: 02-parsing-pipeline
plan: 04
subsystem: workflow-parsing
tags: [workflows, interactions, variables, collections, tdd, chain-linearization]
dependency_graph:
  requires:
    - src/analysis/types.ts (WorkflowSpec, ActionSpec, VariableEntry, CollectionEntry)
  provides:
    - src/analysis/parseWorkflows.ts (linearizeWorkflowChain, buildVariableIndex, parsePageWorkflows, parseElementInteractions, parseVariables, parseCollections)
    - src/analysis/parseWorkflows.test.ts (9 unit tests)
  affects:
    - Any downstream code consuming WorkflowSpec[] (e.g., parsePage, generateBrief)
tech_stack:
  added: []
  patterns:
    - Linked-list chain walk via firstAction + next pointer with visited Set cycle guard
    - Variable ID resolution via Map<id, name> built from page variable dict
    - Raw unknown[] -> typed interface mapping with null-safe fallbacks
key_files:
  created:
    - src/analysis/parseWorkflows.ts
    - src/analysis/parseWorkflows.test.ts
  modified: []
decisions:
  - linearizeWorkflowChain accepts optional variableIndex parameter (defaults to empty Map) so callers can pass or omit resolution context
  - varId extracted from wwpiId ?? variableId ?? id to handle observed WeWeb field name variations
  - details object only populated for action types that have meaningful extractable config (fetch-collection, custom-js, change-page, if, switch)
metrics:
  duration_minutes: 2
  completed_date: "2026-03-24"
  tasks_completed: 1
  files_created: 2
  files_modified: 0
---

# Phase 02 Plan 04: Workflow/Interaction Parsing Summary

**One-liner:** Workflow chain linearizer with cycle-guarded linked-list walk, variable ID-to-name resolution via Map index, and typed parsers for page workflows, element interactions, variables, and collections.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 (RED) | Add failing tests for workflow parsing and variable resolution | 315067e | src/analysis/parseWorkflows.test.ts |
| 1 (GREEN) | Implement workflow parser with chain linearization and variable inventory | f9638fc | src/analysis/parseWorkflows.ts |

## What Was Built

**`src/analysis/parseWorkflows.ts`** — six exported functions:

- `linearizeWorkflowChain(firstActionId, actionsMap, variableIndex?)`: Walks the flat action dict via `firstAction -> next -> next` pointer chain. Cycle-guarded with a `visited Set`. Resolves `varId` to `varName` for `variable` action type. Extracts `details` for `fetch-collection`, `custom-js`, `change-page`, `if`, and `switch` action types. Returns `[]` for falsy or missing `firstActionId`.

- `buildVariableIndex(variables)`: Creates `Map<string, string>` mapping variable `id` -> `name` from a raw variables array.

- `parsePageWorkflows(pageWorkflows, pageName, variableIndex)`: Maps `page.page.workflows[]` (NOT `page.workflows` — always empty) to `WorkflowSpec[]` with `sourceType: 'page'`. Sets `triggerCondition` if `triggerConditions.__wwtype` is present.

- `parseElementInteractions(interactions, elementName, variableIndex)`: Maps `wwObject._state.interactions[]` to `WorkflowSpec[]` with `sourceType: 'element'`.

- `parseVariables(rawVars)`: Maps raw variable objects to `VariableEntry[]` with `isLocalStorage` and `isPersistentOnNav` as boolean flags.

- `parseCollections(rawColls)`: Maps raw collection objects to `CollectionEntry[]` reading `mode` for type classification and `config.table` for table reference.

**Tests:** 9 passing vitest tests covering all 6 exported functions.

## Verification

- `npx tsc --noEmit` — passes (no errors)
- `npx vitest run src/analysis/parseWorkflows.test.ts` — 9/9 tests pass

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all exports are fully implemented with no placeholder values or TODOs.

## Self-Check: PASSED

Files verified:
- FOUND: src/analysis/parseWorkflows.ts
- FOUND: src/analysis/parseWorkflows.test.ts

Commits verified:
- FOUND: 315067e (test(02-04): add failing tests for workflow parsing)
- FOUND: f9638fc (feat(02-04): implement workflow parser)
