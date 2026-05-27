import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import os from 'os';

const missing = JSON.parse(readFileSync('scripts/missing_art.json', 'utf8'));
const sacad = path.join(os.homedir(), 'Documents/scripts/sacad');
const imgDir = 'apps/stephenesch/public/content/images';

let succeeded = 0;
let failed = 0;
let skipped = 0;

for (const entry of missing) {
  if (entry.error) { skipped++; continue; }
  const { key, artist, title } = entry;
  const jpg = path.join(imgDir, key + '.jpg');
  if (existsSync(jpg)) { skipped++; continue; }

  console.log(`[${succeeded + failed + skipped + 1}/${missing.length}] ${artist} - ${title}`);
  try {
    execFileSync(sacad, [artist, title, '600', jpg], { stdio: 'inherit', timeout: 60000 });
    if (existsSync(jpg)) {
      console.log(`  ✓ saved`);
      succeeded++;
    } else {
      console.log(`  ✗ no file after sacad`);
      failed++;
    }
  } catch (err) {
    console.log(`  ✗ sacad failed: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. Succeeded: ${succeeded}, Failed: ${failed}, Skipped: ${skipped}`);
