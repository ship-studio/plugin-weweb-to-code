/**
 * Extracts Google Fonts API URLs from an HTML string.
 * Matches URLs of the form: https://fonts.googleapis.com/css2...
 * Returns unique URLs only.
 */
export function extractGoogleFontUrls(html: string): string[] {
  const regex = /https?:\/\/fonts\.googleapis\.com\/css2[^"'\s)]+/g;
  const matches = html.match(regex) ?? [];
  // Deduplicate
  return [...new Set(matches)];
}
