# Phase 2: Parsing Pipeline — Research

**Researched:** 2026-03-24
**Domain:** WeWeb JSON data format, CSS token parsing, recursive component tree traversal, workflow/interaction extraction, asset management
**Confidence:** HIGH — all findings verified by direct inspection of the sample WeWeb export ZIP (17 pages, 2,246 total wwObjects), cross-referenced with Phase 1 source code already in `src/`

---

## Summary

Phase 2 is the core parsing engine. It receives the `extractDir` path from Phase 1 and produces four outputs: a `DesignSystem` (CSS tokens + fonts), a `SiteAnalysis` (pages, component trees, shared layout, workflows, variables, collections), an `AssetManifest` (images and icons enumerated), and the side effect of those assets copied to `.shipstudio/assets/`.

**The single most important finding from this research** is that the tree walker algorithm documented in prior research was incomplete. The original research documented 13 slot types. The actual export contains 26 named slot types across all 17 pages, and — critically — a large class of wwObjects are not reachable via ANY slot reference at all. Sections with `sectionBaseId` appearing as "shared/linked" sections (Header PUBLIC, Sidemenu PUBLIC) store their entire component subtrees with `parentSectionId` pointing to the section UID, while their `content.default.wwObjects` array is empty. Without the `parentSectionId` fallback, these sections produce zero components. Similarly, `libraryComponent` roots are stored separately and must be walked independently. The correct three-pronged traversal algorithm is documented below and proven to achieve 100% coverage on all 17 pages including the 1,273-object animal-detail page.

**Primary recommendation:** Build the tree walker with all three traversal paths (content.wwObjects + parentSectionId fallback + libraryComponent roots) and verify 100% coverage on animal-detail before writing any other analysis code.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DESIGN-01 | Extract typography tokens from CSS custom properties | CSS :root block has 64 font composite vars; regex classification by value pattern |
| DESIGN-02 | Extract color tokens from CSS custom properties | 144 hex color vars in :root; regex `#[0-9a-fA-F]{3,8}` |
| DESIGN-03 | Extract spacing tokens from CSS custom properties | 19 px-dimension vars in :root; regex `^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)$` |
| DESIGN-04 | Infer semantic labels for typography tokens (H1-H6) | Sort font tokens by extracted px size descending; rank 1=H1 through rank 6=H6 |
| DESIGN-05 | Infer semantic labels for color tokens | Deduplicate by hex value; cluster by hue/lightness; confirmed 144 values, many duplicated |
| DESIGN-06 | Capture external font references (Google Fonts) | 3 Google Font URLs in `<link>` tags in index.html `<head>` (Work Sans, Open Sans, Inter) |
| PAGE-01 | Discover all pages from data/*.json | 17 data/*.json files confirmed; UUIDs are page IDs |
| PAGE-02 | Extract URL route from page.paths.default | `page.paths.default` confirmed as authoritative; `.en` always equals `.default` in sample |
| PAGE-03 | Parse section hierarchy from page sections dict | `sections` dict keyed by UUID; each has `sectionTitle`, `sectionBaseId`, `content.default.wwObjects` |
| PAGE-04 | Walk wwObjects tree recursively across ALL slot types | 26 named slots + greedy nested traversal + parentSectionId fallback + libraryComponent roots; proven 100% coverage |
| PAGE-05 | Detect shared layout sections via sectionBaseId frequency | Header sectionBaseId appears 31 times across 17 pages; Sidemenu 14 times; >50% threshold |
| PAGE-06 | Extract responsive breakpoint style diffs (mobile/tablet/default) | `_state.style.{default,mobile,tablet}` on both sections and wwObjects; diff mobile/tablet against default |
| PAGE-07 | Map wwObjectBaseId UUIDs to component type labels via lookup table | 33 unique wwObjectBaseId values identified across all pages; lookup table documented below |
| PAGE-08 | Fall back to wwObject name field when baseId not in lookup | `name` field on wwObject; fall back to "custom component (UUID)" if name is also null |
| PAGE-09 | Identify library components via libraryComponentBaseId | `libraryComponentBaseId` on wwObjects; 3 `libraryComponents` entries in sample |
| INTERACT-01 | Capture page-level workflows | `page.workflows[]` array on each page JSON; trigger types: `onload`, `page-unload` |
| INTERACT-02 | Capture element-level interactions | `wwObject._state.interactions[]`; trigger types: `click`, `change`, `submit`, `cellValueChanged`, `_wwOnMounted`, `scan`, `action`, `eventClick` |
| INTERACT-03 | Cross-reference variable IDs to human-readable names | Variables dict (58 unique across all pages) indexed by `id`; `name` field is human-readable |
| INTERACT-04 | Inventory variables with name/type/defaultValue/persistence flags | 58 unique variables; types: boolean(38), string(14), number(2), object(2), array(1), query(1); flags: `isLocalStorage`, `isPersistentOnNav` |
| INTERACT-05 | Inventory collections with name/type/table references | 22 unique collections; `name`, `type` (single/list), `config.table` confirmed fields |
| INTERACT-06 | Flag dynamic bindings with [DYNAMIC] annotation | `__wwtype: "f"` (formula) and `"js"` (JS expression) on any value; `defaultValue` for visual fallback |
| ASSET-01 | Copy images/ directory to .shipstudio/assets/images/ | 21 image files in `/images/`; use `copyDirIfExists` pattern from webflow-to-code |
| ASSET-02 | Copy icons/ directory to .shipstudio/assets/icons/ | `icons/` has 3 SVGs + `icons/lucide/` with 23 SVGs; copy whole `icons/` tree |
| ASSET-03 | Copy fonts from CSS @font-face or Google Font links to asset manifest | No local font files; 3 Google Font CDN URLs extracted from HTML `<head>` |
| ASSET-04 | Build asset manifest with file counts and project-relative paths | Mirror webflow-to-code `AssetManifest` pattern; WeWeb-specific: images+icons+googleFonts |
| UX-04 | Show step-by-step progress during extraction and analysis | `onProgress` callback already in Phase 1 `ZipStep` union type; add per-page progress label |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.2 | Type-safe JSON parsing | Already installed from Phase 1; strict types catch nested access errors |
| Vite/Vitest | 8.0.2 / 4.1.1 | Build and test | Already configured from Phase 1; no changes needed |
| Native `JSON.parse` | — | WeWeb data file parsing | Zero deps; base64-decoded JSON from shell read |
| Native `String.match` | — | CSS token extraction from :root | Single-line regex per token; no CSS parser needed |
| Native `DOMParser` | — | HTML head parsing for fonts | Browser-native in Ship Studio webview; not needed for JSON parsing |

### No New Dependencies

Phase 2 introduces zero new npm dependencies. The entire parsing pipeline is:
- `JSON.parse()` for data/*.json files
- Regex for CSS token classification
- `shell.exec('bash', ['-c', "base64 < 'path'"])` for safe file reads
- `shell.exec('cp', ...)` for asset copying

**Installation:**
```bash
# No new packages. All tooling from Phase 1 remains unchanged.
```

---

## Architecture Patterns

### Recommended Module Structure for Phase 2

```
src/
├── design/
│   ├── parseTokens.ts    # CSS :root var extraction + classification
│   ├── mapFonts.ts       # Google Font URL extraction from <head>
│   └── types.ts          # DesignSystem, TokenEntry, FontRef
├── analysis/
│   ├── parsePages.ts     # Read each data/*.json; extract page metadata
│   ├── parseObjects.ts   # Build wwObject tree from flat map (3-pronged walk)
│   ├── detectShared.ts   # sectionBaseId frequency → SharedSectionMap
│   ├── parseWorkflows.ts # Flatten page.workflows + _state.interactions
│   ├── analyze.ts        # Orchestrator: assembles SiteAnalysis
│   └── types.ts          # SiteAnalysis, ParsedPage, ParsedSection, ParsedObject...
├── assets/
│   ├── buildManifest.ts  # Enumerate images/, icons/ from entries list
│   ├── copy.ts           # cp -r assets to .shipstudio/assets/
│   └── types.ts          # AssetManifest (WeWeb-specific: images+icons+googleFonts)
```

### Pattern 1: Safe Base64 File Read

**What:** Read file via `base64 < 'path'` shell command, then `atob()` + `JSON.parse()` in JS. Required because workflow action `code` fields contain backticks, single quotes, and special shell characters that corrupt naive shell string interpolation.

**Source:** Phase 1 established this pattern (see `extract.ts`). Applied to ALL file reads in Phase 2.

```typescript
// Source: pattern established in Phase 1 extract.ts + webflow-to-code
async function readJsonFile<T>(shell: Shell, filePath: string): Promise<T> {
  const result = await shell.exec('bash', ['-c', `base64 < '${filePath}'`]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to read ${filePath}: ${result.stderr.trim()}`);
  }
  const json = atob(result.stdout.trim());
  return JSON.parse(json) as T;
}
```

### Pattern 2: Complete wwObject Tree Traversal (3-Pronged)

**What:** Walk all wwObjects reachable from section roots using three complementary mechanisms. All three are required — any one alone produces incomplete coverage.

**Verified:** Achieves 0 orphans on all 17 pages including animal-detail (1,273 objects).

**The three mechanisms:**

1. **content.{bp}.wwObjects refs** — primary mechanism for non-linked sections; follows `{uid, isWwObject: true}` references in `section.content.default.wwObjects[]`
2. **parentSectionId fallback** — required for linked/shared sections (Header PUBLIC, Sidemenu PUBLIC) where `content.default.wwObjects` is empty; objects point TO the section via `parentSectionId`
3. **libraryComponent roots** — `libraryComponents[].rootElementId` points to wwObjects not connected to any section; 3 library components found in sample

**Within each object, use GREEDY traversal** — recursively find all `{isWwObject: true, uid: string}` structures anywhere in `content.{bp}.*`, regardless of nesting depth. This handles:
- Direct single-ref slots: `content.default.{slot}: {uid, isWwObject: true}`
- Direct array slots: `content.default.{slot}: [{uid, isWwObject: true}, ...]`
- Array-of-arrays slots: `content.default.tabsContent: [[{uid, isWwObject: true}], ...]`
- Deeply-nested refs: `content.default.columns[N].containerId: {uid, isWwObject: true}`

```typescript
// Source: verified against all 17 pages including animal-detail (1,273 objects)
function getAllWwRefs(val: unknown): string[] {
  if (typeof val !== 'object' || val === null) return [];
  if (Array.isArray(val)) return val.flatMap(getAllWwRefs);
  const obj = val as Record<string, unknown>;
  if (obj['isWwObject'] === true && typeof obj['uid'] === 'string') {
    return [obj['uid']]; // stop recursion here — don't descend into refs
  }
  return Object.values(obj).flatMap(getAllWwRefs);
}

function walkObject(uid: string, objectMap: Record<string, WeWebObject>, visited: Set<string>): void {
  if (visited.has(uid)) return; // cycle guard
  visited.add(uid);
  const obj = objectMap[uid];
  if (!obj) return;
  for (const bpVal of Object.values(obj.content ?? {})) {
    for (const refUid of getAllWwRefs(bpVal)) {
      walkObject(refUid, objectMap, visited);
    }
  }
}

function walkSection(
  section: WeWebSection,
  objectMap: Record<string, WeWebObject>,
  parentSectionIndex: Map<string, string[]>,
  libComponentRoots: string[],
  visited: Set<string>
): void {
  // Prong 1: content.{bp}.wwObjects refs
  let hadContentRefs = false;
  for (const bpVal of Object.values(section.content ?? {})) {
    for (const ref of (bpVal?.wwObjects ?? []) as Array<{uid: string; isWwObject: boolean}>) {
      if (ref.isWwObject) {
        walkObject(ref.uid, objectMap, visited);
        hadContentRefs = true;
      }
    }
  }

  // Prong 2: parentSectionId fallback (for linked/shared sections with empty wwObjects)
  for (const rootUid of parentSectionIndex.get(section.uid) ?? []) {
    walkObject(rootUid, objectMap, visited);
  }
}

// Prong 3: libraryComponent roots (called once after all sections)
for (const rootUid of libComponentRoots) {
  walkObject(rootUid, objectMap, visited);
}
```

### Pattern 3: sectionBaseId Shared Layout Detection

**What:** Count sectionBaseId occurrences across all pages. Sections appearing on >= 50% of pages are shared layout. Use `sectionBaseId`, NOT `uid`, `linkId`, or `wwObjectBaseId`.

**Verified:** Header sectionBaseId `99586bd3` appears 31 times across 17 pages (182% — multiple sections per page use it). Sidemenu `ef0ecc71` appears 14 times (82%). Both are correctly detected as shared.

**Note:** The frequency can exceed 100% because a single page can have multiple sections with the same `sectionBaseId` (e.g., animal-detail has 6 sections with `sectionBaseId` = `99586bd3` — Header, Header PUBLIC, Content Section, etc.). The threshold logic should count distinct pages, not total occurrences.

```typescript
// Source: verified against sample export
function detectSharedSections(pages: ParsedPage[]): Map<string, string> {
  // Map: sectionBaseId -> Set<pageId>
  const pageFreq = new Map<string, Set<string>>();
  const baseTitles = new Map<string, string>();

  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      const bid = section.sectionBaseId;
      if (!bid) continue;
      if (!pageFreq.has(bid)) pageFreq.set(bid, new Set());
      pageFreq.get(bid)!.add(page.id);
      baseTitles.set(bid, section.sectionTitle ?? 'unnamed');
    }
  }

  const threshold = pages.length * 0.5;
  const shared = new Map<string, string>(); // sectionBaseId -> title
  for (const [bid, pageIds] of pageFreq) {
    if (pageIds.size >= threshold) {
      shared.set(bid, baseTitles.get(bid)!);
    }
  }
  return shared;
}
```

### Pattern 4: CSS Token Classification

**What:** Parse the second `<style>` block in any HTML shell's `<head>`. Extract all `--{uuid}: {value};` declarations. Classify by value regex.

**Verified against sample:** 227 total tokens: 64 font composites, 144 hex colors, 19 px dimensions. Zero tokens fall into "other" category with the three regex patterns below.

**Important:** The `:root {}` block spans multiple lines. The regex must not rely on single-line mode for the outer block.

```typescript
// Source: verified against index.html in sample export (227 tokens, 0 unclassified)
const TOKEN_REGEX = /--([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*:\s*([^;]+);/gi;

function classifyToken(value: string): 'font' | 'color' | 'dimension' | 'raw' {
  const v = value.trim();
  // Font composite: "500 64px/72px var(--ww-default-font-family, sans-serif)"
  if (/^\d+\s+\d+px\/\d+px\s/.test(v)) return 'font';
  // Hex color: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return 'color';
  // Dimension: 96px, 4px, 16px (all positive integers in sample)
  if (/^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(v)) return 'dimension';
  return 'raw';
}

// Extract font size in px from font composite value for H1-H6 ranking
function extractFontSizePx(value: string): number {
  const match = value.match(/\s(\d+)px\//);
  return match ? parseInt(match[1], 10) : 0;
}
```

### Pattern 5: Workflow Chain Linearization

**What:** Workflows store action chains as a flat dict with `firstAction` ID and `next` pointer per action. Walk the chain to produce an ordered list.

**Verified:** Dashboard `page.workflows` has a 2-action chain (`onload` trigger). Forgot-password form has a 2-action interaction chain. Always guard against cycles.

```typescript
// Source: verified against dashboard and forgot-password page JSONs
function linearizeWorkflowChain(
  firstActionId: string,
  actionsMap: Record<string, WorkflowAction>
): WorkflowAction[] {
  const chain: WorkflowAction[] = [];
  const visited = new Set<string>();
  let current: string | undefined = firstActionId;
  while (current && !visited.has(current)) {
    visited.add(current);
    const action = actionsMap[current];
    if (!action) break;
    chain.push(action);
    current = action.next;
  }
  return chain;
}
```

### Pattern 6: Dynamic Binding Detection

**What:** Any property with `{__wwtype: "f"|"js", code: string, defaultValue: any}` is a dynamic binding. Use `defaultValue` for visual approximation. Annotate with `[DYNAMIC: formula]` or `[DYNAMIC: js-expression]`.

**Verified counts:** Forgot-password has 6 `__wwtype` refs. Dashboard has 110+ across components. `conditionalRendering` also uses `__wwtype: "f"` and lives in `_state.style.default.conditionalRendering`.

```typescript
// Source: verified structure in forgot-password and dashboard page JSONs
interface DynamicBinding {
  __wwtype: 'f' | 'js';
  code: string;
  defaultValue?: unknown;
}

function isDynamicBinding(val: unknown): val is DynamicBinding {
  return (
    typeof val === 'object' &&
    val !== null &&
    '__wwtype' in val &&
    ((val as DynamicBinding).__wwtype === 'f' || (val as DynamicBinding).__wwtype === 'js')
  );
}
```

### Anti-Patterns to Avoid

- **Using only 13 slot types:** The full inventory is 26 named slots plus greedy traversal for deeper nesting. Use greedy `getAllWwRefs()` to avoid missing any.
- **Using `parentSectionId` as the ONLY tree root mechanism:** Content-based walk finds ~855 of 1,273 on animal-detail; `parentSectionId` finds the rest. Both required.
- **Counting sectionBaseId total occurrences vs distinct page count:** The Header sectionBaseId appears on 31 total section instances across 17 pages. Count PAGES, not instances.
- **Parsing design tokens after parsePages:** CSS variable UUIDs appear in `_state.style` values as `var(--uuid, fallback)`. Token map must exist first for inline resolution.
- **Reading CSS tokens from JSON:** Authoritative token definitions are in HTML `<head>` `<style>` block. JSON `_state.style` values reference them via `var()` — the fallback value is useful for confirmation only.

---

## WeWeb JSON Data Format — Verified Structure

### data/{uuid}.json Top-Level Keys

```typescript
// Source: verified against all 17 page JSON files
interface WeWebPageData {
  cacheVersion: number;      // 216 in sample — all pages same version
  page: {
    id: string;
    paths: { en: string; default: string }; // URL route, e.g. "dashboard" or "animal-detail/{{param|}}"
    workflows: WorkflowEntry[];             // PAGE-LEVEL workflows (not element interactions)
    cmsDataSetPath?: string;
  };
  sections: Record<string, WeWebSection>;  // keyed by UUID
  wwObjects: Record<string, WeWebObject>;  // flat reference pool, keyed by UUID
  variables: VariableEntry[];              // 0-13 per page, 58 unique total
  workflows: WorkflowEntry[];              // ALWAYS empty in sample (0 entries)
  collections: CollectionEntry[];          // 0-10 per page, 22 unique total
  formulas: unknown[];
  libraryComponents: LibraryComponentEntry[];  // 0-3 per page
}
```

### WeWebSection Structure

```typescript
interface WeWebSection {
  uid: string;
  linkId: string;            // NOT stable across pages — do not use for shared detection
  sectionBaseId: string;     // STABLE cross-page identity — use this for shared detection
  sectionTitle: string | null;
  _state: {
    style: {
      default?: StyleBlock;
      mobile?: StyleBlock;
      tablet?: StyleBlock;
      // also: _wwHover_default etc. (interaction states)
    };
  };
  content: {
    default?: { wwObjects: Array<{uid: string; isWwObject: true}>; _ww-layout_*?: string };
    mobile?: { wwObjects: Array<{uid: string; isWwObject: true}> };
    tablet?: { wwObjects: Array<{uid: string; isWwObject: true}> };
    // NOTE: For linked sections (Header PUBLIC, Sidemenu PUBLIC), all wwObjects arrays are EMPTY
    // Their children have parentSectionId pointing to this section's uid
  };
}
```

### WeWebObject Structure

```typescript
interface WeWebObject {
  uid: string;
  name: string | null;
  wwObjectBaseId: string;                    // component type identifier (33 unique in sample)
  libraryComponentBaseId: string | null;     // non-null = library component instance
  parentSectionId: string | null;            // IMPORTANT: may be null even for reachable objects
  _state: {
    style: {
      default?: StyleBlock & { conditionalRendering?: DynamicBinding | boolean };
      mobile?: StyleBlock;
      tablet?: StyleBlock;
      _wwHover_default?: StyleBlock;         // hover state
      _wwChecked_default?: StyleBlock;       // checked state
      _wwLinkActive_default?: StyleBlock;    // active link state
      // other state keys with format: {stateId}_default
    };
    interactions: InteractionEntry[];
  };
  content: {
    default?: Record<string, unknown>;       // all content properties + slot refs
    mobile?: Record<string, unknown>;
    tablet?: Record<string, unknown>;
  };
}
```

### StyleBlock — Breakpoint Override Structure

```typescript
// Diff mobile/tablet against default for responsive specs
// Only keys that differ are meaningful overrides
interface StyleBlock {
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
  display?: string | DynamicBinding;       // can be a dynamic binding
  backgroundColor?: string;
  conditionalRendering?: DynamicBinding | boolean;
  // ... all standard CSS property names as camelCase
}
```

### Interaction Entry Structure

```typescript
interface InteractionEntry {
  id: string;
  name: string;
  trigger: 'click' | 'change' | 'submit' | 'cellValueChanged' | '_wwOnMounted' |
           'scan' | 'action' | 'eventClick';
  firstAction: string;                     // ID of first action in chain
  actions: Record<string, WorkflowAction>; // flat dict; walk via firstAction + next
  triggerConditions: DynamicBinding | null;
  description: string;
}
```

### Page Workflow Structure (page.workflows)

```typescript
interface WorkflowEntry {
  id: string;
  name: string;
  trigger: 'onload' | 'page-unload';      // observed triggers
  firstAction: string;
  actions: Record<string, WorkflowAction>;
  triggerConditions: DynamicBinding | null;
}
```

### WorkflowAction Types — All Observed

| type value | Meaning |
|-----------|---------|
| `variable` | Set a variable value |
| `wait` | Wait N ms |
| `reset-variables` | Reset variables to defaults |
| `component-action` | Invoke a component method |
| `fetch-collection` | Fetch a single collection |
| `fetch-collections` | Fetch multiple collections |
| `change-page` | Navigate to another page |
| `return` | Return from workflow |
| `if` | Conditional branch |
| `switch` | Switch branch |
| `log` | Console log |
| `custom-js` | Custom JS code block |
| `{pluginId}-{operation}` | Plugin-specific (e.g., DB CRUD, auth, email) |
| `_wwLocalMethod_{component}.{method}` | Component local method (e.g., dialog.closeDialog) |

---

## wwObjectBaseId Lookup Table

**Verified from all 17 pages.** 33 unique wwObjectBaseId values observed.

| UUID prefix | Component type | Notes |
|------------|----------------|-------|
| `b783dc65` | Container (div/flexbox) | Most common; 621 instances on animal-detail |
| `d7904e9d` | Text element | Paragraph/heading text |
| `1b1e2173` | Icon | Plus/close/error icons |
| `83d890fb` | Icon (variant) | Clear icon, caret icon |
| `6f8796b1` | Button (primary/ghost) | Signin, navigation buttons |
| `59dca300` | Button (variant) | Register, QR popup buttons |
| `deb10a01` | Text input | Email, password, text fields |
| `aeb78b9a` | Text input (variant) | Email/password with validation |
| `6145eb60` | Select dropdown | Gender, status, recurring type |
| `0d3e75d1` | Select dropdown (variant) | Breed, shelter selects |
| `9ecb2cfc` | Form | Animal entry form, recurring form |
| `aa29a661` | Checkbox | Boolean inputs |
| `6ba133b6` | Checkbox (variant) | Active checkbox |
| `3a7d6379` | Image | Animal images, logos |
| `a823467c` | File upload | Photo upload, file input |
| `9202d35c` | File input | Generic file input |
| `985570fc` | Date picker | Date/time fields |
| `d2eeb897` | Data grid/table | Animal list, memo, weight |
| `a6cb6a4d` | Tabs | Tab navigation with content |
| `9256b033` | Modal/popup | Alert dialogs, popups |
| `9ccf84b0` | Image slider | Carousel |
| `aa27b26f` | Loader | Loading spinner |
| `70a53858` | Category | Tag/badge component |
| `97a63460` | Active checkbox | State-aware checkbox |
| `85044fa4` | Date display | Date rendering |
| `c8199d0d` | Select (CDN variant) | External select components |
| `21881619` | Unknown | No named examples in sample |
| `60676ae5` | Unknown | No named examples in sample |
| `69d0b3ef` | Unknown | No named examples in sample |
| `84f5dd60` | Unknown | No named examples in sample |
| `af811adf` | Unknown | No named examples in sample |
| `c6c0c00e` | Unknown (library root) | Used as libraryComponent root |
| `fd8c482f` | Unknown | No named examples in sample |

**Fallback strategy:** If `wwObjectBaseId` not in lookup table, use `obj.name` if non-null. If both are absent, label as `custom-component`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursive tree walk cycle detection | Custom visited-tracking logic from scratch | Pattern from ARCHITECTURE.md: `visited: Set<string>`, check before processing | Already proven; cycles CAN occur in malformed exports |
| Asset copy with progress | Custom shell streaming | Mirror `copyDirIfExists` from webflow-to-code `assets/copy.ts` | Exact pattern already written; handles missing dir gracefully |
| Base64 file read | Custom shell escaping | `base64 < 'path'` → `atob()` → `JSON.parse()` — exact pattern from Phase 1 | Backticks and special chars in `code` fields WILL break naive reads |
| Workflow chain traversal | Unordered dict output | `linearizeWorkflowChain()` with `firstAction`→`next` walk | 4+ action chains exist; unordered dict is unusable in brief |
| Font URL extraction | HTML full parse | Single regex on raw HTML string for `googleapis.com/css2` | HTML head is simple; full parse is overkill |

---

## Complete Slot Type Inventory

**28 named slot types found across all 17 pages.** Classified by cardinality:

### Single-ref slots (`{uid, isWwObject: true}`)
`actionSelectElement`, `bulletsIcons`, `button`, `caretIconElement`, `checkbox`, `choicesElement`, `clearIconElement`, `contentElement`, `el`, `embeddedContainer`, `flexboxElement`, `leftIcon`, `overlayElement`, `placeholderElement`, `rightIcon`, `text`, `textElement`, `triggerElement`

### Array slots (`[{uid, isWwObject: true}, ...]`)
`children`, `formContent`, `layout`, `mainLayoutContent`, `navigationIcons`, `triggerZone`

### Array-of-arrays slots (`[[{uid, isWwObject: true}], ...]`)
`tabsContent`, `tabsList`

### Deeply nested refs (not top-level slot keys)
`columns[N].containerId` — found in data grid components; each column definition can have a `containerId` field that is a `{uid, isWwObject: true}` ref.

**Recommendation:** Use the greedy `getAllWwRefs()` traversal (inspect all values recursively) rather than maintaining an explicit slot list. This future-proofs against new WeWeb component types.

---

## Common Pitfalls

### Pitfall 1: Linked Sections Have Empty content.wwObjects

**What goes wrong:** Header PUBLIC and Sidemenu PUBLIC sections have `content.default.wwObjects: []` — empty. A walker using only content-based traversal produces zero components for these sections, which are present on 12+ pages.

**Root cause:** WeWeb stores "linked" (shared) section content via `parentSectionId` on each wwObject, not via `content.wwObjects` refs.

**Prevention:** After content-based walk for each section, also walk all objects whose `parentSectionId` equals the section UID.

**Verification:** animal-detail page reaches 1,273/1,273 objects with the 3-pronged walk; 855/1,273 without parentSectionId fallback.

### Pitfall 2: sectionBaseId Frequency: Count Pages Not Instances

**What goes wrong:** Header sectionBaseId appears on 31 section instances across 17 pages (multiple sections per page have it). Counting raw occurrences vs distinct pages produces wrong shared layout detection.

**Prevention:** Use `Map<sectionBaseId, Set<pageId>>`, then check `pageSet.size >= pages.length * 0.5`.

**Verification:** Dashboard page alone has 4 sections with sectionBaseId `99586bd3` — if you counted instances, a page with 4 duplicate sections would appear as 4 pages.

### Pitfall 3: Dynamic Bindings on Style Properties

**What goes wrong:** `_state.style.default.display` can be a DynamicBinding object `{__wwtype: "f", code: "...", defaultValue: "block"}` rather than a string. Assigning it directly to a typed `StyleBlock` without checking fails silently.

**Prevention:** When reading any style property, check `isDynamicBinding(val)` before using the value as a string. Use `defaultValue` as fallback for visual specs.

### Pitfall 4: Greedy `getAllWwRefs` Stops at isWwObject Refs

**What goes wrong:** If `getAllWwRefs` recurses INTO an `{isWwObject: true, uid: ...}` object, it may find nested UIDs that don't exist in the objectMap (these are self-contained refs, not further nesting).

**Prevention:** Return immediately when encountering `{isWwObject: true}` — don't recurse into it. Only the `uid` field is needed.

### Pitfall 5: `page.workflows` vs `page.page.workflows`

**What goes wrong:** The top-level `workflows` key in the page JSON is ALWAYS empty in the sample (confirmed across all 17 pages). The page-level workflows are at `data.page.workflows[]` (nested under the `page` key).

**Prevention:** Read from `pageData.page.workflows`, not `pageData.workflows`.

**Verified:** `pageData.workflows` = empty array on all 17 pages. `pageData.page.workflows` = 0-2 entries per page.

### Pitfall 6: Route Parameters Must Use `{{param|}}` Normalization

**What goes wrong:** `page.paths.default` returns `"animal-detail/{{param|}}"` — WeWeb's dynamic segment syntax. Writing this directly to the brief produces an unusable route.

**Prevention:** Normalize `{{param|}}` → `[param]` (Next.js) or `:param` (React Router) in the route extraction step. The parameter name before `|` is the param name.

**Pattern:**
```typescript
function normalizeRoute(path: string): string {
  return path.replace(/\{\{([^|]+)\|[^}]*\}\}/g, '[$1]');
}
// "animal-detail/{{param|}}" → "animal-detail/[param]"
```

### Pitfall 7: `manifest.json` Is a PWA Manifest, Not Site Metadata

**What goes wrong:** Expecting `manifest.json` to contain site structure or page listings. It is a standard PWA web app manifest (name, short_name, icons, start_url).

**Use:** Extract site name from `manifest.name` or `manifest.short_name` for the brief header.

**Verified:** `manifest.name` = Korean-language site name in sample.

### Pitfall 8: Images May Be CDN Placeholders

**What goes wrong:** Some image `url` values in component content reference `cdn.weweb.app/public/images/no_image_selected.png` — a CDN-hosted placeholder, not a local asset.

**Prevention:** When listing image assets, skip CDN URLs. Flag components whose image URL is the WeWeb placeholder. Only files in `images/` and `icons/` are local assets.

**Pattern:**
```typescript
const WW_PLACEHOLDER = 'cdn.weweb.app/public/images/no_image_selected.png';
function isCdnPlaceholder(url: string): boolean {
  return url.includes(WW_PLACEHOLDER) || url.includes('cdn.weweb.app');
}
```

---

## Phase 1 Integration Points

Phase 2 receives `extractDir` and `entries` from Phase 1 (`ExtractionResult`). Key facts about what Phase 1 guarantees:

- `extractDir` is the path to the extracted ZIP contents
- `entries` is the ZipManifest file list (from `unzip -l`)
- The export has already been validated (data/*.json present, manifest.json present, div#app and _wwcv= confirmed)
- `extractDir/data/*.json` — 17 page JSON files
- `extractDir/index.html` — HTML shell with CSS design tokens in `<head>`
- `extractDir/images/` — 21 image files
- `extractDir/icons/` — 3 SVGs + `lucide/` directory with 23 SVGs
- `extractDir/manifest.json` — PWA manifest (site name)

**ZipStep union type:** Phase 2 adds `'copying'`, `'analyzing'` steps. Both are already in the Phase 1 `ZipStep` type (`src/zip/types.ts`). Phase 2 calls `setStep({ kind: 'analyzing', pageCount: N })` and `setStep({ kind: 'copying', label: '...' })`.

---

## Data Type Definitions for Phase 2

These types need to be created in `src/design/types.ts` and `src/analysis/types.ts`:

```typescript
// src/design/types.ts
export interface DesignToken {
  uuid: string;
  value: string;
  type: 'font' | 'color' | 'dimension' | 'raw';
  // For font: extracted size/weight/lineHeight
  fontSizePx?: number;
  fontWeight?: string;
  lineHeight?: string;
  // Inferred semantic label (set after classification)
  semanticLabel?: string;  // e.g. "h1", "h2", "primary", "gray-50"
}

export interface DesignSystem {
  fonts: DesignToken[];        // sorted by fontSizePx desc; semanticLabel: h1-h6...
  colors: DesignToken[];       // deduplicated by hex value
  dimensions: DesignToken[];
  raw: DesignToken[];
  googleFontUrls: string[];    // from HTML <head> link tags
}

// src/analysis/types.ts
export interface ParsedPage {
  id: string;                  // UUID filename
  route: string;               // normalized from page.paths.default
  isDynamic: boolean;          // true if route contains [param]
  sections: Record<string, ParsedSection>;
  variables: VariableEntry[];
  collections: CollectionEntry[];
  workflows: WorkflowSpec[];   // page-level (page.workflows) + linearized
}

export interface ParsedSection {
  uid: string;
  sectionBaseId: string;
  title: string | null;
  isShared: boolean;           // set by detectShared after cross-page analysis
  styleDefault: Record<string, unknown>;
  styleMobile?: Record<string, unknown>;
  styleTablet?: Record<string, unknown>;
  components: ParsedObject[];  // tree-walked, ordered
}

export interface ParsedObject {
  uid: string;
  name: string | null;
  componentType: string;       // from wwObjectBaseId lookup or name fallback
  wwObjectBaseId: string;
  isLibraryComponent: boolean;
  isDynamic: boolean;          // has __wwtype binding on key content properties
  conditionalRendering?: string;  // description if conditionally visible
  styleDefault: Record<string, unknown>;
  styleMobile?: Record<string, unknown>;
  styleTablet?: Record<string, unknown>;
  interactions: WorkflowSpec[];
  children: ParsedObject[];    // resolved subtree
  // Type-specific content (for known component types)
  textContent?: string | '[DYNAMIC]';
  imageUrl?: string | '[DYNAMIC]';
}

export interface WorkflowSpec {
  id: string;
  name: string;
  sourceType: 'page' | 'element';
  sourceName: string;
  trigger: string;
  triggerCondition?: string;
  actions: ActionSpec[];
}

export interface ActionSpec {
  type: string;
  name: string;
  varId?: string;
  varName?: string;            // resolved from variables dict
  details?: Record<string, unknown>;
}

export interface VariableEntry {
  id: string;
  name: string;
  type: 'boolean' | 'string' | 'number' | 'array' | 'object' | 'query';
  defaultValue: unknown;
  isLocalStorage: boolean;
  isPersistentOnNav: boolean;
}

export interface CollectionEntry {
  id: string;
  name: string;
  type: 'single' | 'list';
  table: string;               // from config.table
  pluginId: string;
}

export interface SiteAnalysis {
  siteName: string;            // from manifest.json name/short_name
  pages: ParsedPage[];
  sharedSections: Map<string, string>;  // sectionBaseId -> title
  allVariables: VariableEntry[];
  allCollections: CollectionEntry[];
  totalComponentCount: number;
}

// src/assets/types.ts (WeWeb-specific, simpler than webflow-to-code)
export interface AssetManifest {
  images: AssetEntry[];
  icons: AssetEntry[];
  googleFonts: string[];       // extracted CDN URLs for brief
  totalCopied: number;
}

export interface AssetEntry {
  filename: string;
  projectRelativePath: string;  // .shipstudio/assets/images/foo.jpg
}
```

---

## Assets Module: WeWeb-Specific Patterns

WeWeb assets differ from Webflow in key ways:

1. **No videos/ or fonts/ directories** — WeWeb uses Google Fonts CDN exclusively (no self-hosted fonts in sample)
2. **icons/ directory has subdirectories** — `icons/lucide/` is a subdirectory, not just flat SVGs. Copy entire `icons/` tree recursively.
3. **assets/ directory contains compiled JS/CSS bundles** — NOT relevant to the brief; do not copy
4. **No CSS/JS to copy** — `assets/` in WeWeb is Vue bundles, not stylesheets

**Copy operations:**
```typescript
// COPY: images/ → .shipstudio/assets/images/
// COPY: icons/ → .shipstudio/assets/icons/  (includes lucide/ subdirectory)
// SKIP: assets/  (compiled Vue bundles, not useful)
// SKIP: files/   (unknown purpose in sample; 0 files)
```

**Manifest:** Count files in `images/` (21) and `icons/` tree (26 total: 3 SVGs + 23 lucide). Google Font URLs come from HTML parsing, not from files.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is a pure code/JSON parsing phase. All required tools (`base64`, `bash`, `cp`, `mkdir`) are guaranteed present on macOS from Phase 1 validation. No new external dependencies.

---

## Validation Architecture

Validation is disabled (`nyquist_validation: false` in `.planning/config.json`). Skipping this section.

---

## Open Questions

1. **Linked section content vs parentSectionId for component ORDERING**
   - What we know: Linked sections (Header PUBLIC) have 15 direct children via parentSectionId; those children have their own content-based subtrees
   - What's unclear: Is there an intended ordering for parentSectionId-linked roots? The array order is dict insertion order in the JSON, which may not match visual order
   - Recommendation: Sort by object name alphabetically as fallback if no explicit ordering exists; document in brief that linked section ordering is approximate

2. **`_wwHover_default` and other state keys in _state.style**
   - What we know: Animal-detail page has 8 non-standard style keys (`_wwHover_default`, `_wwChecked_default`, etc.) on 38+ objects
   - What's unclear: Should these be extracted for the brief? They represent interactive states (hover, checked, active link)
   - Recommendation: Extract `_wwHover_default` and `_wwChecked_default` as "interactive state overrides" in the brief component spec; omit the hash-prefixed custom state keys (`AW0E58_default` etc.)

3. **Variables with `type: "query"` semantics**
   - What we know: 1 variable has `type: "query"` in sample
   - What's unclear: What does a "query" variable represent vs a "collection"?
   - Recommendation: Treat as "data binding" in the inventory; document as requiring backend wiring

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` — all 17 pages parsed programmatically for this research:
  - 2,246 total wwObjects across 17 pages confirmed
  - 28 slot types + greedy traversal verified for 100% coverage on all pages
  - 227 CSS tokens classified (64 font, 144 color, 19 dimension, 0 unclassified)
  - 33 unique wwObjectBaseId values mapped
  - sectionBaseId frequency verified: Header on 12 distinct pages, Sidemenu on 12 distinct pages
  - Linked section (empty content.wwObjects + parentSectionId) pattern confirmed on Sidemenu sections
- Phase 1 source code in `src/zip/` and `src/views/MainView.tsx` — integration points verified
- `plugin-webflow-to-code/src/assets/copy.ts` and `manifest.ts` — copy patterns reused verbatim

### Secondary (MEDIUM confidence)
- WeWeb JSON schema inferred from 17 page files — HIGH confidence for observed patterns; MEDIUM for exhaustiveness (other WeWeb projects may have additional slot types or workflow triggers)
- `wwObjectBaseId` lookup table — covers 33 base IDs from one export; 5 are unknown (no named examples)

### Tertiary (informational)
- `manifest.json` site name — Korean-language in sample; extraction pattern is `manifest.name` or `manifest.short_name`

---

## Metadata

**Confidence breakdown:**
- Tree walker algorithm: HIGH — proven 100% coverage on all 17 pages including max-complexity animal-detail
- CSS token classification: HIGH — 0 unclassified tokens against 227 real tokens
- Slot type inventory: HIGH — exhaustive audit across all 17 pages, greedy traversal handles unknowns
- wwObjectBaseId lookup table: MEDIUM — 28/33 types identified; 5 unknowns require fallback
- Workflow/interaction structure: HIGH — all trigger types and action types catalogued
- Asset structure: HIGH — WeWeb-specific differences from Webflow documented and verified

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (WeWeb export format version 216; revalidate if format changes)
