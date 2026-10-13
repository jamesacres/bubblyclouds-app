import { pathToFileURL } from 'node:url';

export function pluralCategories(tag, type = 'cardinal') {
  return new Intl.PluralRules(tag, { type }).resolvedOptions().pluralCategories;
}

function main(tags) {
  const result = {};
  for (const tag of tags) {
    result[tag] = {
      cardinal: pluralCategories(tag, 'cardinal'),
      ordinal: pluralCategories(tag, 'ordinal'),
    };
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
