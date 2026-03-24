import type { ParsedPage } from './types';

/**
 * Detects shared layout sections by counting sectionBaseId occurrences across
 * DISTINCT pages (not total instances).
 *
 * Algorithm:
 * 1. Build a Map<sectionBaseId, Set<pageId>> — each page counted once per baseId
 * 2. Threshold = pages.length * 0.5
 * 3. Sections with pageId count >= threshold are shared
 * 4. Mutates section.isShared = true for all matching sections
 *
 * @param pages  All parsed pages for the site
 * @returns      Map<sectionBaseId, title> for shared sections
 */
export function detectSharedSections(pages: ParsedPage[]): Map<string, string> {
  if (pages.length === 0) return new Map();

  // Step 1: Map sectionBaseId -> Set of distinct pageIds
  const pageFreq = new Map<string, Set<string>>();
  const baseTitles = new Map<string, string>();

  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      const bid = section.sectionBaseId;
      // Skip falsy sectionBaseId (empty string, null, undefined)
      if (!bid) continue;

      if (!pageFreq.has(bid)) {
        pageFreq.set(bid, new Set());
      }
      // Add page.id — NOT section.uid — so multiple sections on same page count once
      pageFreq.get(bid)!.add(page.id);
      // Store title for the sectionBaseId (last write wins, titles should be consistent)
      baseTitles.set(bid, section.title ?? 'unnamed');
    }
  }

  // Step 2: Determine shared sections by threshold
  const threshold = pages.length * 0.5;
  const shared = new Map<string, string>(); // sectionBaseId -> title

  for (const [bid, pageIds] of pageFreq) {
    if (pageIds.size >= threshold) {
      shared.set(bid, baseTitles.get(bid)!);
    }
  }

  // Step 3: Mutate section.isShared on all matching sections
  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      if (section.sectionBaseId && shared.has(section.sectionBaseId)) {
        section.isShared = true;
      }
    }
  }

  return shared;
}
