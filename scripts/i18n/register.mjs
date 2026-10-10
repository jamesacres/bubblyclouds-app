import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const APPS = [
  { app: 'sudoku', game: 'sudoku' },
  { app: 'unblockrace', game: 'unblockrace' },
];

const SHARED = ['ui', 'auth', 'template', 'games'];

function localeTags() {
  const source = fs.readFileSync(
    path.join(repo, 'packages/ui/src/config/locales.ts'),
    'utf8'
  );
  const block = source.match(/LOCALE_TAGS\s*=\s*\[([\s\S]*?)\]/);
  if (!block) {
    throw new Error('LOCALE_TAGS not found');
  }
  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function bundleDirs(game) {
  return [
    ...SHARED.map((name) => ({ name, dir: `packages/${name}` })),
    { name: game, dir: `packages/${game}` },
  ];
}

function isComplete(tag, app, game) {
  const files = [
    ...bundleDirs(game).map(({ dir }) => `${dir}/src/locales/${tag}.json`),
    `apps/${app}/src/locales/${tag}.json`,
  ];
  return files.every((file) => fs.existsSync(path.join(repo, file)));
}

function renderLoader(tag, app, game) {
  const lines = bundleDirs(game).map(({ name }) => {
    return `    ${name}: () => import('@bubblyclouds-app/${name}/locales/${tag}'),`;
  });
  lines.push(`    app: () => import('./locales/${tag}.json'),`);
  const key = /^[a-z]+$/.test(tag) ? tag : `'${tag}'`;
  return `  ${key}: createLocaleLoader({\n${lines.join('\n')}\n  }),`;
}

export function render(app, game, tags) {
  const loaders = tags
    .filter((tag) => isComplete(tag, app, game))
    .sort()
    .map((tag) => renderLoader(tag, app, game));
  return `const translatedLoaders: Partial<Record<LocaleTag, LocaleLoader>> = {\n${loaders.join('\n')}\n};`;
}

const STATEMENT =
  /const translatedLoaders: Partial<Record<LocaleTag, LocaleLoader>> = \{[\s\S]*?\n\};/;

export function apply(source, rendered) {
  if (!STATEMENT.test(source)) {
    throw new Error('translatedLoaders statement not found');
  }
  return source.replace(STATEMENT, () => rendered);
}

function main() {
  const check = process.argv.includes('--check');
  const tags = localeTags();
  let stale = false;
  for (const { app, game } of APPS) {
    const file = path.join(repo, `apps/${app}/src/i18n.ts`);
    const current = fs.readFileSync(file, 'utf8');
    const next = apply(current, render(app, game, tags));
    if (current !== next) {
      if (check) {
        stale = true;
        console.log(`stale: apps/${app}/src/i18n.ts`);
      } else {
        fs.writeFileSync(file, next);
        console.log(`wrote apps/${app}/src/i18n.ts`);
      }
    }
  }
  if (check && stale) {
    process.exit(1);
  }
  if (!stale) {
    console.log('register: up to date');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
