# PLAN: i18n foundation + English string extraction

Branch: `feature/localisation`

## Status

All tasks complete; T9 gate passed (audit clean, build/test/lint green,
built metadata identical to the previous English text).

- [x] T0 Infrastructure (i18n core, detection, selector, agent ids)
- [x] T1 `@ui`
- [x] T2 `@auth`
- [x] T3 `@template`
- [x] T4 `@games`
- [x] T5 `@sudoku`
- [x] T6 `@unblockrace`
- [x] T7 `apps/sudoku`
- [x] T8 `apps/unblockrace` (agent display reconciliation included)
- [x] T9 Gate: `pnpm run i18n:audit` (project-owned `scripts/i18n_audit.py` +
      `scripts/i18n_audit.config.json`), raw-string re-scan, lint, build, test,
      built `out/index.html` check, docs

Deliberate deviations from the plan:

- Locale files are JSON (as decided), keys are untyped strings.
- `agents.<id>.voiceLines.<mood>` keys are kept in the locale files but are not
  rendered; the audit allowlists them with that justification.
- Dev pages (`testers`, `test-errors`, `test-covers`) are left unlocalised.
- `bookCover.months.*` and the English month names used as cover lookup keys
  stay English (`en-US` is deliberate there); display labels use
  `i18n.language`.
- The language selector is only reachable when signed in (avatar menu).
- Found at the gate: `apps/unblockrace` motivational messages were still raw
  (now `motivational.messages` in `en.json`), `Credits` needed `'use client'`,
  and `GlobalErrorHandler`/`ErrorBoundary` rendered outside `I18nProvider` in
  both apps (now inside `Providers`). `apps/bubblyclouds` and `@blog`
  `Providers` also gained an `I18nProvider` because shared components they use
  call `useTranslation`.

## Goal

Introduce `react-i18next` and move every user-facing string in Sudoku Race and
Unblock Race (and the packages they use) behind stable translation keys, with
English as the only locale. No second locale is shipped; the work makes adding
one a pure translation task later.

## Scope

In scope:

- Apps: `apps/sudoku`, `apps/unblockrace`
- Packages: `@ui`, `@auth`, `@template`, `@games`, `@sudoku`, `@unblockrace`
- Language detection (browser and Capacitor) with fallback to English, and a
  language selector inside the user-avatar menu
- Next.js metadata (`title`, `description`) and `<html lang>` in both apps'
  `src/app/layout.tsx`, plus the descriptions in `app.config.js`

Out of scope:

- `apps/bubblyclouds`, `apps/jamesacres`, `apps/stephenesch`, `@blog`
- `@types` (no user-facing strings; confirm during audit)
- Any non-English locale file (only English ships; the detection and selector
  machinery is built and tested against fixture locales), RTL
- App Store / Play listing metadata (already handled by asc/gplay skills)
- `public/manifest.webmanifest` (has no `name`/`description`, only icons)

## Current state (audited)

- No i18n library, no locale files anywhere.
- Static export (`output: 'export'`) + Capacitor, so no server locale routing;
  detection is client-side only.
- Rough raw-string inventory in non-test `.tsx` (lower bound):

  | Location               | Files | Lines |
  | ---------------------- | ----- | ----- |
  | `packages/ui`          | 6     | 15    |
  | `packages/auth`        | 8     | 58    |
  | `packages/template`    | 21    | 137   |
  | `packages/games`       | 14    | 55    |
  | `packages/sudoku`      | 5     | 48    |
  | `packages/unblockrace` | 3     | 21    |
  | `apps/sudoku`          | 13    | 135   |
  | `apps/unblockrace`     | 12    | 125   |

- Non-JSX display strings also exist: `getTechniquesDisplay.ts`,
  `techniqueCategories.ts`, `difficultyDisplay.ts`, `dailyLabel.ts`,
  `nextPuzzleProgressLabel.ts`, agent configs (`defaultAgents.ts`,
  `selectDefaultAgents.ts`, `agentTiming.ts`, `Agent.ts`),
  `apps/*/src/config/subscriptionMessages.tsx`, `premiumFeatures.tsx`.
- Known guardrail violations:
  - `packages/template/src/components/ErrorBoundary.tsx` renders
    `error.message` to the UI.
  - `apps/sudoku/src/app/import/page.tsx` does `alert(error.message)`.
- Metadata: each app's `layout.tsx` has a static
  `export const metadata` fed by `APP_CONFIG.appName` /
  `APP_CONFIG.appDescription`; `<html lang="en">` is hard-coded. `app.config.js`
  also holds `mobileDescription` / `desktopDescription`, consumed only by
  `src/app/puzzle/page.tsx`. No page-level `generateMetadata` exists.
  `appDescription` has no consumer outside `layout.tsx`.
- Share text in `packages/ui/src/helpers/share.ts` is an English template
  string (`Join the … racing team on …!`).
- Hard-coded `'en-US'` / default-locale date formatting in 7 places
  (`currentMonth` in app pages, `BookProvider`, `CollectionProvider`,
  `dailyLabel.ts`); `toLocaleString()` on numbers in `games`.
- Pluralisation is likely hand-rolled (`count === 1 ? '' : 's'`); each task must
  search for it.

## Design

### Library

`i18next` + `react-i18next`. Client-side init, synchronous (resources bundled,
no async backend) so first render is never a flash of keys and Jest needs no
`act` dance.

### Where things live (respects layer rules)

- `@ui` (L1, lowest React package) owns the i18n core:
  - `packages/ui/src/config/i18n.ts` — `createI18n(resources)` returning a
    configured instance (`fallbackLng: 'en'`, `supportedLngs: ['en']`,
    `defaultNS`, `interpolation.escapeValue: false`, `returnNull: false`).
  - `packages/ui/src/providers/I18nProvider.tsx` — wraps `I18nextProvider`,
    sets `document.documentElement.lang` from the active language.
  - Exports follow the existing `./config/*`, `./providers/*` JIT pattern.
- Each package owns its own namespace and file:
  `packages/<pkg>/src/locales/en.json`, exported via `package.json`
  `"./locales/*": "./src/locales/*.json"`.
- Each app owns an `app` namespace: `apps/<app>/src/locales/en.json`, and an
  `apps/<app>/src/i18n.ts` that assembles all bundles and calls `createI18n`.
- Components call `useTranslation('<ns>')` from `react-i18next` directly (no
  re-export wrappers, per CLAUDE.md).

### Namespaces

`ui`, `auth`, `template`, `games`, `sudoku`, `unblockrace`, `app`
(app namespace is per-app, so keys may differ between the two apps).

### Key conventions

- Nested by area then element: `lobby.invite.copyLink`, `login.title`.
- camelCase leaf keys; no sentence text in keys.
- Interpolation `{{name}}`; plurals via `_one` / `_other` + `{ count }`.
- Brand and product terms live in the translation files like any other text,
  under a `brand.*` group, so translators can adapt or deliberately keep them:
  - App-level terms (app name, game name, company name, the "Plus" product
    name, feature/mode names) are in each app's `app` namespace
    (`apps/<app>/src/locales/en.json`, `brand.appName`, `brand.gameName`,
    `brand.companyName`, `brand.plus`, …) and flow down to packages through the
    existing props (`gameName`, `companyName`, …) or interpolation variables.
  - Third-party platform names that packages display (App Store, Google Play,
    Apple, Google, etc.) are in the owning package's namespace under
    `brand.*`.
  - Sentences reference them via interpolation (`{{gameName}}`) or i18next
    nesting (`$t(brand.gameName)`), never by hard-coding the word, so a brand
    term is defined once per namespace.
- Agent names (Bumblebee, Puddle, Sage, …) and their `personality`,
  `emotionalRole`/`emojiName` labels shown in the UI, and every `voiceLines`
  entry are translation keys: `agents.<agentId>.name`,
  `agents.<agentId>.personality`, `agents.<agentId>.voiceLines.<mood>` (array
  read with `returnObjects: true` plus a runtime string-array guard, no
  casts), in the owning package namespace (`sudoku`, `unblockrace`).
- Accessibility strings (`aria-label`, `title`, `alt`, `placeholder`) are
  localised like visible text.
- Strings consumed outside React (helpers, configs) are refactored so the
  caller passes `t` or the helper returns a key plus params; helpers do not
  import the i18n singleton.

### Language detection

Resolution order (first supported match wins):

1. Stored user choice (`localStorage`, key `bubblyclouds.locale`, wrapped in
   try/catch; follow an existing storage helper if the repo already has one).
2. `navigator.languages` in preference order, on every platform (browser,
   Electron, and the Capacitor iOS/Android WebViews, which report the device
   language there; see the unverified edge below). `App.getAppLanguage()` is deliberately not used:
   it returns only a language code, and on iOS it is limited to the languages
   the bundle declares.
3. `DEFAULT_LOCALE` (`en`).

Matching is a pure function `resolveLocale(candidates, supported, fallback)` in
`@ui/helpers`: exact tag (case-insensitive, `_`→`-`), then same base language
(`en-GB` → `en`, `zh-Hans-CN` → `zh-CN` if that is the only `zh` supported),
then fallback. Unit-tested with a multi-locale fixture.

Behaviour:

- `supportedLocales` is declared per app in `apps/<app>/src/i18n.ts` (today
  `['en']`, so detection always resolves to English).
- To avoid a hydration mismatch on static HTML, the provider renders in
  `DEFAULT_LOCALE` first and applies the detected locale in an effect after
  mount. Detection is fully synchronous (no async native call), so there is no
  second pass.
- No Capacitor plugin and no native change: detection is plain web API, so no
  `cap sync` or native release is involved.
- Unverified edge: whether Android 13+ per-app language and iOS per-app
  language are reflected in `navigator.languages` inside the WebView. The
  stored choice from the avatar-menu selector is the reliable override either
  way. To be verified on a device when a second locale ships.
- `I18nProvider` exposes `useLocale()` →
  `{ locale, supportedLocales, preference, setLocale(locale | null) }`;
  `setLocale(null)` clears the stored choice and re-detects.
- `<html lang>` follows the active locale; `dir` is set from
  `Intl.Locale#getTextInfo` only when an RTL locale is supported (none today).

### Language selector

- Lives in the user-avatar menu, not the toolbar: `UserPanel` in `@auth` is
  shared by the mobile dialog and desktop popover in `UserButton`, so one
  insertion covers both.
- New `@ui` component `components/LanguageSelect.tsx` (native `<select>`, or
  headless equivalent if consistent with the panel), placed in the panel between
  the primary action/buttons and the footer links.
- Renders nothing when `supportedLocales.length < 2`, so it is invisible while
  English is the only locale.
- Options: "Automatic" (clears the stored choice; key
  `language.automatic` in the `ui` namespace) plus one entry per supported
  locale labelled in its own language via
  `new Intl.DisplayNames([tag], { type: 'language' })` (autonyms need no
  translation keys).
- Note: the avatar menu is only reachable when signed in. Signed-out users get
  detection only, no selector. Say if you want a signed-out entry point.

### Next.js metadata

Constraint: both apps are `output: 'export'`, so metadata is resolved once at
build time and baked into static HTML. It cannot follow a client-side language
choice; per-locale metadata would need locale route segments (future work).
For now metadata is rendered in the default locale, but sourced from the same
locale files so it is no longer a hard-coded string.

- `app` namespace gets `meta.title` and `meta.description` (and
  `puzzle.mobileDescription` / `puzzle.desktopDescription`, with `{{appName}}`
  interpolation) in `apps/<app>/src/locales/en.json`.
- Brand terms are in `en.json` under `brand.*` (see Key conventions).
  `app.config.js` keeps `appName`, `gameName`, `companyName` because native
  and build tooling read them (`capacitor.config.ts`, `electron-builder.js`,
  `app.config.js` consumers), but derives them from the app's `en.json`
  (`require('./src/locales/en.json').brand`) so the file is the single source
  of truth. These native identifiers are intentionally not runtime-translated.
  React call sites that display the names (`providers.tsx`, `page.tsx`,
  `puzzle/page.tsx`, `layout.tsx`) switch from `APP_CONFIG.appName/gameName` to
  `t('brand.…')`.
  `appDescription`, `mobileDescription`, `desktopDescription` are removed from
  `app.config.js` so there is a single source of truth.
- `apps/<app>/src/i18n.ts` exports `DEFAULT_LOCALE`, the assembled `resources`,
  and has no React/browser imports, so `layout.tsx` can call it at build time.
- `layout.tsx` replaces `export const metadata` with
  `export function generateMetadata(): Metadata` that creates a throwaway
  i18n instance (`createI18n(resources)` is synchronous) and reads
  `meta.title` / `meta.description` via `i18n.t`. `<html lang>` uses
  `DEFAULT_LOCALE`.
- `metadata.icons` is not text and is unchanged.
- Page-level titles: none exist today; do not add any in this task.
- `I18nProvider` keeps `document.documentElement.lang` in sync client-side
  once a second locale exists.

### Agents: identity vs display

`AgentConfig.name` is currently both the display name and the identity:
`agent-${config.name}` ids (`UnblockRace.tsx`, `agentTimeline.ts`),
`agentNames` persisted in session metadata (comma-joined), `selectDefaultAgents`
matching by name, and Map keys in `UnblockRace.tsx`. Translating `name` in place
would break persisted sessions and cross-device sync. So:

- Add a stable `id` (`'bumblebee'`, `'puddle'`, …) to `AgentConfig` in
  `@games/types/Agent`, set it in both `defaultAgents.ts`.
- `name` is kept unchanged as the legacy identity token (so existing persisted
  `agentNames` and `agent-<name>` ids keep resolving); it is no longer rendered.
- Everything rendered (RaceTrack, leaderboard/run results nicknames,
  AgentSelectSheet, voice lines) resolves the display text via the agent `id`
  and `t('agents.<id>.name')`.
- Non-React helpers that currently put `agent.name` into display fields
  (`runResults.ts` nickname, `agentProgress.ts`, `RaceTrack.tsx` nickname) take
  a display-name resolver from the component instead of reading `name`.
- Tests: existing persisted-name fixtures stay valid (identity unchanged); add
  a test that a persisted `agentNames` value still resolves to the right config
  and displays through the locale.

### Error handling

- Map error codes/states to localised keys; log raw `error`/`error.message`
  with `console.error` only.
- Unknown errors use a generic localised fallback (`errors.generic`).

### Formatting

- Dates/numbers use `Intl` with `i18n.language` (via a small `@ui` hook
  `useFormatters`, or `toLocaleString(i18n.language, …)` inline where trivial)
  instead of hard-coded `'en-US'`.

### Tests

- Root `jest.setup.js` initialises a shared English i18n instance from all
  package bundles and wraps nothing else, so existing tests that assert visible
  English text keep passing without rewrites.
- Tests that assert a component renders without providers keep working because
  `react-i18next` falls back to the globally registered instance
  (`initReactI18next`).
- Where a task changes visible text (e.g. fixing a typo while extracting),
  update the test in the same task.

### Tooling

- Root script `pnpm run i18n:audit` running
  `python .claude/skills/i18n-expert/scripts/i18n_audit.py` over each package's
  `src` against its `en.json` (no parity check needed with one locale; checks
  missing/unused keys).
- Document the convention in `ARCHITECTURE.md` and each touched package README.

## Task breakdown

Dependencies: T0 first; T1–T6 are independent of each other (disjoint
packages and disjoint locale files); T7 and T8 need T1–T6 only for
placeholders already created in T0, so they can run in parallel with T1–T6 but
must be merged last; T9 is the final gate.

| Task | Scope                          | Depends on |
| ---- | ------------------------------ | ---------- |
| T0   | Infra                          | —          |
| T1   | `@ui` strings                  | T0         |
| T2   | `@auth` strings                | T0         |
| T3   | `@template` strings            | T0         |
| T4   | `@games` strings               | T0         |
| T5   | `@sudoku` strings              | T0         |
| T6   | `@unblockrace` strings         | T0         |
| T7   | `apps/sudoku` strings          | T0         |
| T8   | `apps/unblockrace` strings     | T0         |
| T9   | Audit, build, test, lint, docs | T1–T8      |

### T0 — Infrastructure

1. Add `i18next` and `react-i18next` to `@ui`, and `react-i18next` to every
   package/app that calls `useTranslation` (package.json must list all deps).
2. `@ui`: `config/i18n.ts`, `providers/I18nProvider.tsx`, unit tests.
3. Create empty `src/locales/en.json` (`{}`) for `@ui`, `@auth`, `@template`,
   `@games`, `@sudoku`, `@unblockrace`, and both apps; add `./locales/*`
   export to each `package.json`.
4. Both apps: `src/i18n.ts` assembling all bundles; wrap tree in
   `I18nProvider` in each `providers.tsx`; verify `<html lang>` handling.
5. Root `jest.setup.js`: init shared English instance from all bundles.
6. Root `i18n:audit` script.
7. Verify `resolveJsonModule` in every affected tsconfig; fix if missing.
8. Language detection per the Language detection section:
   `@ui/helpers/resolveLocale.ts`, detection + persistence in
   `@ui/config/i18n.ts`/`I18nProvider`, `useLocale()` hook, and the `supportedLocales` export in each
   app's `i18n.ts`. Tests: `resolveLocale` table tests, provider tests with a
   fixture second locale (stored choice wins, `navigator.languages` order,
   hydration-safe first render, `setLocale(null)`).
   8a. `@ui` `components/LanguageSelect.tsx` + tests (hidden for 1 locale, lists
   autonyms + Automatic, calls `setLocale`).
   8b. Agent identity: add required `id` to `AgentConfig`
   (`@games/types/Agent`) and set ids in `packages/sudoku` and
   `packages/unblockrace` `defaultAgents.ts` (`name` unchanged), plus a
   `selectDefaultAgents` test. No display change yet.
9. Make `apps/<app>/src/i18n.ts` build-time safe (no React/window imports) and
   export `DEFAULT_LOCALE` + `resources`; add a test that `createI18n`
   works without a DOM (`@jest-environment node`).

Acceptance: existing test suites still pass with all-empty bundles; app
type-check passes.

### T1–T6 — Package extraction (one subagent per package)

Each task, within its package only:

1. Find raw strings: JSX text, `aria-label/title/placeholder/alt`, string
   props, toasts/alerts/confirm, string literals in helpers/configs, plural
   patterns, hard-coded `'en-US'`.
2. Replace with `t('ns:key')` / `t('key', { count })`; fill
   `src/locales/en.json` with the original English text verbatim.
3. Refactor non-React display helpers per the conventions above; update their
   callers and tests.
4. Localise error surfaces (T3 owns `ErrorBoundary`).
5. Run package `type-check`, `test`, `lint:fix`.

Per-package notes:

- T1 `@ui`: Header/Footer/CopyButton/celebration overlay; `helpers/share.ts`
  share title (non-React: takes `t` or a pre-built string from the caller;
  update callers in `@template`/apps accordingly); adds `useFormatters` if
  needed by later tasks.
- T2 `@auth`: LoginModal, UserPanel, UserButton, DeleteAccountDialog,
  AuthProvider messages; render `LanguageSelect` (from `@ui`) inside
  `UserPanel` and add the `UserPanel`/`UserButton` tests for the hidden and
  visible cases (provider with 1 vs 2 supported locales).
- T3 `@template`: largest (Lobby, InviteSheet, PartyRow, FriendsTab,
  PlusModal, AppDownloadModal, providers that surface messages, RevenueCat
  messages, TierBadge, AgentSelectSheet). Fix `ErrorBoundary`
  `error.message` leak. Consider splitting by `components/lobby` vs rest if the
  subagent runs long.
- T4 `@games`: RaceTrack, StageResultPanel, Leaderboard, ScoringLegend,
  HintBox, `getTechniquesDisplay`, agent helpers, `nextPuzzleProgressLabel`.
  Consumes `AgentConfig.id` (landed in T0); owns the display-name resolver used
  by `runResults.ts`/`agentProgress.ts`/`RaceTrack.tsx`.
- T5 `@sudoku`: SudokuControls, Sudoku, BookCover, BookProvider month label,
  `techniqueCategories`, `defaultAgents` (ids + `agents.*` keys incl.
  voice lines), `agentTimeline`.
- T6 `@unblockrace`: UnblockRace, Controls, `dailyLabel`, `difficultyDisplay`,
  CollectionProvider month label, `defaultAgents` (ids + `agents.*` keys incl.
  voice lines), `agentTimeline`.

### T7 / T8 — App extraction

Per app, metadata first: convert `layout.tsx` to `generateMetadata()` per the
Metadata section, move `appDescription` into `meta.description`, move
`mobileDescription`/`desktopDescription` into the `app` namespace and update
`puzzle/page.tsx`, remove the three keys from `app.config.js`, and update
`layout`/`puzzle` tests. Check `apps/<app>/electron*`/`capacitor.config.ts`
do not read the removed keys (grep shows none today). Then: `page.tsx`, `book`/`collection`, `invite`, `import` (sudoku only,
fixes `alert(error.message)`), `credits`, `not-found`, `auth`, `testers`,
`test-errors`, `config/subscriptionMessages.tsx`, `config/premiumFeatures.tsx`,
`components/*`. Keys in the app's own `app` namespace. Test-only pages
(`testers`, `test-errors`) are developer tooling: localise only if reachable by
end users; otherwise mark with a short exclusion note in the plan results.

### T9 — Gate

1. `pnpm run i18n:audit` clean (no missing/unused keys); manually review dynamic
   keys (`t(variable)`).
2. Re-run the raw-string `rg` searches from the skill; remaining hits must be
   justified (brand/data).
   2a. After `pnpm run build`, inspect each app's `out/index.html` `<title>` and
   `<meta name="description">`: identical to the previous English text
   (read the built file only; do not start a server).
3. `pnpm run build`, `pnpm run test`, `pnpm run lint:fix` — fix all issues
   (monorepo sandbox note: run root build/test sandbox-disabled).
4. Update `ARCHITECTURE.md`, `README.md`s, `CLAUDE.md` if they now mislead
   (add an i18n rule: no raw user-facing strings; use `useTranslation`).

## Assumptions / decisions to confirm

1. **JSON locale files** (not TS) so the skill's audit script works. Cost:
   `t` keys are untyped strings (no `CustomTypeOptions`), because per-package
   augmentation would collide globally. Alternative: `.ts` `as const` bundles
   with typed keys, losing the audit script.
2. **Agent names, personalities and voice lines are translation keys** keyed by
   a new stable `AgentConfig.id`; `name` stays as the legacy identity token so
   persisted `agentNames`/`agent-<name>` ids keep working.
3. **Dev-only pages** (`testers`, `test-errors`) are left unlocalised unless
   user-reachable.
4. **Metadata is build-time, default-locale only** (static export); only the
   source of the text moves. Brand terms are in `en.json` (`brand.*`);
   `app.config.js` derives `appName`/`gameName`/`companyName` from it for
   native/build tooling, and the three description keys are removed.
5. **Detection and selector are built now**, but `supportedLocales` is
   `['en']`, so the selector is hidden and detection resolves to English until a
   second locale file is added (then: data only, plus adding it to
   `supportedLocales`).
6. **`navigator.languages` only** for detection, on web and native; no
   Capacitor plugin. Per-app OS language settings may not be reflected; the
   selector override covers that.
7. **Signed-in only selector** (avatar menu), per your instruction.

## Adding a locale later (checklist, not done now)

1. Add `<ns>/locales/<tag>.json` for every namespace and the `app` namespace;
   register in `apps/<app>/src/i18n.ts` and add the tag to `supportedLocales`.
2. iOS: declare it in `CFBundleLocalizations` (Info.plist) / project known
   regions; required for the app to appear in per-app language in iOS Settings
   and for the App Store to list the language.
3. Android: add it to `res/xml/locales_config.xml` and reference it from the
   manifest (`android:localeConfig`) for per-app language on Android 13+.
4. Localise store listings (asc / gplay skills) and metadata (see below).

## Out of scope for later

- Second locale and its translations, RTL, store-listing alignment.
- Per-locale metadata, which requires locale route segments (or one export per
  locale) because of `output: 'export'`.
