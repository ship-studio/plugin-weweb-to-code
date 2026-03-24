# Phase 3: Brief Generation & Output - Research

**Researched:** 2026-03-24
**Domain:** Markdown brief synthesis, mode-gated UI, shell I/O (clipboard + file save)
**Confidence:** HIGH

## Summary

Phase 3 is a pure synthesis phase. All upstream data is ready: `SiteAnalysis`, `DesignSystem`, and `AssetManifest` are produced by `analyzeSite()` and already held in MainView's `result` state after Phase 2 completes. Phase 3 adds three new modules — `src/brief/types.ts`, `src/brief/generate.ts`, `src/brief/io.ts` — and extends `MainView.tsx` to wire mode selection UI, brief generation, file save, and clipboard copy. The sibling `plugin-webflow-to-code/src/brief/` is the direct template; the primary work is adapting its Webflow-specific section builders to WeWeb's different data model (no CSS files section, no CMS templates, instead: WeWeb component types, dynamic binding annotations, shared section listing, workflow specs, design token tables, and Google Font references).

The WeWeb data model surfaces several brief-specific adaptations versus the Webflow brief:
(1) Design system goes in the brief as classified token tables (typography/colors/spacing), not a CSS file reference — WeWeb has no exported CSS files for the AI to reference;
(2) Shared sections are identified by `sectionBaseId` and stored in `SiteAnalysis.sharedSections` (a `Map<string, string>`) rather than a Webflow-style `SharedLayout` struct;
(3) Per-page component trees are `ParsedObject[]` with recursive `children`, not flat section lists;
(4) Dynamic bindings are already annotated `[DYNAMIC]` in `ParsedObject.textContent`/`imageUrl` by Phase 2;
(5) Workflows are `WorkflowSpec[]` on each `ParsedPage`, already linearized.

The io.ts pattern (base64-encode → `echo ... | base64 -d > file` and `echo ... | base64 -d | pbcopy`) is identical to the webflow pattern and must be copied without modification. The mode/preserve UI pattern from webflow-to-code's MainView is a direct port with CSS class prefix changed from `wf2c-` to `ww2c-` — the styles already exist in `src/styles.ts` (all `ww2c-` variants already defined for mode-card, preserve-section, checkbox, custom-notes, results, etc.).

**Primary recommendation:** Create `src/brief/types.ts`, `src/brief/generate.ts`, `src/brief/io.ts` modeled after the webflow equivalents with WeWeb-specific section builders, then extend `MainView.tsx` to add mode state, brief generation step, save/copy actions, and done-state results panel.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRIEF-01 | Plugin generates markdown brief with site overview (page count, asset count, component count) | `SiteAnalysis.pages.length`, `totalComponentCount`, `assetManifest.totalCopied` are all available post-Phase 2 |
| BRIEF-02 | Brief includes design system section with classified token tables (typography, colors, spacing) | `DesignSystem.fonts`, `.colors`, `.dimensions` are pre-classified by Phase 2 with `semanticLabel` and `fontSizePx`; emit as markdown tables |
| BRIEF-03 | Brief includes shared layout section identifying nav/header/sidebar/footer with confidence level | `SiteAnalysis.sharedSections: Map<string, string>` holds `sectionBaseId → title` for all sections on >50% of pages |
| BRIEF-04 | Brief includes per-page sections with component summaries and section structure | `ParsedPage.sections: Record<string, ParsedSection>` with `.components: ParsedObject[]` tree; render section title + component list with depth-indented component type names |
| BRIEF-05 | Brief includes responsive breakpoint diffs per section | `ParsedSection.styleMobile`, `.styleTablet`, `ParsedObject.styleMobile`, `.styleTablet` — emit only when non-empty and different from `styleDefault` |
| BRIEF-06 | Brief includes workflow/interaction specs | `ParsedPage.workflows: WorkflowSpec[]` (page-level) and `ParsedObject.interactions: WorkflowSpec[]` (element-level), already linearized by Phase 2 |
| BRIEF-07 | Brief includes asset inventory with paths and metadata | `AssetManifest.images`, `.icons`, `.googleFonts` — render as tables with `projectRelativePath` |
| BRIEF-08 | Brief includes migration guidance per component type | Use `ParsedObject.componentType` strings to emit a migration note table; define a `COMPONENT_MIGRATION_NOTES` lookup in generate.ts |
| BRIEF-09 | Plugin estimates token count and shows warning if brief exceeds threshold | `estimateTokens(markdown) = Math.ceil(markdown.length / 4)`; threshold `TOKEN_WARNING_THRESHOLD = 12_000` (matching webflow pattern); surface in MainView done state |
| BRIEF-10 | Brief content adapts based on selected mode (pixel-perfect vs best-site) | Mode drives instructions section text and which preserve-checkboxes affect the narrative; same pattern as webflow-to-code |
| UX-03 | User can choose between pixel-perfect and best-site mode (with preserve options) | Mode-card UI + PreserveCheckbox component + customNotes textarea — direct port from webflow-to-code MainView with `ww2c-` CSS classes (already defined in styles.ts) |
| UX-05 | User can copy brief to clipboard | `copyToClipboard(shell, markdown)` from `brief/io.ts` — base64-encode then `pbcopy`; same pattern as webflow |
| UX-06 | Plugin saves brief to .shipstudio/assets/brief.md | `saveBrief(shell, projectPath, markdown)` from `brief/io.ts` — base64-encode then redirect to file; same pattern as webflow |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- TypeScript + React (matching webflow-to-code), Vite build, Vitest for tests
- No runtime dependencies — only peer React 19 from Ship Studio host
- All file system operations go through Ship Studio's Shell abstraction (`exec` commands)
- Must conform to Ship Studio plugin.json spec (slot: toolbar, API version 1)
- Must handle WeWeb export format (ZIP with HTML shells, `/data/` JSON, `/assets/`, `/images/`, `/icons/`)
- No `adm-zip`, `postcss`, `axios`, `lodash` — zero runtime bundle dependencies
- CSS class prefix `ww2c-` (distinct from sibling `wf2c-`)
- All markdown string generation: tagged template literals + helper functions, no templating library
- File reads go through `base64 < 'path'` → `atob()` to avoid shell escaping; brief writes use the inverse

---

## Standard Stack

### Core (no new dependencies for Phase 3)

Phase 3 adds no new npm dependencies. All tooling is inherited from Phase 1/2.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.2 | Static types for BriefInput/BriefResult | Already in project |
| React | 19.2.4 (peer) | Mode-selection UI, results panel | Already in project |
| Vitest | 4.1.1 | Unit tests for generate.ts and io.ts | Already in project |

### New Source Files (Phase 3)

| File | Purpose | Source |
|------|---------|--------|
| `src/brief/types.ts` | `BriefMode`, `PreserveOption`, `BriefInput`, `BriefResult`, `BriefStats` | Adapted from webflow `brief/types.ts` |
| `src/brief/generate.ts` | Pure `generateBrief(input) → BriefResult` + section builder functions | Adapted from webflow `brief/generate.ts` |
| `src/brief/io.ts` | `saveBrief(shell, path, md)` and `copyToClipboard(shell, md)` | Direct copy from webflow `brief/io.ts` — no changes needed |
| `src/brief/generate.test.ts` | Vitest unit tests for generate.ts | New; follow webflow test patterns |
| `src/brief/io.test.ts` | Vitest unit tests for io.ts | Direct copy from webflow `brief/io.test.ts` — no changes needed |

---

## Architecture Patterns

### Recommended Module Structure

```
src/brief/
├── types.ts        # BriefMode, PreserveOption, PRESERVE_OPTIONS, BriefInput, BriefResult
├── generate.ts     # generateBrief() + section builder functions (pure)
├── generate.test.ts
├── io.ts           # saveBrief(), copyToClipboard() (shell side-effects)
└── io.test.ts
```

### Pattern 1: BriefInput Type Contract

The WeWeb `BriefInput` differs from the webflow version because it consumes WeWeb-specific types:

```typescript
// src/brief/types.ts
import type { SiteAnalysis } from '../analysis/types';
import type { DesignSystem } from '../design/types';
import type { AssetManifest } from '../assets/types';

export type BriefMode = 'pixel-perfect' | 'best-site';

export type PreserveOption =
  | 'brand-colors'
  | 'visual-hierarchy'
  | 'exact-layouts'
  | 'interactions'
  | 'image-treatment';

export const PRESERVE_OPTIONS: { key: PreserveOption; label: string }[] = [
  { key: 'brand-colors', label: 'Brand colors & typography' },
  { key: 'visual-hierarchy', label: 'Visual hierarchy & spacing' },
  { key: 'exact-layouts', label: 'Exact layouts (grid/flex)' },
  { key: 'interactions', label: 'Interactions & workflows' },
  { key: 'image-treatment', label: 'Image treatment & sizing' },
];

export const DEFAULT_PRESERVE: Set<PreserveOption> = new Set([
  'brand-colors',
  'visual-hierarchy',
  'image-treatment',
]);

export interface BriefInput {
  mode: BriefMode;
  siteAnalysis: SiteAnalysis;
  designSystem: DesignSystem;
  assetManifest: AssetManifest;
  projectPath: string;
  date?: string;
  preserve?: Set<PreserveOption>;
  customNotes?: string;
}

export interface BriefStats {
  pageCount: number;
  totalComponentCount: number;
  assetCount: number;
  estimatedTokens: number;
}

export interface BriefResult {
  markdown: string;
  charCount: number;
  estimatedTokens: number;
  stats: BriefStats;
}
```

**Key differences from webflow version:**
- Adds `designSystem: DesignSystem` (webflow version gets CSS file paths instead, not token objects)
- Removes `contentPageCount`/`cmsTemplateCount` (WeWeb has no CMS templates concept; use `pages.length`)
- Renames `animations` preserve option to `interactions` (more accurate for WeWeb's workflow model)
- `BriefStats` replaces `contentPageCount`/`cmsTemplateCount` with `totalComponentCount`

### Pattern 2: generate.ts Section Structure

The WeWeb brief has these sections in order:

```typescript
export function generateBrief(input: BriefInput): BriefResult {
  const sections = [
    buildMetadataSection(input),          // # WeWeb Migration Brief + stats header
    buildMigrationPlanSection(),           // ## Migration Plan — plan file instructions
    buildInstructionsSection(input),       // ## How to Use This Brief — mode-gated guidance
    buildOverviewSection(input),           // ## Site Overview — page list, component count
    buildDesignSystemSection(input.designSystem), // ## Design System — token tables
    buildSharedLayoutSection(input.siteAnalysis), // ## Shared Layout — sections on >50% pages
    buildPagesSection(input),              // ## Pages — per-page subsections
    buildAssetsSection(input.assetManifest), // ## Assets — images/icons/fonts tables
  ].filter(Boolean);

  const markdown = sections.join('\n\n');
  const est = estimateTokens(markdown);
  // ...
}
```

**WeWeb-specific sections not in webflow brief:**
- `buildDesignSystemSection` — no equivalent in webflow (webflow uses CSS files); WeWeb has no exported CSS
- `buildSharedLayoutSection` — adapted: webflow uses a `SharedLayout` struct with nav/footer flags; WeWeb uses `sharedSections: Map<string, string>` (sectionBaseId → title) from Phase 2

**Sections removed versus webflow:**
- `buildCSSReferenceSection` — not applicable; WeWeb has no CSS output files
- CMS template handling in `buildPageSubsection` — WeWeb has no CMS template concept

### Pattern 3: Design System Section Builder

```typescript
function buildDesignSystemSection(ds: DesignSystem): string {
  const lines: string[] = ['## Design System', ''];

  // Typography table (sorted by fontSizePx desc, semanticLabel already set)
  if (ds.fonts.length > 0) {
    lines.push('### Typography');
    lines.push('| Token | Semantic | Size | Weight | Line Height |');
    lines.push('|-------|----------|------|--------|-------------|');
    for (const t of ds.fonts) {
      const size = t.fontSizePx ? `${t.fontSizePx}px` : t.value;
      lines.push(`| \`${t.uuid}\` | ${t.semanticLabel ?? '—'} | ${size} | ${t.fontWeight ?? '—'} | ${t.lineHeight ?? '—'} |`);
    }
    lines.push('');
  }

  // Colors table (deduplicated by hex, semanticLabel set)
  if (ds.colors.length > 0) {
    lines.push('### Colors');
    lines.push('| Token | Semantic | Value |');
    lines.push('|-------|----------|-------|');
    for (const c of ds.colors) {
      lines.push(`| \`${c.uuid}\` | ${c.semanticLabel ?? '—'} | \`${c.value}\` |`);
    }
    lines.push('');
  }

  // Dimensions table
  if (ds.dimensions.length > 0) {
    lines.push('### Spacing & Dimensions');
    lines.push('| Token | Value |');
    lines.push('|-------|-------|');
    for (const d of ds.dimensions) {
      lines.push(`| \`${d.uuid}\` | \`${d.value}\` |`);
    }
    lines.push('');
  }

  // Google Fonts
  if (ds.googleFontUrls.length > 0) {
    lines.push('### External Fonts');
    for (const url of ds.googleFontUrls) {
      lines.push(`- ${url}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

### Pattern 4: Shared Layout Section Builder

```typescript
function buildSharedLayoutSection(sa: SiteAnalysis): string {
  if (sa.sharedSections.size === 0) return '';

  const lines: string[] = ['## Shared Layout', ''];
  lines.push(`These sections appear on more than 50% of pages. Build them once as shared components and reuse across all pages.`);
  lines.push('');
  lines.push('| Section Title | sectionBaseId |');
  lines.push('|---------------|---------------|');
  for (const [baseId, title] of sa.sharedSections) {
    lines.push(`| ${escapeTableCell(title ?? 'Untitled')} | \`${baseId}\` |`);
  }
  return lines.join('\n');
}
```

### Pattern 5: Per-Page Section Builder with Component Tree

The WeWeb page subsection must render the recursive `ParsedObject` tree. The key challenge is presenting a nested component tree as readable flat markdown without losing depth context:

```typescript
function renderComponentTree(objects: ParsedObject[], depth = 0): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  for (const obj of objects) {
    const dynamic = obj.isDynamic ? ' `[DYNAMIC]`' : '';
    const lib = obj.isLibraryComponent ? ' *(library)*' : '';
    lines.push(`${indent}- **${obj.componentType}**${dynamic}${lib}${obj.name ? ` — ${obj.name}` : ''}`);
    if (obj.children.length > 0) {
      lines.push(...renderComponentTree(obj.children, depth + 1));
    }
  }
  return lines;
}
```

**Depth cap:** Limit rendering depth to 3-4 levels to avoid runaway output on deeply nested pages (animal-detail has max depth 7, 1273 objects). Components beyond the depth cap get a `(+N nested)` count note.

**Breakpoint diffs:** Per section, only emit breakpoint diff tables when `styleMobile` or `styleTablet` is non-empty and differs from `styleDefault`. Avoid emitting empty diff blocks.

### Pattern 6: io.ts — Identical to Webflow Version

The `saveBrief` and `copyToClipboard` functions are a verbatim copy from webflow-to-code. No WeWeb-specific changes are needed:

```typescript
// src/brief/io.ts
export async function saveBrief(shell, projectPath, markdown): Promise<void> {
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', ['-c', `echo '${encoded}' | base64 -d > '${briefPath}'`]);
  if (result.exit_code !== 0) throw new Error(`Failed to save brief: ${result.stderr}`);
}

export async function copyToClipboard(shell, markdown): Promise<void> {
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', ['-c', `echo '${encoded}' | base64 -d | pbcopy`]);
  if (result.exit_code !== 0) throw new Error(`Clipboard copy failed: ${result.stderr}`);
}
```

**Why base64:** Markdown content may contain backticks, single quotes, dollar signs, and newlines — all shell-unsafe characters. The base64-encode/decode pattern is the established safe pattern in this plugin (proven in Phase 1 for HTML reads).

### Pattern 7: MainView.tsx Extension

The current MainView ends at `step.kind === 'done'` showing a basic completion message with no brief action. Phase 3 extends it to:

1. **Add mode state before the pipeline starts** — `mode`, `preserve`, `customNotes` state variables with the same mode-card UI as webflow-to-code
2. **Add `generating` step** — after `analyzeSite()` resolves, call `generateBrief()` then `saveBrief()` before transitioning to `done`
3. **Extend `done` state** — show stats, token count warning if over threshold, Output file paths, Copy Brief button
4. **ZipStep.done extension** — add `briefResult: BriefResult` to the `done` variant (already present as `{ kind: 'generating' }` in `zip/types.ts`)

**Mode selector visibility:** Show mode selector when `step.kind === 'idle'` (and no existing plan detected). Hide during pipeline execution. This matches the webflow pattern exactly.

**CSS classes already in styles.ts:** `ww2c-mode-group`, `ww2c-mode-card`, `ww2c-mode-card-name`, `ww2c-mode-card-desc`, `ww2c-preserve-section`, `ww2c-checklist`, `ww2c-check-item`, `ww2c-checkbox`, `ww2c-custom-notes`, `ww2c-results`, `ww2c-results-header`, `ww2c-results-stats`, `ww2c-results-output`, `ww2c-results-output-label`, `ww2c-results-path`, `ww2c-results-tip` — all already defined. No new CSS is needed.

**ZipStep type update required:** The `done` variant in `src/zip/types.ts` needs `briefResult: BriefResult` added. Current definition: `{ kind: 'done'; zipPath: string; extractDir: string; fileCount: number }`.

### Pattern 8: Token Warning Display

```typescript
// In MainView done state
const tokenWarning = step.briefResult.estimatedTokens > TOKEN_WARNING_THRESHOLD;
// Render:
{tokenWarning && (
  <div className="ww2c-results-tip">
    Brief is ~{Math.round(step.briefResult.estimatedTokens / 1000)}K tokens — consider building page by page using the migration plan file.
  </div>
)}
```

### Anti-Patterns to Avoid

- **Dumping raw CSS variable UUIDs in the design system table as primary identifier:** Include the UUID for technical reference but the `semanticLabel` should be the primary display. The AI agent needs human-readable labels, not `--7f3a2b...`.
- **Rendering the full component tree without a depth cap:** The animal-detail page has 1,273 objects at depth 7. Without a cap, a single-page section could produce thousands of markdown lines. Cap at depth 3-4; count omitted children.
- **Rendering breakpoint diff blocks when they are empty:** `styleMobile` and `styleTablet` are optional and often absent. Always guard with `Object.keys(style).length > 0` before emitting a breakpoint diff section.
- **Including shared sections in per-page component listings:** Check `section.isShared` (set by `detectSharedSections` in Phase 2) before rendering a section in the per-page block. Shared sections render once in the Shared Layout section, not per page.
- **Calling `generateBrief()` with mode state from a closed-over variable:** Mode is set before the pipeline runs. Pass it explicitly into `generateBrief()` at call time. Do not read it from a ref to avoid stale capture issues.
- **Not guarding `mkdir -p` before save:** The `.shipstudio/assets/` directory is created during `copyAssets` (Phase 2), but if asset copy was skipped or failed silently, the dir may not exist. Guard: `mkdir -p '${projectPath}/.shipstudio/assets' && echo '${encoded}' | base64 -d > '${briefPath}'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom NLP tokenizer | `Math.ceil(markdown.length / 4)` | Rough estimate is sufficient for warning threshold; exact count not needed |
| Markdown table escaping | Custom parser | `value.replace(/\|/g, '\\|')` helper function | Pipe characters in page titles/component names break table formatting; one-liner fix |
| Clipboard copy | Electron/browser clipboard API | `pbcopy` via `shell.exec` | Ship Studio exposes a Shell abstraction; `pbcopy` is guaranteed on macOS |
| File write | FileSystem API | `echo '${base64}' | base64 -d > file` via `shell.exec` | Same Shell abstraction; no direct FS access in plugin context |
| Mode UI state | Redux/Zustand | `useState<BriefMode>` | Simple local state; no cross-component sharing needed |

---

## Common Pitfalls

### Pitfall 1: Shared Sections Duplicated in Per-Page Output
**What goes wrong:** Every page's brief section includes the nav/header/sidebar components, inflating the brief by 12x for those sections.
**Why it happens:** `ParsedSection.isShared` is set by `detectSharedSections` (Phase 2) but only if the check is made during section rendering.
**How to avoid:** In `buildPageSubsection`, iterate `Object.values(page.sections)` and skip any section where `section.isShared === true`. Those sections are rendered once in `buildSharedLayoutSection`.
**Warning signs:** Brief size >> 50K characters for a 17-page site; repeated identical component lists across all page subsections.

### Pitfall 2: Empty Token Warning on Best-Site Mode
**What goes wrong:** Best-site mode with all preserve checkboxes deselected produces a brief with fewer sections, making the token estimate appear to go under the threshold, suppressing a legitimate warning.
**Why it happens:** Token estimation happens after section filtering, so the actual count is correct. The issue is only if the threshold is hardcoded per-mode rather than computed on final output.
**How to avoid:** Always compute `estimateTokens(markdown)` on the final assembled `markdown` string, not per-section. The `TOKEN_WARNING_THRESHOLD = 12_000` applies regardless of mode.

### Pitfall 3: `btoa()` Fails on Non-Latin-1 Characters in Brief
**What goes wrong:** If the WeWeb site name or component names contain non-ASCII characters (e.g., French accents, Japanese), `btoa()` throws `"The string to be encoded contains characters outside of the Latin1 range"`.
**Why it happens:** `btoa()` only handles Latin-1. The brief markdown may contain Unicode from component names parsed from WeWeb JSON.
**How to avoid:** Use `btoa(unescape(encodeURIComponent(markdown)))` — the same pattern used in webflow-to-code io.ts. This is already the correct pattern in the reference; just don't simplify it to bare `btoa(markdown)`.
**Warning signs:** `DOMException: Failed to execute 'btoa'` in Ship Studio console.

### Pitfall 4: Missing `mkdir -p` Before Brief File Write
**What goes wrong:** `saveBrief` fails with `No such file or directory` if `.shipstudio/assets/` wasn't created by `copyAssets`.
**Why it happens:** `copyAssets` calls `mkdir -p` for images/icons but the parent `.shipstudio/assets/` creation depends on at least one file being present. An export with zero images and zero icons may skip `mkdir -p`.
**How to avoid:** In `saveBrief`, prefix the command: `mkdir -p '${projectPath}/.shipstudio/assets' && echo '${encoded}' | base64 -d > '${briefPath}'`.

### Pitfall 5: Component Tree Depth Causes Massive Brief Output
**What goes wrong:** The animal-detail page has 1,273 `ParsedObject` nodes at up to depth 7. Rendering all of them as indented markdown bullets produces thousands of lines for a single page.
**Why it happens:** `renderComponentTree` is called recursively with no depth limit.
**How to avoid:** Pass a `maxDepth` parameter (recommend 3). When `depth >= maxDepth`, emit `${indent}- ...(${obj.children.length} nested components)` instead of recursing. This keeps the brief useful without being exhaustive.
**Warning signs:** Brief > 200K characters; AI agent complains about context length.

### Pitfall 6: ZipStep `done` Variant Missing `briefResult`
**What goes wrong:** TypeScript error `Property 'briefResult' does not exist on type '{ kind: "done"; ... }'` in MainView when accessing `step.briefResult`.
**Why it happens:** The current `ZipStep` union in `src/zip/types.ts` does not have `briefResult` on the `done` variant — Phase 2 left this out because brief generation wasn't implemented yet.
**How to avoid:** Update the `done` variant in `src/zip/types.ts` to include `briefResult?: BriefResult` before writing MainView code. Update the existing `setStep({ kind: 'done', ... })` call in MainView to include the brief result.

---

## Code Examples

### Complete io.ts (verbatim from webflow-to-code, verified correct)

```typescript
// Source: plugin-webflow-to-code/src/brief/io.ts — no WeWeb-specific changes needed
interface ShellLike {
  exec(cmd: string, args: string[]): Promise<{ exit_code: number; stdout: string; stderr: string }>;
}

export async function saveBrief(shell: ShellLike, projectPath: string, markdown: string): Promise<void> {
  const briefPath = `${projectPath}/.shipstudio/assets/brief.md`;
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', ['-c', `mkdir -p '${projectPath}/.shipstudio/assets' && echo '${encoded}' | base64 -d > '${briefPath}'`]);
  if (result.exit_code !== 0) throw new Error(`Failed to save brief: ${result.stderr}`);
}

export async function copyToClipboard(shell: ShellLike, markdown: string): Promise<void> {
  const encoded = btoa(unescape(encodeURIComponent(markdown)));
  const result = await shell.exec('bash', ['-c', `echo '${encoded}' | base64 -d | pbcopy`]);
  if (result.exit_code !== 0) throw new Error(`Clipboard copy failed: ${result.stderr}`);
}
```

Note: `mkdir -p` guard added vs webflow original — see Pitfall 4.

### ZipStep Type Update Required

```typescript
// src/zip/types.ts — add briefResult to done variant
import type { BriefResult } from '../brief/types';

export type ZipStep =
  | { kind: 'idle' }
  | { kind: 'picking' }
  | { kind: 'extracting'; fileCount: number }
  | { kind: 'validating' }
  | { kind: 'copying'; label: string }
  | { kind: 'analyzing'; pageCount: number }
  | { kind: 'generating' }
  | { kind: 'done'; zipPath: string; extractDir: string; fileCount: number; briefResult: BriefResult }
  | { kind: 'error'; message: string };
```

### MainView Brief Generation Integration

```typescript
// After analyzeSite() resolves in MainView's startPickFlow():
setStep({ kind: 'generating' });
const briefResult = generateBrief({
  mode,
  siteAnalysis: analysisResult.siteAnalysis,
  designSystem: analysisResult.designSystem,
  assetManifest: analysisResult.assetManifest,
  projectPath: ctx.project.path,
  preserve: mode === 'best-site' ? preserve : undefined,
  customNotes: mode === 'best-site' ? customNotes : undefined,
});
await saveBrief(ctx.shell, ctx.project.path, briefResult.markdown);
setStep({ kind: 'done', zipPath, extractDir, fileCount: manifest.fileCount, briefResult });
```

### PreserveCheckbox Component (port from webflow with ww2c- classes)

```typescript
function PreserveCheckbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="ww2c-check-item" onClick={onToggle}>
      <div className={`ww2c-checkbox${checked ? ' checked' : ''}`}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span>{label}</span>
    </div>
  );
}
```

All CSS classes (`ww2c-check-item`, `ww2c-checkbox`, `ww2c-checkbox.checked`) are already defined in `src/styles.ts`.

---

## Data Available from Phase 2

This section documents exactly what Phase 3 consumes, sourced directly from the Phase 2 type contracts.

### SiteAnalysis (from `src/analysis/types.ts`)

```typescript
interface SiteAnalysis {
  siteName: string;                          // from manifest.json name/short_name
  pages: ParsedPage[];                       // all pages with full component trees
  sharedSections: Map<string, string>;       // sectionBaseId → title (>50% pages)
  allVariables: VariableEntry[];             // deduplicated across all pages
  allCollections: CollectionEntry[];         // deduplicated across all pages
  totalComponentCount: number;               // recursive count across all pages/sections
}

interface ParsedPage {
  id: string;                                // UUID filename
  route: string;                             // normalized route e.g. "/about" or "/animals/[id]"
  isDynamic: boolean;                        // true if route contains [param]
  sections: Record<string, ParsedSection>;   // sectionUid → section
  variables: VariableEntry[];
  collections: CollectionEntry[];
  workflows: WorkflowSpec[];                 // page-level + element-level interactions
}

interface ParsedSection {
  uid: string;
  sectionBaseId: string;
  title: string | null;
  isShared: boolean;                         // SET BY detectSharedSections — skip in per-page output
  styleDefault: Record<string, unknown>;
  styleMobile?: Record<string, unknown>;
  styleTablet?: Record<string, unknown>;
  components: ParsedObject[];                // tree-walked, ordered
}

interface ParsedObject {
  uid: string;
  name: string | null;
  componentType: string;                     // human label from lookup or name fallback
  isDynamic: boolean;                        // has __wwtype binding
  conditionalRendering?: string;
  styleDefault: Record<string, unknown>;
  styleMobile?: Record<string, unknown>;
  styleTablet?: Record<string, unknown>;
  interactions: WorkflowSpec[];
  children: ParsedObject[];                  // recursive subtree
  textContent?: string | '[DYNAMIC]';
  imageUrl?: string | '[DYNAMIC]';
}
```

### DesignSystem (from `src/design/types.ts`)

```typescript
interface DesignSystem {
  fonts: DesignToken[];         // sorted by fontSizePx desc; semanticLabel: "h1"..."h6"...
  colors: DesignToken[];        // deduplicated by hex value; semanticLabel: "primary", "gray-50"...
  dimensions: DesignToken[];    // px dimension tokens
  raw: DesignToken[];           // unclassified tokens (rarely used in brief)
  googleFontUrls: string[];     // CDN links for brief output
}

interface DesignToken {
  uuid: string;
  value: string;
  type: 'font' | 'color' | 'dimension' | 'raw';
  fontSizePx?: number;
  fontWeight?: string;
  lineHeight?: string;
  semanticLabel?: string;
}
```

### AssetManifest (from `src/assets/types.ts`)

```typescript
interface AssetManifest {
  images: AssetEntry[];       // .shipstudio/assets/images/...
  icons: AssetEntry[];        // .shipstudio/assets/icons/...
  googleFonts: string[];      // CDN URLs (duplicated in DesignSystem; use either)
  totalCopied: number;
}

interface AssetEntry {
  filename: string;
  projectRelativePath: string;   // .shipstudio/assets/images/foo.jpg
}
```

**Important:** The WeWeb `AssetManifest` does NOT have `images.variants`, `images.type`, `images.purpose`, or `videos` fields that the webflow version has. The brief's assets section builder must use the simpler WeWeb type.

---

## Key Adaptations: WeWeb vs Webflow Brief

| Area | Webflow Brief | WeWeb Brief |
|------|---------------|-------------|
| Design system | CSS file paths table | Token tables (typography/colors/dimensions) |
| Shared layout | `SharedLayout` struct (nav/footer flags + class names) | `Map<sectionBaseId, title>` from `sharedSections` |
| Page component spec | Flat section list with Webflow component classes | Recursive `ParsedObject` tree with `componentType` labels |
| CSS reference section | 3 CSS files (normalize/webflow/site) | Not applicable — omit entirely |
| CMS templates | Separate page type with special handling | Not applicable — omit |
| Dynamic content | IX2 interactions flag | `[DYNAMIC]` annotation per component field |
| Workflows | Not present | `WorkflowSpec[]` per page and per element |
| Asset variants | Images have `variants[]` (srcset) | Simple `projectRelativePath` only |
| Migration notes | Per Webflow component class (`w-nav`, `w-slider`) | Per WeWeb component type string from lookup table |

---

## Mode Behavior Differences

### Pixel-Perfect Mode
**Instructions section:** Tells the AI to preserve the exact layout structure, use the design token values verbatim, and implement WeWeb dynamic components (forms, sliders, etc.) as native equivalents.
**Component output:** Full component tree rendered (up to depth cap).
**Design system:** All token tables included.

### Best-Site Mode
**Instructions section:** Tells the AI to use tokens as reference but modernize with relative units, semantic HTML, and a design system approach.
**Preserve checkboxes:** Sub-selections shown in instructions (what to keep vs. modernize).
**Custom notes:** Appended as quoted block in instructions.
**Component output:** Same as pixel-perfect — mode doesn't filter components, only guidance.

---

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies — `pbcopy` and `base64` are macOS builtins confirmed available in Phase 1/2 work)

---

## Sources

### Primary (HIGH confidence)
- `plugin-webflow-to-code/src/brief/generate.ts` — direct source for section structure, escaping, token estimation pattern, mode/preserve guidance text
- `plugin-webflow-to-code/src/brief/types.ts` — type contract template; WeWeb version adapts it
- `plugin-webflow-to-code/src/brief/io.ts` — verbatim copy for file save / clipboard; no changes needed
- `plugin-webflow-to-code/src/brief/generate.test.ts` — test pattern template
- `plugin-webflow-to-code/src/brief/io.test.ts` — test pattern template; direct copy works
- `plugin-webflow-to-code/src/views/MainView.tsx` — mode UI, preserve checkboxes, done-state results panel pattern
- `plugin-weweb-to-code/src/analysis/types.ts` — verified SiteAnalysis/ParsedPage/ParsedSection/ParsedObject contracts
- `plugin-weweb-to-code/src/design/types.ts` — verified DesignSystem/DesignToken contracts
- `plugin-weweb-to-code/src/assets/types.ts` — verified AssetManifest/AssetEntry contracts (simpler than webflow)
- `plugin-weweb-to-code/src/styles.ts` — confirmed all mode/preserve/results CSS classes already defined with `ww2c-` prefix
- `plugin-weweb-to-code/src/zip/types.ts` — confirmed `done` variant needs `briefResult` field added

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` Phase 5 section — brief format overview; verified against actual source files above

---

## Metadata

**Confidence breakdown:**
- BriefInput/BriefResult types: HIGH — derived directly from existing type contracts in the codebase
- generate.ts section structure: HIGH — webflow source is readable and adaptation requirements are clear
- io.ts pattern: HIGH — verbatim copy; proven in production use by webflow-to-code
- MainView integration: HIGH — webflow MainView is a direct template; CSS classes already exist in styles.ts
- Mode/preserve behavior: HIGH — webflow pattern proven; WeWeb adaptation is label changes only
- Component tree depth cap: MEDIUM — recommended depth 3 is pragmatic but not empirically validated; adjust based on brief output size

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain — no external dependencies to expire)
