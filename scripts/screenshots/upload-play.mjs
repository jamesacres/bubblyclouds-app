import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({
  options: {
    app: { type: 'string' },
    package: { type: 'string' },
    locale: { type: 'string' },
    data: { type: 'string', default: join(here, '.data') },
    yes: { type: 'boolean', default: false },
    delay: { type: 'string', default: '300' },
    retries: { type: 'string', default: '4' },
  },
});

if (!values.app) {
  console.error(
    'usage: node scripts/screenshots/upload-play.mjs --app <app> [--locale de,fr] [--package <name>] [--delay 300] [--retries 4] [--yes]'
  );
  process.exit(1);
}

const config = JSON.parse(
  readFileSync(join(here, values.app, 'config.json'), 'utf8')
);
const appLocales = JSON.parse(readFileSync(join(here, 'locales.json'), 'utf8'));
const playLocales = JSON.parse(
  readFileSync(join(here, 'play-locales.json'), 'utf8')
);
const packageName = values.package ?? config.playPackage;
const screens = config.play?.screens ?? config.screens.map((s) => s.id);
const imageTypes = config.play?.imageTypes ?? ['phoneScreenshots'];
if (!packageName) {
  console.error('no package name: pass --package or set playPackage');
  process.exit(1);
}
if (screens.length < 2 || screens.length > 8) {
  console.error(
    `Google Play takes 2 to 8 screenshots per type, config lists ${screens.length}`
  );
  process.exit(1);
}

const tags = values.locale
  ? values.locale.split(',')
  : Object.keys(playLocales);
const unknown = tags.filter((tag) => !playLocales[tag] || !appLocales[tag]);
if (unknown.length > 0) {
  console.error(`unknown locales: ${unknown.join(', ')}`);
  process.exit(1);
}

const sourceDir = (tag) =>
  join(values.data, values.app, 'out', [appLocales[tag]].flat()[0]);
const missing = [];
for (const tag of tags) {
  for (const id of screens) {
    if (!existsSync(join(sourceDir(tag), `${id}.jpeg`))) {
      missing.push(`${tag}/${id}.jpeg`);
    }
  }
}
if (missing.length > 0) {
  console.error(
    `missing images (run pnpm screenshots:compose --app ${values.app}):\n  ${missing.slice(0, 20).join('\n  ')}${missing.length > 20 ? `\n  ...and ${missing.length - 20} more` : ''}`
  );
  process.exit(1);
}

const gplay = (args, { quiet = false } = {}) =>
  spawnSync('gplay', args, {
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

const lockPath = join(here, '.build', 'upload-play.lock');
mkdirSync(dirname(lockPath), { recursive: true });
if (existsSync(lockPath)) {
  const pid = Number(readFileSync(lockPath, 'utf8'));
  let running = false;
  try {
    process.kill(pid, 0);
    running = true;
  } catch {
    running = false;
  }
  if (running) {
    console.error(
      `another upload is already running (pid ${pid}). Google Play allows one edit per app, so a second run would invalidate the first. Wait for it, or stop it with: kill ${pid}`
    );
    process.exit(1);
  }
}
writeFileSync(lockPath, String(process.pid));
process.on('exit', () => rmSync(lockPath, { force: true }));

const created = gplay(['edits', 'create', '--package', packageName], {
  quiet: true,
});
if (created.status !== 0) {
  console.error(
    `could not create an edit for ${packageName}:\n${created.stderr || created.stdout}`
  );
  process.exit(1);
}
let editId;
try {
  editId = JSON.parse(created.stdout).id;
} catch {
  editId = undefined;
}
if (!editId) {
  console.error(`could not read the edit id from:\n${created.stdout}`);
  process.exit(1);
}
console.log(
  `Created edit ${editId} for ${packageName} (nothing is live until it is committed)`
);

const discard = (reason) => {
  gplay(['edits', 'delete', '--package', packageName, '--edit', editId], {
    quiet: true,
  });
  console.error(`${reason}; the edit was discarded and nothing changed`);
  process.exit(1);
};
process.on('SIGINT', () => discard('interrupted'));

const listings = gplay(
  ['listings', 'list', '--package', packageName, '--edit', editId],
  { quiet: true }
);
if (listings.status !== 0) {
  discard(`could not read the store listings:\n${listings.stderr}`);
}
const onListing = new Set(
  [...listings.stdout.matchAll(/"language"\s*:\s*"([^"]+)"/g)].map(
    (match) => match[1]
  )
);
if (onListing.size === 0) {
  discard('could not read the locale list from the store listings');
}

const targets = [];
const noListing = [];
for (const tag of tags) {
  const codes = playLocales[tag].filter((code) => onListing.has(code));
  if (codes.length === 0) {
    noListing.push(tag);
  }
  for (const code of codes) {
    targets.push({ tag, code });
  }
}
const covered = new Set(targets.map((target) => target.code));
const unmapped = [...onListing].filter(
  (code) => !covered.has(code) && !values.locale
);
if (noListing.length > 0) {
  console.log(
    `no Play listing for: ${noListing.join(', ')} (add the language in Play Console to include it)`
  );
}
if (unmapped.length > 0) {
  console.log(
    `listing languages with no screenshots here (left untouched): ${unmapped.join(', ')}`
  );
}
if (targets.length === 0) {
  discard('no locales to upload');
}

console.log(
  `\n${targets.length} Play locales x ${screens.length} screenshots each for ${imageTypes.join(', ')} (${screens[0]}-${screens.at(-1)}).`
);
if (!values.yes) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await readline.question(
    `This replaces the existing ${imageTypes.join(', ')} for those locales and commits the edit.\nType "${packageName}" to continue: `
  );
  readline.close();
  if (answer.trim() !== packageName) {
    discard('cancelled');
  }
}

const delayMs = Number(values.delay);
const retries = Number(values.retries);
const TRANSIENT =
  /\b(429|500|502|503|504)\b|backendError|rateLimitExceeded|internal error|timed? ?out|ETIMEDOUT|ECONNRESET|EAI_AGAIN|temporarily|unavailable/i;
const isTransient = (result) =>
  TRANSIENT.test(`${result.stderr}\n${result.stdout}`);
const run = (args) => gplay(args, { quiet: true });

const tryLocale = async ({ tag, code }) => {
  for (const type of imageTypes) {
    const base = [
      '--package',
      packageName,
      '--edit',
      editId,
      '--locale',
      code,
      '--type',
      type,
    ];
    const deleted = run(['images', 'delete-all', ...base, '--confirm']);
    if (deleted.status !== 0) {
      const remaining = run(['images', 'list', ...base]);
      const alreadyEmpty =
        remaining.status === 0 && !/"id"\s*:/.test(remaining.stdout);
      if (!alreadyEmpty) {
        return { ok: false, step: `delete-all ${type}`, result: deleted };
      }
    }
    for (const id of screens) {
      await sleep(delayMs);
      const uploaded = run([
        'images',
        'upload',
        ...base,
        '--file',
        join(sourceDir(tag), `${id}.jpeg`),
      ]);
      if (uploaded.status !== 0) {
        return {
          ok: false,
          step: `upload of ${id}.jpeg (${type})`,
          result: uploaded,
        };
      }
    }
  }
  return { ok: true };
};

const startedAt = Date.now();
const seconds = (since) => Math.round((Date.now() - since) / 1000);

const processLocale = async (target, label) => {
  process.stdout.write(`${label} ${target.code} ... `);
  const localeStart = Date.now();
  for (let attempt = 1; ; attempt++) {
    const outcome = await tryLocale(target);
    if (outcome.ok) {
      console.log(
        `done in ${seconds(localeStart)}s (${seconds(startedAt)}s total)`
      );
      return true;
    }
    const output = (outcome.result.stderr || outcome.result.stdout).trim();
    if (!isTransient(outcome.result)) {
      console.error(`\n${output}`);
      discard(`failed at ${outcome.step} for ${target.code}`);
    }
    const reason = output.split('\n')[0].slice(0, 70);
    if (attempt > retries) {
      console.log(`gave up after ${attempt} attempts (${reason})`);
      return false;
    }
    const wait = Math.min(60, 2 ** attempt * 2);
    process.stdout.write(
      `\n  ${outcome.step} failed (${reason}); restarting this locale in ${wait}s (${attempt}/${retries}) ... `
    );
    await sleep(wait * 1000);
  }
};

let pending = targets;
for (let pass = 1; pass <= 3 && pending.length > 0; pass++) {
  if (pass > 1) {
    console.log(
      `\nRetrying ${pending.length} locale(s) that failed (pass ${pass} of 3)...`
    );
  }
  const stillFailing = [];
  for (const [index, target] of pending.entries()) {
    const label = `[${index + 1}/${pending.length}]`;
    if (!(await processLocale(target, label))) {
      stillFailing.push(target);
    }
  }
  pending = stillFailing;
}
if (pending.length > 0) {
  discard(
    `these locales still failed after retrying: ${pending.map((target) => target.code).join(', ')}. Committing would leave them with a partial set`
  );
}

console.log('\nValidating the edit...');
if (
  gplay(['edits', 'validate', '--package', packageName, '--edit', editId])
    .status !== 0
) {
  discard('validation failed');
}
console.log('\nCommitting...');
if (
  gplay(['edits', 'commit', '--package', packageName, '--edit', editId])
    .status !== 0
) {
  discard('commit failed');
}
console.log('\nuploaded to Google Play');
