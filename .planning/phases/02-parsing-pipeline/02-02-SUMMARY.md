---
phase: 02-parsing-pipeline
plan: 02
subsystem: assets
tags: [asset-manifest, asset-copy, shell-exec, tdd]
dependency_graph:
  requires: []
  provides: [buildAssetManifest, copyAssets, AssetManifest, AssetEntry]
  affects: [src/assets/types.ts, src/assets/buildManifest.ts, src/assets/copy.ts]
tech_stack:
  added: []
  patterns: [shell-exec-check-then-copy, tdd-red-green, zip-entry-filtering]
key_files:
  created:
    - src/assets/types.ts
    - src/assets/buildManifest.ts
    - src/assets/buildManifest.test.ts
    - src/assets/copy.ts
  modified: []
decisions:
  - "Filter entries by prefix (images/, icons/) not by extension — matches WeWeb ZIP structure exactly"
  - "assets/ directory entries excluded at manifest level (compiled JS/CSS bundles, not user assets)"
  - "Graceful missing-directory handling via test -d check before cp -r (WeWeb exports may omit images or icons)"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-24"
  tasks: 2
  files: 4
---

# Phase 02 Plan 02: Asset Enumeration and Copy Summary

**One-liner:** ZIP-entry-based asset manifest builder and shell-exec copy module for images and icons with graceful missing-directory handling.

## What Was Built

Two modules implementing the asset pipeline for WeWeb export processing:

1. **`src/assets/types.ts`** — `AssetEntry` and `AssetManifest` interfaces (created fresh; Plan 02-01 had not yet created this file at execution time).

2. **`src/assets/buildManifest.ts`** — `buildAssetManifest(entries, googleFontUrls)`: filters ZIP entry strings by `images/` and `icons/` prefixes, excludes directory entries (ending with `/`), excludes `assets/` prefix entirely (compiled bundles). Maps each entry to `{ filename, projectRelativePath: '.shipstudio/assets/' + entry }`. Returns `AssetManifest` with `totalCopied = images.length + icons.length`.

3. **`src/assets/copy.ts`** — `copyAssets(shell, extractDir, projectPath)`: creates `.shipstudio/assets/images` and `.shipstudio/assets/icons` via `mkdir -p`, checks source directory existence with `test -d`, uses `cp -r` for recursive copy (handles `icons/lucide/` subdirectory), suppresses errors with `2>/dev/null || true` for graceful handling of empty directories.

4. **`src/assets/buildManifest.test.ts`** — 5 vitest unit tests covering: correct counts for sample entries, image `projectRelativePath` format, icon subdirectory `projectRelativePath` format, empty entries case, and `assets/` exclusion.

## Verification

- `npx vitest run src/assets/` — 5/5 tests pass
- `npx tsc --noEmit` — compiles cleanly

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Filter by prefix not extension | WeWeb ZIP structure is predictable; prefix filtering is simpler and avoids false matches from filenames with image extensions in other directories |
| Exclude assets/ at manifest level | Compiled JS/CSS bundles in assets/ are not user assets and should never appear in the brief's asset list |
| test -d before cp -r | WeWeb exports may not always include both images/ and icons/ directories; graceful skip prevents false errors |
| types.ts created by this plan | Plan 02-01 had not yet created src/assets/types.ts at execution time (parallel execution); plan guard language accounted for this case |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functions are fully implemented and wired.

## Self-Check: PASSED

All 4 created files exist on disk. All 3 task commits found in git log.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 155a697 | test | Failing tests for buildAssetManifest (RED phase) |
| 9dc0039 | feat | buildAssetManifest implementation and AssetManifest types (GREEN phase) |
| a1da1f0 | feat | copyAssets for images and icons directories |
