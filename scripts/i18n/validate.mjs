import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  compareKeys,
  flatten,
  PSEUDO_LOCALES,
  SOURCE_LOCALE,
  splitPlural,
} from './localeKeys.mjs';
import {
  APPS,
  appOf,
  defaultRepoRoot,
  localePath,
  rootsFor,
} from './roots.mjs';

const PLACEHOLDER_RE = /\{\{[-\s]*([^},\s]+)[^}]*\}\}/g;
const TAG_RE = /<\/?[A-Za-z0-9][^<>]*?\/?>/g;
const NESTING_RE = /\$t\(([^)]*)\)/g;
const EMOJI_CHARS =
  '\\p{Extended_Pictographic}\\p{Emoji_Modifier}\\uFE0F\\u200D\\u20E3\\p{Regional_Indicator}';
const LEADING_RE = new RegExp(`^[${EMOJI_CHARS}\\s]*`, 'u');
const TRAILING_RE = new RegExp(`[${EMOJI_CHARS}\\s]*$`, 'u');
const EMOJI_RE = new RegExp(
  `[\\p{Extended_Pictographic}\\p{Regional_Indicator}]`,
  'gu'
);

function sorted(values) {
  return [...values].sort();
}

function placeholders(text) {
  return new Set([...text.matchAll(PLACEHOLDER_RE)].map((match) => match[1]));
}

function tags(text) {
  return sorted(
    (text.match(TAG_RE) ?? []).map((tag) => tag.replace(/\s+/g, ''))
  );
}

function nesting(text) {
  return sorted([...text.matchAll(NESTING_RE)].map((match) => match[1].trim()));
}

function emojiCount(fragment) {
  return (fragment.match(EMOJI_RE) ?? []).length;
}

export function edgeEmoji(text) {
  const leading = LEADING_RE.exec(text)?.[0] ?? '';
  const trailing = TRAILING_RE.exec(text)?.[0] ?? '';
  return { leading: emojiCount(leading), trailing: emojiCount(trailing) };
}

function sameList(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function samePlaceholders(a, b) {
  return a.size === b.size && [...a].every((name) => b.has(name));
}

function stringsOf(value) {
  return Array.isArray(value) ? value : [value];
}

function checkText(source, text, allowedPlaceholders) {
  const problems = [];
  if (typeof text !== 'string') {
    return ['value is not a string'];
  }
  if (text.trim() === '') {
    return ['empty string'];
  }
  const sourcePlaceholders = placeholders(source);
  const localePlaceholders = placeholders(text);
  const expected = allowedPlaceholders ?? sourcePlaceholders;
  const placeholdersOk = allowedPlaceholders
    ? [...localePlaceholders].every((name) => expected.has(name))
    : samePlaceholders(sourcePlaceholders, localePlaceholders);
  if (!placeholdersOk) {
    problems.push(
      `placeholders differ: expected {{${sorted(expected).join('}}, {{')}}}, found {{${sorted(localePlaceholders).join('}}, {{')}}}`
    );
  }
  if (!sameList(tags(source), tags(text))) {
    problems.push(
      `tags differ: expected [${tags(source).join(' ')}], found [${tags(text).join(' ')}]`
    );
  }
  if (!sameList(nesting(source), nesting(text))) {
    problems.push(
      `$t() references differ: expected [${nesting(source).join(', ')}], found [${nesting(text).join(', ')}]`
    );
  }
  const sourceEdges = edgeEmoji(source);
  const localeEdges = edgeEmoji(text);
  if (sourceEdges.leading !== localeEdges.leading) {
    problems.push(
      `leading emoji count ${localeEdges.leading}, expected ${sourceEdges.leading}`
    );
  }
  if (sourceEdges.trailing !== localeEdges.trailing) {
    problems.push(
      `trailing emoji count ${localeEdges.trailing}, expected ${sourceEdges.trailing}`
    );
  }
  return problems;
}

function pluralUnion(sourceFlat, base, ordinal) {
  const union = new Set();
  for (const [key, value] of Object.entries(sourceFlat)) {
    const plural = splitPlural(key);
    if (plural && plural.base === base && plural.ordinal === ordinal) {
      for (const text of stringsOf(value)) {
        placeholders(String(text)).forEach((name) => union.add(name));
      }
    }
  }
  return union;
}

function budgetLimit(budget) {
  if (typeof budget === 'number') {
    return budget;
  }
  if (budget && typeof budget.max === 'number') {
    return budget.max;
  }
  return null;
}

export function validateLocale({
  source,
  locale,
  tag,
  brand = null,
  budgets = null,
}) {
  const errors = [];
  const sourceFlat = flatten(source);
  const localeFlat = flatten(locale);
  const { missing, extra, expected } = compareKeys(
    Object.keys(sourceFlat),
    Object.keys(localeFlat),
    tag
  );
  for (const key of missing) {
    const plural = splitPlural(key);
    errors.push(plural ? `missing plural form: ${key}` : `missing key: ${key}`);
  }
  for (const key of extra) {
    const plural = splitPlural(key);
    errors.push(
      plural ? `unexpected plural form for ${tag}: ${key}` : `extra key: ${key}`
    );
  }

  for (const { key, source: sourceKey } of expected) {
    if (!(key in localeFlat)) {
      continue;
    }
    const localeValue = localeFlat[key];
    const sourceValue = sourceFlat[sourceKey];
    const plural = splitPlural(key);
    const allowed =
      plural && plural.category !== 'other'
        ? pluralUnion(sourceFlat, plural.base, plural.ordinal)
        : null;

    if (Array.isArray(sourceValue) || Array.isArray(localeValue)) {
      if (!Array.isArray(localeValue) || !Array.isArray(sourceValue)) {
        errors.push(
          `${key}: expected ${Array.isArray(sourceValue) ? 'an array' : 'a string'}`
        );
        continue;
      }
      localeValue.forEach((text, index) => {
        const reference = sourceValue[index] ?? sourceValue[0] ?? '';
        for (const problem of checkText(String(reference), text, null)) {
          errors.push(`${key}[${index}]: ${problem}`);
        }
      });
      continue;
    }
    if (typeof sourceValue !== 'string') {
      continue;
    }
    for (const problem of checkText(sourceValue, localeValue, allowed)) {
      errors.push(`${key}: ${problem}`);
    }
  }

  if (brand) {
    for (const [name, value] of Object.entries(brand)) {
      const key = `brand.${name}`;
      if (localeFlat[key] !== value) {
        errors.push(
          `${key}: expected glossary value ${JSON.stringify(value)}, found ${JSON.stringify(localeFlat[key])}`
        );
      }
    }
  }

  if (budgets) {
    for (const [key, budget] of Object.entries(budgets)) {
      const limit = budgetLimit(budget);
      const value = localeFlat[key];
      if (limit !== null && typeof value === 'string') {
        const rendered = [...value.replace(PLACEHOLDER_RE, '00')].length;
        if (rendered > limit) {
          errors.push(
            `${key}: ${rendered} characters exceeds budget ${limit}`
          );
        }
      }
    }
  }

  return errors;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readOptionalJson(file) {
  return fs.existsSync(file) ? readJson(file) : null;
}

function discoverTags(repo, roots) {
  const tags = new Set();
  for (const root of roots) {
    const dir = path.join(repo, root, 'src', 'locales');
    if (!fs.existsSync(dir)) {
      continue;
    }
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) {
        continue;
      }
      const tag = file.slice(0, -'.json'.length);
      if (tag !== SOURCE_LOCALE && !PSEUDO_LOCALES.includes(tag)) {
        tags.add(tag);
      }
    }
  }
  return [...tags].sort();
}

export function validateRepo({ repo, app = null, locale = null }) {
  const errors = [];
  const roots = rootsFor(app);
  const tags = locale ? [locale] : discoverTags(repo, roots);
  const budgets = readOptionalJson(
    path.join(repo, 'scripts', 'i18n', 'length-budgets.json')
  );
  let checked = 0;

  for (const tag of tags) {
    const glossary = readOptionalJson(
      path.join(repo, 'scripts', 'i18n', 'glossary', `${tag}.json`)
    );
    for (const root of roots) {
      const sourceFile = localePath(repo, root, SOURCE_LOCALE);
      const localeFile = localePath(repo, root, tag);
      if (!fs.existsSync(localeFile)) {
        errors.push(`${root}/${tag}: missing file src/locales/${tag}.json`);
        continue;
      }
      checked += 1;
      const brand = glossary?.[appOf(root)]?.brand ?? null;
      const rootBudgets = budgets?.[root] ?? null;
      let localeData;
      try {
        localeData = readJson(localeFile);
      } catch (error) {
        errors.push(`${root}/${tag}: invalid JSON (${error.message})`);
        continue;
      }
      for (const message of validateLocale({
        source: readJson(sourceFile),
        locale: localeData,
        tag,
        brand,
        budgets: rootBudgets,
      })) {
        errors.push(`${root}/${tag}: ${message}`);
      }
    }
  }
  return { errors, tags, checked };
}

function parseArgs(argv) {
  const options = { app: null, locale: null, repo: defaultRepoRoot() };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === '--locale' || flag === '--app' || flag === '--repo') {
      if (!value) {
        throw new Error(`${flag} needs a value`);
      }
      options[flag.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`unknown argument ${flag}`);
    }
  }
  if (options.app && !(options.app in APPS)) {
    throw new Error(`--app must be one of ${Object.keys(APPS).join(', ')}`);
  }
  return options;
}

function main(argv) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  const { errors, tags, checked } = validateRepo(options);
  if (tags.length === 0) {
    console.log('No non-English locale files found.');
    return 0;
  }
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  console.log(
    `Checked ${checked} locale files for ${tags.length} locale(s): ${errors.length} error(s)`
  );
  return errors.length === 0 ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = main(process.argv.slice(2));
}
