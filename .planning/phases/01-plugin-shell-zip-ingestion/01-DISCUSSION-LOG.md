# Phase 1: Plugin Shell & ZIP Ingestion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 01-plugin-shell-zip-ingestion
**Areas discussed:** Validation logic, Porting strategy, File picker prompt

---

## Validation Logic

| Option | Description | Selected |
|--------|-------------|----------|
| data/*.json + div#app | Core markers: JSON data files exist + HTML shell has div#app. Fast, reliable, minimal false positives. | |
| manifest.json | PWA manifest — present in all WeWeb exports. Adds confidence but not unique to WeWeb. | |
| _wwcv param | WeWeb-specific cache version on asset URLs. Strong WeWeb-only fingerprint. | |
| All of the above | Check everything for maximum confidence | ✓ |

**User's choice:** All of the above
**Notes:** User wants maximum validation confidence — check all 4 fingerprints.

---

## Porting Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Copy and adapt | Copy files directly, rename webflow→weweb, swap validation + icon. Fastest, minimal risk. | ✓ |
| Rewrite inspired | Write fresh using webflow as reference. Cleaner but slower, risk of subtle divergence. | |
| You decide | Claude picks the best approach based on each file's similarity | |

**User's choice:** Copy and adapt
**Notes:** None — straightforward choice.

---

## File Picker Prompt

| Option | Description | Selected |
|--------|-------------|----------|
| No warning | Just overwrite silently, like webflow plugin does. Simpler UX. | |
| Warn + confirm | Show "Existing migration found. Start fresh?" before picking. Prevents accidental overwrites. | ✓ |
| You decide | Claude picks based on what makes sense for the UX flow | |

**User's choice:** Warn + confirm
**Notes:** Prevents accidental overwrites of in-progress migrations.

---

## Claude's Discretion

- WeWeb SVG icon design
- CSS style ID naming
- Test structure and coverage targets
- Whether to include MainView stub in Phase 1 or defer

## Deferred Ideas

None
