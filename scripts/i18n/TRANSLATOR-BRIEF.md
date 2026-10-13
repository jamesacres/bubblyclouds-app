# Translator brief

Instructions for translating the in-app strings of Sudoku Race and Unblock Race
into one locale. Read `PLAN-i18n-locales.md` (Design: Locale set, Brand and
product wording, Plurals, Text length, Translation pipeline and validation) for
the why.

You translate by hand as the model. You only create locale JSON files; you do
not edit code, tests, loaders or any other file and you do not touch git.

## Inputs

English sources (1,329 strings). The output for tag `<tag>` is the same path
with `<tag>.json` next to each `en.json`:

- `packages/ui/src/locales/en.json`
- `packages/auth/src/locales/en.json`
- `packages/template/src/locales/en.json`
- `packages/games/src/locales/en.json`
- `packages/sudoku/src/locales/en.json`
- `packages/unblockrace/src/locales/en.json`
- `apps/sudoku/src/locales/en.json`
- `apps/unblockrace/src/locales/en.json`

Reference material:

- Glossary (binding): `scripts/i18n/glossary/<tag>.json`.
  `sudoku.brand` and `unblockrace.brand` are the exact values `brand.*` in each
  app bundle must equal (including the nested `$t(brand.gameName) Plus` form).
  `terms` is guidance: use these words for race, team, leaderboard, hint, undo,
  theme, daily puzzle, monthly collection or book, AI opponent, monthly,
  lifetime, Plus access. Package bundles also hold brand-like strings
  (`gameName`, `plus`): use the glossary of the app the package belongs to
  (`sudoku` package -> sudoku app, `unblockrace` package -> unblockrace app;
  shared packages use the glossary `plus` word).
- Length budgets (binding): `scripts/i18n/length-budgets.json`. For each listed
  key the rendered string must have at most `max` characters (code points),
  where every `{{placeholder}}` counts as two characters (two digits). Shorten
  the wording; never truncate mid-word and avoid cryptic one-letter
  abbreviations when a short natural form fits.
- Store copy for tone, register and vocabulary only (do not copy sentences):
  the store listing text, whose paths the supervisor gives you.
- Pilot translations you may read for consistency of approach:
  `*/src/locales/de.json`, `ja.json`, `fi.json`, `ar.json`.

## Rules

1. Same JSON structure and key order as `en.json`; never translate keys.
   2-space indent, UTF-8, trailing newline, no `\u` escapes for non-ASCII.
2. Preserve exactly: `{{placeholders}}`, HTML-like tags such as
   `<bold>...</bold>`, `$t(brand.x)` nesting, emoji, line breaks and structural
   punctuation. Tag names stay English; translate only the text inside. Keep
   digits as digits (game data is rendered in Latin digits).
3. Plurals: English uses `_one` / `_other`. The target must have exactly the
   CLDR cardinal categories of the tag, from
   `node -e "console.log(new Intl.PluralRules('<tag>').resolvedOptions().pluralCategories)"`,
   each as an i18next suffix (`_zero _one _two _few _many _other`), each form
   containing `{{count}}` where English does (a non-`_other` form may omit it
   only where the language idiom requires). Keys of the form
   `*_ordinal_*` follow
   `new Intl.PluralRules('<tag>', {type:'ordinal'}).resolvedOptions().pluralCategories`.
   Do not emit a category the locale lacks and do not omit one it has.
4. `agents.<id>.name` are character names: Latin-script languages keep them as
   names; non-Latin scripts transliterate them naturally and consistently.
   `personality`, `emojiName` labels and every `voiceLines` entry are
   translated; `voiceLines` arrays keep their number of entries.
5. Sudoku technique names (`techniques.*`) use the standard term in the
   language when sudoku communities have one, otherwise the common English name
   or a clear translation. Be consistent between the two game bundles.
6. Register: match the store copy (it states formal or informal). Strings that
   address friends (share text, invites) read naturally for a message sent to a
   friend. Keep the same register in all eight files.
7. Concise UI wording; sentence case consistent with English; accessibility
   labels (`aria-label`) natural. Do not leave English except brand names,
   proper nouns, URLs and symbols the glossary keeps.
8. Avoid inflecting interpolated brand names or placeholders where the language
   has case or gender agreement; reword instead.
9. Do not add or remove keys (apart from the plural-category reconciliation in
   rule 3). Do not change numbers or units. Text direction is handled by the
   app; do not insert bidi control characters.
10. For right-to-left languages use native punctuation; keep unavoidable Latin
    fragments (brand names, key names such as "Shift") to a minimum.

## Validate and finish

Validate until clean, from the repo root, for your tag:

```
node scripts/i18n/validate.mjs --locale <tag>
node scripts/i18n/validate.mjs --locale <tag> --app sudoku
node scripts/i18n/validate.mjs --locale <tag> --app unblockrace
```

Then `npx prettier --write` your eight files. Do not register the locale in any
`i18n.ts`; the supervisor does that.

## Report

Files written, exact validator output, glossary terms used, judgement calls
(technique terms, transliterations, strings shortened for budgets, ambiguous
English), and the 10 strings you are least certain about (key, translation,
why). No large listings.
