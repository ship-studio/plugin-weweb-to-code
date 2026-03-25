import type { Shell } from '../types';
import type { ZipManifest } from './types';

/**
 * Parses `unzip -l` stdout to extract file count and entry list.
 * Uses regex column matching — NOT .split(' ') — to handle filenames with spaces.
 */
export function parseUnzipManifest(stdout: string): ZipManifest {
  const lines = stdout.split('\n');
  const entries: string[] = [];

  for (const line of lines) {
    // Skip header, separator, and summary lines
    if (line.match(/^-{5,}/) || line.match(/Length\s+Date/) || line.trim() === '') continue;
    // Filename is everything after the date/time columns
    const match = line.match(/^\s*\d+\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/);
    if (match) entries.push(match[1].trim());
  }

  // Count only actual files (exclude directory entries ending with /)
  const fileEntries = entries.filter((e) => !e.endsWith('/'));
  const fileCount = fileEntries.length;

  return { fileCount, entries };
}

/**
 * Known data path prefixes in WeWeb exports.
 * Different export types put data/*.json at different locations:
 *   - Built export (from WeWeb editor): data/*.json
 *   - Built export (alternative): public/data/*.json
 *   - Raw export: public/public/data/*.json
 */
const DATA_PREFIXES = ['data/', 'public/data/', 'public/public/data/'];

/**
 * Known HTML shell locations in WeWeb exports.
 *   - Built export: index.html
 *   - Raw export: public/front.html
 */
const HTML_CANDIDATES = ['index.html', 'public/front.html', 'public/index.html'];

/**
 * Finds the data directory prefix used in this export.
 * Returns the prefix (e.g., 'data/', 'public/data/') or null if not found.
 */
export function findDataPrefix(entries: string[]): string | null {
  for (const prefix of DATA_PREFIXES) {
    if (entries.some((e) => e.startsWith(prefix) && e.endsWith('.json'))) {
      return prefix;
    }
  }
  return null;
}

/**
 * Finds the HTML shell file used in this export.
 * Returns the path (e.g., 'index.html', 'public/front.html') or null if not found.
 */
export function findHtmlShell(entries: string[]): string | null {
  for (const candidate of HTML_CANDIDATES) {
    if (entries.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Validates that an extracted directory contains a WeWeb export.
 * Checks 4 fingerprints in cheapness order, supporting multiple export formats:
 * 1. data/*.json files exist at any known prefix (in-memory entries scan)
 * 2. manifest.json exists at root or under public/ (in-memory entries scan)
 * 3. <div id="app"> present in HTML shell (shell exec)
 * 4. _wwcv= cache version parameter present in HTML shell (shell exec)
 *
 * Returns { dataPrefix, htmlShell } on success for use by the analysis pipeline.
 */
export async function validateWeWebExport(
  shell: Shell,
  extractDir: string,
  entries: string[],
): Promise<{ dataPrefix: string; htmlShell: string }> {
  // Check 1: data/*.json files exist at any known prefix
  const dataPrefix = findDataPrefix(entries);
  if (!dataPrefix) {
    throw new Error('No data/*.json files found — is this a WeWeb export?');
  }

  // Check 2: manifest.json exists (root or public/)
  const hasManifest = entries.some(
    (e) => e === 'manifest.json' || e === 'public/manifest.json',
  );
  if (!hasManifest) {
    throw new Error('No manifest.json found — is this a WeWeb export?');
  }

  // Find the HTML shell
  const htmlShell = findHtmlShell(entries);
  if (!htmlShell) {
    throw new Error('No index.html found — is this a WeWeb export?');
  }

  // Check 3: HTML shell contains <div id="app">
  const appResult = await shell.exec('bash', [
    '-c',
    `grep -c 'div id="app"' '${extractDir}/${htmlShell}' 2>/dev/null || echo 0`,
  ]);
  const appCount = parseInt(appResult.stdout.trim(), 10);
  if (appCount === 0) {
    throw new Error(
      'No <div id="app"> found in HTML — is this a WeWeb export?',
    );
  }

  // Check 4: _wwcv= cache version param (WeWeb-specific)
  const wwcvResult = await shell.exec('bash', [
    '-c',
    `grep -c '_wwcv=' '${extractDir}/${htmlShell}' 2>/dev/null || echo 0`,
  ]);
  const wwcvCount = parseInt(wwcvResult.stdout.trim(), 10);
  if (wwcvCount === 0) {
    throw new Error(
      'No _wwcv= version parameter found — is this a WeWeb export?',
    );
  }

  return { dataPrefix, htmlShell };
}
