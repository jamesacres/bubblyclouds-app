# PLAN: Unblock Race monetization + retention (stars, juice, hints paywall, locks, combo scoring, rate-app)

> Workflow: this plan is executed task-by-task with fresh-context subagents. Each subagent reads this plan plus the files named in its task. Run `pnpm run lint:fix` at the end of every task; full build/test in Task 8.

## Context

Unblock Race needs a monetization + retention layer built around **hints as the upsell** (not play limits): star ratings vs par, addictive end-of-puzzle celebration (animated stars + points count-up), a compelling continue-to-next-puzzle flow, 2 free hints/day then Plus, 50% of each collection difficulty locked for free users, a puzzles-per-day leaderboard multiplier, Rate-app buttons, top-bar Retry/Previous with confirmations, and a "Beginner" easiest difficulty. **Sudoku stays exactly as-is except the Rate-app buttons** — all shared-code changes must be additive/optional-prop only.

Confirmed decisions:

- **No play limits at all**: the daily run is fully free (all 5 stages), no daily puzzle cap, and the existing 3-runs/day limit is REMOVED. Players who play more are more likely to buy hints.
- **Hints are the paywall**: 2 free hints/day, then Plus. Hint button gets an always-on animated rainbow border; a "Stuck? Try a hint" speech bubble appears when the player goes over par or is idle ~20s, and hides automatically on the next board click.
- Undo stays gated at 5 free/day (mirrors sudoku).
- Collection locks (50% per difficulty) stay; Plus unlocks the whole monthly pack (£0.99/month or £3.99 lifetime — RevenueCat dashboard config).
- Daily combo multiplier is Unblock-only (config-driven, sudoku bit-identical).
- Rate-app button on BOTH homepages AND both completed-puzzle blocks.
- "Retry stage" + "← Previous" buttons in a bar at the top near the stage pips; Retry and Reset show an "Are you sure?" confirm. Retrying a completed stage starts a fresh timer and the new result overwrites.
- Easiest difficulty label renamed "Tricky" → "Beginner" (Unblock only; sudoku's shared display untouched).

Key verified facts:

- **Hints exist as of commit `749cd403`** (free & unlimited today): `packages/unblockrace/src/helpers/hint.ts` (`getHint`), wasm solver `packages/unblockrace/src/services/solver.ts` (jest always mocks it), `handleHint` in `packages/unblockrace/src/components/UnblockRace.tsx` (~L437, hint state ~L416–455, button wiring ~L877, hint-notice row ~L893), hint button in `packages/unblockrace/src/components/Controls.tsx` (~L124, `onHint`/`isHintDisabled` props). The comment at UnblockRace.tsx ~L416 says "free & unlimited" — update it.
- Premium infra: RevenueCat `'Plus'` entitlement via `packages/template/src/providers/RevenueCatProvider.tsx` (already consumed in UnblockRace.tsx L95), paywall `packages/template/src/components/PlusModal.tsx`, wrapper `apps/unblockrace/src/components/UnblockRacePlusModal.tsx`, contexts in `packages/types/src/subscriptionContext.ts`. Prices come from RevenueCat offerings — dashboard config, not code. Unblock's RevenueCat keys are still `'TODO'` in `apps/unblockrace/app.config.js` (flag in PR, don't fix in code).
- `apps/sudoku/src/config/subscriptionMessages.tsx` is an exhaustive `Record<SubscriptionContext, ContextMessage>` — new enum members break sudoku's build unless its record type Excludes them (must land in the same task).
- `getPuzzleType` (`packages/games/src/helpers/scoringUtils.ts:10`) only knows sudoku metadata — unblock sessions currently score as `'unknown'`. Teaching it unblock keys (`runId` starts `oftheday` → daily, `unblockCollectionPuzzleId` → book) can't affect sudoku but WILL raise unblock leaderboard totals (intended; call out in PR).
- Par = `movesRequired`; moves via `movesMadeFromState` (`packages/unblockrace/src/helpers/calculateStatsDisplay.ts`); cheat detection via `isPuzzleCheated`.
- Stage-clear slam is inline in `UnblockRace.tsx` (`data-testid="stage-clear-slam"`); `advanceStage` ~L281; the 3-runs/day enforcement effect ~L340–381 uses `canStartRun`/`addDailyRunId` from `utils/dailyRunCounter.ts` (sole consumer) — all of this is being deleted.
- Undo/redo/reset live in `packages/unblockrace/src/hooks/useGameState.ts` (undo ~L349–367) and `Controls.tsx` (reset button ~L160, destructive styling); stage jumping via `StageResultPanel.tsx` `goToStage` (stays as-is; the top bar is additive).
- Collection ids `ofthemonth-YYYYMM-puzzle-N` are deterministic via `getCollectionOfTheMonth` (`helpers/mockData.ts`) — lock status recomputable anywhere. `CollectionProvider` is app-wide, so `UnblockRace` may call `useCollection()`.
- Difficulty labels: `packages/unblockrace/src/helpers/difficultyDisplay.ts` maps `simple` → "Tricky". Homepage copy says "Tricky → Expert"; collection page has "Jump to difficulty" buttons.
- No count-up or star component exists anywhere — create in `@ui`.
- `@capacitor-community/in-app-review` is a dep of both apps, used by milestone auto-prompts in `packages/ui/src/components/CelebrationAnimation.tsx` + `packages/unblockrace/src/components/RaceCelebration.tsx` (keep those).
- Undo-gating infra is shared: `packages/template/src/utils/dailyActionCounter.ts` (`canUseUndo`, `incrementUndoCount`, date-keyed, midnight reset) + `packages/template/src/config/dailyLimits.ts` (`UNDO: 5`). Sudoku's gating pattern: `packages/sudoku/src/hooks/gameState.ts` ~L385–418.

Design constants:

- **Stars**: 3★ `movesMade ≤ par`; 2★ `movesMade ≤ par + max(2, ceil(par*0.25))`; 1★ any other solve; none if cheated/incomplete.
- **Daily combo**: nth puzzle completed on the same UTC day multiplies that puzzle's (volume + base×difficulty + speed) by `min(1 + (n−1)×0.1, 1.5)`; racing bonus excluded.
- **Locks**: per difficulty band, the latter `floor(len/2)` puzzles are locked for free users ("first half of every difficulty is free").
- **Hints**: `HINT: 2` free/day (template `dailyLimits`), tracked in `dailyActionCounter` alongside undo.
- **New SubscriptionContext**: `HINT = 'hint'`, `COLLECTION_LOCKED = 'collectionLocked'`.

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

**Edit** `packages/types/src/subscriptionContext.ts`: add `HINT = 'hint'`, `COLLECTION_LOCKED = 'collectionLocked'`.

**Edit** `apps/sudoku/src/config/subscriptionMessages.tsx` (SAME task or sudoku type-check breaks): record type → `Record<Exclude<SubscriptionContext, HINT | COLLECTION_LOCKED>, ContextMessage>`; no copy changes.

**Edit** `packages/template/src/config/dailyLimits.ts`: add `HINT: 2` next to `UNDO: 5`.

**Edit** `packages/template/src/utils/dailyActionCounter.ts` (+ its test): additive `hintCount` field with `canUseHint()`, `incrementHintCount()`, `getRemainingHints()` — same shape as the undo functions; sudoku never calls them.

**Delete** `packages/unblockrace/src/config/dailyLimits.ts` and stale `apps/unblockrace/src/config/dailyLimits.ts` — there are no play limits anymore (the `dailyRunCounter` consumer is removed in Task 6).

**Edit** `apps/unblockrace/src/config/subscriptionMessages.tsx`: record type → `Record<Exclude<SubscriptionContext, CHECK_GRID | REVEAL | DAILY_PUZZLE_LIMIT>, ContextMessage>` (UNDO stays gated; DAILY_PUZZLE_LIMIT no longer used by unblock). Messages:

- `HINT`: "You've used your 2 free hints today. Plus gives you unlimited hints — never get stuck again." (limit imported from `@bubblyclouds-app/template/config/dailyLimits`)
- `UNDO`: 5 free undos/day copy (limit from same import).
- `COLLECTION_LOCKED`: "This puzzle is in the locked half of this month's pack. Plus unlocks the entire pack, every month."

**Edit** `apps/unblockrace/src/config/premiumFeatures.tsx` + `UnblockRacePlusModal.tsx` copy: lead with "Unlimited hints", "Entire monthly pack unlocked, every month", "Unlimited undos"; keep teams/themes entries. Keep hard prices OUT of JSX — PlusModal renders store-truth prices from RevenueCat. **PR note (non-code):** configure RevenueCat `default` offering with `monthly` £0.99 + `lifetime` £3.99 packages and `Plus` entitlement; fill `'TODO'` API keys in `apps/unblockrace/app.config.js`.

## Task 4 — Stars, locks, resolver, tiles + Beginner rename

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
```

Order: incomplete in same band after current index (prefer unlocked for free users), then next harder band, then rest.

**Edit** `packages/unblockrace/src/helpers/difficultyDisplay.ts`: `simple` label/shortLabel "Tricky" → "Beginner". Update every Unblock surface that hardcodes "Tricky" (homepage "Tricky → Expert" copy in `apps/unblockrace/src/app/page.tsx`, collection "Jump to difficulty" buttons in `collection/page.tsx`) and affected tests/snapshots. Shared `@games` `getDifficultyDisplay` (sudoku) untouched.

**Edit** `packages/template/src/components/IntegratedSessionRow.tsx` (shared with sudoku — additive optional props only):

- `getStarRating?: (state: State) => number | undefined` → render `<StarRating rating={n} size="sm" />` beside the moves chip on completed rows.
- `isLocked?: boolean; onLockedClick?: () => void` → replace the `Link` wrapper with an identical-layout `<button>` when locked; lucide `Lock` badge overlay + dimmed preview, `aria-label="Locked puzzle"`.
- Update `IntegratedSessionRow.test.tsx` (with/without props); sudoku passes nothing → zero change.

**Edit** `packages/template/src/components/MyPuzzlesTab.tsx`: thread optional `getStarRating` through (same pattern as existing `getMovesDisplay`).

**Edit** `apps/unblockrace/src/app/collection/page.tsx`: `getStarRating={starRatingFromState}`; `lockedIndexes = useMemo(...)`; per tile `isLocked={!isSubscribed && lockedIndexes.has(i)}`, `onLockedClick` → `subscribeModal?.showModalIfRequired(navigateToPuzzle, () => {}, SubscriptionContext.COLLECTION_LOCKED)` (cancel = stay on collection = the "back to collection" choice); header chip "X of Y free this month — Plus unlocks all". Also pass `getStarRating` in `apps/unblockrace/src/app/page.tsx` MyPuzzlesTab/FriendsTab usages.

## Task 5 — End-of-puzzle juice + continue flow

**Create** `packages/unblockrace/src/components/PuzzleGate.tsx` (used by Task 6's locked deep-link): full-board overlay styled like the stage-clear slam (backdrop blur, slam-in, reduced-motion guard):

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

**Edit** `UnblockRace.tsx` stage-clear slam: derive `stars = starRatingForMoves(movesMade, movesRequired)` and `points = calculateSessionScore(synthesizedSession, { dailyCombo: SCORING_CONFIG.DAILY_COMBO, dayPuzzleIndex }).total` (dayPuzzleIndex = user's sessions completed today before this one, from `useSessions` already in scope). Choreography: `<StarRating size="lg" animated />` pops one-by-one → `<CountUp value={points} prefix="+" suffix=" pts" startDelayMs={stars*220+200} />` with "leaderboard points" label → existing `next-stage-button` gets a delayed slow-pulse keyframe + progress line "Stage n of 5 — X to go".

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

**Wire in `UnblockRace.tsx`**: when `completed && metadata.unblockCollectionPuzzleId` (collection = 1-stage run), compute `next = getNextCollectionPuzzle(...)` via `useCollection()` + sessions, render panel under the board above `UnblockRaceTrack`; panel persists after the celebration. After the FINAL daily stage, also render pointing at the next incomplete collection puzzle ("Keep the streak going in the collection").

**Tests**: `UnblockRace.test.tsx` (stars/points/CTA on stage clear; panel + resolver on collection completion; locked-next label), `RaceCelebration.test.tsx` (props present/absent).

## Task 6 — Hints paywall, nudge, retry/previous, remove play limits

**Remove all play limits** (edit `UnblockRace.tsx`): delete the daily-run-limit effect (~L340–381) and the `canStartRun`/`addDailyRunId` import; **delete** `packages/unblockrace/src/utils/dailyRunCounter.ts` + its test (sole consumer; stale `daily-run-ids` localStorage self-expires). All 5 daily stages and unlimited puzzles are free.

**Hint gating** (edit `UnblockRace.tsx` `handleHint` ~L437): mirror sudoku's undo pattern (`packages/sudoku/src/hooks/gameState.ts` ~L385–418) — wrap the existing body in `performHint`; `isSubscribed || canUseHint()` → perform (+ `incrementHintCount()` for free users), else `subscribeModal?.showModalIfRequired(performHint, () => {}, SubscriptionContext.HINT)`. Uses Task 3's `dailyActionCounter` additions. Update the "free & unlimited" comment (~L416). Show remaining free hints on the button ("Hint · 2 left" for free users, from `getRemainingHints()`).

**Rainbow hint button** (edit `packages/unblockrace/src/components/Controls.tsx`): always-on animated rainbow border on the hint button — conic-gradient ring (wrapper span with `background: conic-gradient(...)` + spin keyframe, inner button masks the centre), `prefers-reduced-motion` → static gradient. New optional prop `hintBadge?: string` for the "2 left" count.

**"Stuck?" speech bubble** — **create** `packages/unblockrace/src/components/HintNudge.tsx` + test: small speech-bubble ("Stuck? Try a hint") anchored above the hint button with a tail, gentle bob animation, reduced-motion guard. Logic in `UnblockRace.tsx`: show when NOT completed/transitioning AND (`movesMade > movesRequired` OR ≥20s since the last answer-stack change — timestamp ref updated on `answer` changes + a 1s interval or timeout to flip visibility); hide automatically on the next board pointer-down (Board already surfaces pointer handlers — add an `onBoardPointerDown` hook or listen on the board container ref) and re-arm for the next over-par/idle trigger only once per stage.

**Top bar: Previous / Retry + confirms** (edit `UnblockRace.tsx` + **create** `packages/unblockrace/src/components/ConfirmDialog.tsx` + test):

```tsx
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

- Bar at the top near the stage pips (`RaceHud` area): "← Previous" (visible when `currentStageIndex > 0`; calls `goToStage(currentStageIndex - 1, 'back')` — existing filmstrip navigation stays too) and "Retry" (RotateCcw icon).
- Retry → ConfirmDialog "Retry this stage? Your current time and moves will be replaced." → confirm calls `reset()` (existing `useGameState.reset` starts a fresh timer session). For an already-completed stage, retrying clears `completed` and the stage's entry in `completedStages` so the new result overwrites — verify `reset()` handles the completed state (it clears the stack + new timer session; ensure `completedStages` map entry for the current index is also cleared in `UnblockRace.tsx`).
- Wrap the existing destructive Reset button in `Controls.tsx` with the same ConfirmDialog ("Reset this puzzle?") — add optional `confirmReset?: boolean` or lift confirmation into `UnblockRace.tsx` by intercepting the `reset` prop (preferred: intercept in `UnblockRace.tsx`, no Controls API change).

**Locked deep-link gate** (edit `UnblockRace.tsx`): `isLockedCollectionPuzzle = !isSubscribed && !completed && !alreadyCompleted && isCollectionPuzzleIdLocked(metadata.unblockCollectionPuzzleId)`. When true: `PuzzleGate` over the disabled board ("Unlock the pack with Plus" → paywall w/ `COLLECTION_LOCKED`; "Back to collection" → `router.replace('/collection')`); add flag to the `shouldPause` timer expression so no countdown starts.

**Undo gating** (edit `packages/unblockrace/src/hooks/useGameState.ts` ~L349–367): mirror sudoku — wrap undo body in `performUndo`; `isSubscribed || canUseUndo()` → perform, else `subscribeModal?.showModalIfRequired(performUndo, () => {}, SubscriptionContext.UNDO)`; `incrementUndoCount()` for free users; imports from `@bubblyclouds-app/template/utils/dailyActionCounter`. Redo stays free.

**Tests**: hint gate (subscriber unlimited; free user's 3rd hint → modal; badge counts down), nudge (over-par trigger, idle trigger with fake timers, hides on board click, once per stage), retry confirm flow incl. completed-stage overwrite, reset confirm, previous-stage button, locked deep-link gate, undo gate, and REMOVAL tests (no paywall after 4+ runs in a day).

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

**Completed blocks**: `packages/games/src/components/RaceTrack.tsx` (sudoku's, isCompleted block ~L487–550) — new optional `rateApp?: { appName; appStoreUrl; googlePlayUrl }` prop rendering `variant="inline"` below the "Challenge friends" card (`@games` already depends on `@template`); wire from `packages/sudoku/src/components/Sudoku.tsx` (~L749; store URLs already props). Same optional prop + placement in `packages/unblockrace/src/components/UnblockRaceTrack.tsx` (isCompleted block), wired from `UnblockRace.tsx` (props already present). Update `RaceTrack.test.tsx` + `UnblockRaceTrack` coverage.

## Task 8 — Final verification + doc sync

- From repo root: `pnpm run lint:fix`, `pnpm run build`, `pnpm run test` — **run sandbox-disabled** (known jest-cache/next-font EPERM in sandbox).
- `pnpm dev:unblockrace` manual walkthrough: stars on collection tiles; stage-clear star pop + points count-up + pulsing CTA; hint rainbow border + badge; 3rd hint opens paywall; "Stuck?" bubble on over-par and after 20s idle, hides on board click; Previous/Retry top bar + confirm dialogs (retry overwrites a completed stage); reset confirm; locked tile click + locked deep link; NextPuzzlePanel continue chain incl. locked-next; NO paywall however many puzzles/runs are played; undo gate on 6th undo; combo row in ScoreBreakdown + legend; "Beginner" label on homepage/collection/chips.
- `pnpm dev:sudoku` regression: homepage renders (new Rate button only), completed-puzzle block (Rate button only new element), leaderboard numbers UNCHANGED, no combo row, difficulty labels unchanged.
- **Doc sync (CLAUDE.md rule)**: update SPEC.md §6 (daily run limit — removed) and any hint "free & unlimited" references (SPEC.md, `PLAN-unblock-agents-solver-hint.md` Part C note, code comments); grep for "RUNS", "free & unlimited", "Tricky" in md files.

## Task dependencies

| #   | Task                                            | Depends on |
| --- | ----------------------------------------------- | ---------- |
| 1   | @ui foundations (CountUp, StarRating)           | —          |
| 2   | Scoring engine + UnblockLeaderboard             | —          |
| 3   | Contexts, limits & copy                         | —          |
| 4   | Stars/locks/resolver + tiles + Beginner rename  | 1, 3       |
| 5   | End-of-puzzle juice + continue flow             | 1, 2, 4    |
| 6   | Hints paywall, nudge, retry/previous, no limits | 3, 4, 5 (PuzzleGate) |
| 7   | Rate-app buttons                                | —          |
| 8   | Final verification + doc sync                   | 1–7        |

## Risks

- **Shared-component blast radius**: `IntegratedSessionRow`, `MyPuzzlesTab`, `Leaderboard`, `ScoreBreakdown`, `ScoringLegend`, `RaceTrack`, `dailyActionCounter` are sudoku-consumed — every change optional-prop/additive; Task 8 sudoku regression is mandatory.
- **SubscriptionContext enum is load-bearing for sudoku** — enum additions + sudoku Exclude update must land together (Task 3).
- **Scoring back-compat**: `calculateSessionScore` refactor must be provably identical for sudoku (parity tests in Task 2); unblock leaderboard totals will rise (daily/book bases now apply) — intended, note in PR.
- **Retry-overwrite semantics**: clearing `completed` + the `completedStages` entry must also produce a sane server-session state (the stage session is dual-written) — verify the server save on the retried solve replaces cleanly and cheat detection doesn't flag the fresh timer session (see unblockrace-transition-testing memory for the cheat-check gotcha).
- **Nudge timers vs game timers**: the 20s idle detection must respect pause/visibility (don't pop the bubble while paused, during transitions, or on completed boards).
- **RevenueCat external config**: unblock keys + App Store id are `TODO` — purchases can't complete until dashboard/store setup; code degrades exactly as today.
