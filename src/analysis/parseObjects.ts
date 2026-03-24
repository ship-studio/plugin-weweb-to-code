import type { ParsedObject, WorkflowSpec } from './types';
import { lookupComponentType } from './componentLookup';

// ---------------------------------------------------------------------------
// Internal WeWeb raw object shape (from data/*.json wwObjects dict)
// ---------------------------------------------------------------------------

interface WeWebObject {
  uid: string;
  name: string | null;
  wwObjectBaseId: string;
  libraryComponentBaseId: string | null;
  parentSectionId: string | null;
  _state?: {
    style?: {
      default?: Record<string, unknown>;
      mobile?: Record<string, unknown>;
      tablet?: Record<string, unknown>;
    };
    interactions?: unknown[];
  };
  content?: {
    default?: Record<string, unknown>;
    mobile?: Record<string, unknown>;
    tablet?: Record<string, unknown>;
  };
}

/**
 * Minimal raw section shape required by buildComponentTree.
 * The full WeWebSection is defined in parsePages.ts; this interface only
 * captures what the walker needs.
 */
export interface RawSection {
  uid: string;
  content?: {
    default?: { wwObjects?: Array<{ uid: string; isWwObject: boolean }> };
    mobile?: { wwObjects?: Array<{ uid: string; isWwObject: boolean }> };
    tablet?: { wwObjects?: Array<{ uid: string; isWwObject: boolean }> };
  };
}

// ---------------------------------------------------------------------------
// Public: getAllWwRefs
// ---------------------------------------------------------------------------

/**
 * Greedily find all `{isWwObject: true, uid: string}` references anywhere in
 * the given value tree.
 *
 * Rules:
 * - Primitive (non-object / null): return []
 * - Array: flatMap over elements
 * - Object with isWwObject === true: return [uid] and STOP (do not recurse in)
 * - Other object: flatMap over Object.values
 *
 * This handles all 28 named slot types including single-ref, array, array-of-arrays,
 * and deeply-nested (e.g. columns[N].containerId).
 */
export function getAllWwRefs(val: unknown): string[] {
  if (typeof val !== 'object' || val === null) return [];
  if (Array.isArray(val)) return val.flatMap(getAllWwRefs);
  const obj = val as Record<string, unknown>;
  if (obj['isWwObject'] === true && typeof obj['uid'] === 'string') {
    return [obj['uid']]; // stop here — don't recurse into the ref object
  }
  return Object.values(obj).flatMap(getAllWwRefs);
}

// ---------------------------------------------------------------------------
// Public: isDynamicBinding
// ---------------------------------------------------------------------------

interface DynamicBinding {
  __wwtype: 'f' | 'js';
  code: string;
  defaultValue?: unknown;
}

/**
 * Returns true if `val` is a WeWeb dynamic binding (`__wwtype: "f"` or `"js"`).
 */
export function isDynamicBinding(val: unknown): val is DynamicBinding {
  return (
    typeof val === 'object' &&
    val !== null &&
    '__wwtype' in val &&
    ((val as DynamicBinding).__wwtype === 'f' || (val as DynamicBinding).__wwtype === 'js')
  );
}

// ---------------------------------------------------------------------------
// Internal: walkObject
// ---------------------------------------------------------------------------

/**
 * Recursively build a ParsedObject for one wwObject uid.
 * Uses `visited` to prevent infinite recursion on circular references.
 */
function walkObject(
  uid: string,
  objectMap: Record<string, unknown>,
  visited: Set<string>,
): ParsedObject | null {
  if (visited.has(uid)) return null; // cycle guard
  visited.add(uid);

  const raw = objectMap[uid] as WeWebObject | undefined;
  if (!raw) return null;

  // Component type label
  const componentType = lookupComponentType(raw.wwObjectBaseId ?? '', raw.name ?? null);
  const isLibraryComponent = !!raw.libraryComponentBaseId;

  // Dynamic binding detection — scan all content.default values
  const contentDefault = raw.content?.default ?? {};
  let isDynamic = false;
  for (const v of Object.values(contentDefault)) {
    if (isDynamicBinding(v)) {
      isDynamic = true;
      break;
    }
  }

  // Conditional rendering from _state.style.default.conditionalRendering
  let conditionalRendering: string | undefined;
  const stateStyle = raw._state?.style?.default ?? {};
  const condRender = stateStyle['conditionalRendering'];
  if (condRender !== undefined) {
    if (isDynamicBinding(condRender)) {
      conditionalRendering = '[DYNAMIC: conditional]';
    } else if (condRender === true) {
      conditionalRendering = 'always visible';
    }
  }

  // Text content
  let textContent: string | '[DYNAMIC]' | undefined;
  const rawText = contentDefault['text'];
  if (rawText !== undefined && rawText !== null) {
    if (isDynamicBinding(rawText)) {
      textContent = '[DYNAMIC]';
    } else if (typeof rawText === 'string') {
      textContent = rawText;
    }
  }

  // Image URL — skip CDN placeholder images
  let imageUrl: string | '[DYNAMIC]' | undefined;
  const rawUrl = contentDefault['url'];
  if (rawUrl !== undefined && rawUrl !== null) {
    if (isDynamicBinding(rawUrl)) {
      imageUrl = '[DYNAMIC]';
    } else if (typeof rawUrl === 'string' && !rawUrl.includes('cdn.weweb.app')) {
      imageUrl = rawUrl;
    }
  }

  // Breakpoint styles
  const styleDefault = (raw._state?.style?.default ?? {}) as Record<string, unknown>;
  const styleMobile = raw._state?.style?.mobile as Record<string, unknown> | undefined;
  const styleTablet = raw._state?.style?.tablet as Record<string, unknown> | undefined;

  // Children — greedy slot traversal across ALL content.default values
  const childRefs = getAllWwRefs(contentDefault);
  const children: ParsedObject[] = [];
  for (const childUid of childRefs) {
    const child = walkObject(childUid, objectMap, visited);
    if (child) children.push(child);
  }

  // Interactions — store raw for now (Plan 04 will linearize)
  const interactions: WorkflowSpec[] = (raw._state?.interactions ?? []) as WorkflowSpec[];

  return {
    uid,
    name: raw.name ?? null,
    componentType,
    wwObjectBaseId: raw.wwObjectBaseId ?? '',
    isLibraryComponent,
    isDynamic,
    conditionalRendering,
    styleDefault,
    styleMobile,
    styleTablet,
    interactions,
    children,
    textContent,
    imageUrl,
  };
}

// ---------------------------------------------------------------------------
// Public: buildComponentTree
// ---------------------------------------------------------------------------

/**
 * Build the component tree for one section using the 3-pronged traversal.
 *
 * **Prong 1** — content.{bp}.wwObjects refs: primary mechanism for normal sections.
 * **Prong 2** — parentSectionId fallback: required for linked/shared sections
 *               (Header PUBLIC, Sidemenu PUBLIC) where content.wwObjects is empty.
 *
 * NOTE: Prong 3 (libraryComponent roots) is handled at the PAGE level by the
 * orchestrator (analyze.ts) because those roots are page-wide, not per-section.
 * The caller should walk libraryComponents[].rootElementId through the shared
 * `objectMap` + `visited` set after all sections are processed.
 *
 * @param section            Raw WeWeb section object (uid + content)
 * @param objectMap          Flat wwObjects dict from the page JSON
 * @param parentSectionIndex Pre-built Map<sectionUid, childUids[]> for prong 2
 * @param visited            Shared visited set for cycle detection across all sections
 * @returns                  Ordered ParsedObject[] for this section
 */
export function buildComponentTree(
  section: RawSection,
  objectMap: Record<string, unknown>,
  parentSectionIndex: Map<string, string[]>,
  visited: Set<string>,
): ParsedObject[] {
  const results: ParsedObject[] = [];

  // Prong 1: Walk content.{bp}.wwObjects refs from every breakpoint
  const contentBreakpoints = section.content ?? {};
  for (const bpValue of Object.values(contentBreakpoints)) {
    const wwObjects = (bpValue as { wwObjects?: Array<{ uid: string; isWwObject: boolean }> })
      ?.wwObjects ?? [];
    for (const ref of wwObjects) {
      if (ref.isWwObject && typeof ref.uid === 'string') {
        const parsed = walkObject(ref.uid, objectMap, visited);
        if (parsed) results.push(parsed);
      }
    }
  }

  // Prong 2: parentSectionId fallback (for linked/shared sections)
  const fallbackUids = parentSectionIndex.get(section.uid) ?? [];
  for (const uid of fallbackUids) {
    const parsed = walkObject(uid, objectMap, visited);
    if (parsed) results.push(parsed);
  }

  return results;
}
