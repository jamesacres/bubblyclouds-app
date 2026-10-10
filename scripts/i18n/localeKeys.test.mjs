import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  compareKeys,
  expectedKeys,
  flatten,
  unflatten,
} from './localeKeys.mjs';
import { pluralCategories } from './pluralCategories.mjs';

test('plural categories follow CLDR', () => {
  assert.deepEqual(pluralCategories('en'), ['one', 'other']);
  assert.deepEqual(pluralCategories('ja'), ['other']);
  assert.deepEqual(pluralCategories('ru'), ['one', 'few', 'many', 'other']);
  assert.deepEqual(pluralCategories('ar'), [
    'zero',
    'one',
    'two',
    'few',
    'many',
    'other',
  ]);
  assert.deepEqual(pluralCategories('en', 'ordinal').sort(), [
    'few',
    'one',
    'other',
    'two',
  ]);
});

test('flatten and unflatten round trip', () => {
  const value = { a: { b: 'x', c: ['y', 'z'] }, d: 'w' };
  assert.deepEqual(flatten(value), { 'a.b': 'x', 'a.c': ['y', 'z'], d: 'w' });
  assert.deepEqual(unflatten(flatten(value)), value);
});

test('expected keys expand plural groups to the locale categories', () => {
  const keys = ['title', 'items_one', 'items_other', 'last'];
  assert.deepEqual(
    expectedKeys(keys, 'ja').map((entry) => entry.key),
    ['title', 'items_other', 'last']
  );
  assert.deepEqual(
    expectedKeys(keys, 'ar').map((entry) => entry.key),
    [
      'title',
      'items_zero',
      'items_one',
      'items_two',
      'items_few',
      'items_many',
      'items_other',
      'last',
    ]
  );
});

test('compareKeys reports missing and extra keys', () => {
  const result = compareKeys(
    ['a', 'n_one', 'n_other'],
    ['a', 'n_one', 'n_few', 'z'],
    'en'
  );
  assert.deepEqual(result.missing, ['n_other']);
  assert.deepEqual(result.extra.sort(), ['n_few', 'z']);
});
