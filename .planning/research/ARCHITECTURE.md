# Architecture Research

**Domain:** Ship Studio plugin — WeWeb export parser and brief generator
**Researched:** 2026-03-24
**Confidence:** HIGH (based on direct inspection of real WeWeb export ZIP and existing webflow-to-code plugin source)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         UI Layer (React)                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  MainView (orchestrator)                                  │    │
│  │    ↓ renders                                             │    │
│  │  Modal → progress steps → MigrationProgress component   │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ calls (async, sequential)
┌──────────────────────▼───────────────────────────────────────────┐
│                    Processing Pipeline                             │
│                                                                    │
│  zip/           analysis/         design/          brief/         │
│  ┌──────────┐   ┌──────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ pick     │→  │ parsePages   │  │ parseTokens│  │ generate │  │
│  │ extract  │   │ detectShared │  │ mapFonts   │  │ io       │  │
│  │ validate │   │ parseObjects │  └────────────┘  └──────────┘  │
│  │ discover │   │ parseWorkfl. │                                  │
│  └──────────┘   └──────────────┘                                  │
│                                                                    │
│  assets/                         plan/                            │
│  ┌──────────────────────────┐    ┌──────────────────────────┐    │
│  │ detectFonts              │    │ generate                 │    │
│  │ buildManifest            │    │ read/write               │    │
│  │ copy                     │    │ resumePrompt             │    │
│  └──────────────────────────┘    └──────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                    Ship Studio Host APIs                           │
│  shell.exec()   ctx.storage   ctx.actions.showToast               │
│  ctx.theme      ctx.project.path                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Notes |
|-----------|---------------|-------|
| `zip/pick` | osascript file picker, returns ZIP path | Identical to webflow plugin |
| `zip/extract` | unzip to `.shipstudio/tmp/`, verify file count | Identical to webflow plugin |
| `zip/validate` | confirm WeWeb export shape (data/ JSON files, HTML shells, assets/) | WeWeb-specific: no manifest.json requirement, check for data/*.json |
| `zip/discover` | list data/*.json page files, enumerate images/icons/assets | Replaces HTML discovery; maps UUID filenames to page paths via HTML shells |
| `analysis/parsePages` | read each data/*.json, extract page id/path, sections tree, wwObjects tree | Core parser — JSON walk, not HTML parse |
| `analysis/parseObjects` | resolve wwObject tree from flat map, classify component types by `wwObjectBaseId` | Replaces CSS-class detection; baseId is the component type signal |
| `analysis/detectShared` | group sections by `sectionBaseId` across all pages; sections appearing on N pages are shared layout | Replaces DOM selector heuristics |
| `analysis/parseWorkflows` | extract page-level and object-level workflows; map triggers + action chains | New module — no webflow equivalent |
| `design/parseTokens` | parse inline `<style>:root{...}` from any HTML shell; classify UUIDs as font/color/spacing tokens | New module — no webflow equivalent |
| `design/mapFonts` | extract Google Font URLs from HTML `<link>` preloads | Simple extraction from `<head>` |
| `assets/detectFonts` | confirm which fonts are referenced in design tokens vs loaded externally | Combines design/ output with HTML head |
| `assets/buildManifest` | enumerate images/, icons/, assets/ JS+CSS bundles | WeWeb-specific paths |
| `assets/copy` | `cp -r` assets to `.shipstudio/assets/` via shell | Nearly identical to webflow plugin |
| `brief/generate` | assemble markdown from all parsed data — site overview, design system, pages, components, workflows, assets | Core output; entirely WeWeb-specific sections |
| `brief/io` | write brief to disk, copy to clipboard | Identical to webflow plugin |
| `plan/generate` | create JSON migration plan: shared-layout → pages → sections hierarchy | WeWeb-specific hierarchy |
| `plan/read` | load existing migration plan, compute progress % | Identical to webflow plugin |
| `plan/resumePrompt` | generate AI prompt for resuming mid-migration | Largely identical to webflow plugin |
| `components/Modal` | Shell UI container — reuse from webflow plugin | Direct copy |
| `components/MigrationProgress` | Progress polling UI — reuse from webflow plugin | Direct copy |
| `views/MainView` | Orchestrates entire pipeline, manages React state | WeWeb-specific pipeline calls |
| `context.ts` | `usePluginContext()` hook — reads `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` | Identical to webflow plugin |
| `types.ts` | Shared TypeScript types | WeWeb-specific domain types |

## Recommended Project Structure

```
src/
├── zip/
│   ├── pick.ts           # osascript file picker
│   ├── extract.ts        # unzip + verify
│   ├── validate.ts       # WeWeb export structure validation
│   ├── discover.ts       # list data/*.json, map page paths from HTML shells
│   └── types.ts
├── analysis/
│   ├── parsePages.ts     # iterate data/*.json, build per-page analysis
│   ├── parseObjects.ts   # resolve wwObject tree, classify component types
│   ├── detectShared.ts   # sectionBaseId frequency analysis across pages
│   ├── parseWorkflows.ts # extract page workflows + object interactions
│   ├── analyze.ts        # orchestrator: calls all analysis modules, returns SiteAnalysis
│   └── types.ts
├── design/
│   ├── parseTokens.ts    # parse :root CSS vars from HTML shell
│   ├── mapFonts.ts       # extract Google Font declarations from HTML head
│   └── types.ts
├── assets/
│   ├── buildManifest.ts  # enumerate images/, icons/, assets/
│   ├── copy.ts           # copy assets to .shipstudio/assets/
│   └── types.ts
├── brief/
│   ├── generate.ts       # markdown builder (site overview, design system, pages, etc.)
│   ├── io.ts             # write to disk, copy to clipboard
│   └── types.ts
├── plan/
│   ├── generate.ts       # create migration-plan.json
│   ├── read.ts           # load plan, compute progress
│   ├── write.ts          # save plan
│   ├── resumePrompt.ts   # AI resume prompt builder
│   └── types.ts
├── components/
│   ├── Modal.tsx           # UI shell (port from webflow plugin)
│   └── MigrationProgress.tsx # progress polling UI (port from webflow plugin)
├── views/
│   └── MainView.tsx      # pipeline orchestrator, all React state
├── context.ts            # usePluginContext hook
├── types.ts              # Shell, PluginContext, shared types
├── styles.ts             # CSS-in-JS theme tokens
└── index.tsx             # plugin entry point, Modal mount
```

### Structure Rationale

- **zip/**: Encapsulates all file system access. Everything else receives plain data structures — no shell calls leak past this boundary.
- **analysis/**: Pure data transformation. Receives extracted JSON file paths, returns typed `SiteAnalysis`. Testable without Ship Studio.
- **design/**: Separate from analysis because design token parsing requires HTML file reads, not JSON. Keeps analysis/ focused on JSON walking.
- **assets/**: Separated from analysis because asset operations are side-effectful (shell copy commands). Analysis is pure transformation.
- **brief/**: Takes completed analysis + design + asset data, produces markdown string. Pure function — no I/O inside generate.ts.
- **plan/**: Separated from brief because plan is a long-lived JSON artifact with its own lifecycle (create → read → update on progress).
- **components/ and views/**: UI layer only. No parsing logic inside React components.

## Architectural Patterns

### Pattern 1: Flat-map wwObject Resolution

**What:** WeWeb's page JSON stores all wwObjects in a flat dictionary keyed by UUID. Section `content.default.wwObjects` contains only `{uid, isWwObject: true}` references. Reconstruction requires walking the flat map recursively.

**When to use:** Everywhere component tree structure is needed.

**Trade-offs:** The flat map enables random access and avoids deep JSON nesting, but the tree must be rebuilt for layout analysis. Watch for circular references (not common in exports, but guard anyway).

```typescript
function resolveObjectTree(
  uid: string,
  objectMap: Record<string, WeWebObject>,
  visited = new Set<string>()
): ResolvedObject | null {
  if (visited.has(uid)) return null; // cycle guard
  visited.add(uid);
  const obj = objectMap[uid];
  if (!obj) return null;
  const children = (obj.content?.default?.children ?? [])
    .map((ref: {uid: string}) => resolveObjectTree(ref.uid, objectMap, visited))
    .filter(Boolean);
  return { ...obj, children };
}
```

### Pattern 2: sectionBaseId as Shared Layout Signal

**What:** Sections that appear across multiple pages share the same `sectionBaseId`. This is the reliable cross-page identity — `uid` and `linkId` differ per page, but `sectionBaseId` is stable. Sections with `sectionBaseId` appearing on 50%+ of pages are shared layout (nav, sidebar, footer).

**When to use:** `detectShared.ts` — run after all pages are parsed.

**Trade-offs:** Simple frequency count works well. No need for content-diff heuristics. Threshold (50% of pages) may need tuning for sites with partial shared layout.

```typescript
function detectSharedSections(pages: ParsedPage[]): SharedSectionMap {
  const frequency = new Map<string, {count: number; title: string}>();
  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      const bid = section.sectionBaseId;
      const existing = frequency.get(bid) ?? {count: 0, title: section.sectionTitle ?? 'unnamed'};
      frequency.set(bid, {count: existing.count + 1, title: existing.title});
    }
  }
  const threshold = pages.length * 0.5;
  return Object.fromEntries(
    [...frequency.entries()]
      .filter(([, v]) => v.count >= threshold)
      .map(([bid, v]) => [bid, v])
  );
}
```

### Pattern 3: CSS Variable Classification by Value Pattern

**What:** WeWeb's design tokens are UUID-keyed CSS custom properties. The value format reveals the token type: font shorthand (`weight size/line-height family`) vs hex color (`#RRGGBB` or `#RRGGBBAA`) vs dimension (`Npx` or `Nrem`). No semantic names exist — classification is entirely by value regex.

**When to use:** `design/parseTokens.ts` — regex-match each value to assign type.

**Trade-offs:** Heuristic, not schema-driven. Edge cases exist (e.g., a color stored as `rgb()`). Cover the common cases first; unknown tokens go to a "raw" bucket.

```typescript
function classifyToken(value: string): 'font' | 'color' | 'dimension' | 'raw' {
  if (/^\d/.test(value) && value.includes('/') && value.includes('px')) return 'font';
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return 'color';
  if (/^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(value)) return 'dimension';
  return 'raw';
}
```

### Pattern 4: Page Path Discovery via HTML Shells

**What:** WeWeb's data/*.json files are named with UUIDs (e.g., `65c04fb7-....json`). The human-readable URL path (e.g., `/forgot-password`) lives in the JSON itself at `page.paths.default`. HTML shells at `forgot-password/index.html` also contain the page UUID in `<script>` bundle filenames. Use `page.paths.default` from JSON — it's the authoritative mapping.

**When to use:** `zip/discover.ts` — build the UUID-to-path map during discovery.

**Trade-offs:** Relying on `page.paths.default` is more reliable than parsing HTML filenames. However, the root page (`index.html`) uses path `""` or `"/"` — handle this edge case explicitly.

## Data Flow

### Primary Pipeline Flow

```
User clicks "Select ZIP"
    ↓
zip/pick.ts → returns zipPath (string)
    ↓
zip/extract.ts → extracts to .shipstudio/tmp/<name>/ → returns ZipManifest (entry list)
    ↓
zip/validate.ts → confirms WeWeb structure (data/*.json present, HTML shells present)
zip/discover.ts → returns { pageFiles: string[], htmlShells: string[], assetFiles: string[] }
    ↓
design/parseTokens.ts ← reads any HTML shell → returns DesignSystem (fonts, colors, dimensions, raw)
design/mapFonts.ts ← reads HTML <head> → returns string[] (Google Font URLs)
    ↓
analysis/parsePages.ts ← reads each data/*.json → returns ParsedPage[]
    ↓ (each ParsedPage contains: sections map, wwObjects flat map, variables, workflows)
analysis/parseObjects.ts → resolves wwObject trees per section, classifies component types
analysis/detectShared.ts → computes SharedSectionMap from sectionBaseId frequencies
analysis/parseWorkflows.ts → flattens page-level + object-level workflows into WorkflowSpec[]
analysis/analyze.ts → assembles SiteAnalysis from all above
    ↓
assets/buildManifest.ts → returns AssetManifest (images, icons, JS/CSS bundles)
assets/copy.ts → shell.exec("cp -r ...") → copies to .shipstudio/assets/
    ↓
brief/generate.ts ← receives { siteAnalysis, designSystem, assetManifest, mode, preserve }
              → returns BriefResult (markdown string + token count + stats)
brief/io.ts → write to .shipstudio/weweb-brief.md, copy to clipboard
    ↓
plan/generate.ts ← receives SiteAnalysis → returns MigrationPlan JSON
plan/write.ts → write to .shipstudio/migration-plan.json
    ↓
UI shows success state with copy button + MigrationProgress (if plan detected)
```

### State Management

```
React state in MainView
    ↓ (step: ZipStep union type drives UI rendering)
'idle' → 'picking' → 'extracting' → 'analyzing' → 'generating' → 'done' | 'error'

Each async step updates step state with progress label string.
No global state store — all data lives in local pipeline variables passed forward.
BriefResult stored in useState for clipboard access after completion.
```

### Key Data Flows

1. **Design system extraction:** Only one HTML shell needs to be read — all pages share the same inline `<style>:root{...}` block. Read `index.html` first; fall back to any available HTML shell.

2. **Page-to-path mapping:** UUID filename → `page.paths.default` in JSON. Build `Map<string, string>` (uuid → route path) during `discover.ts`. This map is needed by `parsePages.ts` and `brief/generate.ts`.

3. **Shared layout → brief:** SharedSectionMap produces a set of `sectionBaseId` values. During brief generation, sections matching those IDs get labeled as shared layout components (nav/sidebar/etc.) and appear in a dedicated "Shared Layout" section before per-page content.

4. **Workflow → interaction spec:** Page workflows live at `data.page.workflows[]` and `data.workflows[]` (top-level). Object-level interactions live at `wwObject._state.interactions[]`. All three sources feed `parseWorkflows.ts`, which emits a normalized `WorkflowSpec` with `{trigger, actions[], sourceType, sourceName}`.

5. **Component type mapping:** `wwObjectBaseId` is the component type identifier. Known base IDs map to component labels (text, image, button, form input, container, etc.). Unknown base IDs are reported as "custom component (UUID)". A static lookup table handles known types; this table grows over time as more WeWeb exports are analyzed.

## Scaling Considerations

This is a local plugin with no server. "Scaling" means handling larger WeWeb exports gracefully.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Small sites (< 10 pages) | Default pipeline works as-is |
| Medium sites (10-50 pages) | Progress callbacks per-page in `parsePages.ts` prevent UI freeze |
| Large sites (50+ pages, large data/*.json files) | Stream JSON parsing if `e71a54bc-....json` (1.1MB in test export) causes memory pressure; consider chunked reads |
| Very large data files (> 5MB single JSON) | Flag in validation with a warning; brief generation may truncate per-page detail |

### Scaling Priorities

1. **First bottleneck:** Large page JSON files. The test export has one 1.1MB JSON. At 50+ pages this multiplies. Mitigation: parse pages sequentially (already the pattern), stream if needed.
2. **Second bottleneck:** Brief token count. More pages = longer brief = context window pressure for AI consumers. Mitigation: brief modes (pixel-perfect vs best-site) and optional section truncation already planned.

## Anti-Patterns

### Anti-Pattern 1: Parsing HTML Shells for Structure

**What people do:** Attempt to extract page structure from the HTML files (e.g., parsing `<div id="app">` children or script tags).

**Why it's wrong:** WeWeb HTML shells are empty SPAs. All meaningful structure — sections, components, layout, styles — lives exclusively in `data/*.json`. HTML shells only contain CSS variables and font `<link>` tags that are worth reading.

**Do this instead:** Read `data/*.json` for all structural information. Read exactly one HTML shell for design tokens and font declarations.

### Anti-Pattern 2: Using UUID Keys as Component Labels in Briefs

**What people do:** Emit `wwObjectBaseId` values like `d7904e9d-fc9a-4d80-9e32-728e097879ad` directly into the brief markdown.

**Why it's wrong:** These are meaningless to a developer reading the brief. They don't communicate what the component is or how to rebuild it.

**Do this instead:** Maintain a lookup table of known `wwObjectBaseId` → human label (e.g., `d7904e9d...` = "text element"). For unknown IDs, use the `name` field on the wwObject if present. Fall back to the parent section title + "custom component".

### Anti-Pattern 3: Conflating `sectionBaseId` with `uid` or `linkId`

**What people do:** Use `uid` or `linkId` to detect shared sections across pages.

**Why it's wrong:** `uid` is unique per page instance. `linkId` changes across pages even for the same shared section (observed in the test export). Only `sectionBaseId` is stable across all page instances of a shared section.

**Do this instead:** Use `sectionBaseId` exclusively for cross-page identity. Use `uid` only for intra-page object resolution.

### Anti-Pattern 4: Parsing All Pages Before Reading Design Tokens

**What people do:** Run the full analysis pipeline before extracting the design system.

**Why it's wrong:** Design token UUIDs appear in section `_state.style` values (e.g., `backgroundColor: "var(--287c6c11-...,#F4F4F5)"`). If you haven't classified those UUIDs yet, you can't produce human-readable color names in the brief during page analysis.

**Do this instead:** Run `design/parseTokens.ts` first (it only reads one HTML file). Pass the `DesignSystem` token map into `analysis/parsePages.ts` so that CSS variable references can be resolved to semantic labels inline.

### Anti-Pattern 5: Treating WeWeb `libraryComponents` as the Component Registry

**What people do:** Attempt to use the `libraryComponents` array in page JSON as the definitive component type registry.

**Why it's wrong:** `libraryComponents` in the test export contains only 3 entries representing custom reusable components defined in the project. The actual component type system is `wwObjectBaseId` — a WeWeb platform-level identifier for built-in elements (text, image, container, form input, etc.).

**Do this instead:** Use `wwObjectBaseId` for type detection. Use `libraryComponents` only to identify project-defined reusable components (distinct from built-in WeWeb elements).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Fonts | Detect `<link>` preloads in HTML head; extract family names | No API call — read from exported HTML |
| WeWeb icon CDN | Detect `icons/lucide/`, `icons/noun-*/` paths in export | Copy to `.shipstudio/assets/icons/`; note icon library in brief |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `zip/` ↔ `analysis/` | Passes `extractDir: string` + `entries: string[]` | analysis/ constructs file paths from extractDir |
| `analysis/` ↔ `design/` | design/ runs first; passes `DesignSystem` into analysis pipeline | CSS var UUID resolution depends on this ordering |
| `analysis/` ↔ `brief/` | Passes `SiteAnalysis` typed struct | Single aggregated object; brief/ is pure function |
| `assets/` ↔ `brief/` | Passes `AssetManifest` typed struct | Brief lists asset counts and paths |
| `brief/` ↔ `plan/` | Both receive `SiteAnalysis`; independent outputs | brief generates markdown; plan generates JSON; no dependency between them |
| `views/MainView` ↔ all modules | MainView imports and calls each module's public function directly | No event bus; sequential async calls with step state updates |
| `components/` ↔ `views/` | Props only; no context inside Modal/MigrationProgress | Stateless presentation components |

## Suggested Build Order

Build order follows data flow dependencies:

1. **`types.ts` + `context.ts`** — Foundation; all other modules depend on these types.
2. **`zip/` module** — Entry point for all data. Validates the system works end-to-end before building parsers.
3. **`design/parseTokens.ts` + `design/mapFonts.ts`** — Needed before analysis for CSS variable resolution.
4. **`analysis/parsePages.ts`** — Core data access; everything else in analysis/ depends on its output types.
5. **`analysis/parseObjects.ts`** — Depends on parsePages output (wwObjects flat map).
6. **`analysis/detectShared.ts`** — Depends on all pages being parsed first.
7. **`analysis/parseWorkflows.ts`** — Independent of object tree; can be built alongside detectShared.
8. **`analysis/analyze.ts`** — Orchestrator; built last in analysis/ after all sub-modules exist.
9. **`assets/buildManifest.ts` + `assets/copy.ts`** — Independent of analysis; can be built in parallel with steps 4-8.
10. **`brief/generate.ts`** — Depends on SiteAnalysis + DesignSystem + AssetManifest types being stable.
11. **`brief/io.ts`** — Simple I/O; depends on brief/generate output type.
12. **`plan/generate.ts` + `plan/read.ts` + `plan/write.ts` + `plan/resumePrompt.ts`** — Depends on SiteAnalysis type being stable.
13. **`components/Modal.tsx` + `components/MigrationProgress.tsx`** — Port from webflow plugin; can start early.
14. **`views/MainView.tsx`** — Built last; integrates all modules and manages React state.

## Sources

- Direct inspection of real WeWeb export ZIP (`f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip`) — HIGH confidence
- webflow-to-code plugin source at `/plugin-webflow-to-code/src/` — HIGH confidence (reference architecture)
- WeWeb export JSON schema inferred from 17 page JSON files — HIGH confidence for observed patterns, MEDIUM confidence for exhaustiveness
- CSS variable pattern observed in `index.html` inline `<style>` blocks — HIGH confidence

---
*Architecture research for: WeWeb export parser + brief generator (Ship Studio plugin)*
*Researched: 2026-03-24*
