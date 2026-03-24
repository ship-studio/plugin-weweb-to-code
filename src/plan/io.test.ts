// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import type { MigrationPlan } from './types';
import { saveMigrationPlan } from './io';

function makeMockShell(exitCode = 0, stderr = '') {
  return {
    exec: vi.fn().mockResolvedValue({
      exit_code: exitCode,
      stdout: '',
      stderr,
    }),
  };
}

const mockPlan: MigrationPlan = {
  version: '1.0' as const,
  generatedAt: '2026-03-24',
  items: [{ name: 'Shared Nav', type: 'shared' as const, status: 'pending' as const }],
};

describe('saveMigrationPlan', () => {
  it('Test 1: calls shell.exec with bash as first arg and includes mkdir -p and base64 -d', async () => {
    const shell = makeMockShell();
    await saveMigrationPlan(shell, '/tmp/project', mockPlan);
    expect(shell.exec).toHaveBeenCalledWith('bash', expect.any(Array));
    const args = shell.exec.mock.calls[0][1] as string[];
    const cmd = args[1];
    expect(cmd).toContain('mkdir -p');
    expect(cmd).toContain('base64 -d');
    expect(cmd).toContain('/tmp/project/.shipstudio/migration-plan.json');
  });

  it('Test 2: throws on non-zero exit code', async () => {
    const shell = makeMockShell(1, 'disk full');
    await expect(saveMigrationPlan(shell, '/tmp/project', mockPlan)).rejects.toThrow(
      'Failed to save migration plan',
    );
  });
});
