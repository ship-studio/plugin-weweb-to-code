import type { Shell } from '../types';
import type {
  ParsedPage,
  ParsedSection,
  VariableEntry,
  CollectionEntry,
} from './types';

// ---------------------------------------------------------------------------
// Internal WeWeb JSON shape (raw data/*.json structure)
// ---------------------------------------------------------------------------

interface WeWebPageData {
  cacheVersion: number;
  page: {
    id: string;
    paths: { en: string; default: string };
    workflows: WeWebWorkflowEntry[];
    cmsDataSetPath?: string;
  };
  sections: Record<string, WeWebSection>;
  wwObjects: Record<string, WeWebObject>;
  variables: WeWebVariable[];
  workflows: WeWebWorkflowEntry[];
  collections: WeWebCollection[];
  formulas: unknown[];
  libraryComponents: WeWebLibraryComponent[];
}

interface WeWebSection {
  uid: string;
  linkId: string;
  sectionBaseId: string;
  sectionTitle: string | null;
  _state: {
    style: {
      default?: Record<string, unknown>;
      mobile?: Record<string, unknown>;
      tablet?: Record<string, unknown>;
    };
  };
  content: {
    default?: { wwObjects: Array<{ uid: string; isWwObject: true }> };
    mobile?: { wwObjects: Array<{ uid: string; isWwObject: true }> };
    tablet?: { wwObjects: Array<{ uid: string; isWwObject: true }> };
  };
}

// Minimal shape; full object is used by parseObjects.ts
interface WeWebObject {
  uid: string;
  name: string | null;
  wwObjectBaseId: string;
  libraryComponentBaseId: string | null;
  parentSectionId: string | null;
}

interface WeWebVariable {
  id: string;
  name: string;
  type: VariableEntry['type'];
  defaultValue?: unknown;
  isLocalStorage?: boolean;
  isPersistentOnNav?: boolean;
}

interface WeWebCollection {
  id: string;
  name: string;
  mode?: string;
  config?: { table?: string };
  pluginId?: string;
}

interface WeWebWorkflowEntry {
  id: string;
  name: string;
  trigger: string;
}

interface WeWebLibraryComponent {
  rootElementId: string;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Read a file via base64 shell command and parse its JSON.
 * Required because workflow code fields can contain backticks and special
 * characters that corrupt naive shell string interpolation.
 */
export async function readJsonFile<T>(shell: Shell, filePath: string): Promise<T> {
  const result = await shell.exec('bash', ['-c', `base64 < '${filePath}'`]);
  if (result.exit_code !== 0) {
    throw new Error(`Failed to read ${filePath}: ${result.stderr.trim()}`);
  }
  const json = atob(result.stdout.trim());
  return JSON.parse(json) as T;
}

/**
 * Normalize a WeWeb route string by replacing `{{param|}}` syntax with `[param]`.
 * Example: "animal-detail/{{param|}}" → "animal-detail/[param]"
 */
export function normalizeRoute(path: string): string {
  return path.replace(/\{\{([^|]+)\|[^}]*\}\}/g, '[$1]');
}

/**
 * Parse a single WeWeb page JSON into a ParsedPage.
 * Sections are returned with empty `components: []` arrays; the tree walker
 * (parseObjects.ts → buildComponentTree) populates them in a later step.
 *
 * @param pageJson  Raw parsed JSON object from data/{uuid}.json
 * @param pageId    The UUID filename (without .json) used as the page id
 */
export function parsePageData(pageJson: unknown, pageId: string): ParsedPage {
  const data = pageJson as WeWebPageData;

  // Route — authoritative source is data.page.paths.default
  const rawRoute = data?.page?.paths?.default ?? '';
  const route = normalizeRoute(rawRoute);
  const isDynamic = route.includes('[');

  // Sections — parse into ParsedSection stubs (components populated later)
  const sections: Record<string, ParsedSection> = {};
  const rawSections = data?.sections ?? {};
  for (const [uid, section] of Object.entries(rawSections)) {
    const style = section?._state?.style ?? {};
    const parsedSection: ParsedSection = {
      uid,
      sectionBaseId: section.sectionBaseId ?? '',
      title: section.sectionTitle ?? null,
      isShared: false, // populated later by detectShared
      styleDefault: (style.default as Record<string, unknown>) ?? {},
      styleMobile: style.mobile as Record<string, unknown> | undefined,
      styleTablet: style.tablet as Record<string, unknown> | undefined,
      components: [], // populated by tree walker
    };
    sections[uid] = parsedSection;
  }

  // Variables
  const variables: VariableEntry[] = (data?.variables ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    defaultValue: v.defaultValue ?? null,
    isLocalStorage: !!v.isLocalStorage,
    isPersistentOnNav: !!v.isPersistentOnNav,
  }));

  // Collections
  const collections: CollectionEntry[] = (data?.collections ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.mode === 'single' ? 'single' : 'list',
    table: c.config?.table ?? '',
    pluginId: c.pluginId ?? '',
  }));

  return {
    id: pageId,
    route,
    isDynamic,
    sections,
    variables,
    collections,
    workflows: [], // populated by Plan 04 (parseWorkflows)
  };
}
