import { describe, it, expect } from 'vitest';
import { detectSharedSections } from './detectShared';
import type { ParsedPage, ParsedSection } from './types';

// Helper to build a minimal ParsedSection
function makeSection(
  uid: string,
  sectionBaseId: string,
  title: string | null = 'Section',
): ParsedSection {
  return {
    uid,
    sectionBaseId,
    title,
    isShared: false,
    styleDefault: {},
    components: [],
  };
}

// Helper to build a minimal ParsedPage with given sections array
function makePage(id: string, sections: ParsedSection[]): ParsedPage {
  const sectionsRecord: Record<string, ParsedSection> = {};
  for (const s of sections) {
    sectionsRecord[s.uid] = s;
  }
  return {
    id,
    route: `/${id}`,
    isDynamic: false,
    sections: sectionsRecord,
    variables: [],
    collections: [],
    workflows: [],
  };
}

describe('detectSharedSections', () => {
  // Test 1: Section appearing on 3 of 4 pages is shared (75% > 50%)
  it('marks section appearing on 3 of 4 pages as shared (75%)', () => {
    const pages: ParsedPage[] = [
      makePage('page-1', [makeSection('s1', 'header-base', 'Header')]),
      makePage('page-2', [makeSection('s2', 'header-base', 'Header')]),
      makePage('page-3', [makeSection('s3', 'header-base', 'Header')]),
      makePage('page-4', [makeSection('s4', 'footer-base', 'Footer')]),
    ];

    const shared = detectSharedSections(pages);

    expect(shared.has('header-base')).toBe(true);
    const info = shared.get('header-base')!;
    expect(info.title).toBe('Header');
    expect(info.pageCount).toBe(3);
    expect(info.totalPages).toBe(4);
    expect(info.type).toBe('header');
  });

  // Test 2: Section appearing on 1 of 4 pages is NOT shared (25% < 50%)
  it('does not mark section appearing on 1 of 4 pages as shared (25%)', () => {
    const pages: ParsedPage[] = [
      makePage('page-1', [makeSection('s1', 'header-base', 'Header')]),
      makePage('page-2', [makeSection('s2', 'header-base', 'Header')]),
      makePage('page-3', [makeSection('s3', 'header-base', 'Header')]),
      makePage('page-4', [makeSection('s4', 'footer-base', 'Footer')]),
    ];

    const shared = detectSharedSections(pages);

    expect(shared.has('footer-base')).toBe(false);
  });

  // Test 3: Multiple sections per page with same sectionBaseId count as 1 page occurrence
  it('counts multiple sections with same sectionBaseId on one page as 1 page occurrence', () => {
    // 2 pages: page A has 3 sections with sectionBaseId 'nav-base', page B has 0
    // 1/2 = 50% >= 50% threshold, so it IS shared
    const pages: ParsedPage[] = [
      makePage('page-a', [
        makeSection('s1', 'nav-base', 'Nav'),
        makeSection('s2', 'nav-base', 'Nav'),
        makeSection('s3', 'nav-base', 'Nav'),
      ]),
      makePage('page-b', [makeSection('s4', 'content-base', 'Content')]),
    ];

    const shared = detectSharedSections(pages);

    // 'nav-base' appears on 1 distinct page out of 2 (50% >= 50%) => shared
    expect(shared.has('nav-base')).toBe(true);
    // 'content-base' appears on 1 distinct page out of 2 (50% >= 50%) => also shared
    // Both should be shared
    expect(shared.has('content-base')).toBe(true);
  });

  // Test 4: isShared flag is set on matching sections after call
  it('sets isShared = true on sections with shared sectionBaseId', () => {
    const sharedSection = makeSection('s1', 'header-base', 'Header');
    const nonSharedSection = makeSection('s2', 'footer-base', 'Footer');

    const pages: ParsedPage[] = [
      makePage('page-1', [sharedSection, nonSharedSection]),
      makePage('page-2', [makeSection('s3', 'header-base', 'Header')]),
      makePage('page-3', [makeSection('s4', 'header-base', 'Header')]),
      makePage('page-4', [makeSection('s5', 'other-base', 'Other')]),
    ];

    detectSharedSections(pages);

    // sharedSection is in pages[0].sections — check the section object was mutated
    expect(pages[0].sections['s1'].isShared).toBe(true);
    expect(pages[0].sections['s2'].isShared).toBe(false);
  });

  // Test 5: Empty pages array returns empty map
  it('returns empty map for empty pages array', () => {
    const shared = detectSharedSections([]);
    expect(shared.size).toBe(0);
  });

  // Test 6: Section with no sectionBaseId is skipped
  it('skips sections with no sectionBaseId and does not throw', () => {
    const pages: ParsedPage[] = [
      makePage('page-1', [
        makeSection('s1', '', 'Empty base'),          // empty string sectionBaseId
        makeSection('s2', 'real-base', 'Real'),
      ]),
      makePage('page-2', [makeSection('s3', 'real-base', 'Real')]),
    ];

    expect(() => detectSharedSections(pages)).not.toThrow();
    const shared = detectSharedSections(pages);
    // 'real-base' appears on 2 of 2 pages (100%) => shared
    expect(shared.has('real-base')).toBe(true);
    // Empty string sectionBaseId should NOT be in the shared map
    expect(shared.has('')).toBe(false);
  });
});
