# Roadmap: WeWeb to Code

## Overview

Four phases deliver a complete Ship Studio plugin: the toolbar shell and ZIP ingestion foundation first, then the full parsing pipeline (design tokens, component trees, interactions, assets), then brief generation and output modes, and finally the migration plan and multi-session resume UI. The UI shell and migration progress components are ported from the webflow-to-code sibling plugin; the parsing core is net-new, built to handle WeWeb's JSON-first export format.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Plugin Shell & ZIP Ingestion** - Ship Studio toolbar integration, file picker, ZIP extraction, and WeWeb export validation (completed 2026-03-24)
- [x] **Phase 2: Parsing Pipeline** - Design token extraction, component tree analysis, interactions/state, and asset copying (completed 2026-03-24)
- [ ] **Phase 3: Brief Generation & Output** - Markdown brief assembly, mode selection, clipboard copy, and file save
- [ ] **Phase 4: Migration Plan & Resume UI** - Hierarchical migration plan JSON, progress tracking, and multi-session resume

## Phase Details

### Phase 1: Plugin Shell & ZIP Ingestion
**Goal**: Users can load the plugin in Ship Studio, select a WeWeb export ZIP, and get immediate validation feedback
**Depends on**: Nothing (first phase)
**Requirements**: ZIP-01, ZIP-02, ZIP-03, UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. WeWeb icon appears in Ship Studio toolbar and clicking it opens the plugin modal
  2. User can open a native OS file picker and select a ZIP file from disk
  3. Plugin correctly identifies a valid WeWeb export (data/*.json + manifest.json + HTML shell with div#app)
  4. Plugin shows a clear, actionable error message when the selected ZIP is not a valid WeWeb export
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Project scaffold, core types, ZIP extraction pipeline, WeWeb validation with tests
- [x] 01-02-PLAN.md — Plugin UI shell (Modal, toolbar entry point, MainView with ZIP flow wiring)
**UI hint**: yes

### Phase 2: Parsing Pipeline
**Goal**: Plugin extracts the full site model — design tokens, component trees, interactions, and assets — from the WeWeb export data
**Depends on**: Phase 1
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06, PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09, INTERACT-01, INTERACT-02, INTERACT-03, INTERACT-04, INTERACT-05, INTERACT-06, ASSET-01, ASSET-02, ASSET-03, ASSET-04, UX-04
**Success Criteria** (what must be TRUE):
  1. All pages are discovered with correct URL routes from page.paths.default
  2. Component tree for every page is resolved by recursive wwObject tree walk (all 13 slot types) with correct parent-child structure and [DYNAMIC] annotations on formula/JS bindings
  3. Shared layout sections (nav, sidebar, footer) are identified by sectionBaseId frequency and separated from per-page content
  4. Design system is extracted as classified, deduplicated token sets: font composites sorted by size (H1-H6 inference), hex colors, dimension tokens, and Google Font URLs
  5. Images and icons are copied to .shipstudio/assets/ and an asset manifest with file counts and project-relative paths is written
**Plans**: 5 plans
Plans:
- [x] 02-01-PLAN.md — Phase 2 type contracts + design token extraction (CSS classification, font ranking, color dedup, Google Fonts)
- [x] 02-02-PLAN.md — Asset enumeration and copying (images/, icons/ to .shipstudio/assets/, manifest builder)
- [x] 02-03-PLAN.md — Page discovery + 3-pronged recursive tree walker (component types, dynamic bindings, breakpoints)
- [x] 02-04-PLAN.md — Workflow/interaction parsing (chain linearization, variable/collection inventory)
- [x] 02-05-PLAN.md — Shared layout detection + analysis orchestrator + MainView integration

### Phase 3: Brief Generation & Output
**Goal**: Users receive a complete, structured Markdown brief they can copy to an AI agent to begin reconstruction
**Depends on**: Phase 2
**Requirements**: BRIEF-01, BRIEF-02, BRIEF-03, BRIEF-04, BRIEF-05, BRIEF-06, BRIEF-07, BRIEF-08, BRIEF-09, BRIEF-10, UX-03, UX-05, UX-06
**Success Criteria** (what must be TRUE):
  1. Generated brief contains site overview, classified design system tables, shared layout spec, per-page component summaries, responsive breakpoint diffs, workflow specs, asset inventory, and component migration guidance
  2. User can choose between pixel-perfect mode and best-site mode, and brief content adapts accordingly
  3. Plugin warns the user when the estimated token count exceeds the threshold
  4. User can copy the full brief to clipboard with one click
  5. Brief is saved to .shipstudio/assets/brief.md so it persists across sessions
**Plans**: 2 plans
Plans:
- [x] 03-01-PLAN.md — Brief types, generateBrief() with all section builders, io.ts for save/clipboard, unit tests
- [ ] 03-02-PLAN.md — MainView mode selection UI, brief generation wiring, done-state results panel with copy/warning
**UI hint**: yes

### Phase 4: Migration Plan & Resume UI
**Goal**: Users can track multi-session migrations with a persistent plan and resume from any previous session
**Depends on**: Phase 3
**Requirements**: PLAN-01, PLAN-02, PLAN-03, UX-07, UX-08, UX-09, UX-10
**Success Criteria** (what must be TRUE):
  1. Plugin generates migration-plan.json with hierarchical structure (shared layout -> pages -> sections) and pending/in-progress/complete status per item
  2. Plugin detects an existing migration-plan.json on mount and shows the progress view instead of the generation flow
  3. Progress view displays the migration tree with status symbols, updated by polling migration-plan.json
  4. User can copy a resume prompt to continue the migration in a new AI session
  5. User can start a fresh migration, overwriting the existing plan
**Plans**: 2 plans
Plans:
- [ ] 04-01-PLAN.md — Plan module: types, generateMigrationPlan from SiteAnalysis, I/O (save/load), progress computation, resume prompt
- [ ] 04-02-PLAN.md — MigrationProgress component, MainView integration (plan detection on mount, plan generation after brief, progress UI)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plugin Shell & ZIP Ingestion | 2/2 | Complete   | 2026-03-24 |
| 2. Parsing Pipeline | 5/5 | Complete   | 2026-03-24 |
| 3. Brief Generation & Output | 1/2 | In Progress|  |
| 4. Migration Plan & Resume UI | 0/2 | Not started | - |
