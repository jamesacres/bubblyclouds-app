import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({
  options: {
    app: { type: 'string' },
    version: { type: 'string' },
    'asc-app': { type: 'string' },
    'device-type': { type: 'string' },
    locale: { type: 'string' },
    data: { type: 'string', default: join(here, '.data') },
    yes: { type: 'boolean', default: false },
  },
});

if (!values.app || !values.version) {
  console.error(
    'usage: node scripts/screenshots/upload.mjs --app <app> --version <1.2.3> [--locale de,fr] [--asc-app <id>] [--device-type IPHONE_69] [--yes]'
  );
  process.exit(1);
}

const config = JSON.parse(
  readFileSync(join(here, values.app, 'config.json'), 'utf8')
);
const ascLocales = JSON.parse(readFileSync(join(here, 'locales.json'), 'utf8'));
const ascApp = values['asc-app'] ?? config.ascAppId;
const deviceType = values['device-type'] ?? config.ascDeviceType ?? 'IPHONE_69';
if (!ascApp) {
  console.error('no App Store Connect app ID: pass --asc-app or set ascAppId');
  process.exit(1);
}

const outDir = join(values.data, values.app, 'out');
if (!existsSync(outDir)) {
  console.error(
    `nothing to upload: ${outDir} does not exist. Run pnpm screenshots:compose --app ${values.app}`
  );
  process.exit(1);
}

const tagByAsc = Object.fromEntries(
  Object.entries(ascLocales).flatMap(([tag, asc]) =>
    [asc].flat().map((code) => [code, tag])
  )
);
const requested = values.locale
  ? values.locale.split(',').flatMap((tag) => {
      if (!ascLocales[tag]) {
        console.error(`unknown locale ${tag}`);
        process.exit(1);
      }
      return [ascLocales[tag]].flat();
    })
  : null;
const present = readdirSync(outDir).filter((name) => tagByAsc[name]);
const locales = requested ?? present;

const expected = config.screens.map((screen) => `${screen.id}.jpeg`);
const problems = [];
for (const locale of locales) {
  const dir = join(outDir, locale);
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const missing = expected.filter((name) => !files.includes(name));
  if (missing.length > 0) {
    problems.push(`${locale}: missing ${missing.join(', ')}`);
  }
}
if (problems.length > 0) {
  console.error(`incomplete screenshot sets:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `${locales.length} locales x ${expected.length} screenshots ready in ${outDir}`
);

const run = (args, { quiet = false } = {}) =>
  spawnSync('asc', args, {
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

const listing = run(
  [
    'localizations',
    'list',
    '--app',
    ascApp,
    '--version',
    values.version,
    '--paginate',
    '--output',
    'json',
  ],
  { quiet: true }
);
if (listing.status !== 0) {
  console.error(
    `could not read version ${values.version} of app ${ascApp}:\n${listing.stderr || listing.stdout}`
  );
  process.exit(1);
}
const onVersion = [...listing.stdout.matchAll(/"locale"\s*:\s*"([^"]+)"/g)].map(
  (match) => match[1]
);
let uploadLocales = locales;
if (onVersion.length === 0) {
  console.error(
    `warning: could not read the locale list for version ${values.version}; uploading every locale`
  );
} else {
  const absent = locales.filter((code) => !onVersion.includes(code));
  uploadLocales = locales.filter((code) => onVersion.includes(code));
  if (absent.length > 0) {
    console.error(
      `skipping locales that are not on version ${values.version} in App Store Connect: ${absent.join(', ')}\n  add the localization there first to include them`
    );
  }
}
if (uploadLocales.length === 0) {
  console.error('no locales to upload');
  process.exit(1);
}

const uploadArgs = (extra) => {
  const base = [
    'screenshots',
    'upload',
    '--app',
    ascApp,
    '--version',
    values.version,
    '--device-type',
    deviceType,
    '--replace',
    ...extra,
  ];
  return base;
};

const invocations = (extra) =>
  uploadLocales.map((locale) => [
    ...uploadArgs(extra),
    '--locale',
    locale,
    '--path',
    join(outDir, locale),
  ]);

console.log('\nDry run (nothing is changed):');
for (const args of invocations(['--dry-run'])) {
  if (run(args).status !== 0) {
    console.error('dry run failed; nothing was uploaded');
    process.exit(1);
  }
}

if (!values.yes) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await readline.question(
    `\nThis deletes the existing ${deviceType} screenshots for ${uploadLocales.length} locales of version ${values.version} and uploads the new ones.\nType "${values.version}" to continue: `
  );
  readline.close();
  if (answer.trim() !== values.version) {
    console.log('cancelled');
    process.exit(0);
  }
}

for (const args of invocations(['--confirm'])) {
  if (run(args).status !== 0) {
    console.error(
      '\nupload failed part way; fix the error and run again (it replaces each set, so re-running is safe)'
    );
    process.exit(1);
  }
}
console.log('\nuploaded');
