import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'i18n_audit.py'
);
const python = spawnSync('python3', ['--version']);
const skip = python.status !== 0;

function audit(locales) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-'));
  const src = path.join(repo, 'pkg', 'src');
  fs.mkdirSync(path.join(src, 'locales'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'config.json'), '{}');
  fs.writeFileSync(
    path.join(src, 'a.ts'),
    "t('title'); t('items', { count: 1 }); t('items', { count: 2 });\n"
  );
  fs.writeFileSync(
    path.join(src, 'locales', 'en.json'),
    JSON.stringify({
      title: 'Hi',
      items_one: '{{count}} x',
      items_other: '{{count}} xs',
    })
  );
  for (const [tag, content] of Object.entries(locales)) {
    fs.writeFileSync(
      path.join(src, 'locales', `${tag}.json`),
      JSON.stringify(content)
    );
  }
  return spawnSync(
    'python3',
    ['-I', script, 'pkg', '--config', path.join(repo, 'config.json')],
    { cwd: repo, encoding: 'utf8' }
  );
}

test('audit passes with only English', { skip }, () => {
  assert.equal(audit({}).status, 0);
});

test('audit passes for a faithful locale with CLDR plurals', { skip }, () => {
  const result = audit({
    ja: { title: 'やあ', items_other: '{{count}}個' },
    de: {
      title: 'Hallo',
      items_one: '{{count}} x',
      items_other: '{{count}} xs',
    },
  });
  assert.equal(result.status, 0, result.stdout);
});

test('audit fails on missing, extra and wrong plural keys', { skip }, () => {
  const result = audit({
    de: { items_one: '{{count}} x', items_few: '{{count}} xs', extra: 'z' },
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /locale de: missing key: title/);
  assert.match(result.stdout, /locale de: missing plural form: items_other/);
  assert.match(
    result.stdout,
    /locale de: extra plural form for this locale: items_few/
  );
  assert.match(result.stdout, /locale de: extra key: extra/);
});

test('audit ignores pseudo locales', { skip }, () => {
  assert.equal(audit({ 'en-XA': { stale: 'x' } }).status, 0);
});
