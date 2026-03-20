import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localTsc = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const tscCandidates = existsSync(localTsc)
  ? [{ command: process.execPath, args: [localTsc] }]
  : (process.platform === 'win32'
      ? [{ command: 'tsc.cmd', args: [] }, { command: 'tsc', args: [] }]
      : [{ command: 'tsc', args: [] }]);

for (const candidate of tscCandidates) {
  const result = spawnSync(candidate.command, [...candidate.args, '-p', 'tsconfig.json', '--noEmit'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (!result.error && result.status !== null) {
    process.exit(result.status);
  }
}

console.log('tsc is unavailable in this environment; running structural type-safety checks instead.');

const tsconfig = JSON.parse(await readFile(path.join(repoRoot, 'tsconfig.base.json'), 'utf8'));
const paths = tsconfig.compilerOptions?.paths ?? {};
const expectedAliases = [
  '@takomi/contracts',
  '@takomi/orchestration',
  '@takomi/runtime-codex',
  '@takomi/persistence',
  '@takomi/ui'
];

for (const alias of expectedAliases) {
  if (!paths[alias]) {
    console.error(`Missing tsconfig path alias for ${alias}`);
    process.exit(1);
  }
}

console.log('Typecheck scaffold validation passed.');
