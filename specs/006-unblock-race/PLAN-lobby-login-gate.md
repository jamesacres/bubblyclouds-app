# Plan: require login before play, gate it in the shared Lobby

## Why

A recent fix to `packages/sudoku/src/hooks/gameState.ts` made the restore
effect call `loginRedirect({ userInitiated: false })` automatically when a
previously-authenticated session turns out to be dead. That is a jarring,
non-obvious control-flow surprise (a data hook silently full-page-redirects
the player mid-game) and it only reacts *after* game state has already
started being created.

The user wants a cleaner architecture instead: gate entry at the UI layer
(the lobby), before any server game-state is created, so login is always a
deliberate, user-initiated action with a visible state to design around. This
also fixes the underlying problem the earlier patch was reacting to, since
game state is now never created without a confirmed user.

**Scope decision (confirmed with the user):** this removes guest play
entirely, in **both** Sudoku and Unblock Race, since `Lobby.tsx` is a single
shared component in `packages/template`. This is a deliberate, real product
change beyond a bug fix — not a "keep functionally identical" change.

## Current state (confirmed by reading the code)

- `packages/template/src/components/Lobby.tsx` is shared by both apps. It
  already reads `UserContext` (`user`, `showLoginModal`) and already has one
  precedent for gating an action on login: the "Invite" button
  (`Lobby.tsx` ~423) does `if (!user) { showLoginModal?.(undefined,
  LoginContext.RACE_LOBBY); return; }` before proceeding — a user-initiated,
  in-context modal, not a redirect.
- `Lobby` is rendered by both `Sudoku.tsx` and `UnblockRace.tsx` as an overlay
  toggled by `showLobby` — **the board underneath renders regardless of
  `showLobby`**, and `useGameState`'s restore effect (in
  `packages/sudoku/src/hooks/gameState.ts`) runs unconditionally on mount,
  independent of `showLobby`. Today a guest can be actively playing (game
  state created/restored) while the lobby has never been shown.
- `UserContext` (`packages/auth/src/providers/AuthProvider.tsx`) exposes
  `isInitialised: boolean` — true once cold-start auth (token refresh/session
  resolution) has settled — and `user?: UserProfile`.
- `packages/unblockrace/src/components/PuzzleGate.tsx` is an existing,
  reusable full-board overlay pattern: title/body copy + primary/secondary
  buttons, theme-color driven, board-relative absolute positioning
  (`absolute inset-0 z-30 ... backdrop-blur-sm`). Currently used only for
  locked-collection deep-links. This is the right shape for a "sign in to
  continue" gate — reuse the pattern rather than inventing new UI.
- My earlier patch to `packages/sudoku/src/hooks/gameState.ts` (the
  `loginRedirect` branch in the restore effect, plus the `isInitialised`
  early-return) needs to be **reverted** — this plan supersedes it. The crash
  fix itself (`serverValue?.state` guard) stays; it's a correct, narrow
  defensive fix independent of the gating question.

## Target behavior

On entering a puzzle (either app), before any server game-state
create/restore happens:

1. **Loading** (`isInitialised === false`): show a lightweight loading state
   in place of the lobby/board interaction — auth is still resolving
   (cold-start token refresh). No login prompt yet, no game-state creation.
2. **Not logged in** (`isInitialised === true && !user`): show a "sign in to
   continue" gate (reusing the `PuzzleGate` visual pattern, promoted to a
   shared location since both apps need it — see Package placement below).
   User-initiated only: a primary button triggers `showLoginModal` (in-context
   modal, matching the existing Lobby precedent) or `loginRedirect` if a
   full-page flow is required for this app's auth setup — decide based on
   how `showLoginModal` vs `loginRedirect` are already differentiated
   elsewhere (modal is used for in-context/lobby actions; full redirect is
   used for things like `/auth` page-level flows). No secondary "continue as
   guest" button — guest play is being removed.
3. **Authenticated** (`isInitialised === true && user`): proceed exactly as
   today — `useGameState`'s restore effect runs, server game-state is
   created/restored as usual, Lobby/board render normally.

## Package placement

- Promote the gate UI: either (a) generalize `PuzzleGate` and move it from
  `packages/unblockrace/src/components/` into a shared layer (`packages/ui`
  or `packages/games`, matching layer rules: must not import
  app-specific code) so both apps can use it, keeping Unblock Race's existing
  locked-collection usage working unchanged; or (b) build a new, smaller
  shared "AuthGate" component in `packages/template` (co-located with
  `Lobby.tsx`, which already depends on `template`) if reusing `PuzzleGate`
  directly proves awkward (e.g. its copy/props are too collection-lock
  specific). Decide during implementation by reading `PuzzleGate.tsx` and
  `Lobby.tsx` fully; prefer (a) if the visual/prop shape genuinely fits,
  otherwise (b) rather than forcing a bad fit.
- The gate must be layer-clean: `packages/template` (L3) can depend on
  `packages/ui` (L1) and `packages/auth` (L2), not the other way around, and
  not on `packages/games`/`sudoku`/`unblockrace` (L4+).

## Implementation steps

1. **Revert** the `loginRedirect`/`isInitialised`/`hadUser` branch added to
   `packages/sudoku/src/hooks/gameState.ts`'s restore effect in the prior
   commit. Keep the `serverValue?.state` crash-guard fix (still correct and
   needed regardless of gating strategy). Remove the now-unnecessary
   `useOnline` import/usage if nothing else in the file needs it — check
   first. Revert/adjust the tests added for that branch in
   `gameState.test.ts` / `gameState.extra.test.ts` accordingly (remove tests
   asserting the reverted behavior; keep the crash-guard regression test).

2. **Gate `useGameState`'s restore effect on auth readiness.** The effect
   should not run its server-restore logic until the caller knows there's a
   confirmed user. Two sub-options to evaluate while implementing:
   - Gate inside `gameState.ts` itself using `UserContext` directly (it
     already has access via `useContext(UserContext)`), e.g. skip the
     restore effect body entirely while `!isInitialised || !user`, letting it
     naturally re-run once both are true (add to the dependency array).
   - Or gate at the `Sudoku.tsx`/`UnblockRace.tsx` call site by not mounting
     the puzzle-playing subtree (and therefore not calling `useGameState` in
     a way that creates state) until authenticated — check whether
     `useGameState` is a hook that can be conditionally skipped or whether it
     must always be called (Rules of Hooks) and its internal effects gated
     instead.
   Prefer keeping the change inside `gameState.ts` (smaller diff, consistent
   with where the crash fix already lives) unless investigation shows the
   component-level gate is clearly cleaner. Either way: no `loginRedirect`
   call from inside the hook — the UI gate (Lobby/board overlay) is now
   entirely responsible for getting the user to a logged-in state before the
   hook's effect is allowed to proceed.

3. **Add the three-state gate to the shared entry flow.** Concretely, in
   `packages/template/src/components/Lobby.tsx` (or a thin wrapper that both
   `Sudoku.tsx` and `UnblockRace.tsx` render in place of/alongside `Lobby` and
   the board):
   - Read `isInitialised` and `user` from `UserContext` (already imported).
   - While `!isInitialised`: render the loading state, suppress
     Lobby/board interaction.
   - While `isInitialised && !user`: render the gate UI (from step "Package
     placement"), suppress Lobby/board interaction, primary CTA calls
     `showLoginModal` (or `loginRedirect`, per the decision in step 3 above).
   - While `isInitialised && user`: render existing Lobby/board exactly as
     today.
   - Confirm exactly where the board is rendered in both `Sudoku.tsx` and
     `UnblockRace.tsx` relative to `Lobby`, since the board currently renders
     independently of `showLobby` — the new gate must cover the board too,
     not just the Lobby overlay, otherwise a not-logged-in user could still
     see/interact with the puzzle grid underneath.

4. **Both apps' call sites**: wire `Sudoku.tsx` and `UnblockRace.tsx` to the
   new gated flow. Confirm `LoginContext` needs a new value (e.g. a
   `PUZZLE_ENTRY` context) for accurate modal copy, distinct from the
   existing `RACE_LOBBY` invite-gate copy — check `LoginContext` enum usages
   and the messaging config (`loginMessages.tsx` in each app) to see if a new
   context + copy is warranted or if an existing one fits.

5. **Tests**:
   - `gameState.ts`/`gameState.extra.test.ts`: remove the reverted branch's
     tests, keep/adjust the crash-guard test, add a test that the restore
     effect does not fire while `!user` (whichever layer ends up owning the
     gate).
   - New tests for the loading/not-logged-in/authenticated states in
     `Lobby.test.tsx` (or the new gate component's own test file).
   - `Sudoku.test.tsx` / `Sudoku.callbacks.test.tsx` and the equivalent
     Unblock Race tests: update any existing guest-play assertions (search
     for `'guest'` in both packages' tests) since guest play no longer
     applies — this is a deliberate behavior change, not a regression to
     avoid.
   - Run full suites for `sudoku`, `unblockrace`, `template`, `auth` after
     changes; all must pass green.

6. **Search for other guest-play assumptions** before considering this done:
   `grep -rn "user?.sub || 'guest'" packages/sudoku packages/unblockrace` and
   audit each call site — once login is required pre-entry, `user` should
   never be undefined at these points, so simplify (`user.sub` without the
   `'guest'` fallback) rather than leaving dead fallback code, per repo
   conventions (no unnecessary code, fix root cause not symptoms). Also check
   `RaceTrack.tsx`'s `userId?: string` prop — confirm whether it should
   tighten now that guests can't reach it, or stays optional for other
   reasons (e.g. local-agent-only sessions with no human party).

## Explicitly out of scope

- Any change to Unblock Race's collection-lock `PuzzleGate` usage beyond what
  step "Package placement" requires for sharing.
- Any change to the daily-puzzle-limit, subscription, or other unrelated
  `LoginContext` gates.
- Visual redesign beyond matching the existing `PuzzleGate` aesthetic.

## Open questions to resolve during implementation (not blocking plan approval)

- `showLoginModal` vs `loginRedirect` for the primary CTA — resolve by
  reading how each is used today and picking the one matching "a full puzzle
  page, not a lobby modal context."
- Exact home for the promoted gate component (`ui` vs `games` vs a
  `template`-local new component) — resolve per the layer-fit check in
  "Package placement."
