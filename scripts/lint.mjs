import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const workspacePackages = [
  'apps/desktop/package.json',
  'apps/web/package.json',
  'apps/local-bridge/package.json',
  'packages/contracts/package.json',
  'packages/orchestration/package.json',
  'packages/runtime-codex/package.json',
  'packages/persistence/package.json',
  'packages/ui/package.json'
];

const issues = [];

if (packageJson.private !== true) {
  issues.push('root package.json must remain private');
}

for (const relativePath of workspacePackages) {
  const manifest = JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
  if (!manifest.name || typeof manifest.name !== 'string') {
    issues.push(`${relativePath} is missing a package name`);
  }
  if (!manifest.scripts || typeof manifest.scripts !== 'object') {
    issues.push(`${relativePath} is missing scripts`);
  }
}

if (issues.length > 0) {
  console.error('Lint checks failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Workspace lint checks passed.');
