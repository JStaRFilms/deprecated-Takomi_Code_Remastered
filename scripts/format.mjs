import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await readFile(path.join(repoRoot, 'package.json'), 'utf8');
console.log('Formatting hook is present. Add a formatter dependency when the toolchain is available.');
