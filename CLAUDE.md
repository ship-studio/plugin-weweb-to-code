<!-- GSD:project-start source:PROJECT.md -->
## Project

**WeWeb to Code**

A Ship Studio plugin that converts WeWeb export ZIP files into structured coding briefs and migration plans for AI-assisted development. It parses WeWeb's JSON page definitions, CSS design tokens, and workflow definitions to produce a comprehensive markdown brief that guides developers (or AI agents) through pixel-perfect recreation of WeWeb sites in code.

**Core Value:** The brief must extract enough structural and visual detail from WeWeb's JSON/CSS data model that an AI agent can recreate the site with near pixel-perfect fidelity — without needing access to the original WeWeb project.

### Constraints

- **Tech stack**: TypeScript + React (matching webflow-to-code), Vite build, vitest for tests
- **Runtime**: No runtime dependencies — only peer React 19 from Ship Studio host
- **Shell interface**: All file system operations go through Ship Studio's Shell abstraction (exec commands)
- **Plugin API**: Must conform to Ship Studio plugin.json spec (slot: toolbar, API version 1)
- **Export format**: Must handle WeWeb export format as observed (ZIP with HTML shells, /data/ JSON, /assets/, /images/, /icons/)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 6.0.2 | Primary language | Matches webflow-to-code plugin; strict typing enforces correctness on deeply-nested WeWeb JSON structures; no separate runtime needed |
| React | 19.2.4 (peer dep) | Plugin UI | Ship Studio host exposes `window.__SHIPSTUDIO_REACT__`; importing it as a peer dep avoids bundling a second React instance which breaks hooks |
| Vite | 8.0.2 | Build tool | Used by webflow-to-code; produces a single ES module via `lib` mode; React is externalized via `data:` URL trick so the built `dist/index.js` has no runtime deps |
| Vitest | 4.1.1 | Unit testing | Co-installed with Vite, shares the same config; test files live alongside source, matching webflow-to-code convention |
| Node.js | 24.x (runtime env) | Build/test host | Ship Studio plugins build and test in Node; v24 ships with native `structuredClone`, `atob/btoa`, and the `URL` API—all used in parsing |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsdom | ^29.0.0 | DOMParser shim in Vitest (Node) | Vitest runs in Node where `DOMParser` is absent; jsdom provides it for HTML-parsing tests; the production build uses the browser-native `DOMParser` exposed by Ship Studio's webview. NOT needed for WeWeb JSON parsing (no DOM involvement). |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| `unzip` (system) | ZIP extraction and manifest listing | Invoked via `shell.exec('unzip', [...])`. Already present on macOS. No npm alternative needed — keeps zero runtime deps. |
| `osascript` (macOS) | Native file picker | `shell.exec('osascript', ['-e', 'POSIX path of (choose file...)'])` — exact pattern from webflow-to-code. |
| `bash -c` + `base64` | Safe binary-safe file reads | HTML shell files are read via `base64 < 'path'` then `atob()` — avoids shell escaping issues. JSON data files are also read this way. |
| `find` + `wc -l` | Post-extraction file count verification | Used to validate ZIP extraction completeness. |
## Installation
# Dev dependencies (exact match to webflow-to-code)
# Peer dependency (provided by Ship Studio host at runtime)
# react@^19.0.0 — do NOT bundle
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native `JSON.parse` | `zod` or `io-ts` for schema validation | Use Zod if WeWeb's JSON schema needs runtime validation with detailed error messages. For now, TypeScript interfaces + optional chaining provide sufficient safety with zero bundle cost. |
| Native regex for CSS var parsing | `css-tree` or `postcss` | Use a CSS parser if you need to parse arbitrary CSS rules. WeWeb's CSS vars are in a single `:root {}` block with one declaration per line — regex is sufficient and adds no dependencies. |
| `DOMParser` (browser-native) | `node-html-parser` or `cheerio` | Use these if you need Node-side HTML parsing in production (not just tests). WeWeb's HTML shells are only needed for CSS var extraction; the real data is in JSON, so DOMParser for the HTML head is called from the Ship Studio webview (browser context) where it's native. |
| `shell.exec('unzip', ...)` | `adm-zip` or `jszip` npm packages | Use a JS unzip library if the plugin ever needs to run in an environment without system `unzip`. Ship Studio runs on macOS where `unzip` is guaranteed. |
| Markdown string templates | `marked` or a templating engine | Only needed if generating HTML output. WeWeb briefs are Markdown strings — string template literals with helper functions are sufficient and add no deps. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `adm-zip` / `jszip` | Adds a runtime bundle dependency just for extraction; `unzip` is already present on macOS and works via shell.exec | `shell.exec('unzip', ['-o', zipPath, '-d', extractDir])` |
| `postcss` / `css-tree` | ~200KB bundle overhead for a task (UUID-keyed `:root` var parsing) that a 15-line regex handles | Native `String.match(/--[0-9a-f-]{36}:\s*([^;]+)/g)` |
| `react-dom` (bundled) | Breaks hooks — Ship Studio host already owns the ReactDOM instance; importing your own causes the "two ReactDOM" invariant error | Re-export from `window.__SHIPSTUDIO_REACT_DOM__` via the `data:` URL pattern in vite.config |
| `axios` / `node-fetch` | No HTTP requests needed; all I/O is file system via shell commands | `shell.exec` for all external operations |
| `cheerio` | Heavyweight HTML parser; WeWeb HTML shells are SPA stubs with a single meaningful `<head>` block | `DOMParser` (browser-native in Ship Studio's webview) |
| `uuid` library | No UUID generation needed; WeWeb's UUIDs are parsed, not created | Native string matching on UUID patterns |
| `lodash` | No collection utilities needed that TypeScript's built-ins don't cover | Native `Object.entries`, `Array.reduce`, `Map` |
## Stack Patterns by Variant
- Use native `JSON.parse` + TypeScript interfaces for all `/data/*.json` files
- Model the structure as: `WeWebPageData { cacheVersion, page, sections, wwObjects, workflows, formulas, libraryComponents }`
- Each `wwObject._state.style` has `default`, `mobile`, `tablet` breakpoint keys — model these as `Partial<Record<'default'|'mobile'|'tablet', StyleBlock>>`
- Interactions live at `wwObject._state.interactions[]` not at page-level `workflows[]` (confirmed in sample data)
- Parse the second `<style>` block in each HTML shell's `<head>` (the large `:root {}` block)
- Use regex to extract all `--{uuid}: {value};` declarations
- Classify by value pattern:
- All HTML shells in a WeWeb export share identical CSS var blocks — parse only one (e.g. the first discovered HTML file)
- Use tagged template literals + helper functions — no templating library
- Match the webflow-to-code `generate.ts` pattern: pure function `generateBrief(analysis) → string`
- Tests use vitest + real fixture files from the WeWeb ZIP (committed as test fixtures)
- jsdom is only needed in vitest config for the DOM-using tests
- JSON-parsing tests need no DOM shim
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite@^8.0.0 | vitest@^4.1.0 | Vitest 4.x requires Vite 5+; confirmed compatible with Vite 8 |
| typescript@^6.0.0 | vite@^8.0.0 | Vite 8 bundles its own TS transpiler (esbuild); tsc is used only for type-checking, not compilation |
| react@19.2.4 (peer) | @types/react@^19.0.0 | Must match major version; @types/react@19.x covers all React 19 APIs |
| jsdom@^29.0.0 | vitest@^4.1.0 | Vitest supports jsdom as test environment via `{ environment: 'jsdom' }` in vitest.config |
## WeWeb-Specific Parsing Notes
- `{route}/index.html` — SPA shells (one per page, all identical except `<head>` CSS vars are the same)
- `data/{uuid}.json` — page definitions; filename UUID matches the JS bundle UUID in `/assets/`
- `assets/` — hashed JS/CSS bundles (not parsed)
- `manifest.json` — PWA manifest (name, short_name, icons, start_url)
- `robots.txt`, `serviceworker.js` — ignored
- 3 `<style>` blocks: (1) `--ww-default-font-family` default font, (2) large `:root {}` with UUID-keyed design tokens, (3) `body { background-color }` fallback
- Block 2 contains: 64 typography vars (font shorthand), 138+ color vars (hex), 25 spacing/size vars (px values)
- External CDN links: Google Fonts, `cdn.weweb.app/weweb-icons`, `cdn.weweb.app/font-awesome`, `cdn.weweb.io/heroicons`
- No `<div id="app">` content — all structure is in `/data/*.json`
- `page.workflows` is empty in all observed pages (workflows are at `wwObject._state.interactions[]`)
- `sections[uid]._state.style.{default,mobile,tablet}` — breakpoint-specific layout styles
- `sections[uid].content.default.wwObjects[]` — array of `{ uid, isWwObject: true }` references
- `wwObjects[uid]._state.interactions[]` — action chains with `{ id, name, actions, trigger, firstAction }`
- `wwObjects[uid].content.{default,mobile,tablet}` — breakpoint-specific content including nested `wwObjects[]`
## Sources
- Direct inspection of `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` in working directory — HIGH confidence (source of truth for format claims)
- `/plugin-webflow-to-code/package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json` — HIGH confidence (proven Ship Studio plugin patterns)
- `npm view typescript version`, `npm view vite version`, `npm view vitest version` — HIGH confidence (live registry query, 2026-03-24)
- `npm view react version`, `npm view @types/react version` — HIGH confidence (live registry query, 2026-03-24)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
