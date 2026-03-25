import type { Shell } from '../types';
import type { ZipStep } from '../zip/types';
import type { SiteAnalysis, ParsedPage, VariableEntry, CollectionEntry } from './types';
import type { DesignSystem } from '../design/types';
import type { AssetManifest } from '../assets/types';
import { parseDesignTokens } from '../design/parseTokens';
import { extractGoogleFontUrls } from '../design/mapFonts';
import { parsePageData, readJsonFile } from './parsePages';
import { buildComponentTree } from './parseObjects';
import {
  parsePageWorkflows,
  parseElementInteractions,
  buildVariableIndex,
  parseVariables,
  parseCollections,
} from './parseWorkflows';
import { detectSharedSections } from './detectShared';
import { buildAssetManifest } from '../assets/buildManifest';
import { copyAssets } from '../assets/copy';

// ---------------------------------------------------------------------------
// Internal WeWeb manifest shape
// ---------------------------------------------------------------------------

interface WeWebManifest {
  name?: string;
  short_name?: string;
}

// Minimal page JSON shape for orchestration — full shape is in parsePages.ts
interface WeWebPageJson {
  page: {
    id: string;
    paths: { en: string; default: string };
    workflows?: unknown[];
  };
  sections: Record<string, unknown>;
  wwObjects: Record<string, unknown>;
  variables?: Array<{ id: string; name: string }>;
  workflows?: unknown[];
  collections?: unknown[];
  libraryComponents?: Array<{ rootElementId: string }>;
}

// ---------------------------------------------------------------------------
// Internal: count all ParsedObjects recursively across a tree
// ---------------------------------------------------------------------------

function countObjects(objects: import('./types').ParsedObject[]): number {
  let total = 0;
  for (const obj of objects) {
    total += 1 + countObjects(obj.children);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Internal: collect all ParsedObjects in a subtree (for interaction walking)
// ---------------------------------------------------------------------------

function flattenObjects(
  objects: import('./types').ParsedObject[],
): import('./types').ParsedObject[] {
  const result: import('./types').ParsedObject[] = [];
  for (const obj of objects) {
    result.push(obj);
    result.push(...flattenObjects(obj.children));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public: analyzeSite
// ---------------------------------------------------------------------------

/**
 * Full analysis pipeline orchestrator.
 *
 * Steps:
 * 1. Read HTML shell via base64 → parse design tokens + Google Font URLs
 * 2. Read manifest.json for site name
 * 3. Discover data/*.json page files from ZIP entries
 * 4. Parse each page JSON → ParsedPage stubs
 * 5. Build component trees for each section (prongs 1 + 2 + 3)
 * 6. Parse workflows and element interactions per page
 * 7. Detect shared layout sections across all pages
 * 8. Build asset manifest and copy assets to .shipstudio/assets/
 * 9. Aggregate and return SiteAnalysis + DesignSystem + AssetManifest
 *
 * @param shell        Ship Studio Shell abstraction
 * @param extractDir   Path to the extracted ZIP directory
 * @param entries      ZIP entry list from ZipManifest.entries
 * @param projectPath  Absolute path to the target project root
 * @param onProgress   Callback for step-by-step UI progress updates
 */
export async function analyzeSite(
  shell: Shell,
  extractDir: string,
  entries: string[],
  projectPath: string,
  onProgress: (step: ZipStep) => void,
  /** Data file prefix discovered during validation (e.g., 'data/', 'public/data/') */
  dataPrefix: string = 'data/',
  /** HTML shell path discovered during validation (e.g., 'index.html', 'public/front.html') */
  htmlShell: string = 'index.html',
): Promise<{ siteAnalysis: SiteAnalysis; designSystem: DesignSystem; assetManifest: AssetManifest }> {

  // -------------------------------------------------------------------------
  // Step 1: Read HTML shell and extract design tokens
  // -------------------------------------------------------------------------
  onProgress({ kind: 'analyzing', pageCount: 0 });

  const htmlResult = await shell.exec('bash', ['-c', `base64 < '${extractDir}/${htmlShell}'`]);
  if (htmlResult.exit_code !== 0) {
    throw new Error(`Failed to read ${htmlShell}: ${htmlResult.stderr.trim()}`);
  }
  const html = atob(htmlResult.stdout.trim());
  const designSystem = parseDesignTokens(html);
  const googleFontUrls = extractGoogleFontUrls(html);
  designSystem.googleFontUrls = googleFontUrls;

  // -------------------------------------------------------------------------
  // Step 2: Read manifest.json for site name
  // -------------------------------------------------------------------------
  // manifest.json may be at root or under public/
  const manifestPath = entries.includes('manifest.json')
    ? `${extractDir}/manifest.json`
    : `${extractDir}/public/manifest.json`;
  const manifest = await readJsonFile<WeWebManifest>(shell, manifestPath);
  const siteName = manifest.name ?? manifest.short_name ?? 'Unnamed Site';

  // -------------------------------------------------------------------------
  // Step 3: Discover data/*.json page files
  // -------------------------------------------------------------------------
  const pageEntries = entries.filter(
    (e) => e.startsWith(dataPrefix) && e.endsWith('.json') && !e.endsWith('/'),
  );
  const pageIds = pageEntries.map((e) =>
    e.slice(dataPrefix.length, -'.json'.length),
  );

  // -------------------------------------------------------------------------
  // Steps 4-6: Parse pages, build trees, parse workflows
  // -------------------------------------------------------------------------
  const allParsedPages: ParsedPage[] = [];
  let parsedSoFar = 0;

  for (const pageId of pageIds) {
    onProgress({ kind: 'analyzing', pageCount: parsedSoFar });

    // Read and parse page JSON
    const pageJson = await readJsonFile<WeWebPageJson>(
      shell,
      `${extractDir}/${dataPrefix}${pageId}.json`,
    );
    const parsedPage = parsePageData(pageJson, pageId);

    // Build parentSectionIndex: Map<sectionUid, childUids[]> for prong 2
    const parentSectionIndex = new Map<string, string[]>();
    const wwObjects = pageJson.wwObjects ?? {};
    for (const [uid, obj] of Object.entries(wwObjects)) {
      const rawObj = obj as { parentSectionId?: string | null };
      const parentId = rawObj.parentSectionId;
      if (parentId) {
        if (!parentSectionIndex.has(parentId)) {
          parentSectionIndex.set(parentId, []);
        }
        parentSectionIndex.get(parentId)!.push(uid);
      }
    }

    // Shared visited set for cycle detection across all sections on this page
    const visited = new Set<string>();

    // Prong 1 + 2: Build component tree for each section
    const rawSections = pageJson.sections ?? {};
    for (const [sectionUid, rawSection] of Object.entries(rawSections)) {
      const parsedSection = parsedPage.sections[sectionUid];
      if (!parsedSection) continue;

      const components = buildComponentTree(
        rawSection as Parameters<typeof buildComponentTree>[0],
        wwObjects as Record<string, unknown>,
        parentSectionIndex,
        visited,
      );
      parsedSection.components = components;
    }

    // Prong 3: Walk libraryComponent roots at page level
    const libRoots = pageJson.libraryComponents ?? [];
    for (const libComp of libRoots) {
      const rootUid = libComp.rootElementId;
      if (!rootUid || visited.has(rootUid)) continue;
      // Library roots are stand-alone; they don't belong to a specific section
      // Walk them just for cycle detection and completeness — not added to sections
      buildComponentTree(
        { uid: '__lib_root__', content: { default: { wwObjects: [{ uid: rootUid, isWwObject: true }] } } },
        wwObjects as Record<string, unknown>,
        new Map(),
        visited,
      );
    }

    // Parse workflows + interactions
    const variables = pageJson.variables ?? [];
    const variableIndex = buildVariableIndex(variables);

    // page.page.workflows (NOT pageJson.workflows which is always empty)
    const pageWorkflows = parsePageWorkflows(
      pageJson.page.workflows ?? [],
      parsedPage.route,
      variableIndex,
    );
    parsedPage.workflows = pageWorkflows;

    // Element interactions: walk all ParsedObjects in the tree
    for (const section of Object.values(parsedPage.sections)) {
      const allObjects = flattenObjects(section.components);
      for (const parsedObj of allObjects) {
        // Get raw interactions from the wwObject
        const rawObj = wwObjects[parsedObj.uid] as
          | { _state?: { interactions?: unknown[] } }
          | undefined;
        const interactions = rawObj?._state?.interactions ?? [];
        if (interactions.length > 0) {
          parsedObj.interactions = parseElementInteractions(
            interactions,
            parsedObj.name ?? parsedObj.uid,
            variableIndex,
          );
        }
      }
    }

    // Populate variables and collections on the page
    parsedPage.variables = parseVariables(variables);
    parsedPage.collections = parseCollections(pageJson.collections ?? []);

    allParsedPages.push(parsedPage);
    parsedSoFar += 1;
  }

  // Final page count progress update
  onProgress({ kind: 'analyzing', pageCount: parsedSoFar });

  // -------------------------------------------------------------------------
  // Step 7: Detect shared layout sections
  // -------------------------------------------------------------------------
  const sharedSections = detectSharedSections(allParsedPages);

  // -------------------------------------------------------------------------
  // Step 8: Build asset manifest and copy assets
  // -------------------------------------------------------------------------
  const assetManifest = buildAssetManifest(entries, designSystem.googleFontUrls);

  onProgress({ kind: 'copying', label: 'Copying assets...' });
  await copyAssets(shell, extractDir, projectPath);

  // -------------------------------------------------------------------------
  // Step 9: Aggregate and return
  // -------------------------------------------------------------------------

  // Deduplicate variables across all pages by id
  const variableSeenIds = new Set<string>();
  const allVariables: VariableEntry[] = [];
  for (const page of allParsedPages) {
    for (const v of page.variables) {
      if (!variableSeenIds.has(v.id)) {
        variableSeenIds.add(v.id);
        allVariables.push(v);
      }
    }
  }

  // Deduplicate collections across all pages by id
  const collectionSeenIds = new Set<string>();
  const allCollections: CollectionEntry[] = [];
  for (const page of allParsedPages) {
    for (const c of page.collections) {
      if (!collectionSeenIds.has(c.id)) {
        collectionSeenIds.add(c.id);
        allCollections.push(c);
      }
    }
  }

  // Count total components recursively across all pages and sections
  let totalComponentCount = 0;
  for (const page of allParsedPages) {
    for (const section of Object.values(page.sections)) {
      totalComponentCount += countObjects(section.components);
    }
  }

  const siteAnalysis: SiteAnalysis = {
    siteName,
    pages: allParsedPages,
    sharedSections,
    allVariables,
    allCollections,
    totalComponentCount,
  };

  return { siteAnalysis, designSystem, assetManifest };
}
