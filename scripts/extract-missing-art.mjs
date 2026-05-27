import { readdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const blogDir = 'apps/stephenesch/data/blog';
const imgDir = 'apps/stephenesch/public/content/images';

const missing = [];
for (const fname of readdirSync(blogDir).sort()) {
  if (!fname.endsWith('.mdx')) continue;
  const key = fname.slice(0, -4);
  const jpg = path.join(imgDir, key + '.jpg');
  if (existsSync(jpg)) continue;

  const content = readFileSync(path.join(blogDir, fname), 'utf8');
  const dataMatch = content.match(/export const data = \{([\s\S]*?)\};/);
  if (!dataMatch) { missing.push({ key, error: 'no data block' }); continue; }

  const block = dataMatch[1];
  const artistMatch = block.match(/artist:\s*'((?:[^'\\]|\\.)*)'/);
  const titleMatch = block.match(/title:\s*'((?:[^'\\]|\\.)*)'/);;

  if (artistMatch && titleMatch) {
    const artist = artistMatch[1].replace(/\\'/g, "'");
    const title = titleMatch[1].replace(/\\'/g, "'");
    missing.push({ key, artist, title });
  } else {
    missing.push({ key, error: 'parse failed', block: block.substring(0, 200) });
  }
}

writeFileSync('scripts/missing_art.json', JSON.stringify(missing, null, 2));
console.log('Total missing:', missing.length);
const errors = missing.filter(m => m.error);
console.log('Errors:', errors.length);
errors.forEach(e => console.log(' ', JSON.stringify(e)));
