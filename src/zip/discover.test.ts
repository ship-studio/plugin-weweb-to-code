import { describe, it, expect, vi } from 'vitest';
import type { Shell } from '../types';
import { parseUnzipManifest, validateWeWebExport, findDataPrefix, findHtmlShell } from './discover';

const SAMPLE_UNZIP_OUTPUT = `  Archive:  test.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
     1234  03-24-2026 12:00   index.html
     5678  03-24-2026 12:00   data/page1.json
        0  03-24-2026 12:00   data/
     9012  03-24-2026 12:00   manifest.json
---------                     -------
    15924                     4 files
`;

function createMockShell(
  responses: Array<{ exit_code: number; stdout: string; stderr: string }>,
): Shell {
  let callIndex = 0;
  return {
    exec: vi.fn(async () => {
      const response = responses[callIndex];
      if (!response) throw new Error(`Unexpected shell.exec call #${callIndex}`);
      callIndex++;
      return response;
    }),
  };
}

const validWeWebEntries = [
  'data/1dbf82d5-fa49-4d1a-94d9-27fad844ffa9.json',
  'data/2eeedd11-dc0b-4814-bd65-65a6e7fd6e75.json',
  'manifest.json',
  'index.html',
  'assets/main-6NaVb4ET.js',
  'images/logo.png',
];

describe('parseUnzipManifest', () => {
  it('parses valid unzip -l output into { fileCount, entries }', () => {
    const result = parseUnzipManifest(SAMPLE_UNZIP_OUTPUT);
    // 4 entries total, but data/ is a directory entry — 3 actual files
    expect(result.fileCount).toBe(3);
    expect(result.entries).toHaveLength(4);
    expect(result.entries).toContain('index.html');
    expect(result.entries).toContain('data/page1.json');
    expect(result.entries).toContain('manifest.json');
    expect(result.entries).toContain('data/');
  });

  it('returns fileCount 0 for empty input', () => {
    const result = parseUnzipManifest('');
    expect(result.fileCount).toBe(0);
    expect(result.entries).toHaveLength(0);
  });
});

describe('findDataPrefix', () => {
  it('finds data/ at root level', () => {
    expect(findDataPrefix(['data/page.json', 'index.html'])).toBe('data/');
  });

  it('finds public/data/ prefix', () => {
    expect(findDataPrefix(['public/data/page.json', 'index.html'])).toBe('public/data/');
  });

  it('finds public/public/data/ prefix (raw export)', () => {
    expect(findDataPrefix(['public/public/data/page.json', 'public/front.html'])).toBe('public/public/data/');
  });

  it('returns null when no data files found', () => {
    expect(findDataPrefix(['index.html', 'manifest.json'])).toBeNull();
  });
});

describe('findHtmlShell', () => {
  it('finds index.html at root', () => {
    expect(findHtmlShell(['index.html', 'data/page.json'])).toBe('index.html');
  });

  it('finds public/front.html (raw export)', () => {
    expect(findHtmlShell(['public/front.html', 'public/public/data/page.json'])).toBe('public/front.html');
  });

  it('returns null when no HTML shell found', () => {
    expect(findHtmlShell(['data/page.json', 'manifest.json'])).toBeNull();
  });
});

describe('validateWeWebExport', () => {
  it('returns { dataPrefix, htmlShell } for valid entries + shell responses', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '1', stderr: '' }, // grep div#app returns 1
      { exit_code: 0, stdout: '2', stderr: '' }, // grep _wwcv= returns 2
    ]);
    const result = await validateWeWebExport(shell, '/tmp/out', validWeWebEntries);
    expect(result).toEqual({ dataPrefix: 'data/', htmlShell: 'index.html' });
  });

  it('works with public/data/ prefix (built export variant)', async () => {
    const entries = [
      'public/data/page1.json',
      'manifest.json',
      'index.html',
    ];
    const shell = createMockShell([
      { exit_code: 0, stdout: '1', stderr: '' },
      { exit_code: 0, stdout: '1', stderr: '' },
    ]);
    const result = await validateWeWebExport(shell, '/tmp/out', entries);
    expect(result).toEqual({ dataPrefix: 'public/data/', htmlShell: 'index.html' });
  });

  it('works with raw export format (public/public/data/ + public/front.html)', async () => {
    const entries = [
      'public/public/data/page1.json',
      'public/manifest.json',
      'public/front.html',
    ];
    const shell = createMockShell([
      { exit_code: 0, stdout: '1', stderr: '' },
      { exit_code: 0, stdout: '1', stderr: '' },
    ]);
    const result = await validateWeWebExport(shell, '/tmp/out', entries);
    expect(result).toEqual({ dataPrefix: 'public/public/data/', htmlShell: 'public/front.html' });
  });

  it('throws "No data/*.json files found" when no data/ entries at any prefix', async () => {
    const entries = ['manifest.json', 'index.html', 'assets/main.js'];
    const shell = createMockShell([]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', entries),
    ).rejects.toThrow('No data/*.json files found — is this a WeWeb export?');
  });

  it('throws "No manifest.json found" when manifest.json missing', async () => {
    const entries = [
      'data/1dbf82d5-fa49-4d1a-94d9-27fad844ffa9.json',
      'index.html',
      'assets/main.js',
    ];
    const shell = createMockShell([]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', entries),
    ).rejects.toThrow('No manifest.json found — is this a WeWeb export?');
  });

  it('throws when grep div#app returns 0', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '0', stderr: '' },
    ]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', validWeWebEntries),
    ).rejects.toThrow('No <div id="app"> found in HTML — is this a WeWeb export?');
  });

  it('throws when _wwcv grep returns 0', async () => {
    const shell = createMockShell([
      { exit_code: 0, stdout: '1', stderr: '' }, // div#app found
      { exit_code: 0, stdout: '0', stderr: '' }, // _wwcv= not found
    ]);
    await expect(
      validateWeWebExport(shell, '/tmp/out', validWeWebEntries),
    ).rejects.toThrow('No _wwcv= version parameter found — is this a WeWeb export?');
  });
});
