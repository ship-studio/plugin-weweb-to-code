# WeWeb to Code

## What This Is

A Ship Studio plugin that converts WeWeb export ZIP files into structured coding briefs and migration plans for AI-assisted development. It parses WeWeb's JSON page definitions, CSS design tokens, and workflow definitions to produce a comprehensive markdown brief that guides developers (or AI agents) through pixel-perfect recreation of WeWeb sites in code.

## Core Value

The brief must extract enough structural and visual detail from WeWeb's JSON/CSS data model that an AI agent can recreate the site with near pixel-perfect fidelity — without needing access to the original WeWeb project.

## Requirements

### Validated

- ✓ Plugin loads in Ship Studio toolbar with WeWeb icon and opens modal on click — Phase 1
- ✓ User can select a WeWeb export ZIP via native file picker — Phase 1
- ✓ Plugin extracts ZIP, validates WeWeb export structure (JSON data files, assets, HTML shell) — Phase 1

- ✓ Plugin copies assets (images, icons, fonts, CSS/JS bundles) to .shipstudio/assets/ — Phase 2
- ✓ Plugin parses JSON data files (/data/*.json) to extract page structure, sections, and component trees (wwObjects) — Phase 2
- ✓ Plugin extracts design system from inline CSS variables (typography scales, color palette, spacing tokens) into usable token sets — Phase 2
- ✓ Plugin detects shared layout elements (nav, footer, sidebar) across page JSON definitions — Phase 2
- ✓ Plugin captures WeWeb workflows (triggers + action chains) as interaction specs in the brief — Phase 2
- ✓ Plugin extracts responsive breakpoint values (mobile/tablet/default) from component state objects — Phase 2
- ✓ Plugin maps WeWeb component types to migration guidance (what each component does, how to rebuild it) — Phase 2

### Active
- [ ] Plugin generates markdown brief with site overview, design system, page structure, components, workflows, and assets
- [ ] Plugin generates hierarchical migration plan (JSON) tracking shared layout → pages → sections
- [ ] User can choose between pixel-perfect mode and best-site mode (with preserve options)
- [ ] User can copy brief to clipboard
- [ ] Plugin detects existing migration plan and shows progress UI with resume prompt
- [ ] Multi-session migration tracking via polling migration-plan.json

### Out of Scope

- WeWeb editor integration or API access — works only with static export ZIPs
- Automatic code generation — plugin produces briefs, not code
- Server-side rendering of WeWeb's SPA — we parse the data files, not the rendered output
- WeWeb database/collection bindings — data layer is out of scope, only UI structure matters
- Authentication/user management logic from WeWeb — only visual and interaction structure

## Context

- This plugin mirrors the architecture of the existing webflow-to-code plugin, adapted for WeWeb's fundamentally different export format
- WeWeb exports are SPAs: identical HTML shells with `<div id="app">`, real structure in `/data/*.json` files
- Design system lives in inline CSS custom properties with UUID-based names (e.g., typography scales, colors, spacing)
- WeWeb uses a component model (`wwObjects` with `sections` hierarchy) instead of semantic HTML classes
- Workflows define interactions via JSON: triggers (click, page-load, backdrop-click) → action chains (set variable, navigate, toggle)
- Responsive values are per-component in state objects with mobile/tablet/default breakpoints
- External resources include Google Fonts, WeWeb icon CDN (heroicons, font-awesome, weweb-icons)
- The existing webflow-to-code plugin provides the proven UI shell (Modal, MigrationProgress), build config, and Ship Studio integration patterns

## Constraints

- **Tech stack**: TypeScript + React (matching webflow-to-code), Vite build, vitest for tests
- **Runtime**: No runtime dependencies — only peer React 19 from Ship Studio host
- **Shell interface**: All file system operations go through Ship Studio's Shell abstraction (exec commands)
- **Plugin API**: Must conform to Ship Studio plugin.json spec (slot: toolbar, API version 1)
- **Export format**: Must handle WeWeb export format as observed (ZIP with HTML shells, /data/ JSON, /assets/, /images/, /icons/)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Parse JSON data files instead of HTML | WeWeb HTML is empty SPA shell; all structure is in /data/*.json | — Pending |
| Extract design system from CSS variables | UUID-based tokens in `<head>` are the source of truth for typography, colors, spacing | — Pending |
| Mirror webflow-to-code architecture | Proven patterns for Ship Studio plugins, reduces risk, enables code reuse for UI shell | — Pending |
| Capture workflows as interaction specs | User wants near pixel-perfect recreation including dynamic behavior | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 after Phase 2 completion*
