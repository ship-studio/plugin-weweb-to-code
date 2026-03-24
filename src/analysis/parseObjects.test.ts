import { describe, it, expect } from 'vitest';
import { getAllWwRefs, isDynamicBinding, buildComponentTree } from './parseObjects';
import type { ParsedSection } from './types';

// ---------------------------------------------------------------------------
// Helper: minimal WeWeb section stub
// ---------------------------------------------------------------------------
function makeSection(overrides: Partial<{
  uid: string;
  wwObjects: Array<{ uid: string; isWwObject: true }>;
  sectionBaseId: string;
}>): ParsedSection & { _raw: Record<string, unknown> } {
  const uid = overrides.uid ?? 'section-1';
  return {
    uid,
    sectionBaseId: overrides.sectionBaseId ?? 'base-1',
    title: null,
    isShared: false,
    styleDefault: {},
    components: [],
    // Attach raw section shape for the walker
    _raw: {
      uid,
      sectionBaseId: overrides.sectionBaseId ?? 'base-1',
      sectionTitle: null,
      _state: { style: { default: {} } },
      content: {
        default: { wwObjects: overrides.wwObjects ?? [] },
      },
    },
  } as unknown as ParsedSection & { _raw: Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// Test 1: getAllWwRefs — finds refs in nested structures
// ---------------------------------------------------------------------------
describe('getAllWwRefs', () => {
  it('finds a single nested ref', () => {
    const input = { children: [{ uid: 'a', isWwObject: true }], text: 'hello' };
    expect(getAllWwRefs(input)).toEqual(['a']);
  });

  it('does NOT descend into isWwObject refs (stops at the ref)', () => {
    const input = {
      uid: 'a',
      isWwObject: true,
      nested: { uid: 'b', isWwObject: true },
    };
    expect(getAllWwRefs(input)).toEqual(['a']);
  });

  it('handles array-of-arrays (tabsContent pattern)', () => {
    const input = {
      tabsContent: [
        [{ uid: 'a', isWwObject: true }],
        [{ uid: 'b', isWwObject: true }],
      ],
    };
    expect(getAllWwRefs(input)).toEqual(['a', 'b']);
  });

  it('returns empty array for primitive values', () => {
    expect(getAllWwRefs(null)).toEqual([]);
    expect(getAllWwRefs(undefined)).toEqual([]);
    expect(getAllWwRefs('string')).toEqual([]);
    expect(getAllWwRefs(42)).toEqual([]);
  });

  it('returns empty array for empty object', () => {
    expect(getAllWwRefs({})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Test 4: isDynamicBinding — detects formula and JS bindings
// ---------------------------------------------------------------------------
describe('isDynamicBinding', () => {
  it('detects formula binding (__wwtype: "f")', () => {
    expect(isDynamicBinding({ __wwtype: 'f', code: 'someFormula' })).toBe(true);
  });

  it('detects JS binding (__wwtype: "js")', () => {
    expect(isDynamicBinding({ __wwtype: 'js', code: 'return x' })).toBe(true);
  });

  it('returns false for object without __wwtype', () => {
    expect(isDynamicBinding({ type: 'f' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDynamicBinding(null)).toBe(false);
  });

  it('returns false for strings', () => {
    expect(isDynamicBinding('some string')).toBe(false);
  });

  it('returns false for unknown __wwtype values', () => {
    expect(isDynamicBinding({ __wwtype: 'unknown' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 5: buildComponentTree — walks content.wwObjects refs (prong 1)
// ---------------------------------------------------------------------------
describe('buildComponentTree — prong 1 (content.wwObjects)', () => {
  it('builds a two-level tree from content.default.wwObjects', () => {
    const rawSection = {
      uid: 'section-1',
      sectionBaseId: 'base-1',
      sectionTitle: null,
      _state: { style: { default: {} } },
      content: {
        default: {
          wwObjects: [{ uid: 'a', isWwObject: true as const }],
        },
      },
    };

    const objectMap: Record<string, unknown> = {
      a: {
        uid: 'a',
        name: 'Container A',
        wwObjectBaseId: 'b783dc65-0000-0000-0000-000000000000',
        libraryComponentBaseId: null,
        parentSectionId: 'section-1',
        _state: { style: { default: {} }, interactions: [] },
        content: {
          default: { wwObjects: [{ uid: 'b', isWwObject: true }] },
        },
      },
      b: {
        uid: 'b',
        name: 'Text B',
        wwObjectBaseId: 'd7904e9d-0000-0000-0000-000000000000',
        libraryComponentBaseId: null,
        parentSectionId: null,
        _state: { style: { default: {} }, interactions: [] },
        content: { default: {} },
      },
    };

    const parentSectionIndex = new Map<string, string[]>();
    const visited = new Set<string>();
    const result = buildComponentTree(
      rawSection as Parameters<typeof buildComponentTree>[0],
      objectMap as Parameters<typeof buildComponentTree>[1],
      parentSectionIndex,
      visited,
    );

    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe('a');
    expect(result[0].componentType).toBe('Container');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].uid).toBe('b');
    expect(result[0].children[0].componentType).toBe('Text');
  });
});

// ---------------------------------------------------------------------------
// Test 6: buildComponentTree — walks parentSectionId fallback (prong 2)
// ---------------------------------------------------------------------------
describe('buildComponentTree — prong 2 (parentSectionId fallback)', () => {
  it('includes objects whose parentSectionId matches the section uid', () => {
    const rawSection = {
      uid: 'section-shared',
      sectionBaseId: 'base-shared',
      sectionTitle: null,
      _state: { style: { default: {} } },
      content: {
        default: { wwObjects: [] }, // empty — linked section pattern
      },
    };

    const objectMap: Record<string, unknown> = {
      c: {
        uid: 'c',
        name: 'Header Content',
        wwObjectBaseId: 'b783dc65-0000-0000-0000-000000000000',
        libraryComponentBaseId: null,
        parentSectionId: 'section-shared',
        _state: { style: { default: {} }, interactions: [] },
        content: { default: {} },
      },
    };

    const parentSectionIndex = new Map<string, string[]>([
      ['section-shared', ['c']],
    ]);
    const visited = new Set<string>();
    const result = buildComponentTree(
      rawSection as Parameters<typeof buildComponentTree>[0],
      objectMap as Parameters<typeof buildComponentTree>[1],
      parentSectionIndex,
      visited,
    );

    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe('c');
    expect(result[0].componentType).toBe('Container');
  });
});

// ---------------------------------------------------------------------------
// Test 7: Cycle guard prevents infinite recursion
// ---------------------------------------------------------------------------
describe('buildComponentTree — cycle guard', () => {
  it('terminates when objects reference each other circularly', () => {
    const rawSection = {
      uid: 'section-cycle',
      sectionBaseId: 'base-cycle',
      sectionTitle: null,
      _state: { style: { default: {} } },
      content: {
        default: {
          wwObjects: [{ uid: 'a', isWwObject: true as const }],
        },
      },
    };

    // a → b → a (cycle)
    const objectMap: Record<string, unknown> = {
      a: {
        uid: 'a',
        name: 'Cyclic A',
        wwObjectBaseId: 'b783dc65-0000-0000-0000-000000000000',
        libraryComponentBaseId: null,
        parentSectionId: 'section-cycle',
        _state: { style: { default: {} }, interactions: [] },
        content: {
          default: { wwObjects: [{ uid: 'b', isWwObject: true }] },
        },
      },
      b: {
        uid: 'b',
        name: 'Cyclic B',
        wwObjectBaseId: 'b783dc65-0000-0000-0000-000000000000',
        libraryComponentBaseId: null,
        parentSectionId: null,
        _state: { style: { default: {} }, interactions: [] },
        content: {
          default: { wwObjects: [{ uid: 'a', isWwObject: true }] }, // back to a
        },
      },
    };

    const parentSectionIndex = new Map<string, string[]>();
    const visited = new Set<string>();

    // Should complete without stack overflow
    expect(() => {
      buildComponentTree(
        rawSection as Parameters<typeof buildComponentTree>[0],
        objectMap as Parameters<typeof buildComponentTree>[1],
        parentSectionIndex,
        visited,
      );
    }).not.toThrow();
  });
});
