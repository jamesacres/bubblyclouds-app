# PLAN: ship the App Store locales in the apps (translations, RTL, fit)

Follows `PLAN-i18n-english-keys.md` (complete: English keys, detection,
`LanguageSelect`, `useLocale`, `createI18n`). That plan deliberately deferred
"second locale and its translations, RTL, store-listing alignment". This plan
is those three things.

## Status

Complete. Remaining follow-ups: native review (`scripts/i18n/NATIVE-REVIEW.md`),
visual check with the `en-XA` / `ar-XB` pseudo-locales, and a native release.

Approved (all recommended decisions, with decision 4 changed: the language
selector stays in the avatar menu only, since the locale is detected by
default).

- [x] T0 Infrastructure (pseudo-locale files `en-XA` / `ar-XB` are committed; glossary and budget file shapes defined in `ARCHITECTURE.md`)
- [x] T1 Glossary and length budgets (budgets measure `{{placeholders}}` as two digits)
- [x] T2 RTL, fit and fonts (T2a shared packages, T2b games/game packages/apps)
- [x] T3 Pilot translations (`de`, `ar`, `ja`, `fi`), registered in both apps; shared rules in `scripts/i18n/TRANSLATOR-BRIEF.md`
- [x] T4 Remaining locales: 42 more locales translated in 5 waves (46 total plus English), each validated and registered with `scripts/i18n/register.mjs`
- [x] T5 Native shells (app name, per-app language) and `document.title`; generator `scripts/i18n/native.mjs`; needs `cap sync` and a native release
- [x] T6 Gate: root build 7/7, root tests 15/15 (`turbo run test --concurrency=3`), lint 0 errors, validator 368 files / 46 locales clean, audit clean, native check clean

## Goal

Both apps (`apps/sudoku` Sudoku Race, `apps/unblockrace` Unblock Race) ship in
every language we already localised in the App Store / Google Play listings,
with:

- the same brand and product wording the store listings use (app name,
  subscription and lifetime names) so users see one consistent name per
  language;
- right-to-left layout that is correct for Arabic, Hebrew and Urdu;
- layouts that survive long languages (German, Finnish, Greek, Russian) without
  clipped or overlapping text.

## Scope

In scope: `apps/sudoku`, `apps/unblockrace`, and the packages they use
(`@ui`, `@auth`, `@template`, `@games`, `@sudoku`, `@unblockrace`); native
shells (`ios/`, `android/`) for per-app language and localised app label.

Out of scope: `apps/bubblyclouds`, `apps/jamesacres`, `apps/stephenesch`,
`@blog`, Electron app-name localisation, per-locale web metadata (the apps are
`output: 'export'`; metadata stays build-time, default locale, as decided in the
previous plan), store listings (already done).

## Current state (measured)

- 1,329 unique translatable strings, 32.5k characters across 8 bundles; one app
  loads about 830-920 of them (`ui`, `auth`, `template`, `games`, one game
  package, `app`). 66 plural keys.

  | Bundle                  | Keys | Chars |
  | ----------------------- | ---- | ----- |
  | `packages/ui`           | 37   | 437   |
  | `packages/auth`         | 34   | 696   |
  | `packages/template`     | 173  | 3,527 |
  | `packages/games`        | 180  | 2,761 |
  | `packages/sudoku`       | 270  | 5,456 |
  | `packages/unblockrace`  | 200  | 4,435 |
  | `apps/sudoku` (app)     | 228  | 8,555 |
  | `apps/unblockrace` (app)| 207  | 6,711 |

- `apps/*/src/i18n.ts` imports only `en`; `supportedLocales = ['en']`.
  `jest.setup.i18n.js` hard-codes `en`.
- Tailwind v4, Next 16, Capacitor 8, `output: 'export'`.
- RTL: no logical utilities and no `rtl:` variants in the code today.
  Physical-direction usages to convert (non-test src, both apps + packages):
  64 `ml/mr/pl/pr`, 54 `left/right-*`, 30 `text-left/right`, 19 `space-x-*`
  (Tailwind v4 emits logical margins for `space-x`, to be verified).
  `<html dir>` is never set.
- Fonts: Outfit, Orbitron, Pacifico, Creepster via `next/font/google`
  (Latin-only subsets in use). Arabic, Hebrew, CJK, Indic and Thai text falls
  back to the system stack today; Cyrillic/Greek fall back for Outfit/Orbitron.
- Native: `CFBundleLocalizations` is not declared in `Info.plist`; Android has
  only `values/strings.xml` (`app_name`) and no `locales_config.xml` /
  `android:localeConfig`.
- Brand terms already live in `brand.*` (`appName`, `gameName`, `plus`,
  `plusName` / `plusProduct`); `app.config.js` derives native identifiers from
  `en.json` (not runtime-translated).
- Store wording already produced and uploaded (scratchpad of the store
  sessions): localised app names, "Plus Access" group names, Monthly / Lifetime
  names and the feature line, for 38-49 locales. This is the glossary source.

## Design

### Locale set

The 49 store locales collapse to 46 translation files plus English, because
`en-GB/US/AU/CA` share one file and `es-MX`, `fr-CA`, `pt-PT`, `zh-Hant` are
regional files falling back to their base:

| Files | Tags |
| ----- | ---- |
| Base | `ar bn ca cs da de el es fi fr gu he hi hr hu id it ja kn ko ml mr ms nl nb or pa pl pt ro ru sk sl sv ta te th tr uk ur vi zh-Hans` |
| Regional | `es-MX fr-CA pt-PT zh-Hant` (full files; fallback to base then `en`) |
| Source | `en` |

- `nb` is the BCP-47 tag for the store's `no`; `resolveLocale` maps
  `no`, `nn`, `nb` to `nb`.
- `pt` means Brazilian Portuguese (store `pt-BR`); `pt-PT` is separate.
- `zh-Hans` base; `zh-Hant` also serves `zh-TW`, `zh-HK`, `zh-Hant-*`.
- i18next `fallbackLng` becomes a map (`es-MX → es → en`, etc.).

### Loading

English stays bundled and synchronous (no flash for the default). Every other
locale is a dynamic `import()` chunk per locale per app, loaded when detected or
chosen, so the initial bundle does not grow. First paint for a non-English
device renders English, then swaps after the chunk loads (the provider already
renders default first and applies the detected locale after mount). Result:
one extra small chunk (roughly 10-30 KB gzipped) per session. Alternative
(bundle everything) is rejected: about 2 MB of JSON in the shipped web bundle.

### Brand and product wording ("same as the store")

- A repo-tracked glossary `scripts/i18n/glossary/<tag>.json` is generated from
  the store localisations: `appName`, `gameName` (the short brand before the
  colon in the store name), `plusAccess`, `monthly`, `lifetime`, the feature
  line, and the recurring game terms (race, team, leaderboard, hint, undo,
  theme, daily). Translators must use it verbatim.
- Each app's `app` namespace `brand.*` per locale is filled from the glossary
  (so Sudoku in German reads "Sudoku-Rennen", Unblock Race reads
  "Freifahrt-Rennen"), and flows down through the existing props and
  `$t(brand.*)` interpolation. `plusName` / `plusProduct` follow the store group
  name.
- Product titles and prices shown by the purchase sheet come from StoreKit /
  Play Billing and will already read the store localisations once those are
  approved; the in-app copy around them uses the same glossary wording.
- Native identifiers (`appName` in `app.config.js`, bundle ids) remain English.

### Plurals

i18next suffixes differ per language (`ar`: zero/one/two/few/many/other;
`ru uk pl cs sk hr sl`: one/few/many/other; `fr`: one/many/other; `he`:
one/two/other; `ja ko zh th vi id ms`: other only). The 66 plural keys must
carry exactly the categories `Intl.PluralRules(<tag>)` reports. The audit is
extended (Node helper, because Python has no CLDR) to require the right set per
locale and fail on missing or extra suffixes.

### RTL (ar, he, ur)

- `dir` is set on `<html>` from the active locale (`Intl.Locale#getTextInfo`,
  with a static fallback list `ar he ur fa` for WebViews without it) in
  `I18nProvider`, alongside `lang`.
- Convert physical utilities to logical ones: `ml/mr` → `ms/me`, `pl/pr` →
  `ps/pe`, `left/right` → `start/end`, `text-left/right` → `text-start/end`,
  `rounded-l/r` → `rounded-s/e`, `border-l/r` → `border-s/e`. Where a value is
  not expressible logically, use `rtl:` variants.
- Directional icons (chevrons, arrows, back/forward, send) get `rtl:` mirroring;
  non-directional icons stay.
- **LTR islands:** game geometry is not mirrored. The sudoku grid, number pad,
  unblock board and race track keep `dir="ltr"` on their root; puzzle digits
  always render as Latin digits. Chrome around them (headers, sheets, lobby,
  leaderboards) mirrors. Row text inside leaderboards flows RTL; positions
  (rank 1 first) follow the list order.
- Numbers and dates use `Intl` with the active locale; game data (scores, move
  counts, timers, puzzle digits) uses the `-u-nu-latn` numbering system so Arabic
  and Urdu do not mix Arabic-Indic and Latin digits in one timer.
- Verified by tests that assert `dir`, mirrored class output and LTR islands,
  plus an RTL pseudo-locale (below). No browser run (repo rule); you verify
  visually.

### Text length

- Pseudo-locales for dev and review: `en-XA` (every string expanded about
  40 percent with accents and bracketed, placeholders preserved) and `ar-XB`
  (bidi-marked RTL pseudo). Selectable only in dev builds.
- Layout hardening in the shared components: remove fixed widths and fixed
  heights from text-bearing elements (`w-*`, `h-*`, `truncate`,
  `whitespace-nowrap`, line-clamps) unless the slot is intentionally
  one-line, add `min-w-0`, `break-words` / `overflow-wrap: anywhere` and
  `hyphens: auto` (works because `lang` is set), and prefer flex-wrap for
  button rows and tab bars.
- Length budgets: `scripts/i18n/length-budgets.json` lists the genuinely
  constrained keys (tab labels, badges, buttons, toasts, share titles) with a
  max length. The validator fails any locale that exceeds a budget; the
  translator is told the budget and must shorten, not truncate.
- German, Finnish and Greek are in the pilot wave specifically to exercise this.

### Fonts

Keep Outfit, Orbitron, Pacifico and Creepster for Latin text. Add per-language
fallback stacks (`:lang(ja)`, `:lang(zh-Hans)`, `:lang(zh-Hant)`, `:lang(ko)`,
`:lang(ar)`, `:lang(he)`, `:lang(hi|bn|...)`, `:lang(th)`) to system fonts so
glyph variants are right and nothing renders as tofu. No new webfont downloads
(size and licensing). Display fonts degrade to the system face for scripts they
do not cover; this is a visual change to accept (decision below).

### Native shells

- iOS: declare `CFBundleLocalizations` for all shipped tags (required for the
  per-app language setting and App Store language list) and add
  `InfoPlist.strings` per locale for `CFBundleDisplayName` and any usage
  descriptions (camera for puzzle import, to be confirmed from `Info.plist`).
- Android: `res/values-<qualifier>/strings.xml` `app_name` per locale,
  `res/xml/locales_config.xml`, and `android:localeConfig` in the manifest.
- Home-screen label: localised short brand (the part before the colon), not the
  30-character store name (it truncates under the icon). See decision.
- `document.title` is updated client-side when the locale changes (static
  metadata stays default-locale).
- Requires `cap sync` and a native release; nothing else in the plan does.

### Translation pipeline and validation

- Translators (subagents, fresh context, one to three locales each) receive:
  the eight English bundles for their app set, the glossary entry, the length
  budgets, and the rules (keep `{{x}}`, `<tag>` pairs, `$t(...)`, emoji and
  line breaks exactly; use the same register as the store copy; formal register
  where the language distinguishes it; plural suffixes per CLDR).
- Output is one JSON per bundle per locale at
  `<pkg>/src/locales/<tag>.json` (same shape and key order as `en.json`).
- `scripts/i18n/validate.mjs` (new) fails on: key set differs from `en`,
  placeholder/tag/nesting mismatch, wrong plural categories, budget exceeded,
  empty or untranslated (identical to English where the glossary says it must
  differ), and brand drift (`brand.*` not equal to glossary).
- All output is machine translation and unreviewed by a native speaker; the
  report lists locales ranked by risk (Indic, Urdu, Thai, Arabic, Hebrew first).

## Task breakdown

Dependencies: T0 → T1 and T2 in parallel → T3 → T4 waves → T5 (parallel with
T4 once T1 is merged) → T6 gate.

| Task | Scope | Depends on |
| ---- | ----- | ---------- |
| T0 | Infra: locale tags/fallbacks, lazy loading, `dir`, plural-aware audit, validator, pseudo-locales, Jest multi-locale | - |
| T1 | Glossary + length budgets (data + validator hookup) | T0 |
| T2 | RTL + layout hardening + fonts (code only, no translations) | T0 |
| T3 | Pilot translations: `de`, `ar`, `ja`, `fi` for both apps; review gate | T1, T2 |
| T4 | Remaining locales in waves of up to 4 subagents | T3 approved |
| T5 | Native shells and `document.title` | T1 |
| T6 | Gate: audit all, validate all, lint, build, test, size report, docs | all |

### T0 - Infrastructure

1. `resolveLocale`: add `no/nn → nb`, script-aware zh mapping, regional
   fallback chain; extend tests.
2. `createI18n`: `fallbackLng` map, `supportedLngs`, per-locale lazy loader
   (`addResourceBundle` after dynamic import), no React/browser imports kept
   build-safe.
3. `apps/<app>/src/i18n.ts`: keep `DEFAULT_LOCALE`, `supportedLocales`,
   `resources` (English only, synchronous) and add an explicit
   `localeLoaders` map (one dynamic import per tag, bundled per app).
4. `I18nProvider`: set `dir`, load chunk on detect/choose, keep first-render
   English, `document.title` hook.
5. `scripts/i18n_audit.py` / `scripts/i18nAudit.sh`: multi-locale parity;
   CLDR plural check via a small Node helper.
6. `scripts/i18n/validate.mjs` (placeholders, tags, plurals, budgets, glossary).
7. Pseudo-locale generator and dev-only registration (`en-XA`, `ar-XB`).
8. Jest: `jest.setup.i18n.js` loads every available locale into the shared
   instance (tests keep defaulting to `en`); tests for RTL provider behaviour
   with fixture locales.

### T1 - Glossary and budgets

1. Export the store terms into `scripts/i18n/glossary/<tag>.json` for all
   locales (names, Plus access, monthly, lifetime, feature line, core terms).
2. Identify constrained UI keys per package and write
   `scripts/i18n/length-budgets.json` with a limit and a reason per key.
3. Add glossary and budget checks to the validator.

### T2 - RTL, fit and fonts

1. Logical-property conversion across all in-scope packages and apps; update
   affected tests.
2. LTR islands on sudoku grid, number pad, unblock board, race track.
3. Directional icons get `rtl:` handling.
4. Remove fixed sizing from text-bearing elements, add wrapping and
   hyphenation utilities; short report of every slot that stays one-line and
   why.
5. Per-`:lang()` font fallbacks in both `globals.css`.
6. Numeral handling helper for game data (`-u-nu-latn`).

### T3 - Pilot

Translate `de` (long text), `ar` (RTL, six plural forms), `ja` (CJK, no spaces)
and `fi` (long words, agglutination) for both apps' bundles. Gate: validator
clean, you review a sample plus an `en-XA` / `ar-XB` pass. Output of this task
fixes the translation prompt before the volume run.

### T4 - Waves

Remaining 42 locales (including `es-MX`, `fr-CA`, `pt-PT`, `zh-Hant`) in waves of
at most four subagents running in parallel, each owning one to three locales;
validator must be clean before the next wave starts.

### T5 - Native

iOS `CFBundleLocalizations` and per-locale `InfoPlist.strings`; Android
`values-*` `strings.xml`, `locales_config.xml`, manifest attribute; confirm
usage-description keys from `Info.plist`; `document.title` on locale change.

### T6 - Gate

1. `pnpm run i18n:audit` and `scripts/i18n/validate.mjs` clean for every
   locale and both apps.
2. Re-run the raw-string searches; no new raw strings.
3. `pnpm run build`, `pnpm run test`, `pnpm run lint:fix`; report per-locale
   chunk sizes and total.
4. Update `ARCHITECTURE.md` (Internationalisation section: locale set, lazy
   loading, RTL rules, how to add a locale), package READMEs, `PLAN` status.

## Decisions to confirm

1. **Locale files:** 46 translation files plus `en`, with English variants
   collapsed to `en`, and regional files only for `es-MX`, `fr-CA`, `pt-PT`,
   `zh-Hant`. (Recommended.) Alternative: one file per store locale (49), which
   duplicates the English variants.
2. **Loading:** English synchronous, others lazy per-locale chunks, accepting a
   brief English flash on first launch in another language. (Recommended.)
   Alternative: bundle all, no flash, about 2 MB heavier.
3. **RTL:** chrome mirrors, game boards and race tracks stay LTR, game data uses
   Latin digits. (Recommended.)
4. **Language selector entry point:** stays in the avatar menu only
   (decided). The locale is detected by default, so no signed-out entry point
   is added.
5. **Home-screen label:** localise the short brand (before the colon) in
   `InfoPlist.strings` / `app_name`, rather than the full 30-character store
   name or leaving English. (Recommended.)
6. **Fonts:** accept system-font fallback for scripts the display fonts do not
   cover, no new webfonts. (Recommended.)
7. **Quality:** machine translation, validated mechanically, no native review
   before release. Recommend at least a native check of `ar`, `he`, `ur`, `ja`,
   `zh-Hans`, `zh-Hant` and the Indic set before shipping them in the app.
8. **Rollout:** ship all 47 at once, or ship the pilot four plus the store's
   highest-value locales first and add the rest in a later release.

## Adding a locale later (checklist)

1. Add `src/locales/<tag>.json` to each bundle and a glossary entry.
2. Register the loader in each `apps/<app>/src/i18n.ts` and add the tag to
   `supportedLocales`.
3. Add native entries (T5) and the store locale (asc / gplay skills).
4. Run the validator and audit.
