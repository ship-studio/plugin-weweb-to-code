import type { ParsedPage, SharedSectionInfo } from './types';

/**
 * Infer section type from its title string.
 */
function inferSectionType(title: string): SharedSectionInfo['type'] {
  const t = title.toLowerCase();
  if (t.includes('nav') || t.includes('menu')) return 'nav';
  if (t.includes('header')) return 'header';
  if (t.includes('side')) return 'sidebar';
  if (t.includes('footer')) return 'footer';
  return 'shared';
}

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
 * @returns      Map<sectionBaseId, SharedSectionInfo> with frequency and type
 */
export function detectSharedSections(pages: ParsedPage[]): Map<string, SharedSectionInfo> {
  if (pages.length === 0) return new Map();

  // Step 1: Map sectionBaseId -> Set of distinct pageIds
  const pageFreq = new Map<string, Set<string>>();
  const baseTitles = new Map<string, string>();

  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      const bid = section.sectionBaseId;
      if (!bid) continue;

      if (!pageFreq.has(bid)) {
        pageFreq.set(bid, new Set());
      }
      pageFreq.get(bid)!.add(page.id);
      baseTitles.set(bid, section.title ?? 'unnamed');
    }
  }

  // Step 2: Determine shared sections by threshold
  const threshold = pages.length * 0.5;
  const shared = new Map<string, SharedSectionInfo>();

  for (const [bid, pageIds] of pageFreq) {
    if (pageIds.size >= threshold) {
      const title = baseTitles.get(bid)!;
      shared.set(bid, {
        title,
        pageCount: pageIds.size,
        totalPages: pages.length,
        type: inferSectionType(title),
      });
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
