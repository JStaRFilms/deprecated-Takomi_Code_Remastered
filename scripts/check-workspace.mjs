import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredPaths = [
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'tsconfig.json',
  'apps/desktop/package.json',
  'apps/web/package.json',
  'apps/local-bridge/package.json',
  'packages/contracts/package.json',
  'packages/orchestration/package.json',
  'packages/runtime-codex/package.json',
  'packages/persistence/package.json',
  'packages/ui/package.json'
];

const problems = [];

for (const relativePath of requiredPaths) {
  try {
    await readFile(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    problems.push(`missing ${relativePath}`);
  }
}

if (problems.length > 0) {
  console.error('Workspace check failed:');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

const workspace = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const scripts = workspace.scripts ?? {};

for (const name of ['dev:desktop', 'dev:web', 'dev:web-local', 'typecheck', 'lint', 'format', 'verify']) {
  if (typeof scripts[name] !== 'string' || scripts[name].length === 0) {
    problems.push(`missing root script ${name}`);
  }
}

if (problems.length > 0) {
  console.error('Workspace check failed:');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log('Workspace structure looks consistent.');
