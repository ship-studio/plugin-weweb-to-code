export interface DesignToken {
  uuid: string;
  value: string;
  type: 'font' | 'color' | 'dimension' | 'raw';
  // For font tokens: extracted size/weight/lineHeight
  fontSizePx?: number;
  fontWeight?: string;
  lineHeight?: string;
  // Inferred semantic label (set after classification)
  semanticLabel?: string; // e.g. "h1", "h2", "primary", "gray-50"
}

export interface DesignSystem {
  fonts: DesignToken[]; // sorted by fontSizePx desc; semanticLabel: h1-h6...
  colors: DesignToken[]; // deduplicated by hex value
  dimensions: DesignToken[];
  raw: DesignToken[];
  googleFontUrls: string[]; // from HTML <head> link tags
}
