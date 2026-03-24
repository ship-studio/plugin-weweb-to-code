# Pitfalls Research

**Domain:** WeWeb export parsing / no-code-to-code conversion plugin
**Researched:** 2026-03-24
**Confidence:** HIGH — all findings are based on direct analysis of a real WeWeb export ZIP (`f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip`), cross-referenced with the proven webflow-to-code sibling plugin.

---

## Critical Pitfalls

### Pitfall 1: Treating HTML Files as the Content Source

**What goes wrong:**
The plugin treats WeWeb HTML files (17 pages found in the sample ZIP) as the source of structural content — parsing them like Webflow exports for sections, components, and text. The HTML files are empty SPA shells: every page is identical (`<div id="app"></div>`, one `<script src="/assets/main-6NaVb4ET.js">`, no content), differing only in font preloads and inline CSS variables. A parser that tries to extract headings, sections, or components from HTML finds nothing useful.

**Why it happens:**
Webflow exports embed actual content in HTML. Developers familiar with Webflow (or the webflow-to-code plugin) assume the same approach works for WeWeb. The HTML files look plausible — they have a full `<head>` with CSS variables, Google Fonts, and a title. It takes opening the `<body>` to discover there is no content there.

**How to avoid:**
Parse only `/data/{uuid}.json` files. Ignore all HTML files as content sources. Use the HTML head solely for extracting CSS variables (design tokens) and Google Fonts declarations. Validate this distinction in the WeWeb export validator: if `data/` directory is absent or empty, the export is invalid — not if HTML is missing semantic content.

**Warning signs:**
- The brief generator produces a page section list but all sections are empty
- `wwObjects` count is 0 in analysis output
- Page titles all say `<noscript>` or similar fallback content

**Phase to address:**
ZIP validation and data discovery phase (Phase 1/2). The validator must check for `data/*.json` files, not for semantic HTML content. This is the single most dangerous wrong assumption — it invalidates the entire analysis pipeline if not caught immediately.

---

### Pitfall 2: Misunderstanding the wwObjects Dict as a Tree

**What goes wrong:**
The `wwObjects` dict in each data JSON is treated as a flat list of top-level components — each one iterated and rendered in order. In reality it is a reference pool: `sections` contain children by UID reference, and those children contain further nested children by UID reference via multiple slot types. Walking the dict sequentially produces a scrambled, out-of-order component list that does not reflect the actual page layout.

**Why it happens:**
The dict uses UUID keys at the top level, which looks like a flat collection. There are 142 wwObjects on the dashboard page and 1273 on the animal-detail page. It is tempting to treat them all as peers.

**How to avoid:**
Build a recursive tree walker that starts from `sections[uid].content.default.wwObjects[]` and traverses by UID reference. Critically, `children` is not the only slot — at least 13 slot types reference nested wwObjects: `children`, `formContent`, `button`, `checkbox`, `contentElement`, `el`, `embeddedContainer`, `layout`, `leftIcon`, `overlayElement`, `rightIcon`, `text`, `triggerElement`. All slots must be traversed for complete coverage.

The walk is: sections (ordered) → each section's `.content.default.wwObjects[]` (by uid ref) → for each wwObject, recursively descend all slot types that contain `{ uid, isWwObject: true }`.

**Warning signs:**
- wwObjects count in brief equals total keys in the dict (e.g., 1273 for animal-detail) instead of a smaller reachable set
- Named components like "Label", "Container" appear at the same depth as top-level sections
- Icon proxy objects (leftIcon, rightIcon) appear as standalone sections in the output

**Phase to address:**
JSON parsing/component-tree phase. Write the tree walker before any brief generation. Test it against the animal-detail page (1273 objects, max depth 7) — if the walker only resolves 40 objects when the expected reachable set is much larger, the slot traversal is incomplete.

---

### Pitfall 3: Parsing CSS Variables Without Semantic Classification

**What goes wrong:**
The design system extractor dumps all 226+ UUID-named CSS custom properties as-is into the brief. The AI agent receives `--b0bedcc0-c1ed-4e2e-b18a-a72f5f7d3b25: 500 64px/72px var(--ww-default-font-family, sans-serif)` and has no way to know this is the H1 typography token, or that `--0b2d2b5a-bd76-40e2-90b7-ba854d7a86cf` is the primary blue.

**Why it happens:**
The CSS variables in the HTML head have no human-readable names — WeWeb uses UUID keys throughout. It feels sufficient to list them all; the volume creates an illusion of completeness. But an unsorted list of 226 tokens is noise, not a design system.

**How to avoid:**
Classify tokens by value type before writing to the brief:
- **Font composite tokens**: values matching `{weight} {size}/{lineHeight} var(--ww-default-font-family...)` — these are text style tokens (the sample has 64)
- **Color tokens**: values matching `#RRGGBB` or `#RGB` — these are palette entries (the sample has 143)
- **Spacing/size tokens**: values matching `{N}px` alone — these are spacing scale tokens (the sample has 19)

Within each category, deduplicate by value (multiple UUIDs may share the same hex color). For font tokens, infer semantic roles by sorting on size descending: the largest font composite is H1, second largest H2, etc.

The fallback value in `var(--uuid, fallback)` references within JSON is the ground truth — use it to cross-reference which tokens are actually used.

**Warning signs:**
- Brief design system section has 200+ entries with no grouping
- Font token section is not sorted by size
- Duplicate color values appear under different UUIDs

**Phase to address:**
Design token extraction phase. Do not proceed to brief generation until tokens are classified and deduplicated. This directly determines whether the brief is actionable.

---

### Pitfall 4: Losing Responsive Breakpoint Data

**What goes wrong:**
The extractor only reads `content.default` and `_state.style.default` from each component, ignoring `mobile` and `tablet` variants. The resulting brief has no responsive specifications — the AI agent produces a desktop-only layout that collapses on mobile.

**Why it happens:**
`default` is always present; `mobile` and `tablet` keys only appear when the designer has overridden values at that breakpoint. They look optional and it is tempting to start with `default` and add breakpoints "later." Later never comes.

**How to avoid:**
Always extract all three breakpoints simultaneously. For each component, collect: `_state.style.mobile`, `_state.style.tablet`, `_state.style.default`. Diff the mobile/tablet values against default to produce override-only breakpoint specs (reduces noise). Use the presence of mobile overrides as a signal that the layout is intentionally responsive.

Also extract section-level breakpoints: `sections[uid].content.mobile` and `.content.tablet` can have different `_ww-layout_flexDirection` and alignment values that control the entire section layout.

**Warning signs:**
- Brief has zero mobile/responsive mentions in section specifications
- Components with `"mobile":{"width":"100%"}` in JSON appear in the brief with only their default width

**Phase to address:**
Component state extraction phase. Enforce a rule: if `_state.style.mobile` or `_state.style.tablet` exists on any component in a section, that section must have a breakpoint specification in the brief.

---

### Pitfall 5: Treating All wwObjects as Page-Unique Content

**What goes wrong:**
Every wwObject across all 17 pages is parsed independently and written into each page's brief section. The "Header" section (sectionBaseId `99586bd3`) and "Sidemenu" section (sectionBaseId `ef0ecc71`) each appear on 12 out of 17 pages — their 100+ constituent wwObjects are described 12 times each in the brief. This bloats the brief with redundant content and buries the real per-page differences.

**Why it happens:**
Each data JSON is a standalone file. Without cross-page analysis, every page looks like it has its own header and sidebar. The sectionBaseId field is the key signal but requires reading all pages before knowing which sections are shared.

**How to avoid:**
Run shared layout detection before brief generation. The mechanism: collect `sectionBaseId` values across all pages; any base ID appearing on >50% of pages is a shared layout section. Write shared sections once in a "Shared Layout" section of the brief, then exclude them from per-page descriptions. This mirrors how the webflow-to-code plugin handles shared nav/footer detection via `data-w-id` frequency.

Note: `linkId` on sections is NOT the shared layout indicator — it was zero matches across pages in the sample. `sectionBaseId` is the reliable signal (12-page matches confirmed).

**Warning signs:**
- "Header" and "Sidemenu" sections appear in every page's specification
- Brief is larger than 50,000 words
- Page-by-page section counts are all similar and suspiciously high

**Phase to address:**
Cross-page analysis phase. This must run after all JSON files are parsed and before brief generation starts.

---

### Pitfall 6: Ignoring Dynamic Bindings Without Flagging Them

**What goes wrong:**
Component content with `__wwtype: "f"` (formula/variable reference) or `__wwtype: "js"` (JavaScript expression) is either silently dropped (the brief says nothing about it) or the raw code string is pasted verbatim into the brief. The AI agent either doesn't know dynamic content exists, or receives uninterpretable code snippets.

**Why it happens:**
Static analysis sees `"__wwtype": "f"` and either skips it (no string value to display) or dumps the `code` field. Neither approach communicates "this element shows dynamic content bound to variable X."

**How to avoid:**
Detect `__wwtype` on any value and produce a structured flag rather than trying to resolve the value. The pattern: when a property has `{ code: "...", __wwtype: "f"|"js", defaultValue: ... }`, use the `defaultValue` for visual approximation in the brief and add a `[DYNAMIC: variable binding]` or `[DYNAMIC: JS expression]` annotation. This tells the AI agent to implement a state-driven slot here rather than hardcoded content.

For `conditionalRendering` (13 occurrences in the dashboard page alone): flag the component as conditionally visible with a `[CONDITIONAL: {condition description}]` annotation.

**Warning signs:**
- Brief components with no text content despite having a "Message" or "Error" name
- Components with `_state.style.default.display: { code: ..., __wwtype: "f" }` that appear with no visibility annotation

**Phase to address:**
Component content extraction phase. Add a pre-pass that detects all `__wwtype` occurrences before generating component descriptions.

---

### Pitfall 7: Using `parentSectionId` as the Sole Tree Navigation Signal

**What goes wrong:**
The parser uses `parentSectionId` to group wwObjects by section instead of traversing the tree by uid reference. This appears to work for most objects but silently excludes the 221 objects in the animal-detail page that have no `parentSectionId` (null/missing). These include named components like "profile container", "logo", and many unnamed icon/text proxies that live in slot references rather than direct section children.

**Why it happens:**
`parentSectionId` looks like a reliable foreign key for grouping. It is present on most objects and seems to enable efficient section-to-object lookups.

**How to avoid:**
Use `parentSectionId` only as a secondary index (for lookups), never as the primary tree structure. Build the tree exclusively by following UID references from sections downward. Objects without `parentSectionId` are slot-embedded children that belong to their parent wwObject's slot, not directly to a section.

**Warning signs:**
- Total objects in the brief is less than 60% of total objects in the JSON dict
- Named components like icon proxies or overlay elements are missing from all section descriptions

**Phase to address:**
Component tree traversal phase. Write a test that compares reachable-via-tree-walk count against total JSON dict size — the reachable set should be 100% of all objects (every object is referenced somewhere in the tree).

---

### Pitfall 8: Mapping Routes from HTML Directory Names Without Handling Dynamic Segments

**What goes wrong:**
Routes are inferred from HTML directory names (e.g., `animal-detail/:param/index.html`). The `:param` segment is treated as a literal path component rather than a dynamic route parameter. The brief says the page lives at `/animal-detail/:param` instead of `/animal-detail/[id]` (Next.js) or equivalent.

**Why it happens:**
WeWeb uses `{{param|}}` in its `page.paths` values (e.g., `'animal-detail/{{param|}}'`). If the HTML directory name is parsed directly, the colon-prefixed segment looks like a URL parameter but is actually a filesystem artifact from how WeWeb names the directory.

**How to avoid:**
Read route information from `data/{uuid}.json` → `page.paths.en` (or `.default` as fallback), not from HTML directory names. This is the authoritative route source. Then normalize WeWeb's `{{param|}}` pattern to the target framework's dynamic segment syntax (e.g., `[param]` for Next.js, `:param` for React Router, `[param]` for SvelteKit).

**Warning signs:**
- Brief shows `/animal-detail/:param` as a route
- Dynamic pages are not flagged as requiring slug/param handling in migration guidance

**Phase to address:**
Page discovery phase. The route extraction function must parse `page.paths` from JSON, with a normalizer for `{{param|...}}` patterns.

---

### Pitfall 9: Missing the `__wwtype: "js"` → Shell Safety Problem

**What goes wrong:**
Workflow action values and component content contain JavaScript code strings, including template literals, backticks, and special shell characters. When these strings pass through shell commands (e.g., `base64` encoding, `cat`, `echo`) during brief file writing, they corrupt the output or cause command failures.

**Why it happens:**
The webflow-to-code plugin solved this for HTML content by base64-encoding HTML before passing it through shell commands (`base64 < file`). But the WeWeb plugin reads JSON, and the JSON itself can contain raw JS code strings like `"code": "context.workflow.error?.['message']"` or backtick expressions. If these strings are naively interpolated into shell commands, they break.

**How to avoid:**
Follow the same base64 pattern from webflow-to-code: read JSON files using `base64 < '{path}'` via shell, then `atob()` in JS before `JSON.parse()`. Never pass raw JSON content through shell string interpolation. For brief writing, use `fs`-style writes through the Shell abstraction rather than `echo` or `cat` heredocs.

**Warning signs:**
- Shell exec errors mentioning syntax errors or unexpected tokens when reading data files
- Brief file truncated at a backtick or single-quote character in a workflow action

**Phase to address:**
File I/O phase. Apply base64 encoding to ALL data JSON reads from the very first implementation, not as a later fix.

---

### Pitfall 10: Confusing `wwObjectBaseId` Frequency with Shared Layout Detection

**What goes wrong:**
The shared layout detector counts `wwObjectBaseId` values across pages to find shared components, reasoning that high-frequency base IDs indicate reused layout components. But `wwObjectBaseId` identifies the component *type* (e.g., `b783dc65` = container, `d7904e9d` = text element), not shared instances. A container base ID appearing 621 times on one page means there are 621 container components — it means nothing about cross-page sharing.

**Why it happens:**
The webflow-to-code plugin uses `data-w-id` frequency for shared layout detection, which genuinely identifies the same DOM element across pages. A developer porting that logic to WeWeb might reach for `wwObjectBaseId` as the nearest equivalent.

**How to avoid:**
Use `sectionBaseId` (not `wwObjectBaseId`) for cross-page shared layout detection. A sectionBaseId appearing on 12/17 pages (as "Header" and "Sidemenu" do in the sample) is a shared layout section. `wwObjectBaseId` is a component template type identifier — it tells you *what kind* of component this is, useful for component type → migration guidance mapping, but not for shared layout detection.

**Warning signs:**
- Shared layout detector reports 0 shared sections (because no wwObjectBaseId appears on >50% of pages)
- OR reports dozens of "shared" components because container/text base IDs are common types

**Phase to address:**
Cross-page analysis phase. Use `sectionBaseId` exclusively for shared layout detection.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Only parse `content.default`, skip mobile/tablet | Simpler initial parser | Responsive spec missing from all briefs | Never — mobile breakpoints are a core requirement |
| Dump all 226 CSS vars unsorted | No classification code needed | Brief is unusable for design system extraction | Never — semantic grouping is what makes the brief actionable |
| Skip `__wwtype` detection, use `defaultValue` silently | No annotation logic needed | AI agent builds static UI for dynamic content | Acceptable for MVP only if `[DYNAMIC]` flag added in v2 immediately |
| Use `parentSectionId` grouping instead of tree walk | O(1) lookup per object | 15-20% of objects silently lost from brief | Never — silent data loss is a correctness failure |
| Only parse top 3 slot types (children, formContent, children) | Simpler slot traversal | Icon proxies, overlay, trigger elements all lost | Never |
| Skip workflow parsing on first pass | Faster MVP | Interaction specs absent from brief | Acceptable for MVP if flagged as "interactions: not yet parsed" |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Fonts detection | Parse from JSON component content | Parse from HTML `<head>` link tags — the HTML head is the authoritative fonts source; JSON may reference font family strings but not the full spec |
| Icon library detection | Assume all icons are in `/icons/` dir | Icon names in JSON use multiple prefixes: `lucide/` (SVGs bundled in ZIP), `icon-*` (weweb-icons CDN), `fas`/`far` (Font Awesome CDN), `noun-*` (Noun Project SVGs bundled). Categorize by prefix. |
| WeWeb CDN images | Assume all images are in `/images/` dir | Default placeholder is `cdn.weweb.app/public/images/no_image_selected.png` — this is a CDN-hosted fallback, not a local asset. Flag in brief as "no image selected" rather than a broken asset path. |
| CSS var token source | Parse from data JSON `_ww-text_color` values | Authoritative token definitions are in HTML `<head>` `<style>` block. JSON references tokens via `var(--uuid, fallback)` syntax — the fallback is useful for confirmation but the head style block is the canonical source. |
| Route extraction | Parse from HTML directory names | Parse from `data/{uuid}.json` → `page.paths.en`. HTML directories mirror routes but are unreliable for dynamic segments (`{{param|}}` becomes `:param` in filesystem). |
| `_wwcv` query param on asset URLs | Try to strip or resolve at runtime | It is a cache-busting version stamp (`?_wwcv=216`). Strip it when building asset inventory paths, but preserve it for display in the brief so developers know it exists. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recursive tree walk without visited-set guard | Stack overflow or infinite loop on circular UID references | Always pass and check a `visited: Set<string>` in the recursive walker | Any page where an icon proxy or slot element is referenced from multiple parents |
| Parsing all 17 data JSON files sequentially with `await` | Long wait with no progress feedback | Use the `onProgress` callback pattern from webflow-to-code: `onProgress('Analyzing page 3/17...')` | Pages with 1273 objects (animal-detail) will visibly stall without feedback |
| Loading 1.1MB JSON via `JSON.parse()` synchronously in UI thread | UI freeze during brief generation | Parse in response to shell read, not in a synchronous component render | The animal-detail JSON is 1.1MB — noticeable freeze on parse |
| Building brief as string concatenation in a loop | Memory and performance on large sites | Use an array of sections, join at the end — same pattern as webflow-to-code | Any page with 1000+ components |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Interpolating wwObject `name` fields directly into shell commands | Names like "profile container" or names with quotes/semicolons could break shell commands | Never interpolate user data into shell command strings. All file writes via the Shell abstraction, all reads via `base64` decode. |
| Trusting `page.paths` for file system path construction | A malicious export could set `page.paths.en` to `../../etc/passwd` | Validate and sanitize all route values before using in any file path context |
| Writing brief to arbitrary paths | Not applicable — brief path is fixed by Ship Studio spec | N/A |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No indication that some components are dynamic (`__wwtype`) | User gives AI agent the brief; agent builds static UI; dynamic forms don't work | Annotate every dynamic binding in the brief with `[DYNAMIC]` flag so user knows to tell agent about state management |
| Brief lists 226 UUID CSS variables with no grouping | User cannot use the design system section | Group tokens: Colors, Typography, Spacing — with semantic role labels for typography scale |
| Workflow action chains described as UUID-linked dicts | User cannot understand the interaction flow | Linearize workflow chains following `firstAction` → `next` pointers, present as ordered action lists |
| Progress bar shows "Analyzing..." for 30+ seconds on large pages | User thinks plugin has hung | Show per-page progress with object counts: "Analyzing animal-detail (1273 components)..." |
| No distinction between shared layout and page-specific content | Brief reads as if every page has its own header | Lead with "Shared Layout" section, then page-specific content |

---

## "Looks Done But Isn't" Checklist

- [ ] **Design token extraction:** Token count should be ~226 for the sample. If fewer, the CSS `<style>` block parser has a regex boundary issue — verify it handles multi-line `:root {}` blocks.
- [ ] **Component tree:** If the animal-detail page produces fewer than ~1000 reachable wwObjects from tree traversal, a slot type is not being traversed. Verify all 13 slot types are handled.
- [ ] **Shared layout detection:** Dashboard page should NOT have a "Header" or "Sidemenu" section in its page-specific section. If it does, sectionBaseId cross-page analysis is not running.
- [ ] **Responsive breakpoints:** The forgot-password card component has `"mobile":{"width":"100%","height":"100%","padding":"32px 24px","minHeight":"100vh"}` — if the brief card spec shows only `width: 400px` (the default), mobile breakpoints are not being extracted.
- [ ] **Workflow linearization:** The forgot-password form has a 4-action workflow chain (`firstAction` → `next` pointer). If the brief shows 4 unordered action IDs instead of an ordered list, workflow chains are not being linearized.
- [ ] **Dynamic binding flags:** The `ac5dfd9f` "Text" component on the forgot-password page has `__wwtype: "f"` on both `_ww-text_text` and `conditionalRendering`. Both should appear in the brief with `[DYNAMIC]` flags.
- [ ] **Route parameters:** The animal-detail page route should appear as `/animal-detail/[param]` (or framework equivalent), not `/animal-detail/:param` or `/animal-detail/{{param|}}`.
- [ ] **Icon libraries declared:** The brief should declare Font Awesome CDN, weweb-icons CDN, and Lucide (locally bundled) as dependencies — not just list icon names without context.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| HTML-as-source approach shipped | HIGH — entire analysis pipeline needs rewrite | Introduce data JSON discovery layer; keep ZIP extraction and brief output layers intact |
| Flat wwObjects iteration shipped | MEDIUM — tree walker replaces the loop | Replace iteration with recursive walk; add visited set; test against all 17 pages |
| Missing breakpoints shipped | MEDIUM — add breakpoint extraction to existing component parser | Add `.mobile` and `.tablet` reads alongside existing `.default` reads |
| CSS vars unsorted in brief shipped | LOW — pure output formatting change | Add classification pass before writing design system section |
| `parentSectionId` used for tree | HIGH — silent data loss in every brief | Remove parentSectionId grouping; build tree-first architecture from scratch |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| HTML as content source | Phase 1: ZIP validation & data discovery | Validator rejects ZIPs missing `data/*.json`; brief contains wwObjects count > 0 |
| wwObjects dict as flat list | Phase 2: Component tree traversal | animal-detail tree walk yields ~1000+ reachable objects |
| CSS vars without semantic classification | Phase 3: Design token extraction | Token section in brief has Colors/Typography/Spacing groups |
| Missing responsive breakpoints | Phase 2: Component state extraction | forgot-password card spec includes mobile width override |
| Shared sections duplicated per page | Phase 4: Cross-page analysis | Dashboard brief has "Shared Layout" section; no Header/Sidemenu in per-page specs |
| Dynamic bindings silently dropped | Phase 2: Component content extraction | `[DYNAMIC]` annotation present on error message component |
| `parentSectionId` as tree signal | Phase 2: Component tree traversal | 100% of wwObjects reachable via tree walk (no orphans) |
| Route from HTML dirs | Phase 1: Page discovery | animal-detail route shows `[param]` not `:param` |
| Shell safety with JS code strings | Phase 1: File I/O foundation | JSON with backtick strings reads correctly via base64 pipeline |
| wwObjectBaseId vs sectionBaseId confusion | Phase 4: Cross-page analysis | Header/Sidemenu detected as shared on 12/17 pages |

---

## Sources

- Direct analysis of `f4f96557-7748-43f9-8861-9b89ec6d81ee_216.zip` (WeWeb export, 17 pages, 3,315 wwObjects across all pages)
- WeWeb data file JSON structure: `data/{uuid}.json` (sections, wwObjects, variables, workflows, collections, libraryComponents keys confirmed)
- HTML head structure: `add-job/index.html` (226 UUID CSS variables, 3 Google Fonts families, empty SPA body confirmed)
- Cross-page sectionBaseId analysis: "Header" (sectionBaseId `99586bd3`) and "Sidemenu" (sectionBaseId `ef0ecc71`) each on 12/17 pages
- Slot type inventory from `c4192ae2` dashboard page: 13 named slot keys that embed wwObject refs
- `__wwtype` distribution: 86 `"f"` (formula) and 24 `"js"` (JavaScript) dynamic bindings in dashboard page alone
- webflow-to-code sibling plugin: base64 file reading pattern, shared layout detection via frequency threshold, ZIP manifest parsing via regex (not `.split(' ')`)

---
*Pitfalls research for: WeWeb export parsing / Ship Studio plugin*
*Researched: 2026-03-24*
