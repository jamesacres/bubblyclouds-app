import { pluralCategories } from './pluralCategories.mjs';

export const PSEUDO_LOCALES = ['en-XA', 'ar-XB'];
export const SOURCE_LOCALE = 'en';

const PLURAL_RE = /^(.*?)_(ordinal_)?(zero|one|two|few|many|other)$/;

export function flatten(value, prefix = '') {
  const out = {};
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
  } else {
    out[prefix] = value;
  }
  return out;
}

export function unflatten(flat) {
  const out = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.');
    let cursor = out;
    for (const part of parts.slice(0, -1)) {
      cursor[part] ??= {};
      cursor = cursor[part];
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return out;
}

export function splitPlural(key) {
  const match = PLURAL_RE.exec(key);
  if (!match) {
    return null;
  }
  return {
    base: match[1],
    ordinal: Boolean(match[2]),
    category: match[3],
  };
}

export function pluralKey(base, ordinal, category) {
  return `${base}_${ordinal ? 'ordinal_' : ''}${category}`;
}

export function expectedKeys(sourceKeys, tag) {
  const cardinal = pluralCategories(tag, 'cardinal');
  const ordinal = pluralCategories(tag, 'ordinal');
  const expected = [];
  const seen = new Set();
  for (const key of sourceKeys) {
    const plural = splitPlural(key);
    if (!plural) {
      expected.push({ key, source: key });
      continue;
    }
    const groupId = `${plural.base}|${plural.ordinal}`;
    if (seen.has(groupId)) {
      continue;
    }
    seen.add(groupId);
    const categories = plural.ordinal ? ordinal : cardinal;
    const sourceCategories = sourceKeys
      .map(splitPlural)
      .filter(
        (other) =>
          other &&
          other.base === plural.base &&
          other.ordinal === plural.ordinal
      )
      .map((other) => other.category);
    for (const category of categories) {
      const sourceCategory = sourceCategories.includes(category)
        ? category
        : 'other';
      expected.push({
        key: pluralKey(plural.base, plural.ordinal, category),
        source: pluralKey(plural.base, plural.ordinal, sourceCategory),
      });
    }
  }
  return expected;
}

export function compareKeys(sourceKeys, localeKeys, tag) {
  const expected = expectedKeys(sourceKeys, tag);
  const expectedSet = new Set(expected.map((entry) => entry.key));
  const actualSet = new Set(localeKeys);
  const missing = [...expectedSet].filter((key) => !actualSet.has(key));
  const extra = [...actualSet].filter((key) => !expectedSet.has(key));
  return { missing, extra, expected };
}
