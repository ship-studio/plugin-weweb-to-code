# WeWeb to Code

## What This Is

A Ship Studio plugin that converts WeWeb export ZIP files into structured coding briefs and migration plans for AI-assisted development. It parses WeWeb's JSON page definitions, CSS design tokens, and workflow definitions to produce a comprehensive markdown brief that guides developers (or AI agents) through pixel-perfect recreation of WeWeb sites in code.

## Core Value

The brief must extract enough structural and visual detail from WeWeb's JSON/CSS data model that an AI agent can recreate the site with near pixel-perfect fidelity — without needing access to the original WeWeb project.

## Requirements

### Validated

- ✓ Plugin loads in Ship Studio toolbar with WeWeb icon and opens modal on click — v1.0
- ✓ User can select a WeWeb export ZIP via native file picker — v1.0
- ✓ Plugin extracts ZIP, validates WeWeb export structure (JSON data files, assets, HTML shell) — v1.0
- ✓ Plugin copies assets (images, icons, fonts, CSS/JS bundles) to .shipstudio/assets/ — v1.0
- ✓ Plugin parses JSON data files (/data/*.json) to extract page structure, sections, and component trees (wwObjects) — v1.0
- ✓ Plugin extracts design system from inline CSS variables (typography scales, color palette, spacing tokens) into usable token sets — v1.0
- ✓ Plugin detects shared layout elements (nav, footer, sidebar) across page JSON definitions — v1.0
- ✓ Plugin captures WeWeb workflows (triggers + action chains) as interaction specs in the brief — v1.0
- ✓ Plugin extracts responsive breakpoint values (mobile/tablet/default) from component state objects — v1.0
- ✓ Plugin maps WeWeb component types to migration guidance (what each component does, how to rebuild it) — v1.0
- ✓ Plugin generates markdown brief with site overview, design system, page structure, components, workflows, and assets — v1.0
- ✓ Plugin generates hierarchical migration plan (JSON) tracking shared layout → pages → sections — v1.0
- ✓ User can choose between pixel-perfect mode and best-site mode (with preserve options) — v1.0
- ✓ User can copy brief to clipboard — v1.0
- ✓ Plugin detects existing migration plan and shows progress UI with resume prompt — v1.0
- ✓ Multi-session migration tracking via polling migration-plan.json — v1.0

### Active

(None — v1.0 complete)

### Out of Scope

- WeWeb editor integration or API access — works only with static export ZIPs
- Automatic code generation — plugin produces briefs, not code
- Server-side rendering of WeWeb's SPA — we parse the data files, not the rendered output
- WeWeb database/collection bindings — data layer is out of scope, only UI structure matters
- Authentication/user management logic from WeWeb — only visual and interaction structure

## Context

Shipped v1.0 with 5,279 LOC TypeScript across 30 source files.
Tech stack: TypeScript, React 19 (peer), Vite, vitest (143 tests).
Build output: 73 kB ES module with React externalized.

Architecture mirrors the webflow-to-code sibling plugin with WeWeb-specific parsing:
- ZIP extraction + 4-fingerprint validation (data/*.json, manifest.json, div#app, _wwcv param)
- Design token extraction from 227 UUID CSS variables (64 font, 144 color, 19 spacing)
- 3-pronged recursive tree walker (content.wwObjects + parentSectionId + libraryComponent roots)
- Workflow/interaction parser with action chain linearization
- Shared layout detection via sectionBaseId frequency (distinct pages, not instances)
- 9-section markdown brief with depth-3 component tree cap
- Hierarchical migration plan with 30s polling progress UI

## Constraints

- **Tech stack**: TypeScript + React (matching webflow-to-code), Vite build, vitest for tests
- **Runtime**: No runtime dependencies — only peer React 19 from Ship Studio host
- **Shell interface**: All file system operations go through Ship Studio's Shell abstraction (exec commands)
- **Plugin API**: Must conform to Ship Studio plugin.json spec (slot: toolbar, API version 1)
- **Export format**: Must handle WeWeb export format as observed (ZIP with HTML shells, /data/ JSON, /assets/, /images/, /icons/)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Parse JSON data files instead of HTML | WeWeb HTML is empty SPA shell; all structure is in /data/*.json | ✓ Good |
| Extract design system from CSS variables | UUID-based tokens in `<head>` are the source of truth for typography, colors, spacing | ✓ Good |
| Mirror webflow-to-code architecture | Proven patterns for Ship Studio plugins, reduces risk, enables code reuse for UI shell | ✓ Good |
| Capture workflows as interaction specs | User wants near pixel-perfect recreation including dynamic behavior | ✓ Good |
| 3-pronged tree walker (content + parentSectionId + libraryComponent) | Single traversal mechanism missed linked sections; 3-pronged achieves 100% coverage | ✓ Good |
| Depth-3 cap for component tree in brief | animal-detail page has 1,273 objects at depth 7; uncapped output is unusable | ✓ Good |
| sectionBaseId frequency counts distinct pages | Instance count produces false 182% frequency; page count gives correct 71% | ✓ Good |
| Copy-and-adapt from webflow plugin | Fastest path with minimal risk; all UI shell, configs, io patterns reused | ✓ Good |

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
*Last updated: 2026-03-25 after v1.0 milestone*
