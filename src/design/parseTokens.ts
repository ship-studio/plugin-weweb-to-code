import type { DesignToken, DesignSystem } from './types';

// Matches UUID-keyed CSS custom properties: --{uuid}: {value};
const TOKEN_REGEX =
  /--([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*:\s*([^;]+);/gi;

/**
 * Classifies a CSS token value into font, color, dimension, or raw.
 */
function classifyToken(value: string): 'font' | 'color' | 'dimension' | 'raw' {
  const v = value.trim();
  // Font composite: "500 64px/72px var(--ww-default-font-family, sans-serif)"
  if (/^\d+\s+\d+px\/\d+px\s/.test(v)) return 'font';
  // Hex color: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return 'color';
  // Dimension: 96px, -4px, 1.5rem, 100vh, 50%
  if (/^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(v)) return 'dimension';
  return 'raw';
}

/**
 * Extracts font size in px from a font composite value.
 * e.g. "500 64px/72px var(--ww-default-font-family)" -> 64
 */
function extractFontSizePx(value: string): number {
  const match = value.match(/\s(\d+)px\//);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Extracts font weight from a font composite value.
 * e.g. "500 64px/72px ..." -> "500"
 */
function extractFontWeight(value: string): string {
  const match = value.match(/^(\d+)\s/);
  return match ? match[1] : '';
}

/**
 * Extracts line height in px from a font composite value.
 * e.g. "500 64px/72px ..." -> "72"
 */
function extractLineHeight(value: string): string {
  const match = value.match(/px\/(\d+)px/);
  return match ? match[1] : '';
}

/**
 * Converts a hex color string to HSL values.
 * Returns { h, s, l } where h is 0-360, s and l are 0-100.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Normalize to 6-digit hex
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length > 6) {
    h = h.slice(0, 6); // strip alpha
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  let sat = 0;
  const light = (max + min) / 2;

  if (delta !== 0) {
    sat = delta / (1 - Math.abs(2 * light - 1));
    switch (max) {
      case r:
        hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / delta + 2) / 6;
        break;
      case b:
        hue = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return { h: hue * 360, s: sat * 100, l: light * 100 };
}

/**
 * Assigns semantic labels to color tokens by lightness and saturation.
 * Gray-scale (saturation < 10%) tokens get "gray-N" labels.
 * The highest-saturation cluster is labeled "primary", next "secondary", then "accent".
 */
function assignColorSemanticLabels(tokens: DesignToken[]): DesignToken[] {
  const grays: DesignToken[] = [];
  const saturated: DesignToken[] = [];

  for (const token of tokens) {
    const hsl = hexToHsl(token.value);
    if (hsl.s < 10) {
      grays.push({ ...token, _lightness: hsl.l } as DesignToken & { _lightness: number });
    } else {
      saturated.push({ ...token, _saturation: hsl.s, _hue: hsl.h } as DesignToken & {
        _saturation: number;
        _hue: number;
      });
    }
  }

  // Label grays by lightness ascending: gray-50 (lightest) to gray-900 (darkest)
  // Sort grays by lightness ascending
  const grayLabels = ['gray-50', 'gray-100', 'gray-200', 'gray-300', 'gray-400', 'gray-500', 'gray-600', 'gray-700', 'gray-800', 'gray-900'];
  const sortedGrays = [...grays].sort(
    (a, b) =>
      hexToHsl(a.value).l - hexToHsl(b.value).l,
  );

  const labeledGrays: DesignToken[] = sortedGrays.map((t, i) => ({
    ...t,
    semanticLabel: i < grayLabels.length ? grayLabels[i] : `gray-${i}`,
  }));

  // Cluster saturated colors by hue into groups (primary, secondary, accent)
  // Sort by saturation descending to find dominant hue clusters
  const sortedSaturated = [...saturated].sort(
    (a, b) =>
      hexToHsl(b.value).s - hexToHsl(a.value).s,
  );

  // Simple cluster assignment by hue proximity (within 30 degrees)
  const clusterLabels = ['primary', 'secondary', 'accent'];
  const clusters: number[] = new Array(sortedSaturated.length).fill(-1);
  const clusterCenters: number[] = [];

  for (let i = 0; i < sortedSaturated.length; i++) {
    const hue = hexToHsl(sortedSaturated[i].value).h;
    let foundCluster = -1;
    for (let c = 0; c < clusterCenters.length; c++) {
      const diff = Math.abs(hue - clusterCenters[c]);
      if (diff <= 30 || diff >= 330) {
        foundCluster = c;
        break;
      }
    }
    if (foundCluster === -1 && clusterCenters.length < 3) {
      clusterCenters.push(hue);
      foundCluster = clusterCenters.length - 1;
    }
    clusters[i] = foundCluster;
  }

  const labeledSaturated: DesignToken[] = sortedSaturated.map((t, i) => {
    const clusterIdx = clusters[i];
    return {
      ...t,
      semanticLabel: clusterIdx >= 0 && clusterIdx < clusterLabels.length
        ? clusterLabels[clusterIdx]
        : t.value,
    };
  });

  // Return in original order: grays first, then saturated
  const result: DesignToken[] = [];
  for (const original of tokens) {
    const gray = labeledGrays.find(g => g.uuid === original.uuid);
    if (gray) {
      result.push(gray);
      continue;
    }
    const sat = labeledSaturated.find(s => s.uuid === original.uuid);
    if (sat) {
      result.push(sat);
      continue;
    }
    result.push(original);
  }
  return result;
}

/**
 * Parses an HTML string containing WeWeb CSS design tokens.
 * Extracts all UUID-keyed CSS custom properties from :root blocks,
 * classifies them into font/color/dimension/raw buckets,
 * and applies semantic labels.
 */
export function parseDesignTokens(html: string): DesignSystem {
  const fonts: DesignToken[] = [];
  const colorsRaw: DesignToken[] = [];
  const dimensions: DesignToken[] = [];
  const raw: DesignToken[] = [];

  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(html)) !== null) {
    const uuid = match[1];
    const value = match[2].trim();
    const type = classifyToken(value);

    const token: DesignToken = { uuid, value, type };

    if (type === 'font') {
      token.fontSizePx = extractFontSizePx(value);
      token.fontWeight = extractFontWeight(value);
      token.lineHeight = extractLineHeight(value);
      fonts.push(token);
    } else if (type === 'color') {
      colorsRaw.push(token);
    } else if (type === 'dimension') {
      dimensions.push(token);
    } else {
      raw.push(token);
    }
  }

  // Sort fonts by fontSizePx descending
  fonts.sort((a, b) => (b.fontSizePx ?? 0) - (a.fontSizePx ?? 0));

  // Assign semantic labels to fonts: h1-h6 for top 6, body-N for the rest
  for (let i = 0; i < fonts.length; i++) {
    if (i < 6) {
      fonts[i].semanticLabel = `h${i + 1}`;
    } else {
      fonts[i].semanticLabel = `body-${i - 5}`;
    }
  }

  // Deduplicate colors by hex value (case-insensitive), keeping first occurrence
  const seenHex = new Set<string>();
  const colors: DesignToken[] = [];
  for (const token of colorsRaw) {
    const key = token.value.toLowerCase();
    if (!seenHex.has(key)) {
      seenHex.add(key);
      colors.push(token);
    }
  }

  // Assign semantic labels to colors
  const labeledColors = assignColorSemanticLabels(colors);

  return {
    fonts,
    colors: labeledColors,
    dimensions,
    raw,
    googleFontUrls: [],
  };
}
