# Phase 1: Plugin Shell & ZIP Ingestion - Research

**Researched:** 2026-03-24
**Domain:** Ship Studio plugin shell, ZIP extraction, WeWeb export validation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Validate WeWeb exports using ALL available fingerprints for maximum confidence: data/*.json files exist, HTML shell contains `<div id="app"></div>`, manifest.json exists, and `_wwcv=` version parameter found on asset URLs in HTML
- **D-02:** Validation checks run in order of cheapness — file existence checks first (entries scan), then HTML content grep for div#app and _wwcv param
- **D-03:** Error messages should be clear and actionable, telling the user specifically which marker failed (e.g., "No data/*.json files found — is this a WeWeb export?")
- **D-04:** Copy files directly from webflow-to-code and adapt — rename webflow→weweb, swap validation logic, swap icon. This is the fastest approach with minimal risk since the plugin shell architecture is identical.
- **D-05:** Files to copy near-verbatim: zip/extract.ts (change picker prompt), zip/types.ts, zip/discover.ts (rewrite validateWeWebExport), components/Modal.tsx, src/types.ts, src/context.ts, src/styles.ts (change style ID), vite.config.ts, tsconfig.json, vitest.config.ts, package.json (change name)
- **D-06:** Files to rewrite: src/index.tsx (WeWeb icon SVG, plugin name), zip/discover.ts validateWeWebExport function
- **D-07:** File picker prompt reads "Select WeWeb export zip"
- **D-08:** Before opening the file picker, check if .shipstudio/ directory exists. If it does, warn the user with "Existing migration found. Start fresh?" confirmation before proceeding.

### Claude's Discretion

- WeWeb SVG icon design (find or create appropriate icon)
- Exact CSS style ID naming convention
- Test structure and coverage targets
- Whether to include the MainView stub in Phase 1 or defer to Phase 2

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ZIP-01 | User can select a WeWeb export ZIP via native OS file picker | `pickZipFile` from webflow-to-code copies verbatim, only prompt text changes |
| ZIP-02 | Plugin validates WeWeb export structure (data/*.json, manifest.json, HTML shell with `<div id="app">`) | 4-fingerprint validation confirmed against real ZIP sample; exact grep commands documented |
| ZIP-03 | Plugin shows clear error message when ZIP is not a valid WeWeb export | Error message templates per-fingerprint documented in Architecture Patterns section |
| UX-01 | Plugin loads in Ship Studio toolbar with WeWeb icon | `slots.toolbar` pattern confirmed from webflow-to-code; WeWeb SVG icon needed |
| UX-02 | Plugin opens modal on toolbar button click | `Modal` component copies verbatim from webflow-to-code; state machine is identical |
</phase_requirements>

---

## Summary

This phase ports the proven webflow-to-code plugin shell to become the weweb-to-code plugin. The architecture is a direct copy-and-adapt: the Ship Studio integration layer (plugin.json, toolbar slot, Modal component, Shell interface, context hook, CSS injection) is identical and copies verbatim. The only substantive new work is writing `validateWeWebExport` — a function that confirms a ZIP is a WeWeb export using four fingerprints observed directly from the sample ZIP.

The WeWeb export format has been verified against the real ZIP file (`f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` in the project root). Key finding: WeWeb uses `data/*.json` UUID-named files as the source of truth for page structure, and all HTML shells are SPA stubs containing `<div id="app"></div>` with `_wwcv=` version parameters on asset URLs. The manifest.json is a PWA manifest (name, short_name, start_url, background_color). None of these markers appear in Webflow exports, making them reliable WeWeb fingerprints.

The pre-picker `.shipstudio/` directory check (D-08) and the MainView stub question (discretion) are the only architectural choices beyond straight copy-and-adapt. The MainView should be stubbed in Phase 1 to keep the plugin buildable and testable — a minimal "Select ZIP" button placeholder avoids needing to wire the full Phase 2 analysis flow.

**Primary recommendation:** Copy the 10 source files from webflow-to-code, make targeted edits per the file-by-file adaptation table below, write `validateWeWebExport` using the 4-fingerprint spec, and add tests matching the discover.test.ts pattern from the sibling plugin.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.6.0 | Primary language | Matches webflow-to-code; verified from sibling package.json |
| React | ^19.0.0 (peer) | Plugin UI | Ship Studio host exposes via `window.__SHIPSTUDIO_REACT__`; must not bundle |
| Vite | ^6.0.0 | Build tool | Verified from sibling package.json; produces single ES module; React externalized via data: URL trick |
| Vitest | ^4.1.0 | Unit testing | Co-installed with Vite; test files alongside source matching sibling convention |
| jsdom | ^29.0.0 | DOMParser shim in Vitest | Needed for any HTML-parsing tests; not needed for Phase 1 (no HTML parsing in validation path — we use grep via shell.exec) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `unzip` (system) | macOS built-in | ZIP extraction | Invoked via `shell.exec('unzip', [...])` — no npm alternative |
| `osascript` (macOS) | macOS built-in | Native file picker | `shell.exec('osascript', ['-e', 'POSIX path of (choose file...)'])` |
| `bash -c` + `grep` | macOS built-in | HTML content validation | Checking div#app and _wwcv= inside HTML shells |
| `find` + `wc -l` | macOS built-in | Post-extraction file count | Used in extractAndVerify |

**Note:** jsdom is present in dev dependencies because later phases will need it. Phase 1 tests do not require it — the validation grep runs through mock shell.exec, not a real DOMParser.

**Installation (matches sibling exactly):**
```bash
npm init -y
npm install --save-dev typescript@^5.6.0 @types/react@^19.0.0 vite@^6.0.0 vitest@^4.1.0 jsdom@^29.0.0
# react is a peer dep — DO NOT npm install react
```

---

## Architecture Patterns

### Project Structure (target for Phase 1)
```
src/
├── index.tsx              # Plugin entry point — WeWeb icon, ToolbarButton, slots export
├── types.ts               # Shell, Storage, PluginActions, PluginContextValue interfaces
├── context.ts             # usePluginContext hook (reads window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__)
├── styles.ts              # STYLE_ID = 'weweb-to-code-styles', PLUGIN_CSS (renamed classes)
├── components/
│   └── Modal.tsx          # Modal component — copy verbatim, update class prefix
├── views/
│   └── MainView.tsx       # STUB only in Phase 1 — renders file picker button
└── zip/
    ├── types.ts           # ZipStep union type, ZipManifest, ExtractionResult
    ├── extract.ts         # pickZipFile, buildExtractDir, extractAndVerify
    └── discover.ts        # parseUnzipManifest (copy verbatim), validateWeWebExport (rewrite)

dist/
└── index.js               # Built output (single ES module, no React bundled)

plugin.json                # Ship Studio manifest
vite.config.ts             # React externalization via data: URL
tsconfig.json              # ES2020, bundler moduleResolution, react-jsx
vitest.config.ts           # include: ['src/**/*.test.ts']
package.json               # name: @shipstudio/plugin-weweb-to-code
```

### Pattern 1: Plugin Entry Point (toolbar slot)
**What:** Ship Studio loads plugins by importing `dist/index.js` and reading the `slots.toolbar` export. The toolbar component renders in the Ship Studio toolbar.
**When to use:** Always — this is the Ship Studio plugin contract.
```typescript
// Source: plugin-webflow-to-code/src/index.tsx (copy and adapt)
function WeWebIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      {/* WeWeb-appropriate icon path — discretion item */}
    </svg>
  );
}

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button onClick={() => setModalOpen(true)} title="WeWeb to Code" className="toolbar-icon-btn">
        <WeWebIcon />
      </button>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="WeWeb to Code">
        <MainView />
      </Modal>
    </>
  );
}

export const name = 'WeWeb to Code';
export const slots = { toolbar: ToolbarButton };
export function onActivate() { console.log('[weweb-to-code] Plugin activated'); }
export function onDeactivate() { console.log('[weweb-to-code] Plugin deactivated'); }
```

### Pattern 2: WeWeb Export Validation (rewrite, not copy)
**What:** 4-fingerprint validation in order of cheapness. Entries scan first (O(n) on in-memory array), then shell grep for HTML content.
**When to use:** After every ZIP extraction in the `extractAndVerify` → `validateWeWebExport` call chain.

**Fingerprint spec (verified against real ZIP):**

| Order | Check | Entries scan or shell exec | Error message if fails |
|-------|-------|---------------------------|------------------------|
| 1 | `entries.some(e => e.startsWith('data/') && e.endsWith('.json'))` | entries scan | `"No data/*.json files found — is this a WeWeb export?"` |
| 2 | `entries.some(e => e === 'manifest.json')` | entries scan | `"No manifest.json found — is this a WeWeb export?"` |
| 3 | `grep -c 'div id="app"' '{extractDir}/index.html'` | shell exec | `"No <div id=\"app\"> found — is this a WeWeb export?"` |
| 4 | `grep -c '_wwcv=' '{extractDir}/index.html'` | shell exec | `"No _wwcv= version parameter found — is this a WeWeb export?"` |

```typescript
// Source: zip/discover.ts — rewrite of validateWebflowExport
export async function validateWeWebExport(
  shell: Shell,
  extractDir: string,
  entries: string[],
): Promise<void> {
  // Check 1: data/*.json files exist
  const hasDataJson = entries.some(
    (e) => e.startsWith('data/') && e.endsWith('.json'),
  );
  if (!hasDataJson) {
    throw new Error('No data/*.json files found — is this a WeWeb export?');
  }

  // Check 2: manifest.json exists
  const hasManifest = entries.some((e) => e === 'manifest.json');
  if (!hasManifest) {
    throw new Error('No manifest.json found — is this a WeWeb export?');
  }

  // Check 3: index.html contains <div id="app">
  const appResult = await shell.exec('bash', [
    '-c',
    `grep -c 'div id="app"' '${extractDir}/index.html' 2>/dev/null || echo 0`,
  ]);
  const appCount = parseInt(appResult.stdout.trim(), 10);
  if (appCount === 0) {
    throw new Error(
      'No <div id="app"> found in index.html — is this a WeWeb export?',
    );
  }

  // Check 4: _wwcv= version parameter exists (WeWeb cache-versioned assets)
  const wwcvResult = await shell.exec('bash', [
    '-c',
    `grep -c '_wwcv=' '${extractDir}/index.html' 2>/dev/null || echo 0`,
  ]);
  const wwcvCount = parseInt(wwcvResult.stdout.trim(), 10);
  if (wwcvCount === 0) {
    throw new Error(
      'No _wwcv= version parameter found — is this a WeWeb export?',
    );
  }
}
```

### Pattern 3: Pre-picker .shipstudio/ Check (D-08)
**What:** Before calling `pickZipFile`, check if `.shipstudio/` already exists in the project path. If it does, show confirmation UI before proceeding. This prevents overwriting an in-progress migration.
**When to use:** In MainView, before the "Select ZIP" button triggers `pickZipFile`.

```typescript
// In MainView — check before opening picker
const ctx = usePluginContext();
const checkExisting = async () => {
  if (!ctx) return;
  const result = await ctx.shell.exec('bash', [
    '-c',
    `test -d '${ctx.project.path}/.shipstudio' && echo exists || echo none`,
  ]);
  if (result.stdout.trim() === 'exists') {
    // Show confirmation: "Existing migration found. Start fresh?"
    setShowConfirm(true);
  } else {
    startPickFlow();
  }
};
```

### Pattern 4: React Externalization via data: URL
**What:** The vite.config.ts rewrites React/ReactDOM import paths to `data:` URLs that re-export from `window.__SHIPSTUDIO_REACT__`. This ensures the plugin shares the host's React instance.
**When to use:** Every Ship Studio plugin — this is mandatory. Copying verbatim is correct.
```typescript
// Source: plugin-webflow-to-code/vite.config.ts — copy verbatim
const reactDataUrl = `data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=...`;
```

### Pattern 5: CSS Injection (rename, don't restructure)
**What:** Modal.tsx injects PLUGIN_CSS into `document.head` on open and removes on close, using a unique STYLE_ID to prevent duplication.
**Rename from webflow-to-code:** `STYLE_ID = 'webflow-to-code-styles'` → `'weweb-to-code-styles'`, class prefix `wf2c-` → `ww2c-`.

### Anti-Patterns to Avoid
- **Bundling React:** Never `npm install react` as a regular dependency. The peer dep + data: URL externalization is mandatory.
- **Direct fs access:** All file I/O must go through `shell.exec`. Never use `fs.readFile` or `fetch`.
- **Checking only one fingerprint:** The Webflow plugin only checks 2 fingerprints. For WeWeb, use all 4 — a generic HTML SPA could pass the div#app check but not the _wwcv param check, which is WeWeb-specific.
- **Grepping subpage HTML shells:** The `index.html` at the ZIP root is the right target. Subpages have their own `{route}/index.html` copies but the root index.html is guaranteed to exist.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP extraction | Custom unzip parser | `shell.exec('unzip', ['-o', zipPath, '-d', dir])` | `unzip` handles all ZIP edge cases (compression levels, unicode filenames, nested dirs) |
| File picker | Custom file path input | `shell.exec('osascript', ['-e', 'POSIX path of (choose file...)'])` | Native OS picker provides proper UX; already proven in webflow-to-code |
| Modal component | Build new modal | Copy `Modal.tsx` from webflow-to-code | Already handles overlay, escape key, click-outside, CSS injection |
| React externalization | Custom bundler config | Copy `vite.config.ts` from webflow-to-code | The data: URL trick is non-obvious; reinventing it risks breaking hooks |
| File count verification | Parse unzip stdout for totals | `find '{dir}' -type f | wc -l` via shell.exec | Unzip output format varies; find is reliable |

---

## WeWeb Export Structure (Verified from Real ZIP)

This section documents exactly what a valid WeWeb export ZIP contains, confirmed by direct inspection of `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip`.

### Directory Layout
```
{export-name}.zip
├── index.html                    # Root SPA shell — all pages share same structure
├── manifest.json                 # PWA manifest: name, short_name, start_url, icons[], background_color
├── robots.txt
├── sitemap.xml
├── serviceworker.js
├── data/
│   ├── {uuid}.json               # One file per page — 17 files in sample
│   └── {uuid}.json
├── assets/
│   ├── main-{hash}.js            # Hashed Vue SPA bundle
│   └── main-{hash}.css           # Hashed CSS bundle
├── images/                       # Project images
├── icons/                        # Project SVG/PNG icons
├── files/                        # Uploaded files (PDFs etc.)
│   └── lucide/                   # Icon library subdirectory
└── {route-slug}/
    └── index.html                # Per-page SPA shells (identical structure to root)
```

### index.html Fingerprints (Verified)
1. **`<div id="app"></div>`** — body content, always empty (SPA mount point)
2. **`_wwcv=216`** — appears on favicon href, manifest href (cache version parameter, WeWeb-specific)
3. Three `<style>` blocks in `<head>`:
   - Block 1: `<style>:root{ --ww-default-font-family: 'Inter', sans-serif }</style>` (single line)
   - Block 2: Large `:root {}` block with UUID-keyed design tokens (typography, colors, spacing)
   - Block 3: `body { background-color }` fallback (minimal)
4. Google Fonts `<link>` preloads in `<head>`
5. `<base href="/" target="_self" />` — standard WeWeb SPA configuration
6. Script module: `<script type="module" crossorigin src="/assets/main-{hash}.js"></script>`

### manifest.json Structure (Verified)
```json
{
  "name": "...",
  "short_name": "...",
  "icons": [],
  "start_url": "/",
  "display": "fullscreen",
  "scope": "/",
  "background_color": "#FFFFFF",
  "theme_color": "#FFFFFF"
}
```
Note: `icons` is empty in the sample. This is valid — it's a minimal PWA manifest.

### data/{uuid}.json Top-Level Keys (Verified)
```json
{
  "cacheVersion": 216,
  "page": { "id": "...", "paths": { "default": "route-slug", "en": "route-slug" }, "workflows": [...] },
  "sections": { "{uid}": { "_state": { "style": {...} }, "content": {...} } },
  "wwObjects": { "{uid}": { "_state": { "style": {...}, "interactions": [...] }, "content": {...} } },
  "workflows": {},
  "formulas": {},
  "libraryComponents": {},
  "variables": {},
  "collections": {}
}
```
Note: `page.workflows` can be non-empty (page-level workflows like "page-unload" handlers); `wwObjects` interactions are at `_state.interactions[]` level.

---

## File-by-File Adaptation Table

This is the primary guide for implementation. Planner should create one task per file group.

| File | Action | Changes Required |
|------|--------|-----------------|
| `package.json` | Copy + edit | `name`: `@shipstudio/plugin-weweb-to-code` |
| `plugin.json` | Copy + edit | `id`: `weweb-to-code`, `name`: `WeWeb to Code`, `description`: `Convert WeWeb exports into structured coding briefs` |
| `vite.config.ts` | Copy verbatim | None — identical for all Ship Studio plugins |
| `tsconfig.json` | Copy verbatim | None |
| `vitest.config.ts` | Copy verbatim | None |
| `src/types.ts` | Copy verbatim | None — Shell, Storage, PluginActions, PluginContextValue interfaces are identical |
| `src/context.ts` | Copy verbatim | None — reads same `window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__` |
| `src/styles.ts` | Copy + edit | `STYLE_ID`: `'weweb-to-code-styles'`; CSS class prefix: `wf2c-` → `ww2c-` |
| `src/components/Modal.tsx` | Copy + edit | Update class names: `wf2c-overlay` → `ww2c-overlay`, etc. Replace webflow icon SVG with WeWeb icon SVG. Update modal title prop usage. |
| `src/zip/types.ts` | Copy verbatim | ZipStep, ZipManifest, ExtractionResult types are format-agnostic |
| `src/zip/extract.ts` | Copy + edit | `pickZipFile`: change prompt to `"Select WeWeb export zip"` |
| `src/zip/discover.ts` | Copy + rewrite | `parseUnzipManifest`: copy verbatim. `validateWebflowExport` → `validateWeWebExport`: complete rewrite with 4-fingerprint check |
| `src/index.tsx` | Rewrite | WeWeb icon SVG, `name = 'WeWeb to Code'`, log prefix `[weweb-to-code]` |
| `src/views/MainView.tsx` | Stub only | Phase 1 stub: renders a "Select ZIP" button that triggers the picker flow (pre-picker .shipstudio/ check per D-08), ZipStep state machine rendering |

---

## Common Pitfalls

### Pitfall 1: CSS Class Name Collision with webflow-to-code
**What goes wrong:** If weweb-to-code uses the same CSS class names as webflow-to-code (`wf2c-overlay`, etc.), the two plugins will visually conflict if both are installed in Ship Studio simultaneously.
**Why it happens:** Both plugins inject their CSS into the same document.head. Same class names = last-writer-wins.
**How to avoid:** Use `ww2c-` prefix throughout. Also change `STYLE_ID` from `'webflow-to-code-styles'` to `'weweb-to-code-styles'` so the style tags don't collide.
**Warning signs:** Modal appears unstyled or with unexpected styles when both plugins are active.

### Pitfall 2: grep Pattern Quoting in shell.exec
**What goes wrong:** Passing `grep -c 'div id="app"'` through `shell.exec('bash', ['-c', ...])` can fail if the quote nesting isn't handled carefully. The double quotes inside the single-quoted grep pattern are fine on macOS, but the outer string must use single quotes for the `-c` argument.
**Why it happens:** Shell escaping layers: the outer bash -c argument is a single-quoted string, inner grep pattern uses double quotes.
**How to avoid:** Use the exact pattern: `grep -c 'div id="app"' '${extractDir}/index.html' 2>/dev/null || echo 0`. The `2>/dev/null || echo 0` guard handles missing files gracefully.
**Warning signs:** `appCount` is NaN or the shell.exec call throws.

### Pitfall 3: _wwcv= Grep on Wrong File
**What goes wrong:** Grepping for `_wwcv=` in a subpage's `index.html` instead of the root `index.html`. Subpages have the same content so this works in practice, but using `${extractDir}/index.html` is the correct and reliable target.
**Why it happens:** Confusion about which HTML file to validate against.
**How to avoid:** Always validate against `${extractDir}/index.html` (root). This file is guaranteed present in every WeWeb export.

### Pitfall 4: React bundled twice
**What goes wrong:** If `react` is accidentally listed as a regular dependency (not peerDependency) or if the vite.config.ts externalization is modified, React hooks will throw "Invalid hook call" because two React instances exist.
**Why it happens:** Easy to accidentally `npm install react` when setting up the project.
**How to avoid:** `react` must appear ONLY in `peerDependencies`. The vite.config.ts data: URL externalization must be copied verbatim. Do not add `react` to `external` in rollupOptions without the corresponding `paths` rewrite.

### Pitfall 5: ZipStep Type Missing Cases for Phase 1
**What goes wrong:** The ZipStep type from webflow-to-code includes states like `analyzing`, `generating`, and `done` with analysis/brief fields — these don't exist in Phase 1. Using the full type causes TypeScript errors in the Phase 1 MainView stub.
**Why it happens:** The sibling plugin's ZipStep is a superset of what Phase 1 needs.
**How to avoid:** Copy ZipStep verbatim — keep all states. The stub MainView only needs to use `idle`, `picking`, `extracting`, `validating`, `done` (with minimal fields), and `error`. The extra states (`copying`, `analyzing`, `generating`) will be wired in Phase 2.

### Pitfall 6: manifest.json icons[] can be empty
**What goes wrong:** Validation code that checks `manifest.icons.length > 0` would incorrectly reject valid WeWeb exports. The real sample has `"icons": []`.
**Why it happens:** Overly strict validation.
**How to avoid:** Only validate that `manifest.json` exists (entries scan). Do NOT parse or validate manifest.json content in Phase 1.

---

## Code Examples

### validateWeWebExport — Complete Implementation
```typescript
// Source: Derived from plugin-webflow-to-code/src/zip/discover.ts + WeWeb ZIP inspection
// Location: src/zip/discover.ts

import type { Shell } from '../types';
import type { ZipManifest } from './types';

export function parseUnzipManifest(stdout: string): ZipManifest {
  // COPY VERBATIM from webflow-to-code — format is identical
  const lines = stdout.split('\n');
  const entries: string[] = [];
  for (const line of lines) {
    if (line.match(/^-{5,}/) || line.match(/Length\s+Date/) || line.trim() === '') continue;
    const match = line.match(/^\s*\d+\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/);
    if (match) entries.push(match[1].trim());
  }
  const fileEntries = entries.filter((e) => !e.endsWith('/'));
  const fileCount = fileEntries.length;
  return { fileCount, entries };
}

export async function validateWeWebExport(
  shell: Shell,
  extractDir: string,
  entries: string[],
): Promise<void> {
  // Check 1: data/*.json files (cheapest — in-memory)
  const hasDataJson = entries.some(
    (e) => e.startsWith('data/') && e.endsWith('.json'),
  );
  if (!hasDataJson) {
    throw new Error('No data/*.json files found — is this a WeWeb export?');
  }

  // Check 2: manifest.json (cheapest — in-memory)
  const hasManifest = entries.some((e) => e === 'manifest.json');
  if (!hasManifest) {
    throw new Error('No manifest.json found — is this a WeWeb export?');
  }

  // Check 3: <div id="app"> in index.html (shell exec)
  const appResult = await shell.exec('bash', [
    '-c',
    `grep -c 'div id="app"' '${extractDir}/index.html' 2>/dev/null || echo 0`,
  ]);
  const appCount = parseInt(appResult.stdout.trim(), 10);
  if (appCount === 0) {
    throw new Error(
      'No <div id="app"> found in index.html — is this a WeWeb export?',
    );
  }

  // Check 4: _wwcv= cache version param (shell exec — WeWeb-specific)
  const wwcvResult = await shell.exec('bash', [
    '-c',
    `grep -c '_wwcv=' '${extractDir}/index.html' 2>/dev/null || echo 0`,
  ]);
  const wwcvCount = parseInt(wwcvResult.stdout.trim(), 10);
  if (wwcvCount === 0) {
    throw new Error(
      'No _wwcv= version parameter found — is this a WeWeb export?',
    );
  }
}
```

### plugin.json
```json
{
  "id": "weweb-to-code",
  "name": "WeWeb to Code",
  "version": "0.1.0",
  "description": "Convert WeWeb exports into structured coding briefs",
  "slots": ["toolbar"],
  "author": "",
  "repository": "",
  "min_app_version": "0.3.53",
  "icon": "",
  "required_commands": [],
  "api_version": 1
}
```

### Vitest test pattern for validateWeWebExport
```typescript
// Source: Adapted from plugin-webflow-to-code/src/zip/discover.test.ts
// Location: src/zip/discover.test.ts

const validWeWebEntries = [
  'data/1dbf82d5-fa49-4d1a-94d9-27fad844ffa9.json',
  'data/2eeedd11-dc0b-4814-bd65-65a6e7fd6e75.json',
  'manifest.json',
  'index.html',
  'assets/main-6NaVb4ET.js',
  'images/logo.png',
];

describe('validateWeWebExport', () => {
  it('passes for entries with data/*.json, manifest.json, div#app, and _wwcv= in index.html', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '1', stderr: '' }, // grep div id="app"
      { exit_code: 0, stdout: '2', stderr: '' }, // grep _wwcv=
    ]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', validWeWebEntries),
    ).resolves.toBeUndefined();
  });

  it('throws "No data/*.json files found" when data/ directory is absent', async () => {
    const entries = ['manifest.json', 'index.html'];
    const shell = createMockShell([]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', entries),
    ).rejects.toThrow('No data/*.json files found — is this a WeWeb export?');
  });

  it('throws "No manifest.json found" when manifest is missing', async () => {
    const entries = ['data/page.json', 'index.html'];
    const shell = createMockShell([]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', entries),
    ).rejects.toThrow('No manifest.json found — is this a WeWeb export?');
  });

  it('throws "No <div id=\\"app\\"> found" when grep returns 0', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '0', stderr: '' },
    ]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', validWeWebEntries),
    ).rejects.toThrow('No <div id="app">');
  });

  it('throws "No _wwcv= version parameter found" when _wwcv is absent', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '1', stderr: '' }, // div#app found
      { exit_code: 0, stdout: '0', stderr: '' }, // _wwcv not found
    ]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', validWeWebEntries),
    ).rejects.toThrow('No _wwcv= version parameter found');
  });
});
```

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies To |
|-----------|-----------|
| TypeScript + React, Vite build, vitest for tests | All phases |
| No runtime dependencies — only peer React 19 | All phases |
| All file system operations go through Shell abstraction (exec commands) | All phases |
| Must conform to Ship Studio plugin.json spec (slot: toolbar, API version 1) | Phase 1 (plugin shell) |
| Must handle WeWeb export format: ZIP with HTML shells, /data/ JSON, /assets/, /images/, /icons/ | Phase 1+ |
| Use GSD workflow entry points before making file changes | Development process |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + test | Confirmed (project exists and git initialized) | Assumed 18+ | — |
| unzip | ZIP extraction | macOS built-in | macOS built-in | — (guaranteed on macOS) |
| osascript | File picker | macOS built-in | macOS built-in | — (guaranteed on macOS) |
| grep | HTML validation | macOS built-in | POSIX | — |
| bash | Shell commands | macOS built-in | macOS built-in | — |
| npm | Package install | Assumed available | — | — |

**Missing dependencies with no fallback:** None identified.

**Note:** This plugin targets macOS only (osascript is macOS-specific). This matches the webflow-to-code design and is confirmed in scope.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTML-based validation (like webflow-to-code's `data-wf-site` grep) | 4-fingerprint JSON+HTML validation | Phase 1 design | More reliable WeWeb identification; catches edge cases like generic Vue SPAs that have div#app but no _wwcv |
| Webflow icon SVG | WeWeb-appropriate icon | Phase 1 | Visual identity in toolbar |

---

## Open Questions

1. **WeWeb SVG icon source**
   - What we know: CONTEXT.md leaves this to Claude's discretion
   - What's unclear: Whether there is an official WeWeb logo SVG in the public domain or CDN that can be used directly; the WeWeb icon CDN is at `cdn.weweb.app/weweb-icons` (observed in HTML shells) but it serves component icons not the WeWeb brand logo
   - Recommendation: Use a simple "W" lettermark SVG or a globe/arrow icon at 14x14px — matching the webflow-to-code icon's scale. Avoid fetching from external CDN at runtime.

2. **MainView stub scope in Phase 1**
   - What we know: CONTEXT.md leaves this to Claude's discretion; the webflow-to-code MainView is 300+ lines including analysis, brief generation, and mode selection
   - What's unclear: Whether the Phase 1 stub should include the full ZipStep state machine rendering or just a static "Select ZIP" button
   - Recommendation: Include the full ZipStep state machine in the Phase 1 stub (idle → picking → extracting → validating → done/error), but render only a generic "ZIP imported successfully" on done. This keeps the plugin usable end-to-end in Phase 1 and prevents Phase 2 from needing to restructure the state machine.

---

## Sources

### Primary (HIGH confidence)
- Direct ZIP inspection of `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` — WeWeb export structure, all fingerprints, manifest.json format, HTML shell content
- `plugin-webflow-to-code/src/index.tsx` — Plugin entry point pattern
- `plugin-webflow-to-code/src/zip/extract.ts` — pickZipFile, buildExtractDir, extractAndVerify
- `plugin-webflow-to-code/src/zip/discover.ts` — parseUnzipManifest, validateWebflowExport
- `plugin-webflow-to-code/src/zip/types.ts` — ZipStep, ZipManifest types
- `plugin-webflow-to-code/src/components/Modal.tsx` — Modal component implementation
- `plugin-webflow-to-code/src/types.ts` — Shell, Storage, PluginActions interfaces
- `plugin-webflow-to-code/src/context.ts` — usePluginContext hook
- `plugin-webflow-to-code/src/styles.ts` — PLUGIN_CSS, STYLE_ID pattern
- `plugin-webflow-to-code/vite.config.ts` — React externalization via data: URL
- `plugin-webflow-to-code/package.json` — Exact dependency versions
- `plugin-webflow-to-code/plugin.json` — plugin.json format
- `plugin-webflow-to-code/src/zip/discover.test.ts` — Test pattern for discover module
- `plugin-webflow-to-code/src/zip/extract.test.ts` — Test pattern for extract module
- `.planning/phases/01-plugin-shell-zip-ingestion/01-CONTEXT.md` — Locked decisions
- `CLAUDE.md` (project root) — Project constraints, stack, conventions

### Secondary (MEDIUM confidence)
- PROJECT.md stack research section — version numbers for TypeScript, Vite, Vitest, React (cross-verified with sibling package.json)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — exact versions read from sibling package.json, not training data
- Architecture: HIGH — patterns read directly from sibling source files
- WeWeb fingerprints: HIGH — all 4 fingerprints verified by direct ZIP inspection
- Pitfalls: HIGH — derived from concrete code analysis (class names, escaping, type system)

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable domain — WeWeb export format and Ship Studio plugin API are both stable; fingerprint validity tied to WeWeb's export format which changes rarely)
