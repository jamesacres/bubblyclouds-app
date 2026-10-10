import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { edgeEmoji, validateLocale, validateRepo } from './validate.mjs';
import { rootsFor } from './roots.mjs';

const source = {
  title: 'Hello {{name}}',
  rich: 'Click <0>here</0> to {{action}}',
  nest: 'Get $t(brand.plus) now',
  items_one: '{{count}} item',
  items_other: '{{count}} items',
  cheer: '🎉 Done ✅',
  brand: { appName: 'Sudoku Race' },
};

const good = {
  title: 'Hallo {{name}}',
  rich: 'Klick <0>hier</0> um {{action}}',
  nest: 'Hol dir $t(brand.plus) jetzt',
  items_one: '{{count}} Ding',
  items_other: '{{count}} Dinge',
  cheer: '🎉 Fertig ✅',
  brand: { appName: 'Sudoku-Rennen' },
};

const errorsFor = (locale, extra = {}) =>
  validateLocale({ source, locale, tag: 'de', ...extra });

test('a faithful translation passes', () => {
  assert.deepEqual(errorsFor(good), []);
});

test('missing and extra keys are errors', () => {
  const { title: _title, ...rest } = good;
  const errors = errorsFor({ ...rest, surprise: 'x' });
  assert.ok(errors.includes('missing key: title'));
  assert.ok(errors.includes('extra key: surprise'));
});

test('wrong plural categories are errors', () => {
  const { items_other: _other, ...rest } = good;
  const errors = errorsFor({ ...rest, items_few: '{{count}} Dinge' });
  assert.ok(
    errors.some((error) => error.includes('missing plural form: items_other'))
  );
  assert.ok(
    errors.some(
      (error) =>
        error.includes('unexpected plural form') && error.includes('items_few')
    )
  );
});

test('plural categories follow the locale rules', () => {
  const { items_one: _one, ...rest } = good;
  assert.deepEqual(
    validateLocale({ source, locale: rest, tag: 'ja' }).filter((error) =>
      error.includes('items')
    ),
    []
  );
  assert.ok(
    validateLocale({ source, locale: good, tag: 'ja' }).some((error) =>
      error.includes('items_one')
    )
  );
});

test('placeholder mismatches are errors', () => {
  const errors = errorsFor({ ...good, title: 'Hallo {{nom}}' });
  assert.ok(
    errors.some((error) => error.startsWith('title: placeholders differ'))
  );
});

test('a plural form may drop the count only where the category is not other', () => {
  assert.deepEqual(errorsFor({ ...good, items_one: 'ein Ding' }), []);
  assert.ok(
    errorsFor({ ...good, items_other: 'viele Dinge' }).some((error) =>
      error.startsWith('items_other: placeholders differ')
    )
  );
});

test('tag structure mismatches are errors', () => {
  const errors = errorsFor({ ...good, rich: 'Klick hier um {{action}}' });
  assert.ok(errors.some((error) => error.startsWith('rich: tags differ')));
});

test('nested $t() references must match', () => {
  const errors = errorsFor({ ...good, nest: 'Hol dir $t(brand.other) jetzt' });
  assert.ok(
    errors.some((error) => error.startsWith('nest: $t() references differ'))
  );
});

test('leading and trailing emoji counts must match', () => {
  const errors = errorsFor({ ...good, cheer: 'Fertig' });
  assert.ok(
    errors.some((error) => error.includes('leading emoji count 0, expected 1'))
  );
  assert.ok(
    errors.some((error) => error.includes('trailing emoji count 0, expected 1'))
  );
  assert.deepEqual(edgeEmoji('🎉 🎉 Hi 🏁'), { leading: 2, trailing: 1 });
});

test('empty strings are errors', () => {
  const errors = errorsFor({ ...good, title: '  ' });
  assert.ok(errors.includes('title: empty string'));
});

test('brand keys must equal the glossary', () => {
  const errors = errorsFor(good, { brand: { appName: 'Sudoku Rennen' } });
  assert.ok(
    errors.some((error) =>
      error.startsWith('brand.appName: expected glossary value')
    )
  );
  assert.deepEqual(
    errorsFor(good, { brand: { appName: 'Sudoku-Rennen' } }),
    []
  );
});

test('length budgets are enforced', () => {
  const errors = errorsFor(good, {
    budgets: { title: { max: 5, reason: 'tab' } },
  });
  assert.ok(errors.some((error) => error.includes('exceeds budget 5')));
  assert.deepEqual(errorsFor(good, { budgets: { title: 40 } }), []);
});

test('length budgets measure placeholders as two digits', () => {
  const locale = { ...good, title: 'Hallo {{name}}!!' };
  assert.deepEqual(errorsFor(locale, { budgets: { title: 10 } }), []);
  assert.ok(
    errorsFor(locale, { budgets: { title: 9 } }).some((error) =>
      error.includes('9')
    )
  );
});

test('array values are checked per element', () => {
  const arraySource = { lines: ['Go {{x}}', 'Stop'] };
  assert.deepEqual(
    validateLocale({
      source: arraySource,
      locale: { lines: ['Los {{x}}', 'Halt'] },
      tag: 'de',
    }),
    []
  );
  assert.ok(
    validateLocale({
      source: arraySource,
      locale: { lines: ['Los', ''] },
      tag: 'de',
    }).length > 0
  );
});

function makeRepo(files) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-'));
  for (const root of rootsFor(null)) {
    const dir = path.join(repo, root, 'src', 'locales');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'en.json'),
      JSON.stringify({ a: 'Hello {{n}}' })
    );
    fs.writeFileSync(
      path.join(dir, 'de.json'),
      JSON.stringify({ a: 'Hallo {{n}}' })
    );
  }
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    fs.writeFileSync(path.join(repo, file), content);
  }
  return repo;
}

test('validateRepo discovers locales and reports per file', () => {
  const repo = makeRepo({
    'apps/sudoku/src/locales/de.json': JSON.stringify({ a: 'Hallo' }),
  });
  const { errors, tags } = validateRepo({ repo });
  assert.deepEqual(tags, ['de']);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].startsWith('apps/sudoku/de: a: placeholders differ'));
});

test('validateRepo applies the glossary to the app bundle only', () => {
  const repo = makeRepo({
    'apps/sudoku/src/locales/en.json': JSON.stringify({
      brand: { appName: 'Sudoku Race' },
    }),
    'apps/sudoku/src/locales/de.json': JSON.stringify({
      brand: { appName: 'Sudoku Rennen' },
    }),
    'scripts/i18n/glossary/de.json': JSON.stringify({
      sudoku: { brand: { appName: 'Sudoku-Rennen' } },
    }),
  });
  const { errors } = validateRepo({ repo, app: 'sudoku' });
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('apps/sudoku/de: brand.appName'));
});

test('validateRepo applies length-budgets.json per root', () => {
  const repo = makeRepo({
    'packages/games/src/locales/de.json': JSON.stringify({
      a: 'Hallo {{n}} und mehr',
    }),
    'scripts/i18n/length-budgets.json': JSON.stringify({
      'packages/games': { a: { max: 10, reason: 'tab label' } },
      'packages/ui': { a: 40 },
    }),
  });
  const { errors } = validateRepo({ repo, locale: 'de' });
  assert.equal(errors.length, 1);
  assert.match(
    errors[0],
    /^packages\/games\/de: a: 17 characters exceeds budget 10$/
  );
});

test('validateRepo flags a locale file missing in one root', () => {
  const repo = makeRepo({});
  fs.rmSync(path.join(repo, 'packages/ui/src/locales/de.json'));
  const { errors } = validateRepo({ repo, locale: 'de' });
  assert.deepEqual(errors, [
    'packages/ui/de: missing file src/locales/de.json',
  ]);
});

test('--app limits the roots checked', () => {
  const repo = makeRepo({
    'apps/unblockrace/src/locales/de.json': JSON.stringify({ a: 'Hallo' }),
  });
  assert.deepEqual(validateRepo({ repo, app: 'sudoku' }).errors, []);
  assert.equal(validateRepo({ repo, app: 'unblockrace' }).errors.length, 1);
});

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'validate.mjs'
);
const run = (...args) =>
  spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

test('CLI exits zero when clean and non-zero on errors', () => {
  const clean = makeRepo({});
  assert.equal(run('--repo', clean).status, 0);
  const dirty = makeRepo({
    'packages/ui/src/locales/de.json': JSON.stringify({ a: '' }),
  });
  const result = run('--repo', dirty, '--locale', 'de');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ERROR packages\/ui\/de: a: empty string/);
});

test('CLI rejects bad arguments and passes with no locale files', () => {
  assert.equal(run('--app', 'nope').status, 2);
  assert.equal(run('--bogus').status, 2);
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-'));
  assert.equal(run('--repo', repo).status, 0);
});
