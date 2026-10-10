import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { flatten } from './localeKeys.mjs';
import { APPS, defaultRepoRoot, localePath, rootsFor } from './roots.mjs';
import { validateLocale } from './validate.mjs';

const repo = defaultRepoRoot();
const glossaryDir = path.join(repo, 'scripts', 'i18n', 'glossary');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const english = (root) => readJson(localePath(repo, root, 'en'));
const glossaryTags = fs
  .readdirSync(glossaryDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => file.slice(0, -'.json'.length));

test('glossary has en plus the 46 translated tags', () => {
  assert.ok(glossaryTags.includes('en'));
  assert.equal(glossaryTags.length, 47);
});

test('glossary brand keys are a subset of each app brand block', () => {
  for (const tag of glossaryTags) {
    const glossary = readJson(path.join(glossaryDir, `${tag}.json`));
    for (const app of Object.keys(APPS)) {
      const brand = english(`apps/${app}`).brand;
      const entry = glossary[app].brand;
      for (const key of Object.keys(entry)) {
        assert.ok(key in brand, `${tag}/${app}: unknown brand key ${key}`);
      }
      for (const key of ['appName', 'gameName', 'companyName']) {
        assert.equal(typeof entry[key], 'string', `${tag}/${app}: ${key}`);
      }
    }
  }
});

test('English glossary equals the English brand blocks', () => {
  const glossary = readJson(path.join(glossaryDir, 'en.json'));
  for (const app of Object.keys(APPS)) {
    assert.deepEqual(glossary[app].brand, english(`apps/${app}`).brand);
  }
});

test('English passes the committed length budgets', () => {
  const budgets = readJson(
    path.join(repo, 'scripts', 'i18n', 'length-budgets.json')
  );
  const roots = rootsFor(null);
  for (const [root, entries] of Object.entries(budgets)) {
    assert.ok(roots.includes(root), `unknown root ${root}`);
    const source = english(root);
    const keys = Object.keys(flatten(source));
    for (const key of Object.keys(entries)) {
      assert.ok(keys.includes(key), `${root}: budget for unknown key ${key}`);
      assert.equal(typeof entries[key].reason, 'string', `${root}: ${key}`);
    }
    assert.deepEqual(
      validateLocale({
        source,
        locale: source,
        tag: 'en',
        budgets: entries,
      }),
      []
    );
  }
});
