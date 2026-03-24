# Requirements: WeWeb to Code

**Defined:** 2026-03-24
**Core Value:** Extract enough structural and visual detail from WeWeb's JSON/CSS data model that an AI agent can recreate the site with near pixel-perfect fidelity

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### ZIP & Validation

- [ ] **ZIP-01**: User can select a WeWeb export ZIP via native OS file picker
- [ ] **ZIP-02**: Plugin validates WeWeb export structure (data/*.json, manifest.json, HTML shell with `<div id="app">`)
- [ ] **ZIP-03**: Plugin shows clear error message when ZIP is not a valid WeWeb export

### Asset Management

- [ ] **ASSET-01**: Plugin copies images/ directory to .shipstudio/assets/images/
- [ ] **ASSET-02**: Plugin copies icons/ directory to .shipstudio/assets/icons/
- [ ] **ASSET-03**: Plugin copies fonts (from CSS @font-face or Google Font links) to asset manifest
- [ ] **ASSET-04**: Plugin builds asset manifest with file counts and project-relative paths

### Design System

- [ ] **DESIGN-01**: Plugin extracts typography tokens from CSS custom properties (weight, size, line-height, font-family)
- [ ] **DESIGN-02**: Plugin extracts color tokens from CSS custom properties (hex values)
- [ ] **DESIGN-03**: Plugin extracts spacing tokens from CSS custom properties
- [ ] **DESIGN-04**: Plugin infers semantic labels for typography tokens (h1-h6 from size hierarchy)
- [ ] **DESIGN-05**: Plugin infers semantic labels for color tokens (primary, secondary, gray scale from hue/lightness)
- [ ] **DESIGN-06**: Plugin captures external font references (Google Fonts links from HTML head)

### Page & Component Analysis

- [ ] **PAGE-01**: Plugin discovers all pages from data/*.json files
- [ ] **PAGE-02**: Plugin extracts URL route for each page from page.paths.default
- [ ] **PAGE-03**: Plugin parses section hierarchy from each page's sections dict
- [ ] **PAGE-04**: Plugin walks wwObjects component tree recursively across all 13 slot types (children, formContent, leftIcon, rightIcon, overlayElement, triggerElement, etc.)
- [ ] **PAGE-05**: Plugin detects shared layout sections via sectionBaseId frequency across pages
- [ ] **PAGE-06**: Plugin extracts responsive breakpoint style diffs (mobile/tablet/default) per component
- [ ] **PAGE-07**: Plugin maps wwObjectBaseId UUIDs to component type labels via lookup table
- [ ] **PAGE-08**: Plugin falls back to wwObject name field when wwObjectBaseId is not in lookup table
- [ ] **PAGE-09**: Plugin identifies library components via libraryComponentBaseId cross-reference

### Interactions & State

- [ ] **INTERACT-01**: Plugin captures page-level workflows (triggers: page-load, page-unload, etc. → action chains)
- [ ] **INTERACT-02**: Plugin captures element-level interactions from wwObject._state.interactions[] (triggers: click, hover, etc.)
- [ ] **INTERACT-03**: Plugin cross-references variable IDs to human-readable names in workflow output
- [ ] **INTERACT-04**: Plugin inventories variables with name, type, defaultValue, and persistence flags (isLocalStorage, isPersistentOnNav)
- [ ] **INTERACT-05**: Plugin inventories collections with name, type, and table references as data source stubs
- [ ] **INTERACT-06**: Plugin flags dynamic bindings (__wwtype: "f" or "js") with [DYNAMIC] annotation and uses defaultValue for visual approximation

### Brief Generation

- [ ] **BRIEF-01**: Plugin generates markdown brief with site overview (page count, asset count, component count)
- [ ] **BRIEF-02**: Brief includes design system section with classified token tables (typography, colors, spacing)
- [ ] **BRIEF-03**: Brief includes shared layout section identifying nav/header/sidebar/footer with confidence level
- [ ] **BRIEF-04**: Brief includes per-page sections with component summaries and section structure
- [ ] **BRIEF-05**: Brief includes responsive breakpoint diffs per section
- [ ] **BRIEF-06**: Brief includes workflow/interaction specs
- [ ] **BRIEF-07**: Brief includes asset inventory with paths and metadata
- [ ] **BRIEF-08**: Brief includes migration guidance per component type
- [ ] **BRIEF-09**: Plugin estimates token count and shows warning if brief exceeds threshold
- [ ] **BRIEF-10**: Brief content adapts based on selected mode (pixel-perfect vs best-site)

### Migration Plan

- [ ] **PLAN-01**: Plugin generates hierarchical migration plan JSON (shared layout → pages → sections)
- [ ] **PLAN-02**: Each plan item has name, type, status (pending/in-progress/complete)
- [ ] **PLAN-03**: Plugin saves migration plan to .shipstudio/migration-plan.json

### Output & UX

- [ ] **UX-01**: Plugin loads in Ship Studio toolbar with WeWeb icon
- [ ] **UX-02**: Plugin opens modal on toolbar button click
- [ ] **UX-03**: User can choose between pixel-perfect and best-site mode (with preserve options)
- [ ] **UX-04**: Plugin shows step-by-step progress during extraction and analysis
- [ ] **UX-05**: User can copy brief to clipboard
- [ ] **UX-06**: Plugin saves brief to .shipstudio/assets/brief.md
- [ ] **UX-07**: Plugin detects existing migration-plan.json on mount and shows progress UI
- [ ] **UX-08**: Progress UI polls migration-plan.json and displays tree with status symbols
- [ ] **UX-09**: User can copy resume prompt for continuing migration in new AI session
- [ ] **UX-10**: User can start fresh migration (overwrite existing plan)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Analysis

- **ENH-01**: Plugin detects conditional rendering rules and surfaces them in brief
- **ENH-02**: Plugin extracts animation/transition definitions from component states
- **ENH-03**: Plugin generates visual component hierarchy diagram

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| WeWeb API/editor integration | Requires OAuth, couples to platform versioning; ZIP export is stable and offline |
| Automatic code generation | Code gen belongs in AI agent layer, not the plugin; brief quality is the lever |
| Rendering/executing WeWeb SPA | Requires backend for data; JSON data files are the source of truth |
| Database/collection data import | Data layer is environment-specific; collections listed as stubs only |
| Authentication logic extraction | Deeply tied to WeWeb backend plugins; documented as "requires backend wiring" |
| WeWeb "raw export" support | Different structure (Vue SFCs); doubles parsing complexity for little value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ZIP-01 | Phase 1 | Pending |
| ZIP-02 | Phase 1 | Pending |
| ZIP-03 | Phase 1 | Pending |
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 1 | Pending |
| DESIGN-01 | Phase 2 | Pending |
| DESIGN-02 | Phase 2 | Pending |
| DESIGN-03 | Phase 2 | Pending |
| DESIGN-04 | Phase 2 | Pending |
| DESIGN-05 | Phase 2 | Pending |
| DESIGN-06 | Phase 2 | Pending |
| PAGE-01 | Phase 2 | Pending |
| PAGE-02 | Phase 2 | Pending |
| PAGE-03 | Phase 2 | Pending |
| PAGE-04 | Phase 2 | Pending |
| PAGE-05 | Phase 2 | Pending |
| PAGE-06 | Phase 2 | Pending |
| PAGE-07 | Phase 2 | Pending |
| PAGE-08 | Phase 2 | Pending |
| PAGE-09 | Phase 2 | Pending |
| INTERACT-01 | Phase 2 | Pending |
| INTERACT-02 | Phase 2 | Pending |
| INTERACT-03 | Phase 2 | Pending |
| INTERACT-04 | Phase 2 | Pending |
| INTERACT-05 | Phase 2 | Pending |
| INTERACT-06 | Phase 2 | Pending |
| ASSET-01 | Phase 2 | Pending |
| ASSET-02 | Phase 2 | Pending |
| ASSET-03 | Phase 2 | Pending |
| ASSET-04 | Phase 2 | Pending |
| UX-04 | Phase 2 | Pending |
| BRIEF-01 | Phase 3 | Pending |
| BRIEF-02 | Phase 3 | Pending |
| BRIEF-03 | Phase 3 | Pending |
| BRIEF-04 | Phase 3 | Pending |
| BRIEF-05 | Phase 3 | Pending |
| BRIEF-06 | Phase 3 | Pending |
| BRIEF-07 | Phase 3 | Pending |
| BRIEF-08 | Phase 3 | Pending |
| BRIEF-09 | Phase 3 | Pending |
| BRIEF-10 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| UX-05 | Phase 3 | Pending |
| UX-06 | Phase 3 | Pending |
| PLAN-01 | Phase 4 | Pending |
| PLAN-02 | Phase 4 | Pending |
| PLAN-03 | Phase 4 | Pending |
| UX-07 | Phase 4 | Pending |
| UX-08 | Phase 4 | Pending |
| UX-09 | Phase 4 | Pending |
| UX-10 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
