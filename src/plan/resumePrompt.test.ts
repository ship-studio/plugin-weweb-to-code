import { describe, it, expect } from 'vitest';
import { buildResumePrompt } from './resumePrompt';

describe('buildResumePrompt', () => {
  it('Test 10: returns string containing migration-plan.json and brief.md', () => {
    const result = buildResumePrompt('/project');
    expect(result).toContain('migration-plan.json');
    expect(result).toContain('brief.md');
  });

  it('includes the full migration plan path with projectPath', () => {
    const result = buildResumePrompt('/Users/alice/my-project');
    expect(result).toContain('/Users/alice/my-project/.shipstudio/migration-plan.json');
  });

  it('includes the full brief path with projectPath', () => {
    const result = buildResumePrompt('/Users/alice/my-project');
    expect(result).toContain('/Users/alice/my-project/.shipstudio/assets/brief.md');
  });

  it('instructs the agent to continue', () => {
    const result = buildResumePrompt('/project');
    expect(result.toLowerCase()).toMatch(/continue/);
  });

  it('uses projectPath in both file references', () => {
    const result = buildResumePrompt('/home/bob/site');
    expect(result).toContain('/home/bob/site/.shipstudio/migration-plan.json');
    expect(result).toContain('/home/bob/site/.shipstudio/assets/brief.md');
  });

  it('is a synchronous pure function — same output for same input', () => {
    const r1 = buildResumePrompt('/project');
    const r2 = buildResumePrompt('/project');
    expect(r1).toBe(r2);
  });
});
