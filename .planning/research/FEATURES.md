# Feature Research

**Domain:** No-code-to-code conversion plugin (WeWeb export → coding brief)
**Researched:** 2026-03-24
**Confidence:** HIGH — based on direct inspection of a real WeWeb export ZIP and the proven webflow-to-code plugin this mirrors

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| ZIP file picker (native OS dialog) | Every file-import tool has a native picker; drag-and-drop alternatives feel hacky | LOW | Mirrors webflow plugin exactly; uses Ship Studio Shell `exec` to invoke OS dialog |
| WeWeb export validation | Users accidentally pick wrong ZIPs; silent failure is worse than a clear error | LOW | Check for `data/*.json` + `manifest.json` + HTML shells with `<div id="app">`; the `_wwcv` version query param on asset URLs is a reliable WeWeb fingerprint |
| Asset copying to `.shipstudio/assets/` | Brief is useless if the AI agent can't reference images, fonts, icons | MEDIUM | WeWeb exports contain `images/`, `icons/` (SVG icon libs like lucide), `assets/` (compiled JS/CSS bundles). Only images + icons + fonts matter for the brief; compiled bundles can be skipped |
| Design system extraction (CSS tokens) | Colors, typography, and spacing must be in the brief for pixel-perfect output | MEDIUM | UUID-named CSS custom properties in `<head>` of every HTML shell. Format is `--{uuid}: {value}`. Typography tokens encode weight/size/line-height/font-family shorthand. Color tokens are hex values. Must be parsed from the HTML shell, not the JSON data files |
| Page discovery and routing | Developer must know what pages exist and their URL paths | LOW | `data/*.json` — one file per page. Each file has `page.paths.default` for the route. The filename UUID maps to the page ID. `manifest.json` holds site name |
| Component tree parsing (wwObjects) | The component tree is the entire visual structure; without it the brief is empty | HIGH | Each data JSON has `sections` (dict keyed by UUID, with `sectionTitle`, `linkId`, `_state.style`) and `wwObjects` (dict keyed by UUID). Components have `wwObjectBaseId` (type), `name`, `_state.style` (with `default`/`tablet`/`mobile` breakpoints), and `content.default` (type-specific props). Nesting via `content.default.children` arrays |
| Shared layout detection | Nav/header/sidebar repeat across pages; must be identified once, not per-page | MEDIUM | The `linkId` on a section is the shared identity key. Same `linkId` appearing in multiple page JSON files = shared/linked section. Confirmed in sample ZIP: "Header (PUBLIC)" and "Sidemenu (PUBLIC)" both carry a repeated `linkId` across pages |
| Markdown brief generation | The brief is the entire deliverable; without it there is no output | HIGH | Must synthesize: site metadata, design system token table, shared layout spec, per-page section lists with component summaries, workflow specs, asset inventory |
| Copy to clipboard | Developer's primary consumption flow is pasting into AI chat | LOW | Standard Clipboard API; mirrors webflow plugin `copyToClipboard` function |
| Migration plan (JSON) generation | Tracks progress across multi-session builds; without it the resume feature doesn't work | MEDIUM | Hierarchical: shared items → pages → sections. Each item has `name`, `type`, `status: pending` |
| Resume prompt / progress UI | Builds take multiple sessions; detecting a prior plan and offering resume is baseline UX | MEDIUM | On mount, check for existing `migration-plan.json` in project. If found, show `MigrationProgress` component with polling. Mirrors webflow plugin pattern exactly |
| Token count estimate | Briefs can be 50K+ characters; users need to know if brief fits in their AI context window | LOW | Approximate as `chars / 4`. Show warning if over threshold. Webflow plugin uses 12,000 token threshold |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but expected to be absent in naive tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Responsive breakpoint extraction per component | WeWeb stores `default`/`tablet`/`mobile` style overrides on every component; surfacing these means the AI agent can build responsive layouts correctly on the first pass | MEDIUM | Each `wwObject._state.style` and `section._state.style` has three breakpoint keys. Collect only properties that differ from `default`. Output as a concise diff table per section, not raw JSON dumps |
| Workflow capture as interaction specs | WeWeb's interaction model (trigger → action chain → variable mutation) is richer than HTML attributes; surfacing it means the AI can implement dynamic behavior, not just visual structure | HIGH | Two sources: `page.workflows[]` (page-level triggers like `page-load`, `page-unload`) and `wwObject._state.interactions[]` (element-level triggers like `click`). Each action has `type` (variable, navigate, etc.), `name`, `varId`. Variables have human-readable `name`, `type`, `defaultValue`. Cross-reference variable IDs → names for readable output |
| Design token semantic labeling | UUID tokens are unreadable raw (e.g. `--b0bedcc0-...`). Inferring semantic meaning (heading-1, primary-blue, gray-50) from value patterns makes the brief dramatically more actionable | MEDIUM | Font token values encode size hierarchy (64px > 48px > 32px... → h1–h6). Color tokens group by hue/lightness progression into palettes. Output semantic aliases alongside UUIDs |
| WeWeb component type → migration guidance | Each `wwObjectBaseId` maps to a known WeWeb component type (Button, Text, Input, Form, etc.). Surfacing these with "how to rebuild this in code" guidance saves developer research time | MEDIUM | Maintain a lookup table of known `wwObjectBaseId` UUIDs to component type labels and migration notes. The sample ZIP reveals: container (`b783dc65`), text (`d7904e9d`), icon (`83d890fb`/`1b1e2173`), button (`6f8796b1`/`59dca300`), input (`deb10a01`), form (`9ecb2cfc`), select (`6145eb60`) |
| Variables inventory | WeWeb `variables` (boolean, string, number with `isLocalStorage`/`isPersistentOnNav` flags) define all app state. Listing them gives the AI agent the state model needed to implement dynamic behavior | LOW | Each page JSON has a `variables[]` array. Deduplicate by ID across pages. Output name, type, defaultValue, persistence flags |
| Pixel-perfect vs. best-site mode | Lets developer choose between strict fidelity and AI-assisted improvement | LOW | Mirrors webflow plugin: pixel-perfect preserves brand colors, visual hierarchy, exact layouts, animations. Best-site mode exposes preserve checkboxes. UI already proven |
| Library component identification | `libraryComponentBaseId` on wwObjects flags reusable components (design system building blocks). Knowing these tells the developer what to build as React components vs inline | MEDIUM | Cross-reference `libraryComponents[]` array in each page JSON (list of `{id, rootElementId, type}`). When a wwObject's `libraryComponentBaseId` matches a library component, tag it as "reusable component" in the brief |
| Collections inventory (data-binding stubs) | WeWeb `collections[]` define the data layer (table names, plugin IDs). Out of scope to implement, but listing them tells the developer what API endpoints need to be wired up | LOW | Collections have `name`, `type` (single/list), `config.table`. Filter to unique table names. Present as "data sources to wire" appendix in brief |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Direct WeWeb API/editor integration | Feels more seamless than ZIP upload | WeWeb's API requires OAuth, project-level credentials, and stays coupled to their platform versioning. ZIP export is stable, offline, and already supports the needed data | Keep ZIP-only; document in UI that user must export from WeWeb editor first |
| Automatic code generation | Seems like the logical next step | Code generation belongs in the AI agent layer, not the plugin. Generating code in the plugin would produce opinionated, framework-specific output with no recourse if wrong. Brief → AI agent → code is the correct division | Brief quality is the lever; don't shortcut to generated code |
| Rendering/executing the WeWeb SPA to extract visual output | "What if we just take a screenshot?" | WeWeb exports are Vue.js SPAs that require a backend for data; they won't render without live API endpoints. The data files are the source of truth and don't require execution | Parse JSON data files directly — this is the entire design premise |
| Importing WeWeb database/collection data | Seems helpful for demo/seed data | Data layer is inherently environment-specific (Supabase tables, auth, etc.). Including it in the brief conflates infrastructure setup with UI migration | Mention collection names as stubs in the brief; leave data setup to the developer |
| Authentication logic extraction | WeWeb apps have auth workflows | Auth is deeply tied to WeWeb's backend plugins (Supabase Auth, Xano, etc.) and environment config. Extracting it produces wrong/incomplete output | Document auth-related variables and collections as "requires backend wiring" notes |
| Real-time progress streaming during analysis | Looks impressive | WeWeb JSON parsing is CPU-bound and fast (< 2 seconds for large files). A streaming progress bar would add complexity for zero user benefit | Show simple step labels (Extracting... Parsing... Generating...) without streaming |
| Supporting WeWeb "raw export" (non-built ZIPs) | Some users might export raw project files via WeWeb API | Raw exports have a different structure (Vue SFC source files, not built output). Supporting both formats doubles parsing complexity with little added value | Document that the plugin requires the "built export" ZIP only |

---

## Feature Dependencies

```
[ZIP Picker]
    └──requires──> [WeWeb Export Validation]
                       └──requires──> [Asset Copying]
                       └──requires──> [Design System Extraction (CSS tokens)]
                       └──requires──> [Page Discovery + Routing]
                                          └──requires──> [Component Tree Parsing (wwObjects)]
                                                             └──requires──> [Shared Layout Detection]
                                                             └──requires──> [Responsive Breakpoint Extraction]
                                                             └──requires──> [Workflow Capture]
                                                             └──requires──> [WeWeb Component Type Mapping]
                                                             └──requires──> [Variables Inventory]
                                                             └──requires──> [Library Component Identification]
                       └──all above──> [Markdown Brief Generation]
                                           └──requires──> [Token Count Estimate]
                                           └──requires──> [Copy to Clipboard]

[Markdown Brief Generation] ──requires──> [Migration Plan Generation]
    └──requires──> [Resume Prompt / Progress UI]

[Pixel-Perfect vs Best-Site Mode] ──enhances──> [Markdown Brief Generation]
```

### Dependency Notes

- **Validation requires ZIP Picker:** Validation is the first processing step after a file is selected; it cannot run independently.
- **All analysis requires Validation:** If the ZIP is not a valid WeWeb export, none of the parsing steps should run.
- **Shared Layout Detection requires Component Tree Parsing:** Shared layout identification is based on matching `linkId` values across pages, which are only discovered during JSON parsing.
- **Responsive Breakpoint Extraction requires Component Tree Parsing:** Breakpoints are per-component properties within the parsed `_state.style` objects.
- **Workflow Capture requires Component Tree Parsing:** Element-level interactions (`_state.interactions[]`) are embedded in wwObject data, page-level workflows are also in the same JSON parse pass.
- **Brief Generation requires all analysis features:** The markdown output synthesizes everything; partial analysis produces an incomplete brief.
- **Migration Plan requires Brief Generation:** The plan is generated from the same analysis that drives the brief; they are generated together in one pipeline pass.
- **Resume Prompt conflicts with fresh Brief Generation:** If an existing plan is found on mount, the UI should default to showing the progress view, not the generation flow. These are mutually exclusive UI states.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **ZIP file picker** — entry point; nothing works without it
- [x] **WeWeb export validation** — prevents silent failures on wrong ZIPs
- [x] **Asset copying** — brief references assets; missing files break AI agent output
- [x] **Design system extraction (CSS tokens)** — colors and typography are load-bearing for pixel-perfect output
- [x] **Page discovery and routing** — must know what pages exist
- [x] **Component tree parsing (wwObjects)** — the entire visual structure lives here
- [x] **Shared layout detection** — without it, nav/header gets described once per page (wrong)
- [x] **Markdown brief generation** — the deliverable; without it the plugin has no output
- [x] **Migration plan (JSON) generation** — needed for resume feature
- [x] **Copy to clipboard** — primary consumption path
- [x] **Resume prompt / progress UI** — multi-session builds require this from day one
- [x] **Token count estimate** — brief can exceed AI context limits; users need warning

### Add After Validation (v1.x)

Features to add once core brief is working and producing useful output.

- [ ] **Responsive breakpoint extraction** — add when users report that AI-generated layouts miss mobile/tablet behavior
- [ ] **Workflow capture as interaction specs** — add when users report that dynamic behavior is missing from briefs
- [ ] **WeWeb component type → migration guidance** — add when users report confusion about what WeWeb components map to in code
- [ ] **Pixel-perfect vs. best-site mode** — add when users start asking for modernized output vs. strict fidelity

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Variables inventory** — valuable for complex apps; defer until basic brief quality is validated
- [ ] **Design token semantic labeling** — nice-to-have polish; requires heuristic classification logic
- [ ] **Library component identification** — useful for large design systems; defer until seen in real user projects
- [ ] **Collections inventory stubs** — informational only; defer until users ask for data wiring guidance

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| ZIP file picker | HIGH | LOW | P1 |
| WeWeb export validation | HIGH | LOW | P1 |
| Asset copying | HIGH | LOW | P1 |
| Design system extraction | HIGH | MEDIUM | P1 |
| Page discovery + routing | HIGH | LOW | P1 |
| Component tree parsing | HIGH | HIGH | P1 |
| Shared layout detection | HIGH | MEDIUM | P1 |
| Markdown brief generation | HIGH | HIGH | P1 |
| Migration plan generation | HIGH | MEDIUM | P1 |
| Copy to clipboard | HIGH | LOW | P1 |
| Resume prompt / progress UI | HIGH | MEDIUM | P1 |
| Token count estimate | MEDIUM | LOW | P1 |
| Responsive breakpoint extraction | HIGH | MEDIUM | P2 |
| Workflow capture as interaction specs | HIGH | HIGH | P2 |
| WeWeb component type mapping | MEDIUM | MEDIUM | P2 |
| Pixel-perfect vs. best-site mode | MEDIUM | LOW | P2 |
| Variables inventory | MEDIUM | LOW | P2 |
| Design token semantic labeling | MEDIUM | MEDIUM | P3 |
| Library component identification | LOW | MEDIUM | P3 |
| Collections inventory stubs | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

There are no direct competitors for WeWeb-specific export-to-brief plugins. The closest analogues are:

| Feature | webflow-to-code (sibling plugin) | Generic "export to code" tools | Our WeWeb approach |
|---------|----------------------------------|--------------------------------|--------------------|
| Source format | HTML + CSS + assets | Various | JSON data files + CSS token variables + assets |
| Design system extraction | CSS class inspection | None or basic | UUID CSS custom property parsing from HTML head |
| Component detection | DOM class pattern matching (`w-nav`, `w-dropdown`, etc.) | None | `wwObjectBaseId` lookup table mapping |
| Shared layout detection | Nav/footer element matching by Webflow ID | None | `linkId` cross-page matching |
| Interaction/workflow capture | `data-animation`/`data-easing` attribute extraction | None | `_state.interactions[]` + page-level `workflows[]` JSON |
| Responsive handling | Webflow variant suffix grouping (`-p-500`, `-p-800`) | None | Per-component `_state.style.mobile`/`tablet`/`default` diff |
| Output format | Markdown brief + JSON migration plan | Various (code, Figma, etc.) | Markdown brief + JSON migration plan (same as sibling) |

The sibling webflow-to-code plugin is the primary reference. WeWeb requires fundamentally different parsing (JSON not HTML) but the same output contracts (markdown brief, JSON plan, clipboard, resume UI).

---

## Sources

- Direct inspection of `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` — a real WeWeb export ZIP with 17 pages and 179 files, confirmed structure: `data/*.json` (one per page), `manifest.json`, `index.html` (HTML shell with UUID CSS tokens in `<head>`), `images/`, `icons/lucide/`, `assets/` (compiled Vue bundles)
- WeWeb JSON data file structure verified: top-level keys `cacheVersion`, `page`, `sections`, `wwObjects`, `collections`, `variables`, `workflows`, `formulas`, `libraryComponents`
- `page.paths.default` confirmed as URL route source
- `section.linkId` cross-page matching confirmed as shared layout mechanism
- CSS token format confirmed: font shorthand `{weight} {size}/{line-height} {font-family}`, color as hex
- `wwObjectBaseId` component type mapping observed from sample data
- `_state.interactions[].trigger` values observed: `click`; `page.workflows[].trigger` values observed: `page-unload`, `page-load`
- webflow-to-code plugin source code at `/Users/juliangalluzzo/Desktop/Projects/shipstudio-plugins/plugin-webflow-to-code/src/` — reference for proven UI patterns, output contracts, and Ship Studio integration
- `PROJECT.md` requirements list at `.planning/PROJECT.md`

---
*Feature research for: WeWeb-to-code Ship Studio plugin*
*Researched: 2026-03-24*
