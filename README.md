# WeWeb to Code

A [Ship Studio](https://shipstudio.ai) plugin that converts WeWeb export ZIP files into structured coding briefs for AI-assisted development.

Upload a WeWeb export, get a comprehensive markdown brief that any AI agent can use to recreate the site in code — near pixel-perfect.

## How It Works

1. **Export from WeWeb** — Use WeWeb's built-in export to download a `.zip` of your project
2. **Open the plugin** — Click the WeWeb icon in the Ship Studio toolbar
3. **Choose a mode** — Pixel Perfect (exact recreation) or Best Site (modernized rebuild)
4. **Select the ZIP** — The plugin extracts, validates, and analyzes the export
5. **Copy the brief** — Paste the generated markdown into any AI coding agent
6. **Track progress** — Migration plan tracks multi-session builds with resume support

## What Gets Extracted

| Category | Details |
|----------|---------|
| **Design System** | Typography scales (H1-H6), color palette with semantic labels, spacing tokens — all extracted from WeWeb's UUID-based CSS variables |
| **Page Structure** | Every page with URL routes, section hierarchy, and full component trees |
| **Components** | Recursive tree walk across all 28 WeWeb slot types with component type mapping and migration guidance |
| **Shared Layout** | Nav, header, sidebar, footer detected via cross-page frequency analysis with confidence percentages |
| **Interactions** | Page-level and element-level workflows with action chain linearization and variable cross-referencing |
| **Responsive** | Mobile, tablet, and desktop breakpoint style diffs per component |
| **Assets** | Images and icons copied to `.shipstudio/assets/` with a full manifest |

## Brief Output

The generated brief includes:

- **Site Overview** — Page count, component count, asset count, estimated tokens
- **Design System Tables** — Classified typography, colors, and spacing with semantic labels
- **Shared Layout** — Detected shared sections with type (nav/header/sidebar/footer) and confidence level
- **Per-Page Sections** — Component summaries with depth-3 tree rendering and `[DYNAMIC]` binding annotations
- **Responsive Diffs** — Mobile/tablet overrides per section
- **Workflow Specs** — Triggers, action chains, and variable mutations
- **Asset Inventory** — All images and icons with project-relative paths
- **Migration Guidance** — Per-component-type notes on how to rebuild in code

## Migration Plan

After generating the brief, the plugin creates a hierarchical `migration-plan.json`:

```
Shared Nav (pending)
Shared Sidebar (pending)
Home Page
  ├── Hero Section (pending)
  ├── Features Section (pending)
  └── Footer Section (pending)
Dashboard Page
  ├── Stats Section (pending)
  └── Content Section (pending)
```

- **Progress tracking** — Polls every 30 seconds, shows completion percentage
- **Resume prompt** — Copy a prompt to continue migration in a new AI session
- **Start fresh** — Reset and re-analyze with a different export

## Installation

Clone into your Ship Studio plugins directory:

```bash
cd ~/.shipstudio/plugins  # or your configured plugins path
git clone https://github.com/ship-studio/plugin-weweb-to-code.git
```

The plugin is pre-built — `dist/index.js` is included. Restart Ship Studio to load.

## Development

```bash
npm install
npm run dev     # watch mode — rebuilds on changes
npm run build   # production build
npx vitest      # run tests (143 tests)
```

### Project Structure

```
src/
├── index.tsx              # Plugin entry point, toolbar button, WeWeb icon
├── types.ts               # Shell, Storage, PluginActions interfaces
├── context.ts             # usePluginContext hook
├── styles.ts              # Plugin CSS (ww2c- prefix)
├── zip/                   # ZIP extraction and validation
│   ├── types.ts           # ZipStep state machine, ZipManifest
│   ├── extract.ts         # File picker, extraction, verification
│   └── discover.ts        # Manifest parsing, WeWeb 4-fingerprint validation
├── design/                # Design system extraction
│   ├── types.ts           # DesignToken, DesignSystem
│   ├── parseTokens.ts     # CSS variable classification (font/color/spacing)
│   └── mapFonts.ts        # Google Font URL extraction
├── analysis/              # Site analysis pipeline
│   ├── types.ts           # SiteAnalysis, ParsedPage, ParsedSection, ParsedObject
│   ├── parsePages.ts      # Page discovery, route extraction, JSON parsing
│   ├── parseObjects.ts    # 3-pronged recursive tree walker
│   ├── componentLookup.ts # wwObjectBaseId → component type mapping
│   ├── parseWorkflows.ts  # Workflow/interaction parser with chain linearization
│   ├── detectShared.ts    # Shared layout detection via sectionBaseId frequency
│   └── analyze.ts         # Full analysis orchestrator (9-step pipeline)
├── brief/                 # Brief generation
│   ├── types.ts           # BriefMode, BriefInput, BriefResult
│   ├── generate.ts        # generateBrief() with 9 section builders
│   └── io.ts              # saveBrief, copyToClipboard via shell
├── plan/                  # Migration plan
│   ├── types.ts           # PlanStatus, PlanItem, MigrationPlan
│   ├── generate.ts        # generateMigrationPlan from SiteAnalysis
│   ├── read.ts            # loadMigrationPlan, computeProgress
│   ├── io.ts              # saveMigrationPlan via shell
│   └── resumePrompt.ts    # buildResumePrompt
├── components/            # React UI
│   ├── Modal.tsx          # Modal shell with overlay, escape-to-close
│   └── MigrationProgress.tsx  # Progress tree with polling
└── views/
    └── MainView.tsx       # Main orchestrator view
```

### Tech Stack

- **TypeScript** — Strict mode, no `any`
- **React 19** — Peer dependency from Ship Studio host
- **Vite** — ES module build with React externalized
- **vitest** — 143 unit tests with jsdom environment
- **Zero runtime dependencies** — Only peer React

## WeWeb Export Format

This plugin works with WeWeb's **built export** (the ZIP you download from the WeWeb editor). The export contains:

- `data/*.json` — One JSON file per page with sections, wwObjects, workflows, variables, collections
- `index.html` (+ per-page HTML) — SPA shells with inline CSS design tokens in `<head>`
- `assets/` — Compiled JS/CSS bundles (not used by plugin)
- `images/`, `icons/` — Static assets
- `manifest.json` — PWA manifest with site name

The plugin validates exports using 4 fingerprints: `data/*.json` files, `manifest.json`, `<div id="app">` in HTML, and `_wwcv=` cache version parameter.

## License

MIT
