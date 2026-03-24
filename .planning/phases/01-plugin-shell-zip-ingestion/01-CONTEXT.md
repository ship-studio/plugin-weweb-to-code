# Phase 1: Plugin Shell & ZIP Ingestion - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship Studio toolbar integration with WeWeb icon, native file picker for ZIP selection, ZIP extraction with manifest verification, and WeWeb export validation. Delivers the plugin shell that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Validation Logic
- **D-01:** Validate WeWeb exports using ALL available fingerprints for maximum confidence: data/*.json files exist, HTML shell contains `<div id="app"></div>`, manifest.json exists, and `_wwcv=` version parameter found on asset URLs in HTML
- **D-02:** Validation checks run in order of cheapness — file existence checks first (entries scan), then HTML content grep for div#app and _wwcv param
- **D-03:** Error messages should be clear and actionable, telling the user specifically which marker failed (e.g., "No data/*.json files found — is this a WeWeb export?")

### Porting Strategy
- **D-04:** Copy files directly from webflow-to-code and adapt — rename webflow→weweb, swap validation logic, swap icon. This is the fastest approach with minimal risk since the plugin shell architecture is identical.
- **D-05:** Files to copy near-verbatim: zip/extract.ts (change picker prompt), zip/types.ts, zip/discover.ts (rewrite validateWeWebExport), components/Modal.tsx, src/types.ts, src/context.ts, src/styles.ts (change style ID), vite.config.ts, tsconfig.json, vitest.config.ts, package.json (change name)
- **D-06:** Files to rewrite: src/index.tsx (WeWeb icon SVG, plugin name), zip/discover.ts validateWeWebExport function

### File Picker
- **D-07:** File picker prompt reads "Select WeWeb export zip"
- **D-08:** Before opening the file picker, check if .shipstudio/ directory exists. If it does, warn the user with "Existing migration found. Start fresh?" confirmation before proceeding. This prevents accidental overwrites of in-progress migrations.

### Claude's Discretion
- WeWeb SVG icon design (find or create appropriate icon)
- Exact CSS style ID naming convention
- Test structure and coverage targets
- Whether to include the MainView stub in Phase 1 or defer to Phase 2

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sibling plugin (primary reference)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/index.tsx` — Plugin entry point pattern, toolbar button, modal integration
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/zip/extract.ts` — File picker, buildExtractDir, extractAndVerify patterns
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/zip/discover.ts` — parseUnzipManifest (reuse), validateWebflowExport (rewrite for WeWeb)
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/zip/types.ts` — ZipStep state machine, ZipManifest type
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/components/Modal.tsx` — Reusable modal component
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/types.ts` — Shell, Storage, PluginActions interfaces
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/context.ts` — usePluginContext hook
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/styles.ts` — Plugin CSS injection pattern
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/vite.config.ts` — Build config with React externalization
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/package.json` — Dependencies and scripts
- `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/plugin.json` — Plugin manifest format

### WeWeb export sample
- `/tmp/weweb-export/index.html` — HTML shell with CSS variables, div#app, _wwcv param
- `/tmp/weweb-export/data/` — JSON page definition files
- `/tmp/weweb-export/manifest.json` — PWA manifest

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **webflow-to-code zip/extract.ts**: pickZipFile, buildExtractDir, extractAndVerify — copy directly, change prompt text
- **webflow-to-code zip/discover.ts**: parseUnzipManifest — copy verbatim (ZIP format is identical)
- **webflow-to-code Modal.tsx**: Full modal with overlay, close on Escape, CSS injection — copy verbatim
- **webflow-to-code styles.ts**: PLUGIN_CSS with modal, button, progress styles — copy, change STYLE_ID
- **webflow-to-code types.ts**: Shell, Storage, PluginActions, PluginContextValue — copy verbatim
- **webflow-to-code context.ts**: usePluginContext hook — copy verbatim

### Established Patterns
- **Shell abstraction**: All file I/O goes through shell.exec() — no direct fs access
- **Base64 encoding**: Content passed through shell uses base64 for safety
- **ZipStep state machine**: Union type tracks extraction progress (idle → picking → extracting → validating → done/error)
- **Progress callbacks**: Async operations accept onProgress for UI updates

### Integration Points
- Plugin registers via plugin.json with slot: "toolbar"
- ToolbarButton renders in Ship Studio toolbar via slots export
- Modal overlays on top of Ship Studio UI
- Shell interface provided by Ship Studio host via window.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__

</code_context>

<specifics>
## Specific Ideas

- Copy-and-adapt from webflow-to-code is the explicit strategy — minimize divergence from the proven pattern
- WeWeb validation uses 4 fingerprints (data/*.json, div#app, manifest.json, _wwcv param) for maximum confidence
- Pre-picker check for .shipstudio/ to prevent accidental overwrites

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-plugin-shell-zip-ingestion*
*Context gathered: 2026-03-24*
