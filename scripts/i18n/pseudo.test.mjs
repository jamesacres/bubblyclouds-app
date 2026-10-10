import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { flatten } from './localeKeys.mjs';
import { generate, pseudoAccent, pseudoBidi, pseudoLocale } from './pseudo.mjs';
import { validateLocale } from './validate.mjs';
import { rootsFor } from './roots.mjs';

const placeholderOf = (text) => text.match(/\{\{[^}]*\}\}/g) ?? [];

test('accent pseudo wraps in brackets and keeps placeholders', () => {
  const output = pseudoAccent('Hello {{name}}, you have {{count}} left');
  assert.ok(output.startsWith('[') && output.endsWith(']'));
  assert.deepEqual(placeholderOf(output), ['{{name}}', '{{count}}']);
  assert.ok(!output.includes('Hello'));
});

test('accent pseudo expands text by about 40 percent', () => {
  const plain = 'Create a new puzzle and invite your friends';
  const output = pseudoAccent(plain);
  const ratio = (output.length - 2) / plain.length;
  assert.ok(ratio >= 1.4 && ratio < 1.7, `ratio ${ratio}`);
});

test('pseudo output is deterministic', () => {
  assert.equal(pseudoAccent('Play now'), pseudoAccent('Play now'));
  assert.equal(pseudoBidi('Play now'), pseudoBidi('Play now'));
});

test('tags, nesting and emoji are untouched', () => {
  const text = '🎉 <0>Join</0> the $t(brand.plus) team {{n}} 🏁';
  for (const output of [pseudoAccent(text), pseudoBidi(text)]) {
    assert.ok(output.startsWith('🎉 '));
    assert.ok(output.endsWith(' 🏁'));
    assert.ok(output.includes('<0>'));
    assert.ok(output.includes('</0>'));
    assert.ok(output.includes('$t(brand.plus)'));
    assert.ok(output.includes('{{n}}'));
  }
});

test('bidi pseudo uses Arabic script and bidi controls', () => {
  const output = pseudoBidi('Settings');
  assert.ok(output.includes('‫'));
  assert.ok(output.includes('‬'));
  assert.ok(/\p{Script=Arabic}/u.test(output));
  assert.ok(!/[A-Za-z]/.test(output));
});

test('strings without letters are left alone', () => {
  assert.equal(pseudoAccent('{{count}}'), '[{{count}}]');
  assert.equal(pseudoAccent(''), '');
});

test('pseudo locales satisfy the validator for any plural rules', () => {
  const source = {
    title: '🎉 Hello {{name}}',
    items_one: '{{count}} item',
    items_other: '{{count}} items',
    lines: ['One', 'Two <b>x</b>'],
    nested: { text: 'Go $t(title)' },
  };
  for (const tag of ['en-XA', 'ar-XB']) {
    const locale = pseudoLocale(source, tag);
    assert.deepEqual(validateLocale({ source, locale, tag }), []);
  }
  assert.ok('items_zero' in flatten(pseudoLocale(source, 'ar-XB')));
});

test('generate writes and checks pseudo files for every root', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'pseudo-'));
  for (const root of rootsFor(null)) {
    const dir = path.join(repo, root, 'src', 'locales');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'en.json'), '{"a":"Hello"}');
  }
  assert.ok(generate({ repo, check: true }).length > 0);
  generate({ repo });
  assert.deepEqual(generate({ repo, check: true }), []);
  const file = path.join(repo, 'packages/ui/src/locales/ar-XB.json');
  assert.ok(fs.readFileSync(file, 'utf8').includes('\\u202b'));
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).a.charAt(0), '‫');
});
