# Project Research Summary

**Project:** plugin-weweb-to-code (Ship Studio plugin)
**Domain:** No-code export parser and AI coding brief generator
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

This project is a Ship Studio plugin that parses a WeWeb "built export" ZIP and produces a Markdown coding brief and JSON migration plan for AI-assisted frontend reconstruction. The domain is well-understood: a proven sibling plugin (webflow-to-code) already exists in the same host environment, establishing all integration patterns, output contracts, and tooling. The recommended approach is to mirror the webflow-to-code architecture exactly — same Stack (TypeScript + Vite + Vitest + React-as-peer-dep), same output format (Markdown brief + JSON migration plan + clipboard copy + resume UI) — while replacing the entire parsing core. Webflow parses HTML and CSS; WeWeb requires parsing JSON data files for structure and a single HTML shell for design tokens. This distinction is the critical architectural insight: do not treat WeWeb's HTML files as content sources.

The primary risks are all in the parsing layer. WeWeb exports have several non-obvious structural properties: components live in a flat UUID-keyed dictionary that must be tree-walked (not iterated), shared layout sections are identified by `sectionBaseId` frequency (not by `linkId` or `uid`), design tokens are UUID-named CSS custom properties requiring heuristic classification, and dynamic bindings (`__wwtype: "f"/"js"`) must be flagged rather than silently dropped. Every one of these pitfalls has been empirically verified against a real 17-page WeWeb export ZIP in the working directory, giving the research unusually high confidence. The mitigation strategy is straightforward: build the parsing pipeline in strict data-flow order (design tokens first, then JSON parsing, then cross-page analysis, then brief generation), with correctness tests against the known sample export at each step.

The scope for v1 is clear and bounded. Twelve features constitute the MVP — ZIP picker through resume UI — all with established patterns from the sibling plugin. Four v1.x features (responsive breakpoints, workflow capture, component type mapping, pixel-perfect mode) should follow once the core brief quality is validated. The implementation is local-only, has zero runtime dependencies beyond the Ship Studio host, and targets macOS exclusively.

---

## Key Findings

### Recommended Stack

The stack is a direct match to the webflow-to-code sibling plugin, which is the right call: it eliminates tooling research and keeps the Ship Studio host integration patterns identical. TypeScript 6 provides strict typing over deeply-nested WeWeb JSON structures. Vite 8 in library mode with the `data:` URL React externalization trick is mandatory to avoid bundling a second React instance (which breaks hooks in the Ship Studio host). Vitest 4 shares the Vite config.

**Core technologies:**
- TypeScript 6.0.2 — primary language — strict typing enforces correctness on nested WeWeb JSON; no runtime overhead
- React 19.2.4 (peer dep only) — plugin UI — must NOT be bundled; re-exported from `window.__SHIPSTUDIO_REACT__` via `data:` URL pattern
- Vite 8.0.2 — build tool — lib mode produces single `dist/index.js` with no runtime deps
- Vitest 4.1.1 — unit testing — co-installed with Vite, tests live alongside source
- jsdom 29.x — DOMParser shim for Vitest (Node) only — not needed in production (Ship Studio exposes browser DOMParser)

**Key constraint:** `adm-zip`, `postcss`, `axios`, `lodash`, and all other npm libraries are explicitly excluded. System `unzip` via `shell.exec` handles extraction. Regex handles CSS var parsing. Zero runtime bundle dependencies.

**WeWeb-specific parsing notes (verified against sample ZIP):**
- All structural data is in `data/{uuid}.json` — HTML shells contain only CSS tokens and font links
- Design tokens: 64 font composite vars + 138+ color hex vars + 25 spacing/size vars in a single `:root {}` block
- JSON top-level keys: `cacheVersion, page, sections, wwObjects, collections, variables, workflows, formulas, libraryComponents`
- Interactions live at `wwObject._state.interactions[]`, not `page.workflows[]` (which is empty)

### Expected Features

The feature set mirrors webflow-to-code's output contracts with a fully different parsing core.

**Must have (v1 table stakes):**
- ZIP file picker — native OS dialog via `osascript`; entry point for everything
- WeWeb export validation — check for `data/*.json` presence; prevents silent failure on wrong ZIPs
- Asset copying to `.shipstudio/assets/` — images, icons, fonts; brief references these paths
- Design system extraction — parse UUID CSS tokens from HTML head; classify into colors/typography/spacing
- Page discovery and routing — read `page.paths.default` from each JSON; build UUID-to-route map
- Component tree parsing (wwObjects) — recursive tree walker from section roots through all 13 slot types
- Shared layout detection — `sectionBaseId` frequency analysis across all pages (>50% threshold = shared)
- Markdown brief generation — synthesizes all parsed data into the deliverable
- Migration plan (JSON) generation — hierarchical plan for multi-session builds
- Copy to clipboard — primary consumption path for AI chat
- Resume prompt / progress UI — detect existing `migration-plan.json` on mount and show progress view
- Token count estimate — warn when brief exceeds ~12,000 token threshold

**Should have (v1.x, add after validation):**
- Responsive breakpoint extraction — diff `mobile`/`tablet` style overrides against `default` per component
- Workflow capture as interaction specs — linearize `firstAction → next` chains with variable name resolution
- WeWeb component type mapping — `wwObjectBaseId` lookup table → human-readable component labels
- Pixel-perfect vs. best-site mode — expose preserve checkboxes for mode selection

**Defer (v2+):**
- Variables inventory — valuable for complex apps; defer until core brief quality is validated
- Design token semantic labeling — heuristic size-rank → H1-H6 mapping; nice-to-have polish
- Library component identification — tag reusable project components; defer until seen in real user projects
- Collections inventory stubs — data source listing; informational only

**Anti-features to avoid:**
- WeWeb API/editor integration — ZIP-only is stable, offline, and sufficient
- Automatic code generation — belongs in the AI agent layer, not the plugin
- Rendering/executing the WeWeb SPA — SPAs require live backend; data files are the source of truth
- Real-time progress streaming — parsing takes < 2 seconds; step labels are sufficient

### Architecture Approach

The architecture is a sequential processing pipeline with clean module boundaries: `zip/` handles all file system access and returns plain data structures; `design/` reads one HTML shell and returns a `DesignSystem`; `analysis/` performs pure JSON transformation into `SiteAnalysis`; `assets/` handles side-effectful copy operations; `brief/` and `plan/` are pure functions from analysis data to output strings/JSON. `MainView.tsx` orchestrates the pipeline with a `ZipStep` union type driving UI state. No global state store; no event bus.

**Major components:**
1. `zip/` — file picker, extraction, validation, page discovery; only module that calls `shell.exec`
2. `design/` — CSS token parsing + font extraction from HTML head; must run before `analysis/`
3. `analysis/` — recursive wwObject tree walker, shared layout detector, workflow parser; pure transformation
4. `assets/` — enumerate and copy images/icons to `.shipstudio/assets/`; side-effectful, independent of analysis
5. `brief/` — assembles Markdown from `SiteAnalysis` + `DesignSystem` + `AssetManifest`; pure function
6. `plan/` — creates and reads `migration-plan.json`; independent lifecycle from brief
7. `views/MainView` — React orchestrator; manages step state, calls pipeline modules in sequence
8. `components/Modal` + `MigrationProgress` — ported directly from webflow-to-code; no changes needed

**Critical ordering constraint:** `design/parseTokens.ts` must run before `analysis/parsePages.ts` so that CSS variable UUID references in section `_state.style` values can be resolved to semantic labels inline during page analysis.

### Critical Pitfalls

1. **Treating HTML files as content sources** — WeWeb HTML shells are empty SPAs; all structure is in `data/*.json`. Validate by checking for `data/*.json` presence in the ZIP validator; brief with 0 wwObjects is the warning sign. Recovery cost: HIGH (full pipeline rewrite).

2. **Iterating wwObjects dict as a flat list** — wwObjects is a reference pool; structure is only recovered by recursive tree walk from section roots through all 13 slot types (`children`, `formContent`, `button`, `checkbox`, `contentElement`, `el`, `embeddedContainer`, `layout`, `leftIcon`, `overlayElement`, `rightIcon`, `text`, `triggerElement`). The animal-detail page has 1,273 objects; a flat iteration produces a scrambled, out-of-order component list. Write the tree walker first; test it before any brief generation.

3. **Using `linkId` or `uid` for shared layout detection instead of `sectionBaseId`** — `linkId` had zero cross-page matches in the sample export. Only `sectionBaseId` is stable across page instances. Header and Sidemenu appear on 12/17 pages by `sectionBaseId`; the shared layout detector must use this field exclusively.

4. **Dumping 226+ UUID CSS vars unsorted into the brief** — UUID-named tokens are meaningless to developers. Classify by value pattern before writing: font composites (weight/size/line-height/family), hex colors, px dimensions. Deduplicate by value. Sort font tokens by size descending to infer H1-H6 hierarchy. Unsorted token dumps make the brief unusable.

5. **Skipping `__wwtype` detection** — Dashboard page alone has 86 formula bindings and 24 JS expression bindings plus 13 conditional rendering instances. Silently dropping these means the AI agent builds static UI where dynamic content is required. Detect `__wwtype: "f"/"js"` and emit `[DYNAMIC]` annotations; use `defaultValue` for visual approximation.

6. **Shell safety with JS code strings in JSON** — Workflow action `code` fields contain backticks and special characters. All JSON reads must go through `base64 < '{path}'` → `atob()` → `JSON.parse()` — the same pattern used by webflow-to-code for HTML reads. Apply this from the first implementation.

7. **Using `parentSectionId` as tree navigation** — 221 objects on the animal-detail page have no `parentSectionId`; using it as a grouping key silently loses 15-20% of components. Use `parentSectionId` only as a secondary index; build the tree exclusively by following UID references from section roots.

---

## Implications for Roadmap

### Phase 1: Foundation and File I/O

**Rationale:** Everything depends on correct file system access and WeWeb ZIP structure validation. The most dangerous wrong assumption (HTML as content source) must be caught here. Base64 file reading must be established from the start to prevent shell safety issues downstream.

**Delivers:** Working ZIP picker, extraction, WeWeb-specific validation, page discovery with correct route mapping, and the base64 I/O foundation used by all subsequent file reads.

**Addresses:** ZIP file picker, WeWeb export validation, page discovery and routing (P1 features)

**Avoids:**
- HTML-as-content-source pitfall (Pitfall 1) — validator checks for `data/*.json` not HTML content
- Shell safety pitfall (Pitfall 9) — base64 read pattern established here for all JSON reads
- Route-from-HTML-directory pitfall (Pitfall 8) — use `page.paths.default` from JSON, normalize `{{param|}}` to `[param]`

**Research flag:** None — established patterns from webflow-to-code plugin; standard Ship Studio integration.

---

### Phase 2: Design Token Extraction

**Rationale:** Design tokens must be available before JSON analysis begins, because CSS variable UUID references in section `_state.style` values are only meaningful once the token map is built. This phase is small (one HTML file read) but architecturally load-bearing.

**Delivers:** Classified and deduplicated `DesignSystem` object: font tokens (sorted by size → H1-H6), color tokens (deduplicated by hex value), dimension tokens, Google Font URLs.

**Addresses:** Design system extraction (P1 feature), semantic token labeling groundwork

**Avoids:**
- CSS vars unsorted pitfall (Pitfall 3) — classification and deduplication happen here, not in brief generation
- Parsing tokens after analysis (Anti-Pattern 4) — explicit phase ordering enforces correct sequence

**Research flag:** None — regex-based classification is sufficient; sample ZIP provides ground truth (226 tokens, known format).

---

### Phase 3: Component Tree Parsing

**Rationale:** This is the highest-complexity phase and the most likely source of correctness bugs. The recursive tree walker and all 13 slot types must be proven correct before brief generation begins. Breakpoint extraction belongs here because `mobile`/`tablet` are properties of the same objects being traversed.

**Delivers:** Resolved per-page component trees from all `data/*.json` files with correct parent-child structure, component type labels (via `wwObjectBaseId` lookup), and `[DYNAMIC]` annotations for `__wwtype` bindings.

**Addresses:** Component tree parsing, shared layout detection groundwork (requires all pages parsed first), responsive breakpoint extraction (v1.x but data collected here)

**Avoids:**
- wwObjects flat-list pitfall (Pitfall 2) — recursive tree walker traverses all 13 slot types
- `parentSectionId` pitfall (Pitfall 7) — tree built exclusively by UID reference from section roots
- Missing breakpoints pitfall (Pitfall 4) — all three breakpoints extracted simultaneously per component
- Dynamic binding drop pitfall (Pitfall 6) — `__wwtype` pre-pass before component description generation

**Research flag:** None — sample ZIP provides exhaustive test cases (animal-detail: 1,273 objects, max depth 7; forgot-password: known dynamic bindings and breakpoint overrides).

---

### Phase 4: Cross-Page Analysis and Shared Layout Detection

**Rationale:** Shared layout detection requires all pages parsed first (Phase 3 output). This phase runs a single pass over all parsed pages to compute `sectionBaseId` frequency and produce the `SharedSectionMap`. Without it, Header and Sidemenu appear in every page's brief section — inflating the brief by 12x for those components.

**Delivers:** `SharedSectionMap` identifying sections that appear on >50% of pages by `sectionBaseId`; these are excluded from per-page specs and written once in a "Shared Layout" section.

**Addresses:** Shared layout detection (P1 feature), brief de-duplication

**Avoids:**
- Shared sections duplicated per page (Pitfall 5) — `sectionBaseId` frequency analysis; not `linkId` or `wwObjectBaseId`
- `wwObjectBaseId` vs `sectionBaseId` confusion (Pitfall 10) — explicit use of section-level field

**Research flag:** None — pattern is direct equivalent of webflow-to-code's shared nav/footer detection.

---

### Phase 5: Brief Generation and Output

**Rationale:** Pure synthesis phase — all inputs are ready. `brief/generate.ts` is a pure function from `{ SiteAnalysis, DesignSystem, AssetManifest }` to Markdown string. This is where the quality of all upstream phases becomes visible.

**Delivers:** Complete Markdown brief (site overview, shared layout spec, per-page section/component specs, design system tables, asset inventory), token count estimate, clipboard copy, brief file written to `.shipstudio/weweb-brief.md`.

**Addresses:** Markdown brief generation, copy to clipboard, token count estimate, asset copying (P1 features)

**Avoids:**
- UUID labels in brief (Anti-Pattern 2) — `wwObjectBaseId` lookup table produces human labels
- Workflow chains as unordered dicts (UX pitfall) — linearize `firstAction → next` chains into ordered lists
- Brief > 50,000 words from duplicated shared sections — shared layout already isolated in Phase 4

**Research flag:** None — output format mirrors webflow-to-code; brief structure is well-defined.

---

### Phase 6: Migration Plan and Resume UI

**Rationale:** The migration plan is generated from the same `SiteAnalysis` as the brief. The resume UI detects an existing plan on mount and switches to progress view. Both depend on the full analysis pipeline (Phases 1-4) being stable, making this the correct final phase.

**Delivers:** `migration-plan.json` with shared-layout → pages → sections hierarchy, resume prompt generation, `MigrationProgress` component with polling, mutual exclusion between fresh-generation and resume flows.

**Addresses:** Migration plan generation, resume prompt/progress UI (P1 features)

**Avoids:**
- Resume prompt conflicting with fresh generation (dependency note) — mutual exclusion enforced in `MainView.tsx` step state

**Research flag:** None — ported directly from webflow-to-code; pattern is proven.

---

### Phase Ordering Rationale

- **Phases 1 → 2 → 3** must be strictly sequential due to data flow dependencies: no JSON parsing without valid ZIP; no CSS variable resolution without design token map; no cross-page analysis without individual page parse trees.
- **Phase 4** must follow Phase 3 (all pages parsed); can be implemented as the final step of `analysis/analyze.ts` rather than a separate pipeline stage if preferred.
- **Phases 5 and 6** are independent of each other and can be developed in parallel, but both require Phases 1-4 outputs to be stable.
- **Assets copying** (from Phase 5 scope) can be developed in parallel with Phases 3-4 since it only requires the file discovery output from Phase 1.

### Research Flags

Phases with standard patterns (no deeper research needed):
- **Phase 1:** ZIP extraction, file picker, Shell integration — direct copy from webflow-to-code; patterns proven.
- **Phase 2:** CSS regex classification — sample ZIP provides exact format; no ambiguity.
- **Phase 5:** Brief markdown assembly + clipboard I/O — mirrors webflow-to-code output contracts exactly.
- **Phase 6:** Migration plan structure + resume UI — direct port from webflow-to-code.

Phases that may benefit from targeted research during implementation:
- **Phase 3 (component tree):** The 13-slot-type inventory was inferred from one page (dashboard). A broader slot-type audit across all 17 pages before implementation would reduce the risk of missing a slot type. Run `grep -r "isWwObject" data/*.json | grep -v '"children"' | grep -v '"formContent"'` on the sample ZIP to confirm the full slot inventory.
- **Phase 3 (wwObjectBaseId lookup table):** The lookup table covers types observed in the sample ZIP. New WeWeb exports may introduce unknown base IDs. The lookup table should be designed for graceful unknown-ID fallback from day one.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct inspection of sample ZIP + live npm registry queries + proven sibling plugin patterns; all version compatibilities verified |
| Features | HIGH | Based on real export ZIP structure + proven webflow-to-code output contracts; MVP scope is clear and well-bounded |
| Architecture | HIGH | Component boundaries derived from data-flow dependencies in real ZIP; build order verified against actual file structure |
| Pitfalls | HIGH | Every critical pitfall verified empirically against sample ZIP with exact object counts, field names, and page distributions |

**Overall confidence:** HIGH

### Gaps to Address

- **Exhaustive slot type inventory:** 13 slot types identified from the dashboard page. The full inventory across all 17 pages should be audited before implementing the tree walker. Risk: LOW — missing a slot type means some components are absent from the brief, not a crash.

- **`wwObjectBaseId` lookup table completeness:** Component type lookup table covers observed base IDs from the sample ZIP. Unknown base IDs from other WeWeb projects will appear as "custom component (UUID)" unless the table is extended. Mitigation: design the lookup to degrade gracefully (use `name` field as fallback).

- **WeWeb export format versioning:** The sample ZIP has `cacheVersion` in the JSON. If WeWeb updates their export format, the parser may need updates. No versioning strategy is currently documented. Mitigation: add a validation warning if `cacheVersion` is outside tested range.

- **Large site performance bounds:** The largest page JSON in the sample is 1.1MB (1,273 wwObjects). Performance at 50+ pages or 5MB+ individual files has not been tested. Mitigation: progress-per-page callbacks are planned; sequential parsing prevents memory compounding.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` — 17 pages, 179 files, 3,315 wwObjects total; ground truth for all WeWeb format claims
- `/plugin-webflow-to-code/src/` source code — proven Ship Studio plugin patterns, output contracts, shell integration
- Live npm registry queries (2026-03-24) — verified current versions: TypeScript 6.0.2, Vite 8.0.2, Vitest 4.1.1, React 19.2.4

### Secondary (MEDIUM confidence)
- WeWeb JSON schema inferred from 17 page JSON files — HIGH confidence for observed patterns, MEDIUM confidence for exhaustiveness (all exports may not share exact same structure)
- `wwObjectBaseId` lookup table — based on components observed in one export project; may not cover all WeWeb built-in components

### Tertiary (informational)
- WeWeb export format versioning — `cacheVersion` field observed but no documentation found on versioning semantics

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
