---
phase: 01-plugin-shell-zip-ingestion
plan: "01"
subsystem: zip-ingestion
tags: [scaffold, zip, validation, types, tests]
dependency_graph:
  requires: []
  provides:
    - parseUnzipManifest
    - validateWeWebExport
    - pickZipFile
    - buildExtractDir
    - extractAndVerify
    - Shell
    - Storage
    - PluginActions
    - PluginContextValue
    - ZipStep
    - ZipManifest
    - ExtractionResult
  affects: []
tech_stack:
  added:
    - TypeScript 5.6 (devDep)
    - Vite 6 (devDep)
    - Vitest 4.1 (devDep)
    - jsdom 29 (devDep)
    - "@types/react 19 (devDep)"
  patterns:
    - Shell abstraction for all file system operations
    - Peer React 19 (no bundled React)
    - createMockShell pattern for unit testing shell-dependent functions
key_files:
  created:
    - package.json
    - plugin.json
    - vite.config.ts
    - tsconfig.json
    - vitest.config.ts
    - src/types.ts
    - src/context.ts
    - src/styles.ts
    - src/zip/types.ts
    - src/zip/extract.ts
    - src/zip/discover.ts
    - src/zip/discover.test.ts
  modified: []
decisions:
  - "4-fingerprint WeWeb validation in cheapness order: data/*.json → manifest.json → div#app grep → _wwcv= grep"
  - "CSS class prefix ww2c- (distinct from webflow-to-code wf2c-) for style isolation"
  - "pickZipFile prompt: 'Select WeWeb export zip'"
metrics:
  duration_seconds: 203
  completed_date: "2026-03-24"
  tasks_completed: 3
  files_created: 12
  files_modified: 0
---

# Phase 1 Plan 1: Plugin Shell and ZIP Ingestion Summary

**One-liner:** Project scaffold with 4-fingerprint WeWeb ZIP validation (data/*.json, manifest.json, div#app, _wwcv=) using Shell abstraction and 7 passing unit tests.

## What Was Built

Established the complete project foundation for `plugin-weweb-to-code` and implemented the core ZIP extraction and validation pipeline.

### Task 1: Project Scaffold (commit: bb206cc)

- `package.json` — `@shipstudio/plugin-weweb-to-code`, no runtime deps (React as peer only)
- `plugin.json` — id `weweb-to-code`, slot `toolbar`, api_version 1
- `vite.config.ts` — verbatim from webflow-to-code (React externalized via data: URL)
- `tsconfig.json` — ES2020, bundler module resolution, strict, jsx react-jsx
- `vitest.config.ts` — includes `src/**/*.test.ts`
- `npm install` — 132 packages installed

### Task 2: Core Types and ZIP Pipeline (commit: 59b2835)

- `src/types.ts` — Shell, Storage, PluginActions, PluginContextValue interfaces
- `src/context.ts` — usePluginContext hook via window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__
- `src/styles.ts` — STYLE_ID `weweb-to-code-styles`, all CSS classes prefixed `ww2c-`
- `src/zip/types.ts` — ZipStep, ZipManifest, ExtractionResult (no Phase 2+ imports)
- `src/zip/extract.ts` — pickZipFile (prompts "Select WeWeb export zip"), buildExtractDir, extractAndVerify
- `src/zip/discover.ts` — parseUnzipManifest (verbatim) + validateWeWebExport (4-fingerprint)

### Task 3: Unit Tests (commit: 1712af0)

`src/zip/discover.test.ts` — 7 tests:
- parseUnzipManifest: parses valid unzip -l output with correct fileCount and entries
- parseUnzipManifest: returns fileCount 0 for empty input
- validateWeWebExport: resolves for valid entries + shell responses
- validateWeWebExport: throws for missing data/*.json
- validateWeWebExport: throws for missing manifest.json
- validateWeWebExport: throws for missing div#app (grep returns 0)
- validateWeWebExport: throws for missing _wwcv= (grep returns 0)

## Verification Results

1. `npx tsc --noEmit` — exits 0 (TypeScript compiles clean)
2. `npx vitest run` — 7/7 tests pass
3. `grep -c 'ww2c-' src/styles.ts` — 37 (prefix applied throughout)
4. `grep -c 'wf2c-' src/styles.ts` — 0 (no old prefix remnants)
5. `grep 'Select WeWeb export zip' src/zip/extract.ts` — match found
6. `grep 'validateWeWebExport' src/zip/discover.ts` — match found

## Deviations from Plan

None — plan executed exactly as written.

The TDD task (Task 3) had implementation already written in Task 2 as part of the same plan. Tests confirmed all behaviors pass from the first run. This is expected given the plan structure: Task 2 was explicitly instructed to implement validateWeWebExport, and Task 3 was to write tests confirming that implementation.

## Known Stubs

None — all functions are fully implemented. `src/zip/discover.ts` and `src/zip/extract.ts` are complete functional modules, not placeholders.

## Self-Check: PASSED

Files verified:
- FOUND: package.json
- FOUND: plugin.json
- FOUND: vite.config.ts
- FOUND: tsconfig.json
- FOUND: vitest.config.ts
- FOUND: src/types.ts
- FOUND: src/context.ts
- FOUND: src/styles.ts
- FOUND: src/zip/types.ts
- FOUND: src/zip/extract.ts
- FOUND: src/zip/discover.ts
- FOUND: src/zip/discover.test.ts

Commits verified:
- FOUND: bb206cc (chore(01-01): initialize project scaffold)
- FOUND: 59b2835 (feat(01-01): create core type modules)
- FOUND: 1712af0 (test(01-01): add unit tests)
