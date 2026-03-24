import { describe, it, expect } from 'vitest';
import { parseDesignTokens } from './parseTokens';
import { extractGoogleFontUrls } from './mapFonts';

// Minimal UUID for tests
const uuid1 = '11111111-1111-1111-1111-111111111111';
const uuid2 = '22222222-2222-2222-2222-222222222222';
const uuid3 = '33333333-3333-3333-3333-333333333333';
const uuid4 = '44444444-4444-4444-4444-444444444444';
const uuid5 = '55555555-5555-5555-5555-555555555555';
const uuid6 = '66666666-6666-6666-6666-666666666666';
const uuid7 = '77777777-7777-7777-7777-777777777777';

describe('parseDesignTokens', () => {
  it('returns empty DesignSystem for empty input', () => {
    const result = parseDesignTokens('');
    expect(result.fonts).toEqual([]);
    expect(result.colors).toEqual([]);
    expect(result.dimensions).toEqual([]);
    expect(result.raw).toEqual([]);
    expect(result.googleFontUrls).toEqual([]);
  });

  it('returns empty DesignSystem for HTML with no :root block', () => {
    const result = parseDesignTokens('<html><head></head><body></body></html>');
    expect(result.fonts).toEqual([]);
    expect(result.colors).toEqual([]);
  });

  it('classifies font tokens correctly', () => {
    const html = `:root {
      --${uuid1}: 500 64px/72px var(--ww-default-font-family, sans-serif);
      --${uuid2}: 400 16px/24px var(--ww-default-font-family, sans-serif);
    }`;
    const result = parseDesignTokens(html);
    expect(result.fonts).toHaveLength(2);
    expect(result.fonts[0].type).toBe('font');
    expect(result.fonts[1].type).toBe('font');
  });

  it('extracts fontSizePx from font tokens', () => {
    const html = `:root { --${uuid1}: 500 64px/72px var(--ww-default-font-family, sans-serif); }`;
    const result = parseDesignTokens(html);
    expect(result.fonts[0].fontSizePx).toBe(64);
  });

  it('extracts fontWeight from font tokens', () => {
    const html = `:root { --${uuid1}: 700 48px/56px var(--ww-default-font-family, sans-serif); }`;
    const result = parseDesignTokens(html);
    expect(result.fonts[0].fontWeight).toBe('700');
  });

  it('extracts lineHeight from font tokens', () => {
    const html = `:root { --${uuid1}: 500 64px/72px var(--ww-default-font-family, sans-serif); }`;
    const result = parseDesignTokens(html);
    expect(result.fonts[0].lineHeight).toBe('72');
  });

  it('sorts font tokens by fontSizePx descending', () => {
    const html = `:root {
      --${uuid1}: 400 16px/24px var(--ww-default-font-family, sans-serif);
      --${uuid2}: 500 64px/72px var(--ww-default-font-family, sans-serif);
      --${uuid3}: 600 32px/40px var(--ww-default-font-family, sans-serif);
    }`;
    const result = parseDesignTokens(html);
    expect(result.fonts[0].fontSizePx).toBe(64);
    expect(result.fonts[1].fontSizePx).toBe(32);
    expect(result.fonts[2].fontSizePx).toBe(16);
  });

  it('assigns h1-h6 semantic labels to top 6 font tokens', () => {
    const uuids = [
      '11111111-1111-1111-1111-000000000001',
      '11111111-1111-1111-1111-000000000002',
      '11111111-1111-1111-1111-000000000003',
      '11111111-1111-1111-1111-000000000004',
      '11111111-1111-1111-1111-000000000005',
      '11111111-1111-1111-1111-000000000006',
      '11111111-1111-1111-1111-000000000007',
    ];
    const sizes = [72, 64, 48, 36, 24, 18, 14];
    const lines = uuids
      .map((u, i) => `--${u}: 500 ${sizes[i]}px/${sizes[i] + 8}px var(--ww-default-font-family, sans-serif);`)
      .join('\n');
    const html = `:root { ${lines} }`;
    const result = parseDesignTokens(html);
    expect(result.fonts[0].semanticLabel).toBe('h1');
    expect(result.fonts[1].semanticLabel).toBe('h2');
    expect(result.fonts[2].semanticLabel).toBe('h3');
    expect(result.fonts[3].semanticLabel).toBe('h4');
    expect(result.fonts[4].semanticLabel).toBe('h5');
    expect(result.fonts[5].semanticLabel).toBe('h6');
    expect(result.fonts[6].semanticLabel).toBe('body-1');
  });

  it('classifies color tokens correctly', () => {
    const html = `:root {
      --${uuid1}: #FF0000;
      --${uuid2}: #abc;
      --${uuid3}: #AABBCCDD;
    }`;
    const result = parseDesignTokens(html);
    expect(result.colors).toHaveLength(3);
    expect(result.colors.every(c => c.type === 'color')).toBe(true);
  });

  it('deduplicates color tokens by hex value (case-insensitive)', () => {
    const html = `:root {
      --${uuid1}: #FF0000;
      --${uuid2}: #ff0000;
      --${uuid3}: #FF0000;
    }`;
    const result = parseDesignTokens(html);
    expect(result.colors).toHaveLength(1);
  });

  it('keeps distinct color tokens when hex values differ', () => {
    const html = `:root {
      --${uuid1}: #FF0000;
      --${uuid2}: #00FF00;
      --${uuid3}: #0000FF;
    }`;
    const result = parseDesignTokens(html);
    expect(result.colors).toHaveLength(3);
  });

  it('classifies dimension tokens correctly', () => {
    const html = `:root {
      --${uuid1}: 16px;
      --${uuid2}: 1.5rem;
      --${uuid3}: 100vh;
      --${uuid4}: 50%;
      --${uuid5}: -4px;
    }`;
    const result = parseDesignTokens(html);
    expect(result.dimensions).toHaveLength(5);
    expect(result.dimensions.every(d => d.type === 'dimension')).toBe(true);
  });

  it('puts unclassified values in raw array', () => {
    const html = `:root {
      --${uuid1}: some-other-value;
    }`;
    const result = parseDesignTokens(html);
    expect(result.raw).toHaveLength(1);
    expect(result.raw[0].type).toBe('raw');
  });

  it('stores uuid correctly on tokens', () => {
    const html = `:root { --${uuid1}: #AABBCC; }`;
    const result = parseDesignTokens(html);
    expect(result.colors[0].uuid).toBe(uuid1);
  });

  it('only matches UUID-keyed CSS vars, not arbitrary vars', () => {
    const html = `:root {
      --ww-default-font-family: sans-serif;
      --primary-color: blue;
      --${uuid1}: #FF0000;
    }`;
    const result = parseDesignTokens(html);
    // Only the UUID-keyed var should be matched
    expect(result.colors).toHaveLength(1);
    expect(result.raw).toHaveLength(0);
  });
});

describe('extractGoogleFontUrls', () => {
  it('returns empty array for empty input', () => {
    expect(extractGoogleFontUrls('')).toEqual([]);
  });

  it('extracts Google Font URLs from HTML', () => {
    const html = `<html><head>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap">
    </head></html>`;
    const result = extractGoogleFontUrls(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('fonts.googleapis.com/css2');
    expect(result[1]).toContain('fonts.googleapis.com/css2');
  });

  it('deduplicates identical Google Font URLs', () => {
    const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap';
    const html = `<link href="${url}"><link href="${url}">`;
    const result = extractGoogleFontUrls(html);
    expect(result).toHaveLength(1);
  });

  it('extracts URLs from quoted and unquoted contexts', () => {
    const html = `
      href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
    `;
    const result = extractGoogleFontUrls(html);
    expect(result).toHaveLength(1);
  });

  it('does not match non-Google font URLs', () => {
    const html = `
      <link href="https://fonts.example.com/css2?family=Test">
      <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap">
    `;
    const result = extractGoogleFontUrls(html);
    expect(result).toHaveLength(1);
  });
});
