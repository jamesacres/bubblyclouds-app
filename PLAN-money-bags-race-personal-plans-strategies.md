# Money Bags Race — Personal retirement plans + full Morningstar withdrawal strategy set

## Context

The `moneybagsrace` app is a UK household net-worth / retirement Monte Carlo planner for couples. Two gaps prompted this work:

1. **Withdrawal strategies.** Morningstar lists 8 income strategies. The engine already implements 3 (`FIXED_PERCENT`, `GUARDRAILS`, `RMD`) plus the `FIXED_REAL` baseline. The remaining 5 are missing.
2. **Individual vs household is unclear.** Today `runSimulationOnce` (`packages/moneybagsrace/src/engine/simulate.ts`) pools *all* members' balances and applies **one** household desired-withdrawal + **one** strategy. The couple wants each partner to run their **own fully-personal plan** (own pots, own desired withdrawal, own strategy, own access ages), retire together on one date, and see the household result as the **sum of the two personal plans** ("withdraw into a combined pot"). Right now there's no way to express different personal settings, and no screen states whether a figure is personal or combined.

**Outcome:** each member gets a personal plan; the household headline is the rollup; a run is a household failure if *either* member's plan fails (retire-together); all 8 Morningstar strategies are selectable per member; and Retirement / Projection / Dashboard / Settings each make personal-vs-combined explicit.

Baseline is green: **337 tests pass** in the `moneybagsrace` package.

### User decisions (settled — do not re-litigate)
- **Pot model:** fully personal. No cross-member pooling of any wrapper. Each member's own bridge (ISA/GIA/CRYPTO/OTHER) funds their own pre-pension years; each member's own pensions (SIPP/COMPANY_PENSION) drain against their own NMPA. Household income/success = sum/rollup of the two personal plans.
- **Strategies:** add all 5 remaining — forgo-inflation-after-loss, Vanguard dynamic, spending-declines-with-age, endowment 10-yr average, probability guardrails.
- **Results:** one combined household headline (success rate + earliest date) **plus** an expandable per-member breakdown. Retire-together framing stays primary.
- **Clarity:** all four screens.

## Load-bearing design decision — determinism

All members within a run share **the same market**: keep the single run-level RNG in `runSimulationOnce`, draw **one** accumulation-year array and **one** withdrawal-phase `drawAnnualRealPct()` sequence, and loop members *inside* each year using that year's single growth factor. Do **not** give members separate RNG streams — that would break sync-vs-async parity (`runAsync.ts`) and the shared-market assumption. The horizon still runs to the **oldest** member's `planToAge` (`prepareSimulationContext`); a member whose pots empty simply stops contributing income. Real-terms convention (comment at `simulate.ts:27-31`) is preserved and extended for the new strategies.

---

## Stage 1 — Types + strategy params (no behaviour change)

**`types/assumptions.ts`**
- Extend `WithdrawalStrategyKind` with: `FIXED_REAL_NO_INFLATION_AFTER_LOSS`, `VANGUARD_DYNAMIC`, `SPENDING_DECLINE`, `ENDOWMENT_TEN_YEAR_AVG`, `PROBABILITY_GUARDRAILS`.
- Add optional `WithdrawalStrategy` fields (all optional → existing persisted payloads stay valid): `vanguardFloorPct`, `vanguardCeilingPct`, `spendingDeclinePctPerYear`, `endowmentAveragingYears`, `probabilityGuardrailLowerPct`, `probabilityGuardrailUpperPct`. Vanguard + endowment reuse `fixedPercentRatePct` as their target rate.
- Add matching `DEFAULT_*` consts: floor `-1.5`, ceiling `+5`, decline `-1.0`/yr, averaging `10`, prob lower `80`, prob upper `99`.

**`types/profile.ts`** — add to `MemberRetirementOverrides` (its natural home; already per-member and threaded through `useRetirementModel`): `desiredWithdrawalAnnualPence?: number`, `withdrawalStrategy?: WithdrawalStrategy`. Optional fields only → `ProfileData.schemaVersion` stays `1`, provider `isProfileData` guard unaffected.

**`types/simulation.ts`**
- `SimulationMember` gains **resolved** `desiredWithdrawalAnnualPence: number` and `withdrawalStrategy: WithdrawalStrategy` (computed by `useRetirementModel` so the engine never reaches into profile/assumptions).
- Keep `SimulationInputs.withdrawalAnnualPence` / `.withdrawalStrategy` as household **fallback** (derived Σ; used by sensitivity/solver back-compat and the floor fallback). Document precedence: per-member wins, household is fallback.
- Add `MemberBreakdown { userId; successRatePct; incomePathsPence: PercentilePathPoint[]; endingWealthPercentilesPence: PercentileBand; failures: {count; medianFailureYear?; byKind} }` and `memberBreakdowns: MemberBreakdown[]` on `SimulationResult`. Existing top-level fields become the household rollup.
- Extend `SimulationRunOutcome` (in `simulate.ts`) with `memberOutcomes[]` (per-member `endingWealthPence` / `failure?` / `incomeAnnualPence` / `pathTotalsPence`); keep the summed household rollup fields.

Extend `resolveStrategy` (`simulate.ts:94`) to fill all new defaults so `Required<WithdrawalStrategy>` stays exhaustive.

## Stage 2 — Engine: per-member personal plans + 5 new strategies (core rewrite)

Rewrite `runSimulationOnce` (`simulate.ts`) so each year iterates members, running **each member's own strategy against their own pots** with their own desired withdrawal, state pension, NMPA, and tax bands. Reuse the existing per-member state-pension / NMPA gating and `grossPensionForNet`/`netFromGrossPension` (`tax.ts`) drain logic verbatim — just remove the cross-member proportional split. Per member carry: `balances`, resolved `strategy`, `desiredWithdrawalPence`, and strategy state (`guardrailWithdrawalPence`, `lastActualWithdrawalPence`, `deflatedFactor`, `portfolioHistoryPence[]`, `probabilityWithdrawalPence`).

Per year: compute one `growthFactor` from the single `drawAnnualRealPct()`; each member computes their year target, drains their own bridge→pension with tax/state-pension, records delivered income + per-member failure; then apply the year's growth to every member. Roll up household income = Σ member income, household path = Σ member pots.

**Aggregation rule:** a run is a **household failure if any member fails** (retire-together). Household `medianFailureYear` = median earliest-failing-member year across failing runs; household `byKind` attributes each failing run to its earliest-year member (tie-break by index). Each `MemberBreakdown.successRatePct` = runs where **that member** didn't fail ⇒ household success ≤ each member's success (easy invariant to test).

**New strategy yearly targets** (real terms; `rate = fixedPercentRatePct/100`):
1. **FIXED_REAL_NO_INFLATION_AFTER_LOSS** — base = member desired; carry `deflatedFactor`, and after any year whose realised real return `< 0` set `deflatedFactor *= 1/(1+inflationRatePct/100)` **persistently** (never re-inflates — faithful to "hold nominal, don't restore purchasing power"). `target = desired * deflatedFactor`. Pot-exhaustion semantics. Uses `assumptions.inflationRatePct`; carry *previous* year's return (never peek ahead).
2. **VANGUARD_DYNAMIC** — `raw = rate * memberWealth`; clamp vs `lastActual`: `target = clamp(raw, lastActual*(1+floor/100), lastActual*(1+ceiling/100))`; first year = raw; set `lastActual = target`. Pot-exhaustion semantics (the floor can force draws past the fraction).
3. **SPENDING_DECLINE** — `target = desired * (1 + decline/100)^stepIndex`. Pot-exhaustion; floor check compares against the **declined** target, not the constant.
4. **ENDOWMENT_TEN_YEAR_AVG** — append member start-of-year wealth to `portfolioHistoryPence` (cap `endowmentAveragingYears`); `target = rate * average(history)` (available history when < window). Income-below-floor semantics (like FIXED_PERCENT); clamp actual draw at wealth.
5. **PROBABILITY_GUARDRAILS** — **funded-ratio proxy, NOT nested Monte Carlo** (avoids O(n²)). `H = remaining years`; `required = spend * annuityFactor(lowerRealPct, H)` with `annuityFactor(r,H)=(1-(1+r)^-H)/r` (`=H` when `r≈0`) at `assumptions.returnScenarios.lowerRealPct`; `fundedRatio = memberWealth / required`. Below lower band ⇒ cut carried spend ×0.9; above upper band ⇒ raise ×1.1; else hold (thresholds from the `probabilityGuardrail*Pct` params reinterpreted as funded-ratio guardrails). Carry starts at `desired`. Pot-exhaustion semantics. **Document explicitly in the header comment** that this is a deterministic funded-ratio approximation and why.

**Failure-floor generalisation:** for the fraction-of-portfolio strategies (SPENDING_DECLINE, VANGUARD_DYNAMIC) compare delivered income against **that year's desired target** (minus `FAILURE_EPSILON_PENCE`); keep the constant-desired comparison for FIXED_PERCENT/RMD/ENDOWMENT. Comment the semantics per strategy.

`runAsync.ts` / `rng.ts`: no change (determinism preserved). Add a sync==async two-member mixed-strategy regression test.

## Stage 3 — Results: per-member breakdown surfaced

**`simulate.ts` `aggregateSimulationOutcomes`** — factor the household summary (percentiles + failure tally, reusing `percentileSummary`) into a helper taking `{failure, endingWealthPence, incomeAnnualPence, pathTotalsPence}[]`; call once for the rollup and once per member into `memberBreakdowns[]` (reuse `context.pathYears`).

**`components/RetirementResultPanel.tsx`** — keep the household headline primary; add an expandable `<details>` per member (nickname-labelled via a new `memberNicknames: Record<string,string>` prop from `household.members`) showing that member's success rate, income summary, ending wealth, failures. Reuse `successColorClass` + the percentile cell layout.

## Stage 4 — Solver + sensitivity under personal settings

- **Solver** (`solver.ts`): no structural change — it still searches one `retirementMonth` and reads household `successRatePct`. CRN monotonicity holds (a later date only helps every member ⇒ household rollup monotonic). Add a two-member/two-strategy monotonicity test.
- **Sensitivity** (`sensitivity.ts`): add `applyWithdrawalDelta(members, deltaPence)` alongside `applyContributionDelta` (`:86`), spreading ±£5k proportional to each member's desired withdrawal (equal split when both zero); `buildVariants` (`:115`) calls it instead of setting `withdrawalAnnualPence`. Keep the household `withdrawalAnnualPence` = Σ updated for fallback consumers.

## Stage 5 — `useRetirementModel` threading + migration

**`hooks/useRetirementModel.ts`** — resolve per member: `desiredWithdrawalAnnualPence = overrides.desiredWithdrawalAnnualPence ?? householdDefaultSplit`, `withdrawalStrategy = overrides.withdrawalStrategy ?? assumptions.defaultWithdrawalStrategy ?? DEFAULT_WITHDRAWAL_STRATEGY`. Return `householdDesiredWithdrawalAnnualPence` (Σ) for the page + `SimulationInputs.withdrawalAnnualPence` fallback.

**Migration (biggest data risk):** `assumptions.defaultWithdrawalAnnualPence` / `defaultWithdrawalStrategy` stay on `HouseholdAssumptions` as **fallbacks** (old LWW payloads still carry them; `resolveSharedAssumptions` in `helpers/lww.ts` keeps surfacing them). At **read time** in `useRetirementModel`, an existing single household figure is **split equally** across members (e.g. £40k ⇒ £20k+£20k) — **never doubled** — and surfaced in the UI to adjust. No destructive server rewrite; personal overrides are written on first save under the new model.

## Stage 6 — UI clarity per screen

- **Retirement** (`app/retirement/page.tsx`): a "Household — combined across both of you" summary card (Σ desired withdrawal + the existing `SolverHeadline`, retire-together), then **one card per member** ("[Nickname]'s personal plan"): own desired withdrawal (`CurrencyInput`), strategy chips (`STRATEGY_OPTIONS` extended with the 5 new kinds + descriptions), and per-strategy param sliders (`PercentSlider` for rates/widths; new sliders for Vanguard floor/ceiling, spending decline, endowment years, probability band). Own card editable, partner read-only (mirror projection's "edit your own" pattern). Keep `planToAge`, `includeStatePension`, `applyTax`, `targetSuccessRatePct`, date-mode at household level. Run handler builds per-member `members`, sets `withdrawalAnnualPence` = Σ, persists own overrides via `saveOwnProfile` + shared knobs via `saveSharedAssumptions`. Results use the new per-member breakdown.
- **Projection** (`app/projection/page.tsx`): relabel header + contributions card so it's unambiguous the fan chart is **household-combined** while edits are **personal** (already summed in `projection.ts`). Minimal engine risk.
- **Dashboard** (`app/page.tsx`): label per-member `StatCard`s "personal" and `NetWorthHeadline` "household"; retirement card copy "Household — you both retire together." Solve uses the updated `useRetirementModel` (mostly free); the "no desired withdrawal yet" guard becomes "no member has one yet."
- **Settings** (`app/settings/page.tsx`): add own desired withdrawal + default strategy to the personal "You" section (writes `profile.overrides.*`), headed "Your personal plan (only you)"; keep `AssumptionsForm` for genuinely shared assumptions ("Shared with your household").

---

## Verification

Per `CLAUDE.md` this is a complex task — each stage ends with `pnpm run build`, `pnpm run test`, `pnpm run lint:fix`.

**Tests** (extend/add):
- `engine/withdrawalStrategies.test.ts` — one `describe` per new kind with zero-return analytic single-member cases (loss-year inflation erosion; Vanguard floor/ceiling clamp; decline geometric taper; endowment smoothing lag; probability funded-ratio cut/raise + a direct unit test of the annuity/funded-ratio helper).
- `engine/simulate.test.ts` — **rewrite** the pooling-specific cases (e.g. the cross-member pension-split case ~`:341`) to personal semantics; add a two-member case (A succeeds, B fails ⇒ household < 100%, A breakdown 100%, B < 100%); add sync==async two-member mixed-strategy determinism.
- `engine/solver.test.ts` — two-member/two-strategy monotonicity + earliest-date resolves.
- `engine/sensitivity.test.ts` — `applyWithdrawalDelta` proportional split; variants still solve.
- `components/RetirementResultPanel.test.tsx` — per-member disclosure + nicknames + per-member success.
- `app/retirement/page.test.tsx` — per-member inputs render, own editable/partner read-only, new chips selectable, run handler builds per-member members.

**Manual (optional):** `/run` the app, open Retirement, set different strategies + amounts per member, run, confirm the household headline + per-member breakdown read sensibly and copy makes personal-vs-combined clear.

## Repo rules to honour
No casting; `unknown` over `any`; no `T`-prefixed generics; relative imports within the package; no `index.ts` re-exports; package.json Just-in-Time exports if a new cross-package import appears (none expected — all changes stay inside `moneybagsrace` + its app). Update `TODO.md` line 16 (strategies) to reflect all 8 done, and add the personal-plan note.

## Staging (independently-committable, fresh-context-friendly)
1. Types + strategy params (Stage 1)
2. Engine per-member rewrite + 5 strategies (Stage 2)
3. Results aggregation + panel (Stage 3)
4. Solver + sensitivity + `useRetirementModel` threading + migration (Stages 4–5)
5. UI clarity across the four screens (Stage 6)

## Risks
- **Probability guardrails cost** — mitigated by the documented O(1) funded-ratio proxy; unit-test the proxy directly.
- **Assumptions migration** — read-time equal-split, no destructive rewrite; watch the "don't double the spend" trap.
- **Pooled-test drift** — several `simulate.test.ts` cases assert cross-member pooling that no longer exists; rewrite (don't just extend) and flag in the diff.
- **Determinism** — single-RNG/shared-draws is load-bearing; enforce with the sync==async two-member test.
