---
phase: 03-brief-generation-output
verified: 2026-03-24T17:35:00Z
status: gaps_found
score: 12/13 must-haves verified
re_verification: false
gaps:
  - truth: "Brief contains shared layout section listing sections on >50% of pages"
    status: partial
    reason: "BRIEF-03 requires 'confidence level' per REQUIREMENTS.md ('identifying nav/header/sidebar/footer with confidence level') but buildSharedLayoutSection emits only sectionBaseId and title columns — no confidence level column or nav/header/sidebar/footer classification"
    artifacts:
      - path: "src/brief/generate.ts"
        issue: "buildSharedLayoutSection table has 2 columns (Section Base ID, Title) — missing confidence level and section type classification required by BRIEF-03"
    missing:
      - "Add a confidence or section-type column to the shared layout table (e.g. percentage of pages it appears on, or a nav/header/footer/sidebar label derived from title heuristics)"
human_verification:
  - test: "End-to-end brief generation in Ship Studio"
    expected: "Mode cards render, best-site preserve checkboxes appear, pipeline runs, brief is generated and saved to .shipstudio/assets/brief.md, results panel shows stats and copy button, token warning appears when brief exceeds 12K tokens"
    why_human: "Full pipeline requires Ship Studio host, shell.exec, and the physical WeWeb ZIP file — cannot be driven programmatically from CLI"
---

# Phase 3: Brief Generation Output Verification Report

**Phase Goal:** Users receive a complete, structured Markdown brief they can copy to an AI agent to begin reconstruction
**Verified:** 2026-03-24T17:35:00Z
**Status:** gaps_found (1 gap)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `generateBrief()` returns a BriefResult with markdown, charCount, estimatedTokens, and stats | VERIFIED | `src/brief/generate.ts:385-414` — returns all four fields; 57 tests pass covering BriefResult shape |
| 2 | Brief contains site overview with page count, component count, asset count | VERIFIED | `buildOverviewSection` at line 131 — table with Route, Sections, Components, Dynamic plus total row |
| 3 | Brief contains design system tables for typography, colors, spacing, and Google Fonts | VERIFIED | `buildDesignSystemSection` at line 157 — four guarded subsections, each only emitted when tokens exist |
| 4 | Brief contains shared layout section listing sections on >50% of pages | PARTIAL | `buildSharedLayoutSection` at line 197 exists and guards on sharedSections.size, but BRIEF-03 requires "confidence level" — only title + baseId columns present, no confidence/classification |
| 5 | Brief contains per-page sections with depth-capped component tree (max depth 3) | VERIFIED | `renderComponentTree` at line 218 — depth cap enforced with `countDescendants` fallback, `isShared` filtered in `buildPageSubsection:290` |
| 6 | Brief contains responsive breakpoint diffs only when non-empty | VERIFIED | `renderBreakpointDiffs` at line 249 — guards with `Object.keys(...).length > 0` before emitting |
| 7 | Brief contains workflow/interaction specs per page and per element | VERIFIED | `renderWorkflows` at line 269 — renders trigger + action chain numbered list |
| 8 | Brief contains asset inventory with project-relative paths | VERIFIED | `buildAssetsSection` at line 318 — images/icons tables with filename + path, font list, total count |
| 9 | Brief contains migration guidance notes per component type | VERIFIED | `buildMigrationGuidanceSection` at line 366 with `COMPONENT_MIGRATION_NOTES` lookup (18 entries); fallback "Implement as custom component" |
| 10 | Brief adapts instructions section based on pixel-perfect vs best-site mode | VERIFIED | `buildInstructionsSection` at line 94 — bifurcated on `input.mode`; preserve labels and customNotes blockquote for best-site |
| 11 | `saveBrief` writes markdown to `.shipstudio/assets/brief.md` via base64 shell pattern | VERIFIED | `src/brief/io.ts:8-23` — `mkdir -p` guard + `btoa(unescape(encodeURIComponent(...)))` + `base64 -d` redirect to brief.md |
| 12 | `copyToClipboard` pipes base64-decoded markdown to pbcopy | VERIFIED | `src/brief/io.ts:25-37` — same encoding, `base64 -d \| pbcopy` |
| 13 | User sees mode selection cards and best-site preserve UI; done state shows stats, copy button, token warning | VERIFIED | `src/views/MainView.tsx` — mode cards at idle, preserve section conditionally shown, results panel with stats/warning/copy/select-another |

**Score:** 12/13 truths verified (1 partial)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/brief/types.ts` | BriefMode, PreserveOption, PRESERVE_OPTIONS, DEFAULT_PRESERVE, BriefInput, BriefResult, BriefStats, TOKEN_WARNING_THRESHOLD | VERIFIED | All 8 exports present, 54 lines, fully typed |
| `src/brief/generate.ts` | generateBrief, estimateTokens, all section builders | VERIFIED | 415 lines, 9 section builders, all required exports present |
| `src/brief/io.ts` | saveBrief, copyToClipboard | VERIFIED | 38 lines, both exports, mkdir guard and Unicode-safe encoding confirmed |
| `src/brief/generate.test.ts` | Unit tests for generateBrief section builders | VERIFIED | 47 tests covering all section builders, mode gates, depth cap, isShared filter |
| `src/brief/io.test.ts` | Unit tests for saveBrief and copyToClipboard | VERIFIED | 10 tests — saveBrief (6), copyToClipboard (4), error paths covered |
| `src/zip/types.ts` | Updated ZipStep done variant with briefResult field | VERIFIED | `briefResult: BriefResult` on done variant, import from brief/types confirmed |
| `src/views/MainView.tsx` | Mode UI, brief generation integration, done-state results panel | VERIFIED | All required patterns present — imports, state, mode cards, preserve section, generateBrief call, saveBrief call, results panel |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/brief/generate.ts` | `src/brief/types.ts` | `import BriefInput, BriefResult` | WIRED | Line 1: `import type { BriefInput, BriefResult, BriefStats, PreserveOption } from './types'` |
| `src/brief/generate.ts` | `src/analysis/types.ts` | uses SiteAnalysis, ParsedPage, etc. | WIRED | Line 2: `import type { SiteAnalysis, ParsedPage, ParsedSection, ParsedObject, WorkflowSpec } from '../analysis/types'` |
| `src/brief/generate.ts` | `src/design/types.ts` | uses DesignSystem, DesignToken | WIRED | Line 3: `import type { DesignSystem, DesignToken } from '../design/types'` |
| `src/brief/io.ts` | shell.exec | base64 encode/decode shell commands | WIRED | Lines 16-19, 28-31: `shell.exec('bash', ['-c', ...])` with `btoa(unescape(encodeURIComponent(...)))` |
| `src/views/MainView.tsx` | `src/brief/generate.ts` | import generateBrief | WIRED | Line 9: `import { generateBrief } from '../brief/generate'` |
| `src/views/MainView.tsx` | `src/brief/io.ts` | import saveBrief, copyToClipboard | WIRED | Line 10: `import { saveBrief, copyToClipboard } from '../brief/io'` |
| `src/views/MainView.tsx` | `src/brief/types.ts` | import BriefMode, PRESERVE_OPTIONS, etc. | WIRED | Lines 7-8: both type and value imports confirmed |
| `src/zip/types.ts` | `src/brief/types.ts` | import BriefResult for done variant | WIRED | Line 1: `import type { BriefResult } from '../brief/types'` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `src/views/MainView.tsx` | `step.briefResult` | `generateBrief(...)` called in `startPickFlow` at line 76 after live `analyzeSite` call | Yes — briefResult populated from real analysis pipeline output, not hardcoded | FLOWING |
| `src/views/MainView.tsx` | `step.briefResult.estimatedTokens` | `estimateTokens(markdown)` via `generateBrief` | Yes — computed from actual markdown length | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `generateBrief` exports function | `node -e "const m = require('./dist/index.js')"` | Build succeeded (60.06 kB output), TypeScript clean | PASS |
| All brief module tests pass | `npx vitest run src/brief/` | 2 test files, 57 tests, 0 failures | PASS |
| All project tests pass | `npx vitest run` | 8 test files, 118 tests, 0 failures | PASS |
| TypeScript compiles cleanly | `npx tsc --noEmit` | No errors, no output | PASS |
| Production build succeeds | `npm run build` | dist/index.js 60.06 kB, built in 55ms | PASS |
| End-to-end pipeline in Ship Studio | requires Ship Studio host + ZIP file | Cannot test without runtime | SKIP — human verification needed |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| BRIEF-01 | 03-01 | Markdown brief with site overview (page count, asset count, component count) | SATISFIED | `buildOverviewSection` + `buildMetadataSection` — page count, component count, asset count all in brief |
| BRIEF-02 | 03-01 | Design system section with classified token tables (typography, colors, spacing) | SATISFIED | `buildDesignSystemSection` — three guarded subsections for each token type |
| BRIEF-03 | 03-01 | Shared layout section identifying nav/header/sidebar/footer **with confidence level** | PARTIAL | `buildSharedLayoutSection` emits title+baseId only; no confidence level or type classification |
| BRIEF-04 | 03-01 | Per-page sections with component summaries and section structure | SATISFIED | `buildPagesSection` + `buildPageSubsection` + `renderComponentTree` |
| BRIEF-05 | 03-01 | Responsive breakpoint diffs per section | SATISFIED | `renderBreakpointDiffs` — guards on non-empty styleMobile/styleTablet |
| BRIEF-06 | 03-01 | Workflow/interaction specs | SATISFIED | `renderWorkflows` — trigger + action chain per WorkflowSpec |
| BRIEF-07 | 03-01 | Asset inventory with paths and metadata | SATISFIED | `buildAssetsSection` — images, icons, fonts tables with project-relative paths |
| BRIEF-08 | 03-01 | Migration guidance per component type | SATISFIED | `buildMigrationGuidanceSection` + `COMPONENT_MIGRATION_NOTES` with 18 entries |
| BRIEF-09 | 03-02 | Token count estimation + warning if exceeds threshold | SATISFIED | `estimateTokens` + `TOKEN_WARNING_THRESHOLD` used in MainView results panel |
| BRIEF-10 | 03-01 | Content adapts based on mode (pixel-perfect vs best-site) | SATISFIED | `buildInstructionsSection` bifurcated by mode; preserve labels and customNotes only in best-site |
| UX-03 | 03-02 | User can choose pixel-perfect vs best-site mode with preserve options | SATISFIED | Mode cards + preserve checkboxes + custom notes textarea in MainView idle state |
| UX-05 | 03-02 | User can copy brief to clipboard | SATISFIED | "Copy Brief to Clipboard" button calls `copyToClipboard` in done state |
| UX-06 | 03-02 | Plugin saves brief to `.shipstudio/assets/brief.md` | SATISFIED | `saveBrief` called in `startPickFlow` after `generateBrief`; path shown in results panel |

**Orphaned requirements:** None. All 13 requirement IDs from both plans appear in the traceability table and are mapped to Phase 3 in REQUIREMENTS.md.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| No blockers found | — | — | — | — |

Scan notes:
- No `TODO`, `FIXME`, `PLACEHOLDER` comments in brief module
- No `return null` / `return []` stubs in section builders
- Empty string returns in builders (`buildSharedLayoutSection` returning `''` when no shared sections) are correct guards, not stubs
- `result` state removed from MainView — no orphaned `setResult(null)` calls

---

### Human Verification Required

#### 1. End-to-End Brief Generation Flow

**Test:** Build the plugin (`npm run build`), load in Ship Studio, select the WeWeb ZIP, run the full pipeline
**Expected:**
- Mode cards appear at idle (Pixel Perfect default-selected)
- Clicking Best Site reveals preserve checkboxes and custom notes textarea
- Pipeline shows "Generating brief..." after analysis
- Done state shows: stats line, ".shipstudio/assets/brief.md" path, "Copy Brief to Clipboard" button, "Select Another" button
- Pasting clipboard shows "# WeWeb Migration Brief" with all major sections
- `.shipstudio/assets/brief.md` exists on disk with valid Markdown
- If brief > 12K tokens, yellow warning tip appears

**Why human:** Requires Ship Studio host runtime, `shell.exec` for real filesystem operations, and the physical `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` WeWeb export file — none of which are available in a headless CLI environment.

---

### Gaps Summary

**1 gap blocking full BRIEF-03 compliance:**

BRIEF-03 in REQUIREMENTS.md specifies: "shared layout section identifying nav/header/sidebar/footer with confidence level". The implemented `buildSharedLayoutSection` produces a valid and useful table of sections appearing on >50% of pages, but it lacks:
- A **confidence level** column (e.g., percentage of pages the section appears on)
- A **type classification** (nav/header/sidebar/footer heuristic based on section title)

This is a narrowly-scoped gap. The section title is already present, so a simple heuristic (title contains "nav" → "nav", "footer" → "footer", etc.) and a frequency ratio (sharedSections frequency / total pages) could satisfy the requirement. All other section builder behavior is correct.

The remaining 12 must-haves are fully verified with passing tests, clean TypeScript, a successful production build (60.06 kB), and 118/118 tests passing across the full test suite.

---

_Verified: 2026-03-24T17:35:00Z_
_Verifier: Claude (gsd-verifier)_
