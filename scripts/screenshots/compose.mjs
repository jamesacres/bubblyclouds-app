import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({
  options: {
    app: { type: 'string' },
    locale: { type: 'string', default: 'all' },
    data: { type: 'string', default: join(here, '.data') },
  },
});

if (!values.app) {
  console.error(
    'usage: node scripts/screenshots/compose.mjs --app <app> [--locale de,fr|all] [--data <dir>]'
  );
  process.exit(1);
}

const appDir = join(here, values.app);
const config = join(appDir, 'config.json');
const appConfig = JSON.parse(readFileSync(config, 'utf8'));
const captionsDir = join(appDir, appConfig.captionsDir ?? 'captions');
const ascLocales = JSON.parse(readFileSync(join(here, 'locales.json'), 'utf8'));
const source = join(here, 'compose.swift');
const binary = join(here, '.build', 'compose');

if (
  !existsSync(binary) ||
  statSync(binary).mtimeMs < statSync(source).mtimeMs
) {
  mkdirSync(dirname(binary), { recursive: true });
  const moduleCache = join(tmpdir(), 'screenshots-swift-module-cache');
  mkdirSync(moduleCache, { recursive: true });
  execFileSync(
    'swiftc',
    ['-O', '-module-cache-path', moduleCache, source, '-o', binary],
    { stdio: 'inherit' }
  );
}

const available = readdirSync(captionsDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.slice(0, -'.json'.length));
const requested =
  values.locale === 'all' ? available : values.locale.split(',');

const unknown = requested.filter((tag) => !available.includes(tag));
if (unknown.length > 0) {
  console.error(`no captions for: ${unknown.join(', ')}`);
  process.exit(1);
}

const dataDir = join(values.data, values.app);
const skipped = [];
const failed = [];
for (const tag of requested) {
  const codes = [ascLocales[tag]].flat();
  if (!ascLocales[tag]) {
    console.error(`${tag}: missing from locales.json`);
    process.exit(1);
  }
  const shots = join(dataDir, 'shots', tag);
  if (!existsSync(shots)) {
    skipped.push(tag);
    continue;
  }
  console.log(`${tag} -> ${codes.join(', ')}`);
  try {
    execFileSync(
      binary,
      [
        '--config',
        config,
        '--captions',
        join(captionsDir, `${tag}.json`),
        '--shots',
        shots,
        '--out',
        join(dataDir, 'out', codes[0]),
      ],
      { stdio: ['ignore', 'inherit', 'inherit'] }
    );
    for (const extra of codes.slice(1)) {
      cpSync(join(dataDir, 'out', codes[0]), join(dataDir, 'out', extra), {
        recursive: true,
      });
    }
  } catch {
    failed.push(tag);
  }
}

if (skipped.length > 0) {
  console.error(`no captures yet for: ${skipped.join(', ')}`);
}
if (failed.length > 0) {
  console.error(`failed: ${failed.join(', ')}`);
  process.exit(1);
}
