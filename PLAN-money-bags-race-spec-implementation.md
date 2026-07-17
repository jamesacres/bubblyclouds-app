# Money Bags Race — Implementation Plan

Implements `PLAN-money-bags-race-spec.md` (v1.0, all 19 questions resolved) in
`apps/moneybagsrace` + a new `packages/moneybagsrace`, on branch
`feature/money-bags-init`. Executed as one fresh-context subagent per task
(§7), in dependency order, with per-task verification.

## 1. Context

Money Bags Race is a household net-worth tracker and retirement planner for
couples: monthly balance snapshots per partner, shared property, net-worth
history charts, investment growth projection, and a bootstrap Monte Carlo
retirement simulator with an earliest-retirement-date solver.

The app scaffold exists (template clone): providers stack wired, month-keyed
placeholder `/state?month=YYYY-MM` page with a raw JSON textarea persisted
dual local+server. All domain logic is greenfield — nothing money-related
exists anywhere in the monorepo.

### 1.1 Verified framework facts that shape the design

1. Server sessions are **per-user**; a partner's state is read via
   `useServerStorage.listValues({ partyId, userId })`
   (`packages/template/src/hooks/serverStorage.ts`). Server key format for
   StateType.PUZZLE: `moneybagsrace-<id>`.
2. `saveValue` hardcodes `expiresAt = now + 32 days`
   (serverStorage.ts:226–242). A net-worth tracker needs permanent monthly
   history → **Task 1 adds an optional `expiresAt` override** (backwards
   compatible; sudoku/unblockrace call sites unchanged).
3. `SessionsProvider` filters sessions older than 32 days
   (SessionsProvider.tsx:218, 321) and `useLocalStorage.listValues` purges
   >32-day entries → the domain data layer must **bypass `SessionsProvider`**
   and call `useServerStorage.listValues` directly (no age filter). Server is
   canonical for history; localStorage is a recent cache only.
   `SessionsProvider` stays mounted for template routes.
4. L5 package precedent: `packages/unblockrace` ↔ `apps/unblockrace` (JIT
   exports, jest config, root tsconfig paths, `@source` in app globals.css).
5. Charts: recharts ^3.8.1 precedent in
   `apps/stephenesch/src/components/RatingHistogram.tsx` (dark-mode custom
   tooltip idiom). No Button/Input/Slider/Modal primitives exist in
   packages/ui — domain components are built new. Reusable: `Toggle`
   (`packages/ui/src/components/NotesToggle.tsx`), `CountUp`
   (`packages/ui/src/components/CountUp.tsx`).
6. Money is GBP integer pence everywhere (spec §8).

## 2. Architecture decisions

### D1. New L5 package `packages/moneybagsrace`

All domain logic lives in `packages/moneybagsrace`
(`@bubblyclouds-app/moneybagsrace`): types, engines, returns dataset, data
provider/hooks, domain components incl. recharts charts. `apps/moneybagsrace`
keeps only pages/routing/config — mirrors unblockrace per the ARCHITECTURE.md
decision tree.

Wiring:

- `packages/moneybagsrace/package.json` — model on
  `packages/unblockrace/package.json`. Exports: `"."`,
  `"./components/*": "./src/components/*.tsx"`,
  `"./providers/*": "./src/providers/*.tsx"`,
  `"./hooks/*": "./src/hooks/*.ts"`,
  `"./helpers/*": "./src/helpers/*.ts"`,
  `"./engine/*": "./src/engine/*.ts"`, `"./data/*": "./src/data/*.ts"`,
  `"./types/*": "./src/types/*.ts"`. Dependencies (`workspace:*`):
  `@bubblyclouds-app/auth`, `@bubblyclouds-app/template`,
  `@bubblyclouds-app/types`, `@bubblyclouds-app/ui`; plus `lucide-react`,
  `next`, `react`, `react-dom`, **`recharts ^3.8.1`** (recharts is a package
  dep — the app never imports it directly). devDependencies + scripts
  (`type-check`, `lint`, `lint:fix`, `test`, `circular`) copied from
  unblockrace.
- Root `tsconfig.json`: add
  `"@bubblyclouds-app/moneybagsrace": ["./packages/moneybagsrace/src"]` and
  `"@bubblyclouds-app/moneybagsrace/*": ["./packages/moneybagsrace/src/*"]`.
- `apps/moneybagsrace/package.json`: add
  `"@bubblyclouds-app/moneybagsrace": "workspace:*"`.
- `apps/moneybagsrace/src/app/globals.css`: add
  `@source "../../../../packages/moneybagsrace";`.
- `packages/moneybagsrace/jest.config.js` copied from
  `packages/unblockrace/jest.config.js`;
  `apps/moneybagsrace/jest.config.js` gains
  `'^@bubblyclouds-app/moneybagsrace/(.*)$': '<rootDir>/../../packages/moneybagsrace/src/$1'`
  (keep the 60/70/70/70 coverage thresholds).

### D2. Storage & sync model

Session ids (per user; server key = `moneybagsrace-<id>`):

| id | content | cadence |
|---|---|---|
| `<YYYY-MM>` | member's monthly snapshot + optional shared-assets entry | monthly, freely editable forever (Q19) |
| `profile` | member's account definitions, DOB, contributions, overrides, + household `sharedAssumptions` (LWW) | on settings change |

`profile` can never collide with a month id (regex validation).

Persistence rules:

- Every save dual-writes local (`useLocalStorage.saveValue`) + server
  (`useServerStorage.saveValue(state, { expiresAt: now + 100 years })`).
- Every read is newest-wins merge of local (`lastUpdated`) vs server
  (`updatedAt`) — same idiom as the current `state/page.tsx`.
- History list: own = server `listValues<T>()` ∪ local recent months; partner
  = `listValues<T>({ partyId, userId })`. Never via SessionsProvider.

**Shared property (house + mortgage), last-write-wins (Q4/Q5, §3.3)**: each
member's month snapshot may embed `shared: SharedAssetsEntry` with its own
`updatedAt`. Effective shared value for a month = newest entry across all
members' snapshots (`resolveSharedAssets`). Editing shared values only writes
to your own session. Pre-fill for a new month = previous month's effective
entry.

**Shared assumptions** use identical LWW inside each member's `profile`
(`sharedAssumptions.updatedAt`). Member-personal fields are only edited by
their owner.

**Completeness (§3)**: month complete = every party member's snapshot has
`complete: true` and an effective shared entry exists for that month.
Dashboard "entry due" = current month incomplete (Q8, no push).

**Party**: the couple = the user's first party (template parties,
`maxSize: 2`); party/invite UI reused from the existing template components
(currently in `RacingTeamsTab.tsx`), repurposed into Settings.

### D3. Simulation execution — main thread, chunked async

Engine core is pure, synchronous, seeded (mulberry32). A thin
`runRetirementSimulationAsync(inputs, { chunkSize, onProgress, signal })`
wrapper yields between chunks. Rationale: 5,000 runs × ≤60 annual steps is
tens/hundreds of ms; solver ≈ 10 binary-search probes + 4 sensitivity solves;
no worker precedent in repo and workers complicate static-export/Capacitor
packaging. Chunked results must equal the synchronous result for the same
seed (sub-seeds derived per chunk). Solver uses **common random numbers**
(same seed per probe) so success rate is monotone in retirement date and the
binary search is well-founded.

### D4. Charts — recharts inside the package

`NetWorthChart`, `FanChart`, `PercentilePathsChart` in
`packages/moneybagsrace/src/components/`. Follow the RatingHistogram idiom:
`ResponsiveContainer`, `tick={{ fill: 'currentColor' }}`, dark-aware custom
tooltip, local `useDarkMode` MutationObserver hook.

## 3. Data model (`packages/moneybagsrace/src/types/`)

Split across files (no barrels): `monthId.ts`, `accounts.ts`, `snapshot.ts`,
`profile.ts`, `assumptions.ts`, `household.ts`, `state.ts`, `simulation.ts`.

```ts
// types/monthId.ts
export type MonthId = string; // 'YYYY-MM'

// types/accounts.ts
export enum AccountKind { INVESTMENT = 'INVESTMENT', CASH = 'CASH', CREDIT_CARD = 'CREDIT_CARD' }
export enum InvestmentWrapper { SIPP = 'SIPP', COMPANY_PENSION = 'COMPANY_PENSION', ISA = 'ISA', GIA = 'GIA', CRYPTO = 'CRYPTO', OTHER = 'OTHER' }
export interface AccountDefinition {
  accountId: string;           // crypto.randomUUID()
  kind: AccountKind;
  wrapper?: InvestmentWrapper; // required when kind === INVESTMENT
  name: string;
  sortOrder: number;
  createdMonth: MonthId;
  archivedMonth?: MonthId;     // hidden from this month onward; history untouched (Q2)
}

// types/snapshot.ts
export interface SnapshotAccount {  // frozen as-of-month copy (Q2)
  accountId: string; kind: AccountKind; wrapper?: InvestmentWrapper;
  name: string; balancePence: number; // credit cards: positive amount owed
}
export interface SharedAssetsEntry {
  houseValuePence: number; mortgageBalancePence: number;
  updatedAt: string;                 // ISO — LWW across members (Q4/Q5)
}
export interface MonthlySnapshotData {
  schemaVersion: 1; month: MonthId; enteredAt?: string;
  accounts: SnapshotAccount[]; complete: boolean;
  shared?: SharedAssetsEntry;
}

// types/assumptions.ts
export interface TaxBand { thresholdPence: number; ratePct: number } // annual, ascending
export interface ReturnScenarios { lowerRealPct: number; centralRealPct: number; upperRealPct: number }
export interface HouseholdAssumptions {
  inflationRatePct: number;              // default 2.5 (Q10/Q11)
  returnScenarios: ReturnScenarios;      // defaults 2 / 5 / 7 (§5.1)
  taxBands: TaxBand[];                   // editable (Q16)
  statePensionAnnualPence: number;       // default full new state pension (Q13)
  targetSuccessRatePct: number;          // default 90 (Q17)
  defaultWithdrawalAnnualPence?: number; // remembered between runs (§6.2)
  defaultPlanToAge?: number;
}
export interface SharedAssumptionsEntry { updatedAt: string; assumptions: HouseholdAssumptions }

// types/profile.ts
export interface ContributionStepChange { fromMonth: MonthId; wrapper: InvestmentWrapper; monthlyPence: number }
export interface ContributionPlan {
  monthlyPencePerWrapper: Partial<Record<InvestmentWrapper, number>>; // per member per wrapper (Q12)
  stepChanges: ContributionStepChange[];
}
export interface MemberRetirementOverrides {
  nmpaAgeOverride?: number;
  statePensionAgeOverride?: number;
  statePensionAnnualPenceOverride?: number; // partial NI records (Q13)
}
export interface ProfileData {
  schemaVersion: 1; accounts: AccountDefinition[]; dateOfBirth?: string; // ISO (Q14)
  contributions: ContributionPlan; overrides: MemberRetirementOverrides;
  sharedAssumptions?: SharedAssumptionsEntry;
}

// types/state.ts — framework envelope (empty scaffolding for template compat)
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
export interface MoneyBagsMonthState extends BaseServerState<unknown> { data: MonthlySnapshotData }
export interface MoneyBagsProfileState extends BaseServerState<unknown> { data: ProfileData }

// types/household.ts — merged view from the data provider
export interface HouseholdMember { userId: string; nickname: string; isUser: boolean; profile?: ProfileData }
export interface HouseholdMonth {
  month: MonthId;
  memberSnapshots: { [userId: string]: MonthlySnapshotData | undefined };
  effectiveShared?: SharedAssetsEntry; complete: boolean;
}
export interface HouseholdData {
  partyId?: string; members: HouseholdMember[];
  months: { [month: MonthId]: HouseholdMonth };
  orderedMonths: MonthId[];
  effectiveAssumptions: HouseholdAssumptions;
}

// types/simulation.ts
export interface SimulationMember {
  userId: string; dateOfBirth: string;
  balancesPencePerWrapper: Partial<Record<InvestmentWrapper, number>>; // latest snapshot
  contributions: ContributionPlan; overrides: MemberRetirementOverrides;
}
export interface AnnualReturn { year: number; realPct: number; nominalPct: number }
export interface SimulationInputs {
  members: SimulationMember[];
  startMonth: MonthId; retirementMonth: MonthId; planToAge: number;
  withdrawalAnnualPence: number;   // household, today's money, net (§6.2)
  includeStatePension: boolean;    // per-run toggle (Q13)
  applyTax: boolean;               // per-run toggle (Q16)
  assumptions: HouseholdAssumptions;
  returns: AnnualReturn[];         // injected dataset (swappable, Q15)
  runs: number;                    // default 5000
  seed: number;
}
export enum FailureKind { BRIDGE_EXHAUSTED = 'BRIDGE_EXHAUSTED', WEALTH_EXHAUSTED = 'WEALTH_EXHAUSTED' }
export interface SimulationResult {
  successRatePct: number;
  endingWealthPercentilesPence: { p5: number; p25: number; p50: number; p75: number; p95: number };
  percentilePathsPence: { year: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  failures: { count: number; medianFailureYear?: number; byKind: Record<FailureKind, number> };
}
export interface SolverResult {
  earliestRetirementMonth?: MonthId; // undefined if unachievable in window
  achievedSuccessRatePct?: number;
  agesAtRetirement: { [userId: string]: number };
}
export interface SensitivityResult {
  withdrawalPlus5k?: MonthId; withdrawalMinus5k?: MonthId;
  contributionsPlus500?: MonthId; contributionsMinus500?: MonthId;
}
```

## 4. Engine design (`src/engine/`, `src/data/`, `src/helpers/`)

All pure TS, no React, no I/O; every stochastic function takes `seed`.

- `data/globalEquityReturns.ts` — `GLOBAL_EQUITY_ANNUAL_RETURNS: AnnualReturn[]`,
  ~1900–2023 world-equity annual returns for a GBP investor. Embed reasonable
  published long-run figures (documented approximation in a comment): real
  mean ≈ 5% ± 1.5%, stdev ≈ 17–20%, historic crash years (1931, 1974, 2008…)
  negative. Swappable — the engine takes `returns` as input.
- `engine/rng.ts` — `createRng(seed: number): () => number` (mulberry32),
  `sampleIndex(rng, length)`.
- `engine/accessRules.ts` — config-table driven: `NMPA_TABLE` (55; 2028-04-06
  → 57), `getNmpaAge(dateOfBirth, override?)`; `STATE_PENSION_AGE_TABLE` (66 /
  67 transition cohort / 68), `getStatePensionAge(dateOfBirth, override?)`;
  `isLockedWrapper(w)` — SIPP/COMPANY_PENSION locked, ISA/GIA/CRYPTO/OTHER =
  bridge (§6.1); `partitionWealth(member, calendarYear)`. Decision: cash and
  property are excluded from the retirement sim (spec §6.2 — investments
  only); they still count in net worth (§2.4).
- `engine/tax.ts` — closed-form piecewise: `taxDueForIncome(grossPence,
  bands)`, `netFromGrossPension(...)` (25% tax-free, remainder through
  bands), `grossPensionForNet(netNeededPence, otherTaxableIncomePence,
  bands)` — exact piecewise inversion, no iteration (Q16). State pension
  counts as taxable income. GIA CGT ignored (documented v1 simplification).
- `engine/projection.ts` — deterministic fan (§5): monthly compounding at the
  three scenario rates, per member per wrapper contributions incl. step
  changes; real/nominal series pair.
- `engine/simulate.ts` — `runRetirementSimulation(inputs): SimulationResult`.
  Per run: accumulate to retirement (monthly contributions, annual growth
  bootstrapped with replacement from real returns), then annual withdrawal
  loop: state pension (if on) reduces required withdrawal from each member's
  SP age; ordering bridge-first (ISA→GIA→CRYPTO→OTHER) until each member's
  NMPA year, then pensions proportionally; tax toggle grosses-up pension
  withdrawals; failure = bridge zero pre-NMPA (`BRIDGE_EXHAUSTED`) or total
  zero pre-horizon (`WEALTH_EXHAUSTED`). Records yearly wealth for percentile
  paths.
- `engine/runAsync.ts` — chunked async wrapper (D3), progress + AbortSignal;
  chunked ≡ sync for same seed.
- `engine/solver.ts` — `findEarliestRetirement(base, targetSuccessRatePct,
  windowYears = 40): SolverResult` — binary search over months with common
  random numbers; async variant with progress.
- `engine/sensitivity.ts` — solver reruns at withdrawal ±£5,000/yr and
  contributions ±£500/mo (spread proportionally across wrappers) (§6.3).
- `helpers/networth.ts` — `memberTotalPence(snapshot)`,
  `householdNetWorthPence(householdMonth)`, `categoryBreakdown(...)`
  (Investments/Cash/Property equity/Credit cards),
  `buildNetWorthSeries(household, mode: 'real' | 'nominal',
  inflationRatePct)`, `monthOnMonthChange`, `twelveMonthChange`,
  `allTimeChange` (§2.4, §4).
- `helpers/money.ts` — `formatPence(pence): string` (Intl.NumberFormat
  en-GB GBP), `parsePoundsToPence(input): number | undefined`.
- `helpers/monthId.ts` — `currentMonthId()`, `isValidMonthId()`,
  `previousMonthId`, `nextMonthId`, `addMonths`, `monthsBetween`,
  `monthIdToLabel` ('Jul 2026'). Supersedes
  `apps/moneybagsrace/src/helpers/monthStateId.ts` (deleted in T9).
- `helpers/lww.ts` — `resolveSharedAssets(monthSnapshots)`,
  `resolveSharedAssumptions(profiles)`, `isMonthComplete(...)`.

## 5. Data layer (`src/providers/`, `src/hooks/`)

- `providers/MoneyBagsDataProvider.tsx` — mounted in app providers.tsx inside
  PartiesProvider (needs `useParties`) and UserProvider. Loads own sessions
  (local + server `listValues`), partner sessions (`listValues({ partyId,
  userId })` direct — not SessionsProvider), builds `HouseholdData` (LWW +
  completeness). Mutations (dual-write, far-future expiresAt):
  `saveOwnSnapshot(month, data)`, `saveOwnProfile(data)`,
  `saveSharedAssumptions(assumptions)` (stamps `updatedAt`). Exposes
  `refresh()`, `isLoading`, `isPartnerLoading`.
- `hooks/useHousehold.ts` — context accessor (throws outside provider).
- `hooks/useMonthEntry.ts` — entry-screen model: active accounts for the
  month (profile definitions filtered by created/archived month, or the
  frozen snapshot list if one exists), balances pre-filled from previous
  month (Q2), effective shared pre-fill, `setBalance`, `setShared`,
  `markComplete`, `save`, partner completion status.
- `hooks/useRetirementModel.ts` — assembles `SimulationInputs` from
  `HouseholdData`; readiness flags (e.g. `missingDob: string[]`).
- `hooks/useDarkMode.ts` — MutationObserver hook for chart tooltips.

## 6. Screens (`apps/moneybagsrace/src/app/`)

Keep the existing liquid-glass dark idiom. Auth via existing
`UserContext.showLoginModal` / AuthGate patterns.

1. **Dashboard `/`** — rewrite `page.tsx`. Drop Tab enum / MyStatesTab /
   RacingTeamsTab / `useSessions` usage. Sections: household net worth
   (`CountUp`) + change vs last month (abs/%), per-member totals, entry-due
   card (Q8), earliest-retirement headline ("You can retire in March 2041
   (age 52) at 90% confidence") via `findEarliestRetirementAsync` with
   remembered defaults when the model is ready (setup CTA otherwise), nav
   cards → Entry / History / Projection / Retirement / Settings, no-party
   state → invite CTA.
2. **Monthly entry `/state?month=YYYY-MM`** — rewrite `state/page.tsx`
   replacing the JSON textarea. `useMonthEntry`: grouped account rows
   (Investments/Cash/Credit cards) with `CurrencyInput` pre-filled from last
   month; shared property section (equity derived; "updated by <nickname>"
   LWW note); partner status chip; mark-complete + save; prev/next month nav
   (all months editable, Q19).
3. **History `/history`** — new page. `NetWorthChart` with layer toggles
   (household / per-member / stacked categories / individual accounts),
   real–nominal toggle (labelled on-chart), stat cards (MoM, 12-month,
   all-time).
4. **Projection `/projection`** — new page. `FanChart` (three scenario lines
   over historical actuals), contribution controls (per member per wrapper +
   step changes), horizon selector, FIRE milestone marker, real/nominal
   toggle.
5. **Retirement `/retirement`** — new page. Inputs: desired annual withdrawal
   (remembered), plan-to-age, specific-date mode or solver mode; toggles:
   state pension, tax; success-rate slider (default 90). Run → progress bar
   (chunked async, abortable) → success % headline,
   `PercentilePathsChart`, ending-wealth percentiles, failure breakdown,
   solver result + `SensitivityTable`.
6. **Settings `/settings`** — new page. Sections: Accounts
   (add/rename/archive/reorder, kind + wrapper pickers), You (DOB, SP/NMPA
   overrides), Contributions, Assumptions (inflation, scenario returns, tax
   bands editor, SP default, target success rate → `saveSharedAssumptions`),
   Party (repurposed `RacingTeamsTab.tsx` content; couple `maxSize: 2`).

Domain components (in `packages/moneybagsrace/src/components/`, each with
co-located `.test.tsx`): `CurrencyInput`, `RealNominalToggle`,
`PercentSlider`, `ToggleRow`, `StatCard`, `EntryDueCard`,
`NetWorthHeadline`, `AccountEntryRow`, `SharedPropertyForm`,
`AccountManager`, `AssumptionsForm`, `ContributionsForm`, `NetWorthChart`,
`FanChart`, `PercentilePathsChart`, `RetirementResultPanel`,
`SensitivityTable`, `SolverHeadline`.

## 7. Task list (one fresh-context subagent per task)

Dependency graph: T1→T8; T2→{T3,T4,T5,T6,T8}; {T3,T4}→T6→T7; T8→{T9,T10,T11};
T5→T10; {T6,T7}→T11; all→T12.

### Task 1 — Template: optional `expiresAt` on `saveValue`
Modify `packages/template/src/hooks/serverStorage.ts`:
`saveValue = async <T>(state: T, options?: { expiresAt?: Date })`, defaulting
to current +32 days. Add/extend co-located test asserting PATCH body
`expiresAt` for default and override.
**Verify**: template `type-check` + `test`; sudoku + unblockrace
`type-check` (no call-site breakage).

### Task 2 — Scaffold `packages/moneybagsrace` + wiring + types + helpers
Create package (`package.json`, `tsconfig.json`, `jest.config.js`,
`eslint.config.mjs`, minimal `src/index.ts` — shapes copied from
unblockrace, per D1 incl. recharts dep). Create all `src/types/*` (§3),
`src/helpers/money.ts`, `src/helpers/monthId.ts`, `src/helpers/lww.ts`
(+tests). Modify root `tsconfig.json`, `apps/moneybagsrace/package.json`,
`apps/moneybagsrace/jest.config.js`, `apps/moneybagsrace/src/app/globals.css`.
Run `pnpm install`.
**Verify**: package `type-check` + `test` + `circular`.

### Task 3 — Returns dataset + seeded RNG
Create `src/data/globalEquityReturns.ts`, `src/engine/rng.ts` (+tests:
length ≥ 120, mean/stdev sanity, crash years negative; RNG determinism).
**Verify**: package `type-check` + `test`.

### Task 4 — Access rules + tax engine
Create `src/engine/accessRules.ts`, `src/engine/tax.ts` (+tests: DOB
straddling 2028-04-06 NMPA boundary, overrides win, SP-age table, wrapper
classification, gross↔net round-trips at band boundaries incl. other taxable
income).
**Verify**: package `type-check` + `test`.

### Task 5 — Projection + net-worth calculators
Create `src/engine/projection.ts`, `src/helpers/networth.ts` (+tests:
closed-form compounding, step changes, real↔nominal consistency, §2.4
formula incl. credit-card subtraction and derived property equity, series
deflation).
**Verify**: package `type-check` + `test`.

### Task 6 — Monte Carlo simulator + async runner
Create `src/engine/simulate.ts`, `src/engine/runAsync.ts` (+tests, fixed
seeds: zero-volatility synthetic dataset with analytic checks; huge
portfolio → 100%; zero portfolio → 0% `WEALTH_EXHAUSTED`; bridge empty
pre-NMPA → `BRIDGE_EXHAUSTED`; SP toggle raises success; tax toggle lowers
it; async ≡ sync; abort works).
**Verify**: package `type-check` + `test`.

### Task 7 — Solver + sensitivity
Create `src/engine/solver.ts`, `src/engine/sensitivity.ts` (+tests: monotone
synthetic case finds exact month; unachievable → undefined; CRN stability;
+withdrawal never earlier, +contributions never later).
**Verify**: package `type-check` + `test`.

### Task 8 — Data provider + hooks
Create `src/providers/MoneyBagsDataProvider.tsx`, `src/hooks/useHousehold.ts`,
`src/hooks/useMonthEntry.ts`, `src/hooks/useRetirementModel.ts`,
`src/hooks/useDarkMode.ts` (+tests mocking template storage hooks:
newest-wins merge, LWW shared assets across two members, completeness,
pre-fill incl. add/archive lifecycle, dual-write with far-future expiresAt).
Mount provider in `apps/moneybagsrace/src/app/providers.tsx`.
**Verify**: package `type-check` + `test`; app `type-check`.

### Task 9 — Settings + Monthly entry screens
Create components `CurrencyInput`, `ToggleRow`, `PercentSlider`,
`AccountEntryRow`, `SharedPropertyForm`, `AccountManager`,
`AssumptionsForm`, `ContributionsForm` (+tests). Create
`apps/moneybagsrace/src/app/settings/page.tsx` (+test; fold in party UI from
`src/components/RacingTeamsTab.tsx`). Rewrite
`apps/moneybagsrace/src/app/state/page.tsx` as the entry screen (+test).
Delete `apps/moneybagsrace/src/helpers/monthStateId.ts` (+its test); use
package `helpers/monthId.ts`.
**Verify**: package `test`; app `type-check` + `test` (coverage 60/70/70/70
holds).

### Task 10 — Dashboard + History screens
Create components `StatCard`, `EntryDueCard`, `NetWorthHeadline`,
`RealNominalToggle`, `NetWorthChart` (+tests; mock
`ResponsiveContainer`/`ResizeObserver` in jsdom). Rewrite
`apps/moneybagsrace/src/app/page.tsx` as Dashboard (remove
Tab/MyStatesTab/RacingTeamsTab/`useSessions`; delete `MyStatesTab.tsx` +
`RacingTeamsTab.tsx` once unused, with their tests; update `page.test.tsx` +
snapshots). Create `apps/moneybagsrace/src/app/history/page.tsx` (+test).
**Verify**: as Task 9 plus app `lint`.

### Task 11 — Projection + Retirement screens
Create components `FanChart`, `PercentilePathsChart`,
`RetirementResultPanel`, `SensitivityTable`, `SolverHeadline` (+tests).
Create `apps/moneybagsrace/src/app/projection/page.tsx`,
`apps/moneybagsrace/src/app/retirement/page.tsx` (+tests). Wire
`SolverHeadline` into the Dashboard. Persist remembered defaults via
`saveSharedAssumptions`.
**Verify**: as Task 9.

### Task 12 — Integration, cleanup, full verification
Update `apps/moneybagsrace/src/config/` copy if it references
puzzles/racing; regenerate snapshots; confirm no imports of deleted files;
sweep new code for CLAUDE.md rule violations (no `any`/casts/barrels);
update any md files that reference removed things.
**Verify (root)**: `pnpm install && pnpm run type-check && pnpm run test &&
pnpm run lint:fix && pnpm run build:moneybagsrace` and package + app
`circular`. Note: root `pnpm test`/`build` fail inside the sandbox
(jest_dx cache / next-font EPERM) — rerun sandbox-disabled.

## 8. Verification (end-to-end)

Manual smoke via `pnpm run dev:moneybagsrace`: create party → invite second
member → enter a month's balances for both → shared property LWW → dashboard
totals + change + entry-due → history chart layers + real/nominal →
projection fan + contributions → retirement run (toggles, progress, abort) →
solver headline + sensitivity.

## 9. Risks / notes

- Backend must honor the PATCH `expiresAt` override; if the API caps TTL at
  32 days, monthly history will expire server-side and a backend change is
  needed — flag immediately if old sessions vanish during testing.
- Never route domain reads through SessionsProvider or local `listValues`
  for history (32-day filter/purge).
- Engine stays React-free and side-effect-free; all randomness via injected
  seed.
- Returns dataset is an embedded approximation of published long-run
  world-equity figures (swappable module; documented in-file).
- `BaseServerState` envelope kept as empty scaffolding (`[]`, `{}`, `{}`)
  for template compatibility; real payload lives in `data`.
