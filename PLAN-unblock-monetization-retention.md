# PLAN: Unblock Race monetization + retention (stars, juice, gates, locks, combo scoring, rate-app)

> Workflow: this plan is executed task-by-task with fresh-context subagents. Each subagent reads this plan plus the files named in its task. Run `pnpm run lint:fix` at the end of every task; full build/test in Task 8.

## Context

Unblock Race needs a monetization + retention layer: star ratings vs par, addictive end-of-puzzle celebration (animated stars + points count-up), a compelling continue-to-next-puzzle flow, a Plus gate after stage 3 of the daily run, 50% of each collection difficulty locked for free users, a puzzles-per-day leaderboard multiplier, a 5-puzzles/day free cap, and Rate-app buttons. **Sudoku stays exactly as-is except the Rate-app buttons** — all shared-code changes must be additive/optional-prop only.

Confirmed decisions: the "try an easier puzzle" prompt IS the free path of the stage-3 gate; the daily multiplier is Unblock-only (config-driven, sudoku bit-identical); Rate-app button goes on BOTH homepages AND both completed-puzzle blocks; the 5/day cap counts every started puzzle (each daily stage + each collection puzzle) and replaces the current 3-runs/day limit.

Key verified facts:

- Premium infra exists: RevenueCat `'Plus'` entitlement via `packages/template/src/providers/RevenueCatProvider.tsx`, paywall `packages/template/src/components/PlusModal.tsx`, app wrapper `apps/unblockrace/src/components/UnblockRacePlusModal.tsx`, contexts in `packages/types/src/subscriptionContext.ts`. Prices come from RevenueCat offerings (packages matched by `monthly`/`lifetime` identifier substrings) — £0.99/month + £3.99 lifetime is **dashboard config**, not code. Unblock's RevenueCat keys are still `'TODO'` in `apps/unblockrace/app.config.js` (flag in PR, don't fix in code).
- `apps/sudoku/src/config/subscriptionMessages.tsx` is an exhaustive `Record<SubscriptionContext, ContextMessage>` — new enum members break sudoku's build unless its record type Excludes them (must land in the same task).
- `getPuzzleType` (`packages/games/src/helpers/scoringUtils.ts:10`) only knows sudoku metadata — unblock sessions currently score as `'unknown'`. Teaching it unblock keys (`runId` starts `oftheday` → daily, `unblockCollectionPuzzleId` → book) can't affect sudoku (its metadata never has those keys) but WILL raise unblock leaderboard totals (intended; call out in PR).
- Par = `movesRequired` on every puzzle; moves via `movesMadeFromState` (`packages/unblockrace/src/helpers/calculateStatsDisplay.ts`); cheat detection via `isPuzzleCheated`.
- Stage-clear slam is inline in `packages/unblockrace/src/components/UnblockRace.tsx` (~L668, `data-testid="stage-clear-slam"`); `advanceStage` L281; daily-run-limit effect L340–381 (uses `canStartRun`/`addDailyRunId` from `utils/dailyRunCounter.ts`, sole consumer); `RevenueCatContext` already consumed at L95.
- Collection ids `ofthemonth-YYYYMM-puzzle-N` are deterministic via `getCollectionOfTheMonth` (`helpers/mockData.ts`), so lock status is recomputable anywhere without the provider. `CollectionProvider` is app-wide, so `UnblockRace` may call `useCollection()`.
- No count-up or star component exists anywhere — create in `@ui`.
- `@capacitor-community/in-app-review` is a dep of both apps and used in `packages/ui/src/components/CelebrationAnimation.tsx` + `packages/unblockrace/src/components/RaceCelebration.tsx` (milestone auto-prompts — keep those).

Design constants:

- **Stars**: 3★ `movesMade ≤ par`; 2★ `movesMade ≤ par + max(2, ceil(par*0.25))`; 1★ any other solve; none if cheated/incomplete.
- **Daily combo**: nth puzzle completed on the same UTC day multiplies that puzzle's (volume + base×difficulty + speed) by `min(1 + (n−1)×0.1, 1.5)`; racing bonus excluded.
- **Locks**: per difficulty band, the latter `floor(len/2)` puzzles are locked for free users ("first half of every difficulty is free"). Plus unlocks the whole month.
- **Limits**: `PUZZLES: 5` per day free (id-set, resumes never double-count), `FREE_DAILY_RUN_STAGES: 3`. Free budget composes: 3 daily stages + 2 collection puzzles = 5, so the gate's escape hatch is always playable.
- **New SubscriptionContext**: `DAILY_RUN_STAGES = 'dailyRunStages'`, `COLLECTION_LOCKED = 'collectionLocked'`.

---

## Task 1 — @ui foundations (L1)

**Create** `packages/ui/src/components/CountUp.tsx` + `CountUp.test.tsx`:

```tsx
interface CountUpProps {
  value: number;
  durationMs?: number; // 900
  startDelayMs?: number; // 0
  prefix?: string;
  suffix?: string;
  format?: (value: number) => string;
  className?: string;
  onDone?: () => void;
}
```

`'use client'`; `requestAnimationFrame` + ease-out cubic; cancel on unmount/value change; `prefers-reduced-motion` → jump to final + fire `onDone`; visible span `aria-hidden`, final value in visually-hidden `aria-live="polite"` span. Tests: fake timers + mocked rAF/matchMedia (pattern in `CelebrationAnimation.test.tsx`).

**Create** `packages/ui/src/components/StarRating.tsx` + test:

```tsx
interface StarRatingProps {
  rating: number;
  max?: number; // 3
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean; // stagger pop-in
  staggerMs?: number; // 220
  className?: string;
}
```

lucide `Star` filled amber w/ glow vs dimmed outline; `animated` = per-star scale-pop with `animation-delay: i*staggerMs`, reduced-motion guard; `role="img"` `aria-label="N of 3 stars"`. Add exports to `packages/ui/package.json` (JIT pattern).

## Task 2 — Scoring engine (@games, L4) — sudoku must stay bit-identical

**Edit** `packages/games/src/types/scoringTypes.ts`: add

```ts
export interface DailyComboConfig {
  increment: number;
  max: number;
}
export interface ScoringOptions {
  dailyCombo?: DailyComboConfig;
}
export interface SessionScore {
  volumeScore: number;
  baseScore: number;
  difficultyBonus: number;
  speedBonus: number;
  comboMultiplier: number;
  comboBonus: number;
  total: number;
}
```

Add `comboBonus: number` to `ScoringResult` and `FriendsLeaderboardScore['breakdown']`.

**Edit** `packages/games/src/helpers/scoringConfig.ts`: add `DAILY_COMBO: { increment: 0.1, max: 1.5 }`.

**Edit** `packages/games/src/helpers/scoringUtils.ts`:

1. `getPuzzleType`: AFTER the sudoku checks, add `runId?.startsWith('oftheday')` → `'daily'`, `unblockCollectionPuzzleId` → `'book'`.
2. Extract `calculateSessionScore(session, options?: { dailyCombo?: DailyComboConfig; dayPuzzleIndex?: number }): SessionScore` — the single-session portion of the loop (shared by leaderboard AND end-of-stage points display). `comboMultiplier = min(1 + dayPuzzleIndex*increment, max)`; `comboBonus = (multiplier−1)*(volume + base*diffMult + speed)`.
3. `calculateUserScore(..., options?: ScoringOptions)`: when `dailyCombo` set, group completed non-cheated sessions by UTC day of `completed.at`, sort by `completed.at`, feed `dayPuzzleIndex`. No options → `comboBonus: 0`, everything else numerically identical (delegate loop to `calculateSessionScore`).

**Edit** components: `Leaderboard.tsx` optional `scoringOptions?: ScoringOptions` prop (pass to both `calculateUserScore` calls, include comboBonus in totals, add to useMemo deps, forward `dailyCombo` to legend); `ScoreBreakdown.tsx` add "Daily combo" row (renders only when > 0 — sudoku visually unchanged); `ScoringLegend.tsx` optional `dailyCombo?: DailyComboConfig` prop → multiplier table section.

**Create** `apps/unblockrace/src/components/UnblockLeaderboard.tsx`: thin wrapper passing `scoringOptions={{ dailyCombo: SCORING_CONFIG.DAILY_COMBO }}`, matching `FriendsTab`'s `LeaderboardComponent` signature. Wire in `apps/unblockrace/src/app/page.tsx` (~L619). Sudoku keeps plain `Leaderboard`.

**Tests** (`scoringUtils.test.ts` + component tests): mandatory backward-compat parity (sudoku fixtures identical output with no options), unblock metadata typing, combo grouping/cap, `calculateSessionScore` parity.

## Task 3 — Contexts, limits config, pricing copy

**Edit** `packages/types/src/subscriptionContext.ts`: add `DAILY_RUN_STAGES = 'dailyRunStages'`, `COLLECTION_LOCKED = 'collectionLocked'`.

**Edit** `apps/sudoku/src/config/subscriptionMessages.tsx` (SAME task or sudoku type-check breaks): record type → `Record<Exclude<SubscriptionContext, DAILY_RUN_STAGES | COLLECTION_LOCKED>, ContextMessage>`; no copy changes.

**Edit** `packages/unblockrace/src/config/dailyLimits.ts`:

```ts
export const DAILY_LIMITS = { PUZZLES: 5, FREE_DAILY_RUN_STAGES: 3 };
```

**Edit** `apps/unblockrace/src/config/subscriptionMessages.tsx` + **delete** stale `apps/unblockrace/src/config/dailyLimits.ts` (its `PUZZLE: 1` copy was already wrong): import limits from `@bubblyclouds-app/unblockrace/config/dailyLimits`; remove `UNDO` from the Exclude (undo now gated — message: 5 free undos/day, limit from `@bubblyclouds-app/template/config/dailyLimits`); update `DAILY_PUZZLE_LIMIT` copy (5 puzzles/day, stages + collection both count); add `DAILY_RUN_STAGES` ("Stages 4 & 5 are Plus-only…") and `COLLECTION_LOCKED` ("Plus unlocks the entire pack, every month") messages.

**Edit** `apps/unblockrace/src/config/premiumFeatures.tsx` + `UnblockRacePlusModal.tsx` copy: lead with "Full daily run — all 5 stages", "Entire monthly pack unlocked, every month", "Unlimited puzzles & undos". Keep hard prices OUT of JSX — PlusModal renders store-truth prices from RevenueCat. **PR note (non-code):** configure RevenueCat `default` offering with `monthly` £0.99 + `lifetime` £3.99 packages and `Plus` entitlement; fill `'TODO'` API keys in `apps/unblockrace/app.config.js`.

## Task 4 — Stars, locks, next-puzzle resolver + tiles

**Create** `packages/unblockrace/src/helpers/starRating.ts` + test:

```ts
export const starRatingForMoves = (
  movesMade: number,
  movesRequired: number
): 1 | 2 | 3;
export const starRatingFromState = (
  state /* session state */
): number | undefined; // undefined unless completed + par known + not cheated
```

Reuses `movesMadeFromState` and `isPuzzleCheated` (relative imports).

**Create** `packages/unblockrace/src/helpers/collectionLocks.ts` + test:

```ts
export const lockedCollectionIndexes = (
  puzzles: UnblockCollectionPuzzle[]
): Set<number>; // per difficulty band, lock last floor(len/2)
export const isCollectionPuzzleIdLocked = (id: string): boolean; // parses ofthemonth-YYYYMM-puzzle-N, recomputes getCollectionOfTheMonth — provider-free
```

**Create** `packages/unblockrace/src/helpers/nextCollectionPuzzle.ts` + test:

```ts
export interface NextCollectionPuzzle {
  puzzle: UnblockCollectionPuzzle;
  index: number;
  unblockCollectionPuzzleId: string;
  isLocked: boolean;
}
export const getNextCollectionPuzzle = (args: {
  collection;
  completedInitials: Set<string>;
  currentInitial?: string;
  isSubscribed: boolean;
}): NextCollectionPuzzle | undefined;
export const easiestUnlockedIncomplete = (args: {
  collection;
  completedInitials;
  isSubscribed;
}): NextCollectionPuzzle | undefined;
```

Order: incomplete in same band after current index (prefer unlocked for free users), then next harder band, then rest. `easiestUnlockedIncomplete` scans bands ascending, unlocked only (the stage-gate free path).

**Edit** `packages/template/src/components/IntegratedSessionRow.tsx` (shared with sudoku — additive optional props only):

- `getStarRating?: (state: State) => number | undefined` → render `<StarRating rating={n} size="sm" />` beside the moves chip on completed rows.
- `isLocked?: boolean; onLockedClick?: () => void` → replace the `Link` wrapper with an identical-layout `<button>` when locked; lucide `Lock` badge overlay + dimmed preview, `aria-label="Locked puzzle"`.
- Update `IntegratedSessionRow.test.tsx` (with/without props); sudoku passes nothing → zero change.

**Edit** `packages/template/src/components/MyPuzzlesTab.tsx`: thread optional `getStarRating` through (same pattern as existing `getMovesDisplay`).

**Edit** `apps/unblockrace/src/app/collection/page.tsx`: `getStarRating={starRatingFromState}`; `lockedIndexes = useMemo(...)`; per tile `isLocked={!isSubscribed && lockedIndexes.has(i)}`, `onLockedClick` → `subscribeModal?.showModalIfRequired(navigateToPuzzle, () => {}, SubscriptionContext.COLLECTION_LOCKED)` (cancel = stay on collection = the "back to collection" choice); header chip "X of Y free this month — Plus unlocks all". Also pass `getStarRating` in `apps/unblockrace/src/app/page.tsx` MyPuzzlesTab/FriendsTab usages.

## Task 5 — End-of-puzzle juice + continue flow

**Create** `packages/unblockrace/src/components/PuzzleGate.tsx` (reused by Task 6): full-board overlay styled like the stage-clear slam (backdrop blur, slam-in, reduced-motion guard):

```tsx
interface PuzzleGateProps {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}
```

**Edit** `UnblockRace.tsx` stage-clear slam (~L668–801): derive `stars = starRatingForMoves(movesMade, movesRequired)` and `points = calculateSessionScore(synthesizedSession, { dailyCombo: SCORING_CONFIG.DAILY_COMBO, dayPuzzleIndex }).total` (dayPuzzleIndex = user's sessions completed today before this one, from `useSessions` already in scope). Choreography: `<StarRating size="lg" animated />` pops one-by-one → `<CountUp value={points} prefix="+" suffix=" pts" startDelayMs={stars*220+200} />` with "leaderboard points" label → existing `next-stage-button` gets a delayed slow-pulse keyframe + progress line "Stage n of 5 — X to go".

**Edit** `packages/unblockrace/src/components/RaceCelebration.tsx`: optional `stars?: number; points?: number` props; render animated StarRating above totals + CountUp below, timed within the existing `RACE_CELEBRATION_MS` window. Caller passes run-total stars (total moves vs total par) and summed `calculateSessionScore` points.

**Create** `packages/unblockrace/src/components/NextPuzzlePanel.tsx` + test:

```tsx
interface NextPuzzlePanelProps {
  next: NextCollectionPuzzle;
  progressLabel: string; // "3 of 8 Hard complete"
  onContinue: () => void;
}
```

Big pulsing "Continue — next puzzle" CTA (same pill language as next-stage-button); difficulty badge; `Lock` glyph + "Continue (Plus)" when `next.isLocked` (navigation proceeds; Task 6's deep-link gate catches it).

**Wire in `UnblockRace.tsx`**: when `completed && metadata.unblockCollectionPuzzleId` (collection = 1-stage run), compute `next = getNextCollectionPuzzle(...)` via `useCollection()` + sessions, render panel under the board above `UnblockRaceTrack`; panel persists after the celebration. After the FINAL daily stage (free user with budget left), also render pointing at `easiestUnlockedIncomplete` ("Keep the streak going in the collection").

**Tests**: `UnblockRace.test.tsx` (stars/points/CTA on stage clear; panel + resolver on collection completion; locked-next label), `RaceCelebration.test.tsx` (props present/absent).

## Task 6 — Gates & limits in UnblockRace

**Stage-3 gate** (edit `UnblockRace.tsx`): new `stageGate` state. In `advanceStage` (L281): if daily run && `!isSubscribed` && `currentStageIndex + 1 >= DAILY_LIMITS.FREE_DAILY_RUN_STAGES` → `setStageGate(true)` instead of `goToStage`; also guard forward `goToStage` jumps into gated indexes (StageResultPanel exposes them). Render `PuzzleGate`: primary "Unlock stages 4 & 5 with Plus" → `subscribeModal?.showModalIfRequired(() => { setStageGate(false); goToStage(next, 'forward'); }, () => {}, SubscriptionContext.DAILY_RUN_STAGES)`; secondary "Try an easier puzzle from the collection" → `easiestUnlockedIncomplete` → `router.push(buildPuzzleUrl(...))`, fallback `/collection`. Timer-safe by construction: gate fires after stage-3 `completed` (timer stopped) and before any `StageTransition`; stage-4 countdown only starts in `handleTransitionDone`, unreachable until purchase callback. Slam→Next→gate ordering (gate replaces the transition, not the slam).

**Locked deep-link gate** (edit `UnblockRace.tsx`): `isLockedCollectionPuzzle = !isSubscribed && !completed && !alreadyCompleted && isCollectionPuzzleIdLocked(metadata.unblockCollectionPuzzleId)`. When true: `PuzzleGate` over the disabled board ("Unlock the pack with Plus" → paywall w/ `COLLECTION_LOCKED`; "Back to collection" → `router.replace('/collection')`); add flag to the `shouldPause` timer expression (~L386) so no countdown starts and no puzzle credit burns.

**5-puzzles/day cap**: **create** `packages/unblockrace/src/utils/dailyPuzzleCounter.ts` + test (**delete** `dailyRunCounter.ts` + its test; sole consumer is `UnblockRace.tsx`; stale `daily-run-ids` localStorage self-expires): key `'daily-puzzle-ids'`, `getDailyPuzzleIds()`, `addDailyPuzzleId(id)`, `canStartPuzzle(id)` (`has(id) || size < DAILY_LIMITS.PUZZLES`), `getRemainingPuzzles()`; date rollover, SSR guard. **Edit** the enforcement effect (L340–381): trigger on countdown for EVERY stage (drop the stage-0-only condition), key by the stage's board string (not runId), skip when stage already completed or any gate overlay is up; on block `setPauseTimer(true)` + `subscribeModal?.showModalIfRequired(resume, () => router.replace('/'), SubscriptionContext.DAILY_PUZZLE_LIMIT)`.

**Undo gating** (edit `packages/unblockrace/src/hooks/useGameState.ts` ~L349–367): mirror `packages/sudoku/src/hooks/gameState.ts` L385–418 — `RevenueCatContext` already available in the package; wrap undo body in `performUndo`; `isSubscribed || canUseUndo()` → perform, else `subscribeModal?.showModalIfRequired(performUndo, () => {}, SubscriptionContext.UNDO)`; `incrementUndoCount()` for free users. Imports from `@bubblyclouds-app/template/utils/dailyActionCounter` (5/day). Redo stays free (matches sudoku). Hint gating: future only (hint doesn't exist yet — see PLAN-unblock-agents-solver-hint.md; note, no code).

**Tests**: gate both paths, forward-jump guard, per-stage counting w/o double-count on resume, gated stage never burns credit, undo gate (subscriber free / free user's 6th undo → modal), and a composed-flow walkthrough test: 3 daily stages + gate → easier-puzzle path → 2 collection puzzles → 6th puzzle blocked.

## Task 7 — Rate-app buttons (both apps)

**Create** `packages/template/src/components/RateAppButton.tsx` + test:

```tsx
interface RateAppButtonProps {
  appName: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  variant?: 'card' | 'inline';
  className?: string;
}
```

On Capacitor (`isCapacitor()` from `../helpers/capacitor`) → `InAppReview.requestReview().catch(console.error)`; mobile web → open matching store URL (`noopener`); desktop web → two small store links. Copy: "Enjoying {appName}? ★ Rate it". Add `@capacitor-community/in-app-review` to `packages/template/package.json` + component export. Keep the existing milestone auto-prompts in `RaceCelebration.tsx`/`CelebrationAnimation.tsx` unchanged.

**Homepages**: `apps/unblockrace/src/app/page.tsx` Start tab — `variant="card"` between the collection grid and `<PremiumFeatures>` (~L570); `apps/sudoku/src/app/page.tsx` same placement relative to its `PremiumFeatures` (~L585). Update both `page.test.tsx` (sudoku has snapshots). Note: unblock `appStoreUrl` contains `idTODO` — flag, don't fix.

**Completed blocks**: `packages/games/src/components/RaceTrack.tsx` (sudoku's, isCompleted block ~L487–550) — new optional `rateApp?: { appName; appStoreUrl; googlePlayUrl }` prop rendering `variant="inline"` below the "Challenge friends" card (`@games` already depends on `@template`); wire from `packages/sudoku/src/components/Sudoku.tsx` (~L749; store URLs already props). Same optional prop + placement in `packages/unblockrace/src/components/UnblockRaceTrack.tsx` (~L658–714), wired from `UnblockRace.tsx` (props already present). Update `RaceTrack.test.tsx` + `UnblockRaceTrack` coverage.

## Task 8 — Final verification

- From repo root: `pnpm run lint:fix`, `pnpm run build`, `pnpm run test` — **run sandbox-disabled** (known jest-cache/next-font EPERM in sandbox).
- `pnpm dev:unblockrace` manual walkthrough: stars on collection tiles; stage-clear star pop + points count-up + pulsing CTA; stage-3 gate (both paths); locked tile click + locked deep link; NextPuzzlePanel continue chain incl. locked-next; 5-puzzle cap on 6th puzzle; undo gate on 6th undo; combo row in ScoreBreakdown + legend.
- `pnpm dev:sudoku` regression: homepage renders (new Rate button only), completed-puzzle block (Rate button only new element), leaderboard numbers UNCHANGED, no combo row visible.
- Update any md files that reference changed behaviour (e.g. SPEC.md daily-limit section if it mentions 3 runs/day).

## Task dependencies

| #   | Task                                     | Depends on        |
| --- | ---------------------------------------- | ----------------- |
| 1   | @ui foundations (CountUp, StarRating)    | —                 |
| 2   | Scoring engine + UnblockLeaderboard      | —                 |
| 3   | Contexts, limits & copy                  | —                 |
| 4   | Stars/locks/resolver helpers + tiles     | 1, 3              |
| 5   | End-of-puzzle juice + continue flow      | 1, 2, 4           |
| 6   | Gates & limits in UnblockRace            | 3, 4, 5 (PuzzleGate) |
| 7   | Rate-app buttons                         | —                 |
| 8   | Final verification                       | 1–7               |

## Risks

- **Shared-component blast radius**: `IntegratedSessionRow`, `MyPuzzlesTab`, `Leaderboard`, `ScoreBreakdown`, `ScoringLegend`, `RaceTrack` are sudoku-rendered — every change optional-prop/additive; Task 8 sudoku regression is mandatory.
- **SubscriptionContext enum is load-bearing for sudoku** — enum additions + sudoku Exclude update must land together (Task 3).
- **Scoring back-compat**: `calculateSessionScore` refactor must be provably identical for sudoku (parity tests in Task 2); unblock leaderboard totals will rise (daily/book bases now apply) — intended, note in PR.
- **Gate/timer interplay**: both gates must block before `goToStage`/`StageTransition` so no countdown/daily-credit side effects fire; the counter effect must skip while gated.
- **RevenueCat external config**: unblock keys + App Store id are `TODO` — purchases can't complete until dashboard/store setup; code degrades exactly as today.
