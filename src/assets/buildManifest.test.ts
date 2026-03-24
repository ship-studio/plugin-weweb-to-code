import { describe, it, expect } from 'vitest';
import { buildAssetManifest } from './buildManifest';

describe('buildAssetManifest', () => {
  const sampleEntries = [
    'images/',
    'images/photo.jpg',
    'images/logo.png',
    'icons/',
    'icons/close.svg',
    'icons/lucide/',
    'icons/lucide/arrow.svg',
  ];
  const googleFonts = ['https://fonts.googleapis.com/css2?family=Work+Sans'];

  it('correctly enumerates images and icons, excluding directory entries', () => {
    const manifest = buildAssetManifest(sampleEntries, googleFonts);
    expect(manifest.images.length).toBe(2);
    expect(manifest.icons.length).toBe(2);
    expect(manifest.totalCopied).toBe(4);
    expect(manifest.googleFonts.length).toBe(1);
  });

  it('sets correct projectRelativePath for image entries', () => {
    const manifest = buildAssetManifest(sampleEntries, googleFonts);
    expect(manifest.images[0].projectRelativePath).toBe(
      '.shipstudio/assets/images/photo.jpg',
    );
    expect(manifest.images[0].filename).toBe('photo.jpg');
  });

  it('sets correct projectRelativePath for icon entries (including lucide/ subdirectory)', () => {
    const manifest = buildAssetManifest(sampleEntries, googleFonts);
    expect(manifest.icons[1].projectRelativePath).toBe(
      '.shipstudio/assets/icons/lucide/arrow.svg',
    );
    expect(manifest.icons[1].filename).toBe('arrow.svg');
  });

  it('returns empty manifest for empty entries', () => {
    const manifest = buildAssetManifest([], []);
    expect(manifest.images).toEqual([]);
    expect(manifest.icons).toEqual([]);
    expect(manifest.googleFonts).toEqual([]);
    expect(manifest.totalCopied).toBe(0);
  });

  it('does NOT include assets/ directory entries (compiled JS/CSS bundles)', () => {
    const entriesWithAssets = [
      'assets/bundle.js',
      'assets/styles.css',
      'images/photo.jpg',
    ];
    const manifest = buildAssetManifest(entriesWithAssets, []);
    expect(manifest.images.length).toBe(1);
    expect(manifest.icons.length).toBe(0);
    // assets/ entries are not in images or icons
    const allPaths = [
      ...manifest.images.map((e) => e.projectRelativePath),
      ...manifest.icons.map((e) => e.projectRelativePath),
    ];
    expect(allPaths.every((p) => !p.includes('assets/bundle'))).toBe(true);
  });
});
