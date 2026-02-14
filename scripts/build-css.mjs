import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileString } from 'sass';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'assets', 'main.scss');
const outputPath = path.join(repoRoot, 'assets', 'app.css');

const raw = (await readFile(sourcePath, 'utf8')).replace(/^\uFEFF/, '');
const source = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

const result = compileString(source, {
  style: 'compressed',
  sourceMap: false,
});

await writeFile(outputPath, result.css, 'utf8');
