import type { AssetEntry, AssetManifest } from './types';

/**
 * Builds an asset manifest from ZIP entry strings and Google Font URLs.
 *
 * Filters entries by prefix:
 * - `images/` → images list (skips directory entries ending with "/")
 * - `icons/` → icons list (includes `icons/lucide/...` subdirectory, skips directory entries)
 * - `assets/` → EXCLUDED (compiled JS/CSS bundles)
 *
 * @param entries  - Array of ZIP entry path strings (e.g. from ZipManifest.entries)
 * @param googleFontUrls - Google Font CSS URLs to pass through into the manifest
 */
export function buildAssetManifest(
  entries: string[],
  googleFontUrls: string[],
): AssetManifest {
  const images: AssetEntry[] = entries
    .filter((e) => e.startsWith('images/') && !e.endsWith('/'))
    .map((e) => ({
      filename: e.split('/').pop()!,
      projectRelativePath: `.shipstudio/assets/${e}`,
    }));

  const icons: AssetEntry[] = entries
    .filter((e) => e.startsWith('icons/') && !e.endsWith('/'))
    .map((e) => ({
      filename: e.split('/').pop()!,
      projectRelativePath: `.shipstudio/assets/${e}`,
    }));

  return {
    images,
    icons,
    googleFonts: googleFontUrls,
    totalCopied: images.length + icons.length,
  };
}
