import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import allowlist from './physicalDirectionAllowlist.json';

const REPO_ROOT = resolve(__dirname, '../../../..');
const SCANNED_ROOTS = [
  'packages/ui/src',
  'packages/auth/src',
  'packages/template/src',
  'packages/games/src',
  'packages/sudoku/src',
  'packages/unblockrace/src',
  'apps/sudoku/src',
  'apps/unblockrace/src',
];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css'];
const SKIPPED_DIRECTORIES = ['node_modules', 'locales', 'coverage', 'dist'];

const VARIANTS = String.raw`(?:[a-z0-9_\[\]=&>*.-]+:)*`;
const TAILWIND_BOUNDARY = String.raw`(?<![\w-])`;

const RULES: { name: string; pattern: RegExp; hint: string }[] = [
  {
    name: 'margin/padding/inset utility',
    pattern: new RegExp(
      `${TAILWIND_BOUNDARY}${VARIANTS}-?(?:ml|mr|pl|pr|left|right|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-(?=[\\w\\[./])`
    ),
    hint: 'use ms-/me-/ps-/pe-/start-/end-',
  },
  {
    name: 'text alignment utility',
    pattern: new RegExp(
      `${TAILWIND_BOUNDARY}${VARIANTS}text-(?:left|right)\\b`
    ),
    hint: 'use text-start/text-end',
  },
  {
    name: 'corner or side radius/border utility',
    pattern: new RegExp(
      `${TAILWIND_BOUNDARY}${VARIANTS}(?:rounded|border)-(?:l|r|tl|tr|bl|br)(?:-|\\b)`
    ),
    hint: 'use rounded-s/e, rounded-ss/se/es/ee, border-s/e',
  },
  {
    name: 'float utility',
    pattern: new RegExp(
      `${TAILWIND_BOUNDARY}${VARIANTS}float-(?:left|right)\\b`
    ),
    hint: 'use float-start/float-end',
  },
  {
    name: 'horizontal translate without rtl pair',
    pattern: new RegExp(
      `(?<![\\w:-])-?translate-x-(?!0(?![\\w.]))(?=[\\w\\[])(?![^'"\`]*rtl:)`
    ),
    hint: 'add an rtl: counterpart',
  },
  {
    name: 'physical inline style property',
    pattern:
      /\b(?:marginLeft|marginRight|paddingLeft|paddingRight|borderLeft|borderRight|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)\b\s*:/,
    hint: 'use marginInlineStart/End, paddingInline*, borderStartStartRadius...',
  },
  {
    name: 'physical inline offset or text-align',
    pattern:
      /(?<![\w.-])(?:left|right)\s*:\s*[-\d'"`]|textAlign\s*:\s*['"](?:left|right)['"]/,
    hint: 'use insetInlineStart/End or textAlign start/end',
  },
  {
    name: 'physical CSS property',
    pattern:
      /(?<![\w-])(?:margin-left|margin-right|padding-left|padding-right|border-left|border-right|float\s*:\s*(?:left|right)|text-align\s*:\s*(?:left|right))\b/,
    hint: 'use the logical CSS property',
  },
  {
    name: 'horizontal translateX in CSS',
    pattern: /translateX\((?!var\(|0\))/,
    hint: 'drive the sign from a variable so it flips under RTL',
  },
];

interface Offence {
  location: string;
  rule: string;
  text: string;
}

const findOffences = (filePath: string, source: string): Offence[] => {
  const offences: Offence[] = [];
  source.split('\n').forEach((line, index) => {
    RULES.forEach((rule) => {
      if (rule.pattern.test(line)) {
        offences.push({
          location: `${filePath}:${index + 1}`,
          rule: `${rule.name} (${rule.hint})`,
          text: line.trim(),
        });
      }
    });
  });
  return offences;
};

const isAllowed = (offence: Offence): boolean => {
  const file = offence.location.slice(0, offence.location.lastIndexOf(':'));
  return allowlist.some(
    (entry) =>
      entry.file === file &&
      entry.reason.length > 0 &&
      offence.text.includes(entry.match)
  );
};

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      return SKIPPED_DIRECTORIES.includes(name) ? [] : collectSourceFiles(path);
    }
    const isSource = SOURCE_EXTENSIONS.some((extension) =>
      name.endsWith(extension)
    );
    const isTest = /\.test\.(?:ts|tsx)$/.test(name) || name.endsWith('.d.ts');
    return isSource && !isTest ? [path] : [];
  });

describe('physical direction rules', () => {
  const matches = (source: string) => findOffences('fixture.tsx', source);

  it.each([
    ['ml-2', 'className="ml-2"'],
    ['pr-4 with variant', 'className="md:pr-4"'],
    ['negative right', 'className="absolute -right-10"'],
    ['left-0', 'className="fixed left-0 top-0"'],
    ['text-left', 'className="text-left"'],
    ['rounded-l', 'className="rounded-l-[5px]"'],
    ['border-r', 'className="border-r"'],
    ['float', 'className="float-right"'],
    ['translate-x', 'className="translate-x-5"'],
    ['marginLeft', 'style={{ marginLeft: 4 }}'],
    ['left offset', "style={{ left: '25%' }}"],
    ['css right', 'right: 20px;'],
    ['translateX', 'transform: translateX(400px);'],
  ])('flags %s', (_name, source) => {
    expect(matches(source)).not.toHaveLength(0);
  });

  it.each([
    ['logical margin', 'className="ms-2 me-2 ps-1 pe-1"'],
    ['logical inset', 'className="start-0 end-0 inset-x-0"'],
    ['logical text', 'className="text-start text-end"'],
    ['logical radius', 'className="rounded-s-lg rounded-e-lg"'],
    ['translate with rtl pair', 'className="translate-x-5 rtl:-translate-x-5"'],
    ['space-x', 'className="space-x-2"'],
    ['geometry read', 'const x = rect.left + rect.width;'],
    ['type member', 'left: number;'],
    ['bottom-left word', 'const flexLeft = 1;'],
    ['logical inline style', 'style={{ insetInlineStart: 4 }}'],
    ['css var translate', 'transform: translateX(var(--slide));'],
  ])('allows %s', (_name, source) => {
    expect(matches(source)).toHaveLength(0);
  });
});

describe('allowlist', () => {
  it('gives every entry a reason and a match', () => {
    allowlist.forEach((entry) => {
      expect(entry.file.length).toBeGreaterThan(0);
      expect(entry.match.length).toBeGreaterThan(0);
      expect(entry.reason.length).toBeGreaterThan(0);
    });
  });

  it('only lists entries that are still needed', () => {
    const unused = allowlist.filter((entry) => {
      const source = readFileSync(join(REPO_ROOT, entry.file), 'utf8');
      return !findOffences(entry.file, source).some((offence) =>
        offence.text.includes(entry.match)
      );
    });
    expect(unused).toEqual([]);
  });
});

describe('sources use logical direction utilities', () => {
  it.each(SCANNED_ROOTS)('%s has no physical direction', (root) => {
    const sourceRoot = join(REPO_ROOT, root);
    const offences = collectSourceFiles(sourceRoot)
      .flatMap((path) =>
        findOffences(relative(REPO_ROOT, path), readFileSync(path, 'utf8'))
      )
      .filter((offence) => !isAllowed(offence))
      .map((offence) => `${offence.location} ${offence.rule}: ${offence.text}`);
    expect(offences).toEqual([]);
  });
});
