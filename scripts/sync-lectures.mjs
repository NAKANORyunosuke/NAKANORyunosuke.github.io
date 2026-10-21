// 講義リポジトリのビルド済み lecture_XX.html を講義資料置き場にコピーする.
//   node scripts/sync-lectures.mjs <講義の interactive ディレクトリ> <コピー先>
//   例: node scripts/sync-lectures.mjs ../HokkaiGakuenUniversity/2026/数学概論Ⅱ/interactive lecture-materials/2026/math-overview-2
// 隠しページなので, コピー時に <meta name="robots" content="noindex, nofollow"> を差し込む.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('usage: node scripts/sync-lectures.mjs <src> <dest>');
  process.exit(1);
}

const robots = '<meta name="robots" content="noindex, nofollow">';
mkdirSync(dest, { recursive: true });
readdirSync(src).filter((f) => /^lecture_\d+\.html$/.test(f)).sort().forEach((f) => {
  let html = readFileSync(join(src, f), 'utf8');
  if (!html.includes(robots)) html = html.replace(/<meta charset="utf-8">/i, (m) => `${m}\n${robots}`);
  writeFileSync(join(dest, f), html);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  console.log(`${f}  ${title}`);
});
