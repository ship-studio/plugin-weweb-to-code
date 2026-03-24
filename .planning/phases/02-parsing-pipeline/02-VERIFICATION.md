---
phase: 02-parsing-pipeline
verified: 2026-03-24T16:28:00Z
status: passed
score: 17/17 must-haves verified
gaps: []
---

# Phase 2: Parsing Pipeline Verification Report

**Phase Goal:** Plugin extracts the full site model — design tokens, component trees, interactions, and assets — from the WeWeb export data
**Verified:** 2026-03-24T16:28:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CSS :root block is parsed into classified token arrays (font, color, dimension) | VERIFIED | `parseTokens.ts:188` — `parseDesignTokens()` returns DesignSystem with fonts/colors/dimensions/raw; TOKEN_REGEX targets UUID-keyed vars |
| 2 | Font tokens are sorted by size descending with H1-H6 semantic labels | VERIFIED | `parseTokens.ts:219-227` — `fonts.sort()` by fontSizePx desc, loop assigns h1-h6 then body-N |
| 3 | Color tokens are deduplicated by hex value | VERIFIED | `parseTokens.ts:231-239` — seenHex Set deduplication; `assignColorSemanticLabels` assigns gray-N/primary/secondary/accent |
| 4 | Google Font URLs are extracted from HTML head link tags | VERIFIED | `mapFonts.ts:6-11` — regex matches `fonts.googleapis.com/css2`; deduplicated via Set |
| 5 | All Phase 2 type contracts are defined for downstream consumers | VERIFIED | `src/design/types.ts`, `src/analysis/types.ts`, `src/assets/types.ts` all exist and compile clean |
| 6 | images/ and icons/ directories are copied to .shipstudio/assets/ | VERIFIED | `assets/copy.ts:18-50` — `copyAssets()` with test-d existence check then `cp -r` |
| 7 | Asset manifest contains file counts and project-relative paths | VERIFIED | `assets/buildManifest.ts:14-38` — `buildAssetManifest()` returns AssetManifest with images, icons, totalCopied |
| 8 | Google Font URLs are included in the asset manifest | VERIFIED | `analyze.ts:247` — `buildAssetManifest(entries, designSystem.googleFontUrls)` passes through extracted URLs |
| 9 | All pages are discovered from data/*.json with correct routes | VERIFIED | `analyze.ts:127-132` — filters entries by `data/*.json`; `parsePages.ts:107-109` — normalizeRoute converts {{param|}} to [param] |
| 10 | Component tree is built by 3-pronged walk: content.wwObjects + parentSectionId fallback + libraryComponent roots | VERIFIED | `parseObjects.ts:215-244` — prong 1+2; `analyze.ts:183-195` — prong 3 (libraryComponent roots via dummy section wrapper) |
| 11 | All 28+ slot types are handled via greedy getAllWwRefs traversal | VERIFIED | `parseObjects.ts:60-68` — `getAllWwRefs()` recurses through all object values, handles array-of-arrays; stops at isWwObject refs |
| 12 | wwObjectBaseId mapped to human-readable component type via lookup table with name fallback | VERIFIED | `componentLookup.ts:6-52` — 26-entry lookup table keyed on first 8 UUID chars; falls back to name then 'custom-component' |
| 13 | Dynamic bindings (__wwtype: f/js) flagged with [DYNAMIC] annotation | VERIFIED | `parseObjects.ts:83-90` — `isDynamicBinding()` detects __wwtype 'f'/'js'; `parseObjects.ts:138-157` — text/imageUrl set to '[DYNAMIC]' |
| 14 | Responsive breakpoint diffs (mobile/tablet vs default) extracted per component | VERIFIED | `parseObjects.ts:160-162` — styleDefault/styleMobile/styleTablet from `_state.style`; `parsePages.ts:131-141` — same for sections |
| 15 | Workflow chains linearized and element interactions captured | VERIFIED | `parseWorkflows.ts:8-75` — `linearizeWorkflowChain()` walks firstAction→next chain with visited Set cycle guard |
| 16 | Variable IDs resolved to names; variables/collections inventoried | VERIFIED | `parseWorkflows.ts:80-190` — `buildVariableIndex()`, `parseVariables()` (with isLocalStorage/isPersistentOnNav), `parseCollections()` (with config.table) |
| 17 | Shared layout sections detected by sectionBaseId frequency across distinct pages | VERIFIED | `detectShared.ts:16-58` — Map<sectionBaseId, Set<pageId>>, threshold = pages.length * 0.5, mutates isShared |

**Score:** 17/17 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/design/types.ts` | DesignToken, DesignSystem interfaces | VERIFIED | Exports both; DesignToken has `type: 'font' | 'color' | 'dimension' | 'raw'` |
| `src/design/parseTokens.ts` | parseDesignTokens function | VERIFIED | Exports `parseDesignTokens`; UUID TOKEN_REGEX, font/color/dimension classification, dedup, semantic labels |
| `src/design/mapFonts.ts` | extractGoogleFontUrls function | VERIFIED | Exports `extractGoogleFontUrls`; regex matches css2 URLs; deduplicates |
| `src/design/parseTokens.test.ts` | Unit tests for token parsing | VERIFIED | 20 tests; all pass |
| `src/analysis/types.ts` | ParsedPage, ParsedSection, ParsedObject, SiteAnalysis, WorkflowSpec, ActionSpec, VariableEntry, CollectionEntry | VERIFIED | All 8 interfaces exported; ParsedObject has `children: ParsedObject[]`; SiteAnalysis has `sharedSections: Map<string, string>` |
| `src/assets/types.ts` | AssetManifest, AssetEntry interfaces | VERIFIED | Both interfaces exported |
| `src/assets/buildManifest.ts` | buildAssetManifest function | VERIFIED | Exports `buildAssetManifest`; filters by images/ and icons/ prefix; excludes assets/ |
| `src/assets/copy.ts` | copyAssets async function | VERIFIED | Exports `copyAssets`; mkdir -p + test -d + cp -r pattern; graceful on missing dirs |
| `src/assets/buildManifest.test.ts` | Unit tests for manifest building | VERIFIED | 5 tests; all pass |
| `src/analysis/parsePages.ts` | parsePageData, normalizeRoute, readJsonFile | VERIFIED | All 3 exported; route from `data.page.paths.default`; base64 read pattern |
| `src/analysis/componentLookup.ts` | COMPONENT_LOOKUP, lookupComponentType | VERIFIED | 26-entry table; lookupComponentType with 3-tier fallback |
| `src/analysis/parseObjects.ts` | getAllWwRefs, isDynamicBinding, buildComponentTree | VERIFIED | All 3 exported; greedy slot traversal; cycle guard via visited Set |
| `src/analysis/parseObjects.test.ts` | Unit tests for tree walker | VERIFIED | 14 tests; all pass |
| `src/analysis/parseWorkflows.ts` | linearizeWorkflowChain, parsePageWorkflows, parseElementInteractions, buildVariableIndex, parseVariables, parseCollections | VERIFIED | All 6 exported; cycle guard; variable ID resolution |
| `src/analysis/parseWorkflows.test.ts` | Unit tests for workflow parsing | VERIFIED | 9 tests; all pass |
| `src/analysis/detectShared.ts` | detectSharedSections | VERIFIED | Exports `detectSharedSections`; uses Set<pageId> for distinct-page counting |
| `src/analysis/detectShared.test.ts` | Unit tests for shared detection | VERIFIED | 6 tests; all pass |
| `src/analysis/analyze.ts` | analyzeSite orchestrator | VERIFIED | Exports `analyzeSite`; wires all 9 pipeline steps; reads page.page.workflows (not page.workflows) |
| `src/views/MainView.tsx` | UI with analysis pipeline integration and progress steps | VERIFIED | Imports and calls `analyzeSite`; useState for AnalysisResult; done state shows page/component/token/asset counts |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/design/parseTokens.ts` | `src/design/types.ts` | `import { DesignToken, DesignSystem }` | WIRED | Line 1: `import type { DesignToken, DesignSystem } from './types'` |
| `src/assets/copy.ts` | `shell.exec` | `cp -r for directory copying` | WIRED | Lines 28-49: `shell.exec('bash', [...])` with `cp -r '${extractDir}/images/'*` |
| `src/assets/buildManifest.ts` | `src/assets/types.ts` | `import { AssetManifest, AssetEntry }` | WIRED | Line 1: `import type { AssetEntry, AssetManifest } from './types'` |
| `src/analysis/parsePages.ts` | (no call to parseObjects needed — sections created as stubs) | n/a | N/A — orchestrated in analyze.ts instead |  |
| `src/analysis/parseObjects.ts` | `src/analysis/componentLookup.ts` | `calls lookupComponentType` | WIRED | Line 2: `import { lookupComponentType }` + line 112 call |
| `src/analysis/parseObjects.ts` | `src/analysis/types.ts` | `import { ParsedObject, WorkflowSpec }` | WIRED | Line 1: `import type { ParsedObject, WorkflowSpec } from './types'` |
| `src/analysis/parseWorkflows.ts` | `src/analysis/types.ts` | `import { WorkflowSpec, ActionSpec, ... }` | WIRED | Line 1: full import of all workflow types |
| `src/analysis/analyze.ts` | `src/design/parseTokens.ts` | calls `parseDesignTokens` | WIRED | Line 6 import + line 114 call |
| `src/analysis/analyze.ts` | `src/analysis/parsePages.ts` | calls `parsePageData` | WIRED | Line 8 import + line 148 call |
| `src/analysis/analyze.ts` | `src/analysis/parseObjects.ts` | calls `buildComponentTree` | WIRED | Line 9 import + line 173 call |
| `src/analysis/analyze.ts` | `src/analysis/parseWorkflows.ts` | calls `parsePageWorkflows` | WIRED | Lines 10-16 import + line 202 call |
| `src/analysis/analyze.ts` | `src/analysis/detectShared.ts` | calls `detectSharedSections` | WIRED | Line 17 import + line 242 call |
| `src/analysis/analyze.ts` | `src/assets/buildManifest.ts` | calls `buildAssetManifest` | WIRED | Line 18 import + line 247 call |
| `src/views/MainView.tsx` | `src/analysis/analyze.ts` | calls `analyzeSite` | WIRED | Line 6 import + line 50 call |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `src/views/MainView.tsx` done state | `result.siteAnalysis.pages.length` | `analyzeSite()` → pages parsed from data/*.json | Yes — real JSON parsing | FLOWING |
| `src/views/MainView.tsx` done state | `result.siteAnalysis.totalComponentCount` | `analyze.ts:281-286` countObjects() over all section.components | Yes — recursive count of parsed tree | FLOWING |
| `src/views/MainView.tsx` done state | `result.designSystem.fonts.length` | `parseDesignTokens(html)` on real HTML shell | Yes — regex over real CSS vars | FLOWING |
| `src/views/MainView.tsx` done state | `result.assetManifest.totalCopied` | `buildAssetManifest(entries, ...)` from real ZIP entries | Yes — filtered from real ZIP manifest | FLOWING |
| `src/analysis/analyze.ts` | `designSystem` | `parseDesignTokens(html)` where html = `atob(base64 < index.html)` | Yes — real file read | FLOWING |
| `src/analysis/analyze.ts` | `sharedSections` | `detectSharedSections(allParsedPages)` | Yes — derived from real parsed pages | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: The project has no server or standalone runnable entry point yet (Ship Studio plugin, runs in webview). Tests serve as the behavioral verification.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 61 unit tests pass | `npx vitest run src/` | 6 test files, 61 tests, 0 failures | PASS |
| TypeScript compiles without errors | `npx tsc --noEmit` | No output (0 errors) | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DESIGN-01 | 02-01 | Extract typography tokens from CSS custom properties | SATISFIED | `parseTokens.ts` classifies font composite values; extracts fontSizePx, fontWeight, lineHeight |
| DESIGN-02 | 02-01 | Extract color tokens from CSS custom properties | SATISFIED | `parseTokens.ts` classifies hex values; 144 color tokens expected from sample |
| DESIGN-03 | 02-01 | Extract spacing tokens from CSS custom properties | SATISFIED | `parseTokens.ts` classifies dimension values (px, rem, em, vh, vw, %) |
| DESIGN-04 | 02-01 | Infer semantic labels for typography tokens (h1-h6) | SATISFIED | `parseTokens.ts:222-227` — top 6 by fontSizePx get h1-h6; remainder get body-N |
| DESIGN-05 | 02-01 | Infer semantic labels for color tokens (primary/secondary/gray scale) | SATISFIED | `parseTokens.ts:96-180` — hex→HSL; saturation<10% → gray-N; hue clustering → primary/secondary/accent |
| DESIGN-06 | 02-01 | Capture external font references (Google Fonts) | SATISFIED | `mapFonts.ts:6-11` — regex extracts and deduplicates fonts.googleapis.com/css2 URLs |
| PAGE-01 | 02-03 | Discover all pages from data/*.json files | SATISFIED | `analyze.ts:127-132` — filters entries for `data/*.json`; extracts pageId from filename |
| PAGE-02 | 02-03 | Extract URL route from page.paths.default | SATISFIED | `parsePages.ts:123-125` — reads `data.page.paths.default`, runs normalizeRoute |
| PAGE-03 | 02-03 | Parse section hierarchy from each page's sections dict | SATISFIED | `parsePages.ts:128-143` — iterates `data.sections`, creates ParsedSection stubs |
| PAGE-04 | 02-03 | Walk wwObjects tree recursively across all slot types | SATISFIED | `parseObjects.ts:60-68` — getAllWwRefs handles all slot patterns including array-of-arrays |
| PAGE-05 | 02-05 | Detect shared layout sections via sectionBaseId frequency | SATISFIED | `detectShared.ts:16-58` — frequency map across distinct pages, >=50% threshold |
| PAGE-06 | 02-03 | Extract responsive breakpoint style diffs per component | SATISFIED | `parseObjects.ts:160-162` — styleMobile/styleTablet extracted per ParsedObject |
| PAGE-07 | 02-03 | Map wwObjectBaseId UUIDs to component type labels via lookup table | SATISFIED | `componentLookup.ts:6-33` — 26-entry table keyed on UUID prefix |
| PAGE-08 | 02-03 | Fall back to wwObject name field when baseId not in table | SATISFIED | `componentLookup.ts:50-51` — `if (name) return name` fallback |
| PAGE-09 | 02-03 | Identify library components via libraryComponentBaseId | SATISFIED | `parseObjects.ts:113` — `isLibraryComponent = !!raw.libraryComponentBaseId` |
| INTERACT-01 | 02-04 | Capture page-level workflows | SATISFIED | `analyze.ts:202-207` — reads `pageJson.page.workflows` (NOT pageJson.workflows which is empty) |
| INTERACT-02 | 02-04 | Capture element-level interactions | SATISFIED | `analyze.ts:210-225` — walks all ParsedObjects, reads `_state.interactions`, calls `parseElementInteractions` |
| INTERACT-03 | 02-04 | Cross-reference variable IDs to human-readable names | SATISFIED | `parseWorkflows.ts:30-39` — buildVariableIndex + varId lookup for 'variable' action type |
| INTERACT-04 | 02-04 | Inventory variables with name, type, defaultValue, persistence flags | SATISFIED | `parseWorkflows.ts:161-172` — `parseVariables()` with isLocalStorage/isPersistentOnNav boolean flags |
| INTERACT-05 | 02-04 | Inventory collections with name, type, table references | SATISFIED | `parseWorkflows.ts:178-190` — `parseCollections()` reads mode and config.table |
| INTERACT-06 | 02-03 | Flag dynamic bindings with [DYNAMIC] annotation | SATISFIED | `parseObjects.ts:83-90, 138-157` — isDynamicBinding check; text/imageUrl/conditionalRendering set to '[DYNAMIC]' |
| ASSET-01 | 02-02 | Copy images/ to .shipstudio/assets/images/ | SATISFIED | `copy.ts:24,28-37` — mkdir -p + test -d + cp -r for images/ directory |
| ASSET-02 | 02-02 | Copy icons/ to .shipstudio/assets/icons/ | SATISFIED | `copy.ts:25,39-48` — mkdir -p + test -d + cp -r for icons/ directory (includes lucide/ subdirectory) |
| ASSET-03 | 02-02 | Copy fonts to asset manifest | SATISFIED (Google Fonts only) | `mapFonts.ts` extracts Google Font CDN URLs; `buildManifest.ts:35` passes them to `googleFonts` field. No @font-face parsing — WeWeb exports exclusively use Google Fonts CDN links per research (STACK.md) |
| ASSET-04 | 02-02 | Build asset manifest with file counts and project-relative paths | SATISFIED | `buildManifest.ts:18-38` — filters entries, maps to `.shipstudio/assets/${entry}` paths, totalCopied = images.length + icons.length |
| UX-04 | 02-05 | Show step-by-step progress during extraction and analysis | SATISFIED | `MainView.tsx:126-132` — 'copying' and 'analyzing' step.kind states render progress UI; analyzeSite calls `onProgress` with both kinds |

**All 25 requirement IDs declared across plans 02-01 through 02-05 are accounted for.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/analysis/parseObjects.ts` | 173 | `const interactions: WorkflowSpec[] = (raw._state?.interactions ?? []) as WorkflowSpec[]` | INFO | Intentional stub pattern — analyze.ts overwrites this with properly linearized interactions via parseElementInteractions. SUMMARY documents this design decision. Not a blocker. |

No other anti-patterns found. No TODO/FIXME/HACK/PLACEHOLDER comments. No empty return {} / return [] without data-fetching justification. No hardcoded empty props at call sites.

---

### Human Verification Required

#### 1. Full E2E Pipeline Run Against Real ZIP

**Test:** Select the `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` file from within Ship Studio
**Expected:** Plugin transitions through idle → picking → extracting → validating → analyzing (showing page count incrementing) → copying → done, with done state showing non-zero counts for pages, components, design tokens, and assets
**Why human:** Requires Ship Studio webview runtime; involves system `unzip`, `osascript`, and `base64` shell commands that cannot be exercised in tests

#### 2. Design Token Counts Against Known Sample

**Test:** Load the ZIP and note the counts in the done state
**Expected:** ~64 font tokens, 100+ color tokens (after dedup), 19+ dimension tokens based on research in 02-RESEARCH.md
**Why human:** Token counts from the specific ZIP can only be validated against the real HTML shell in Ship Studio runtime

---

### Gaps Summary

No gaps. All 17 observable truths verified, all 19 required artifacts exist with substantive implementations, all key links are wired, and all 25 requirements are satisfied. The codebase is complete and tests are passing (61/61).

One architectural note on ASSET-03: the requirement mentions "@font-face or Google Font links" but the implementation only handles Google Font CDN URLs. This is architecturally sound because STACK.md research (confirmed by direct ZIP inspection) shows WeWeb exports exclusively use Google Fonts CDN links in HTML `<head>` — there are no @font-face declarations to parse. The requirement's "@font-face" branch is simply not present in WeWeb's output format.

---

_Verified: 2026-03-24T16:28:00Z_
_Verifier: Claude (gsd-verifier)_
