# Native review brief

All 46 non-English locale files are machine translations written by the model
against the glossary (`scripts/i18n/glossary`) and length budgets
(`scripts/i18n/length-budgets.json`), and mechanically validated
(`node scripts/i18n/validate.mjs`). They have not been reviewed by native
speakers.

## Review priority

| Tier | Locales | Why |
| ---- | ------- | --- |
| 1 | `ar`, `he`, `ur` | Right-to-left layout, mixed Latin fragments, six Arabic plural forms, Urdu Nastaliq text |
| 1 | `ja`, `ko`, `zh-Hans`, `zh-Hant` | No word spaces, fixed technique terms, speech-level choices |
| 2 | `hi`, `bn`, `mr`, `gu`, `kn`, `ml`, `ta`, `te`, `or`, `pa`, `th` | No community sudoku vocabulary; transliterated technique names; `or` has no store product wording |
| 3 | `ru`, `uk`, `pl`, `cs`, `sk`, `sl`, `hr`, `ro`, `hu`, `fi`, `tr`, `el` | Case and gender agreement around interpolated names, difficulty ladders |
| 4 | `de`, `fr`, `fr-CA`, `es`, `es-MX`, `it`, `pt`, `pt-PT`, `nl`, `sv`, `da`, `nb`, `ca`, `id`, `ms`, `vi` | Lowest expected risk |

## Recurring issues worth fixing in the English source

Translators flagged the same ambiguities in nearly every language. Fixing the
source once fixes them everywhere:

- `difficulty.daily.simple` is labelled "Tricky" but is the easiest daily tier;
  the key name and the label disagree.
- "Par" (Unblock Race) has no equivalent in most languages and is rendered as a
  golf loanword or "target/norm" inconsistently.
- "Run" (a multi-stage run) is rendered as race, series or all stages.
- `lobby.away` ("Away") and `session.cheated` ("Cheated") are short status
  words with no context.
- "Local Agent" in `partyConfirmation.removeAgent.title` is ambiguous (AI rival?).
- `invite.bonus.duration.premium` is used as a duration, which reads oddly once
  the sentence is restructured.
- Split sentences built from two keys (`morePuzzlesPrefix` plus a link,
  `crossPromo.whyNotTry` plus a game name) assume English word order.
- `raceTrack.racingLabel` is a lowercase label with no visible context.
- `scoringLegend.dailyCombo.puzzleOrMore` ("Puzzle N+") and
  `difficultyMultipliers.daily` ("{{gameName}} of the Day") force awkward
  construction around an interpolated brand name.
- The November book cover refers to Bonfire Night; every translator replaced it
  with an autumn-evening line.

## Constraints a reviewer must respect

- Keep `{{placeholders}}`, `<tags>`, `$t(...)` nesting and emoji exactly.
- Keep `brand.*` equal to the glossary (these match the store listings).
- Length budgets count placeholders as two characters; the validator enforces
  them. Shorten wording, do not truncate.
- Plural suffixes must match the CLDR categories of the locale.

After editing, run `node scripts/i18n/validate.mjs --locale <tag>`.
