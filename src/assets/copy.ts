import type { Shell } from '../types';

/**
 * Copies images/ and icons/ directories from an extracted WeWeb ZIP to
 * `.shipstudio/assets/` within the project path.
 *
 * Behaviour:
 * - Creates destination directories unconditionally (`mkdir -p`)
 * - Checks source directory existence before attempting copy
 * - Uses `cp -r` for recursive copy (handles icons/lucide/ subdirectory)
 * - Does NOT throw if source directories are missing — WeWeb exports may not
 *   always include both images and icons
 *
 * @param shell       - Ship Studio Shell abstraction for executing commands
 * @param extractDir  - Path to the extracted ZIP contents
 * @param projectPath - Absolute path to the target project root
 */
export async function copyAssets(
  shell: Shell,
  extractDir: string,
  projectPath: string,
): Promise<void> {
  // Create destination directories
  await shell.exec('mkdir', ['-p', `${projectPath}/.shipstudio/assets/images`]);
  await shell.exec('mkdir', ['-p', `${projectPath}/.shipstudio/assets/icons`]);

  // Copy images/ if it exists
  const imgCheck = await shell.exec('bash', [
    '-c',
    `test -d '${extractDir}/images' && echo exists || echo none`,
  ]);
  if (imgCheck.stdout.trim() === 'exists') {
    await shell.exec('bash', [
      '-c',
      `cp -r '${extractDir}/images/'* '${projectPath}/.shipstudio/assets/images/' 2>/dev/null || true`,
    ]);
  }

  // Copy icons/ if it exists (includes lucide/ subdirectory)
  const iconCheck = await shell.exec('bash', [
    '-c',
    `test -d '${extractDir}/icons' && echo exists || echo none`,
  ]);
  if (iconCheck.stdout.trim() === 'exists') {
    await shell.exec('bash', [
      '-c',
      `cp -r '${extractDir}/icons/'* '${projectPath}/.shipstudio/assets/icons/' 2>/dev/null || true`,
    ]);
  }
}
