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
 * Validates that an extracted directory contains a WeWeb export.
 * Checks 4 fingerprints in cheapness order:
 * 1. data/*.json files exist (in-memory entries scan)
 * 2. manifest.json exists (in-memory entries scan)
 * 3. <div id="app"> present in index.html (shell exec)
 * 4. _wwcv= cache version parameter present in index.html (shell exec)
 */
export async function validateWeWebExport(
  shell: Shell,
  extractDir: string,
  entries: string[],
): Promise<void> {
  // Check 1 (cheapest -- in-memory entries scan): data/*.json files exist
  const hasDataJson = entries.some(
    (e) => e.startsWith('data/') && e.endsWith('.json'),
  );
  if (!hasDataJson) {
    throw new Error('No data/*.json files found — is this a WeWeb export?');
  }

  // Check 2 (cheapest -- in-memory entries scan): manifest.json exists
  const hasManifest = entries.some((e) => e === 'manifest.json');
  if (!hasManifest) {
    throw new Error('No manifest.json found — is this a WeWeb export?');
  }

  // Check 3 (shell exec): HTML shell contains <div id="app">
  const appResult = await shell.exec('bash', [
    '-c',
    `grep -c 'div id="app"' '${extractDir}/index.html' 2>/dev/null || echo 0`,
  ]);
  const appCount = parseInt(appResult.stdout.trim(), 10);
  if (appCount === 0) {
    throw new Error(
      'No <div id="app"> found in index.html — is this a WeWeb export?',
    );
  }

  // Check 4 (shell exec): _wwcv= cache version param (WeWeb-specific)
  const wwcvResult = await shell.exec('bash', [
    '-c',
    `grep -c '_wwcv=' '${extractDir}/index.html' 2>/dev/null || echo 0`,
  ]);
  const wwcvCount = parseInt(wwcvResult.stdout.trim(), 10);
  if (wwcvCount === 0) {
    throw new Error(
      'No _wwcv= version parameter found — is this a WeWeb export?',
    );
  }
}
