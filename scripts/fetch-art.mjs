import fs from 'fs';
import { execSync } from 'node:child_process';

function slugify_simple(input) {
  return input
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s/g, '-')
    .replace(/"/g, '')
    .replace(/&/g, 'and')
    .replace(/[^\w\-]/g, '_');
}

const ratings = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

for (const r of ratings) {
  // Derive the key by using the same logic as batch-add-rating
  // We just need to find the file and get the key from the filename
  const files = fs.readdirSync('apps/stephenesch/data/blog/');
  // Try to find by artist slug
  const artistSlug = slugify_simple(r.artist);
  const match = files.find(f => f.startsWith(artistSlug + '|') || f.startsWith(artistSlug + '_'));

  if (!match) {
    console.warn(`No file found for: ${r.artist} - ${r.title}`);
    continue;
  }

  const key = match.replace('.mdx', '');
  const imgPath = `apps/stephenesch/public/content/images/${key}.jpg`;

  if (fs.existsSync(imgPath)) {
    console.log(`SKIP (art exists): ${key}`);
    continue;
  }

  const cmd = `~/Documents/scripts/sacad "${r.artist.replaceAll('"', '\\"')}" "${r.title.replaceAll('"', '\\"')}" 600 "${imgPath}"`;
  console.log(`Fetching art for: ${r.artist} - ${r.title}`);
  try {
    execSync(cmd, { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`  OK: ${imgPath}`);
  } catch (e) {
    console.warn(`  FAILED: ${e.message.split('\n').slice(-3).join(' | ')}`);
  }
}
