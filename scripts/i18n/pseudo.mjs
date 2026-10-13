// Generates committed dev-only pseudo-locales (en-XA, ar-XB) from each en.json; run `pnpm run i18n:pseudo`.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  expectedKeys,
  flatten,
  SOURCE_LOCALE,
  unflatten,
} from './localeKeys.mjs';
import { defaultRepoRoot, localePath, rootsFor } from './roots.mjs';

const EXPANSION = 0.4;
const ACCENT_FILLER = 'ƒïłłéŕ ŧéẋŧ ẃöŕđš ';
const ARABIC_FILLER = 'كلمات إضافية للاختبار ';
const ACCENTED = {
  a: 'àáâãäåāăą',
  b: 'ƀɓ',
  c: 'çćĉċč',
  d: 'ďđ',
  e: 'èéêëēĕėęě',
  f: 'ƒ',
  g: 'ĝğġģ',
  h: 'ĥħ',
  i: 'ìíîïĩīĭįı',
  j: 'ĵ',
  k: 'ķ',
  l: 'ĺļľŀł',
  m: 'ɱ',
  n: 'ñńņňŋ',
  o: 'òóôõöøōŏő',
  p: 'ƥ',
  q: 'ɋ',
  r: 'ŕŗř',
  s: 'śŝşš',
  t: 'ţťŧ',
  u: 'ùúûüũūŭůűų',
  v: 'ʋ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ýÿŷ',
  z: 'źżž',
};
const ARABIC = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
const RLE = '‫';
const PDF = '‬';
const EMOJI_CHARS =
  '\\p{Extended_Pictographic}\\p{Emoji_Modifier}\\uFE0F\\u200D\\u20E3\\p{Regional_Indicator}';
const PRESERVED_RE = new RegExp(
  `\\{\\{[^}]*\\}\\}|<\\/?[A-Za-z0-9][^<>]*?\\/?>|\\$t\\([^)]*\\)|[${EMOJI_CHARS}]+`,
  'gu'
);
const EDGE_RE = new RegExp(
  `^([${EMOJI_CHARS}\\s]*)([\\s\\S]*?)([${EMOJI_CHARS}\\s]*)$`,
  'u'
);

function accent(char) {
  const lower = char.toLowerCase();
  const pool = ACCENTED[lower];
  if (!pool) {
    return char;
  }
  const mapped = pool[(char.charCodeAt(0) + lower.charCodeAt(0)) % pool.length];
  return char === lower ? mapped : mapped.toUpperCase();
}

function arabic(char) {
  const lower = char.toLowerCase();
  if (lower < 'a' || lower > 'z') {
    return char;
  }
  return ARABIC[(lower.charCodeAt(0) - 97) % ARABIC.length];
}

function filler(count, source) {
  if (count <= 0) {
    return '';
  }
  let out = '';
  for (let index = 0; index < count; index += 1) {
    out += source[index % source.length];
  }
  return ` ${out}`.replace(/\s+$/u, '');
}

function transformMiddle(text, { letter, wrap, fill }) {
  let letters = 0;
  let output = '';
  let cursor = 0;
  const convert = (plain) => {
    for (const char of plain) {
      if (/\p{L}/u.test(char)) {
        letters += 1;
      }
    }
    return [...plain].map((char) => letter(char)).join('');
  };
  let length = 0;
  for (const match of text.matchAll(PRESERVED_RE)) {
    const plain = text.slice(cursor, match.index);
    length += [...plain].length;
    output += convert(plain) + match[0];
    cursor = match.index + match[0].length;
  }
  const tail = text.slice(cursor);
  length += [...tail].length;
  output += convert(tail);
  const extra = letters === 0 ? 0 : Math.ceil(length * EXPANSION) + 1;
  return wrap(output + filler(extra, fill));
}

function transform(text, options) {
  const [, leading, middle, trailing] = EDGE_RE.exec(text);
  if (middle === '') {
    return text;
  }
  return `${leading}${transformMiddle(middle, options)}${trailing}`;
}

export function pseudoAccent(text) {
  return transform(text, {
    letter: accent,
    wrap: (value) => `[${value}]`,
    fill: ACCENT_FILLER,
  });
}

export function pseudoBidi(text) {
  return transform(text, {
    letter: arabic,
    wrap: (value) => `${RLE}[${value}]${PDF}`,
    fill: ARABIC_FILLER,
  });
}

const TRANSFORMS = { 'en-XA': pseudoAccent, 'ar-XB': pseudoBidi };

export function pseudoLocale(source, tag) {
  const transformText = TRANSFORMS[tag];
  const sourceFlat = flatten(source);
  const out = {};
  for (const { key, source: sourceKey } of expectedKeys(
    Object.keys(sourceFlat),
    tag
  )) {
    const value = sourceFlat[sourceKey];
    out[key] = Array.isArray(value)
      ? value.map((item) => transformText(String(item)))
      : typeof value === 'string'
        ? transformText(value)
        : value;
  }
  return unflatten(out);
}

export function generate({ repo, check = false }) {
  const stale = [];
  for (const root of rootsFor(null)) {
    const source = JSON.parse(
      fs.readFileSync(localePath(repo, root, SOURCE_LOCALE), 'utf8')
    );
    for (const tag of Object.keys(TRANSFORMS)) {
      const file = localePath(repo, root, tag);
      const content = `${JSON.stringify(
        pseudoLocale(source, tag),
        null,
        2
      ).replace(
        /[\u202A-\u202E]/gu,
        (char) => `\\u${char.charCodeAt(0).toString(16)}`
      )}\n`;
      if (check) {
        if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) {
          stale.push(path.relative(repo, file));
        }
      } else {
        fs.writeFileSync(file, content);
      }
    }
  }
  return stale;
}

function main(argv) {
  const check = argv.includes('--check');
  const repoFlag = argv.indexOf('--repo');
  const repo = repoFlag >= 0 ? argv[repoFlag + 1] : defaultRepoRoot();
  const stale = generate({ repo, check });
  if (check && stale.length > 0) {
    console.error(
      `Stale pseudo-locales (run pnpm run i18n:pseudo):\n${stale.join('\n')}`
    );
    return 1;
  }
  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = main(process.argv.slice(2));
}
