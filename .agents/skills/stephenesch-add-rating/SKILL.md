---
name: stephenesch-add-rating
description: Stores music rating MDX files for Stephen's blog and album art JPGs. Use when asked to update ratings for Stephen.
---

# Instructions

## Step 1 — Identify user and page range

Ask the user which RateYourMusic username and which page range to process (e.g. user `Amoux`, pages 1–126).

## Step 2 — Open pages in Chrome DevTools MCP

Open each page in the browser one at a time (do NOT batch-fetch — RateYourMusic will block automated requests):

```
https://rateyourmusic.com/collection/<USERNAME>/recent/<PAGE_NUMBER>
```

Use `mcp__chrome-devtools__new_page` for the first page, then `mcp__chrome-devtools__navigate_page` for subsequent pages.

**Cloudflare note:** The first page load may show a Cloudflare verification screen. Take a screenshot and wait — it auto-resolves in a few seconds. **502 Bad Gateway** errors mean RYM's server is temporarily down; just retry the same page.

## Step 3 — Extract ratings from each page

Run this JS via `mcp__chrome-devtools__evaluate_script` on each loaded page:

```js
() => {
  const rows = document.querySelectorAll('tr');
  const ratings = [];
  rows.forEach(row => {
    const artistCell = row.querySelector('td.or_q_albumartist_td');
    const dateCell = row.querySelector('td.or_q_rating_date_d');
    const ratingCell = row.querySelector('td.or_q_rating_date_s');
    if (!artistCell || !dateCell || !ratingCell) return;
    const artist = artistCell.querySelector('.artist')?.innerText?.trim() || '';
    const title = artistCell.querySelector('.album')?.innerText?.trim() || '';
    const yearMatch = artistCell.querySelector('.smallgray')?.innerText?.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : '';
    const monthEl = dateCell.querySelector('.date_element_month');
    const dayEl = dateCell.querySelector('.date_element_day');
    const yearEl = dateCell.querySelector('.date_element_year');
    let ratingDate = '';
    if (monthEl && dayEl && yearEl) {
      const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
      const m = months[monthEl.innerText.trim()] || '01';
      const d = dayEl.innerText.trim().padStart(2, '0');
      const y = yearEl.innerText.trim();
      ratingDate = `${y}-${m}-${d}`;
    }
    const ratingImg = ratingCell.querySelector('img');
    const ratingAlt = ratingImg ? ratingImg.alt : '';
    const ratingMatch = ratingAlt.match(/([\d.]+)\s*stars?/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    if (artist && title && rating !== null) {
      ratings.push({ artist, title, year, ratingDate, rating });
    }
  });
  return ratings;
}
```

The rating value (e.g. `3.5`) comes from the image `alt` attribute (e.g. `"3.50 stars"`). Pages return 25 entries. The first entry on page N+1 often duplicates the last entry of page N — this is fine, `batch-add-rating.mjs` skips existing files.

## Step 4 — Batch entries and process

Accumulate ~200–300 ratings (roughly 10–12 pages) into a JSON array, then write to `scripts/ratings_batch.json` and run:

```
node scripts/batch-add-rating.mjs scripts/ratings_batch.json
```

Run this **without sandbox** (`dangerouslyDisableSandbox: true`) — sacad needs filesystem access for its cache.

**Critical:** Run only ONE batch job at a time. Running two simultaneously causes sacad to time out (ETIMEDOUT) because they contend for the same cache files. Wait for the previous job to finish before starting the next.

The script:
- Skips entries where the MDX file already exists AND the art JPG already exists
- If MDX exists but art is missing, re-fetches art only ("ART ONLY" mode)
- Creates MDX at `apps/stephenesch/data/blog/<key>.mdx`
- Runs `~/Documents/scripts/sacad` to fetch album art to `apps/stephenesch/public/content/images/<key>.jpg`
- sacad failures (no cover found) are non-fatal — just move on

## Step 5 — Retry missing art

After batches complete, find MDX files missing their art JPG:

```bash
for f in apps/stephenesch/data/blog/*.mdx; do
  key=$(basename "$f" .mdx)
  jpg="apps/stephenesch/public/content/images/${key}.jpg"
  [ ! -f "$jpg" ] && echo "$key"
done
```

For each missing key, read the MDX to extract artist and title from the `export const data = { ... }` block, then run sacad directly:

```bash
~/Documents/scripts/sacad "<artist>" "<title>" 600 "apps/stephenesch/public/content/images/<key>.jpg"
```

**Do NOT read MDX from this approach to rebuild a batch JSON** — just run sacad directly per missing file. Process one at a time; do not parallelise sacad calls.

## Key: rating scale

RYM uses 0.5-star increments. The extracted `rating` field is already out of 5 (e.g. `3.5`). The batch script converts internally: `ratingOutOfTen = rating * 2`.

## Key: slugify behaviour

The key is `slugify(artist)|slugify(title)`. The slugify function:
- Removes diacritics (ü → u, é → e, etc.)
- Lowercases
- Spaces → `-`
- `&` → `and`
- `"` → removed
- All other non-word chars → `_`

So `Mary's Danish` → `mary_s-danish`, `Peter Stampfel & The Bottlecaps` → `peter-stampfel-and-the-bottlecaps`.

## Key: the batch script

`scripts/batch-add-rating.mjs` was created for this workflow. It inlines its own slugify/diacritics logic (does not import from `add-rating.mjs`, which has top-level `await` prompts that would execute on import). The JSON input format is:

```json
[
  { "artist": "...", "title": "...", "year": "1989", "ratingDate": "2026-05-27", "rating": 3.5 },
  ...
]
```

Pass the JSON file path as the first argument: `node scripts/batch-add-rating.mjs <path-to-json>`

The file must be in the project directory (not `/tmp`) when running without sandbox, as the sandbox and non-sandbox environments use different `$TMPDIR` paths.
