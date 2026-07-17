# Money Bags Race — Product & Technical Spec (v0.1 draft)

**Platform:** BubblyClouds framework (existing login, party model, per-day shared state backend)
**Party model:** A party of 2 (couple). Extensible to N members later.
**Status:** v1.0 — all requirements confirmed; decisions log at the bottom.

---

## 1. Overview

Money Bags Race is a household net worth tracker and retirement planner for couples. Each partner records their own balances on a monthly snapshot date (default: the 17th). The app combines both partners' figures plus shared assets into a household net worth, graphs it over time, projects investment growth, and runs a Monte Carlo retirement simulation to answer the core question: **when is the earliest we can retire?**

---

## 2. Core Concepts & Data Model

### 2.1 Party & Members
- Uses the existing framework party. Each member owns their own accounts; a party additionally owns **shared assets** (initially: the house/mortgage).
- All data is visible to all party members (couples share full visibility). **[Resolved Q1]** Confirmed — no per-member privacy.

### 2.2 Snapshot
- A snapshot is the set of all balances recorded for one month, keyed by month (e.g. `2026-07`), with an actual entry date (usually the 17th).
- Stored via the framework's per-day state. Canonical key is the month; the day recorded is metadata.
- **Entry can be partial and asynchronous** — one partner may enter their numbers days before the other. A snapshot is *complete* when all members have entered all active accounts and shared assets are updated.
- **[Resolved Q2]** Entry pre-fills each account with last month's balance for easy editing — the member just overtypes what changed. **Account lifecycle:** accounts can be added and removed over time. A removed (archived) account disappears from the current and future snapshots but stays in all historical snapshots and charts; a new account appears from the month it's created. Snapshots therefore store the account list *as of that month*, not a global list.
- **[Resolved Q3]** No historical backfill — tracking starts fresh from the first snapshot. (Past months remain editable per Resolved Q19, so a determined manual backfill isn't blocked, just not a supported import flow.)

### 2.3 Accounts
Each member maintains a flexible list of accounts. Accounts can be added, archived (kept in history, hidden from entry), and reordered.

**Account types:**

| Type | Owner | Notes |
|---|---|---|
| Investment | Member | Subtype/tax wrapper: SIPP, Stocks & Shares ISA, GIA, Bitcoin/crypto, company pension, other. Wrapper matters for retirement access rules (§6). |
| Cash | Member | One entry per bank; only the total at that bank, pots ignored. |
| Credit card | Member | Liability. Any number of cards (currently 4 across the couple); balance entered as owed, subtracted from net worth. |
| Property equity | Shared | House value − outstanding mortgage balance. |

- **[Resolved Q4/Q5]** Property entered as **house value and mortgage balance separately**; equity is derived. Both pre-fill from last month like any other balance — house value rarely changes, so it just carries forward until you overtype it; the mortgage balance gets updated monthly.
- **[Resolved Q6]** Liabilities = mortgage + **credit cards** (flexible count, member-owned, add/archive like other accounts). No other debt types in v1.
- **[Resolved Q7]** Bitcoin/crypto entered as a **manual £ balance** like every other account — no price feeds, no holdings-in-BTC. Keeps v1 fully offline and consistent.

### 2.4 Net Worth Calculation
```
member_total   = Σ investments + Σ cash − Σ credit_cards   (per member)
household      = Σ member_totals + (house_value − mortgage_balance)
```
Displayed as: per-member totals, household total, and change vs previous month (absolute and %).

---

## 3. Monthly Entry Flow

1. **[Resolved Q8]** No reminders/notifications. The dashboard shows an "entry due" state when the current month is incomplete, but nothing pushes.
2. Entry screen lists their accounts pre-filled with last month's values; they overtype current balances.
3. Shared property values editable by either member (last write wins).
4. Once both members have entered, the month is marked complete and the graph updates.

---

## 4. History & Graphing

- **Primary chart:** household net worth over time (line), monthly resolution.
- Toggleable layers: per-member lines; stacked breakdown by category (Investments / Cash / Property equity); individual account lines.
- Stats: month-on-month change, 12-month change, all-time growth. **[Resolved Q9]** Balances only — contributions are not tracked, so no "growth vs money added" split; projections instead take a user-entered contribution assumption (§5.2).
- **[Resolved Q10/Q11]** Both real and nominal supported, switched with a toggle (history charts and projections share the toggle; real-terms view deflates by an assumed inflation rate, default 2.5%, editable).

---

## 5. Investment Growth Projection

Projects the **Investments** category forward based on ongoing contributions, modelled as a 100% equity global index tracker.

### 5.1 Assumptions (defaults, editable in settings)
Based on long-run historical global equity returns:

| Scenario | Real return (after inflation) | Nominal (illustrative, ~2.5% inflation) |
|---|---|---|
| Lower | 2% | ~4.5% |
| Central | 5% | ~7.5% |
| Upper | 7% | ~9.5% |

- **[Resolved Q11]** Real/nominal toggle. Both modes available everywhere projections appear; the active mode is clearly labelled on every chart to avoid misreading.
- Monthly compounding; contributions applied monthly (user-entered assumption, since contributions aren't tracked — see Resolved Q9).

### 5.2 Inputs
- Current investment total (from latest snapshot).
- Monthly contribution amounts — **[Resolved Q12]** entered **per member per wrapper** (e.g. James/SIPP £X, James/ISA £Y, partner/SIPP £Z…). This feeds the access-rules engine directly: SIPP contributions grow the locked pot, ISA contributions grow the bridge.
- Optional: planned step changes (e.g. "contributions rise to £X from 2028").

### 5.3 Output
Fan chart: three lines (lower/central/upper) from today to a chosen horizon, overlaid on the historical actuals line. Milestone markers (e.g. crossing target FIRE number).

---

## 6. Retirement Planning

### 6.1 UK Access Rules Engine
Each investment account's wrapper determines when it can be drawn:

| Wrapper | Access |
|---|---|
| SIPP / company pension | Normal Minimum Pension Age — currently 55, rising to 57 in April 2028, with further rises possible. Modelled as a configurable table per member (derived from date of birth) with a manual override for future rule changes. |
| S&S ISA / GIA / crypto | Any age — these bridge early retirement before pension access. |
| State pension | **[Resolved Q13]** Included as a **per-run toggle** in the sim. When on: each member receives their state pension amount (default full new state pension, editable per member for partial NI records) from their state pension age, reducing the required portfolio withdrawal in those years. State pension age derived from DOB, manually overridable like the NMPA. |

- Requires each member's **date of birth** (**[Resolved Q14]** stored; used only for access-age and state-pension-age calculation).
- The engine partitions wealth into "accessible now" vs "accessible at age X" buckets per member per year of the simulation.

### 6.2 Monte Carlo Withdrawal Simulator
**Inputs:**
- Desired annual withdrawal (household, today's money) — asked each run, remembered as default.
- Retirement length in years (or "to age N", e.g. plan to 95) — asked each run.
- Retirement start date (for a specific-date simulation) — or solved for in §6.3.
- Current balances per wrapper, ongoing contributions until retirement.

**Method:**
- N runs (default 5,000) sampling annual real returns. **[Resolved Q15]** **Bootstrap** from a bundled dataset of historical annual global equity returns (e.g. ~120 years of world equity real returns), resampled with replacement per simulated year. Captures fat tails and bad decades better than a parametric model. Dataset ships with the app and is swappable; a real/nominal series pair supports the display toggle.
- Withdrawal order respects access rules: ISA/GIA fund the years before pension access; a run **fails** if accessible pots hit zero before pensions unlock, or if total wealth hits zero before the horizon.
- **[Resolved Q16]** Tax is a **toggle** per simulation run. When **off**: withdrawals are treated gross (tax-naive). When **on**: ISA/GIA withdrawals are tax-free¹; pension withdrawals are taxed on the way out — 25% tax-free, the remainder treated as income and taxed through the UK bands based on that year's total withdrawal income (personal allowance → basic → higher rate). The sim then grosses up pension withdrawals so the household still receives the desired *net* amount each year. Tax bands stored as an editable table (frozen thresholds are themselves a planning assumption).
  ¹ GIA capital gains ignored in v1 — noted as a known simplification.

**Output:**
- **Success rate %** (headline), distribution of ending wealth, percentile paths chart, and — on failure paths — the median failure year and whether failure was "bridge exhausted" (ISA ran dry pre-pension) vs "wealth exhausted".

### 6.3 Earliest Retirement Date Solver
The headline feature. Given a target success rate (**[Resolved Q17]** slider, default 90%), desired withdrawal, and horizon:

- Binary-search over candidate retirement dates, running the Monte Carlo at each, to find the earliest date achieving the target success rate.
- Displayed prominently on the dashboard: **"You can retire in March 2041 (age 52) at 90% confidence"**, updating as each monthly snapshot lands.
- Show sensitivity: how the date moves if withdrawal is ±£5k/yr or contributions ±£500/mo.

---

## 7. Screens (v1)

1. **Dashboard** — household net worth, change vs last month, earliest-retirement headline, entry-due nudge.
2. **Monthly entry** — per-member account list with balances to update; shared property section.
3. **History** — charts and stats (§4).
4. **Projection** — fan chart with contribution controls (§5).
5. **Retirement** — Monte Carlo inputs, success %, earliest-date solver (§6).
6. **Settings** — accounts management, assumptions, DOB/access ages, party members.

---

## 8. Non-Functional

- Backend: framework state store; snapshots stored per month per party, small JSON payloads.
- All monetary values in GBP, stored as integer pence. **[Resolved Q18]** GBP-only.
- Simulation runs client-side (5,000 runs of a 60-year path is trivial in JS/TS) — no backend compute needed.
- **[Resolved Q19]** Snapshots are **freely editable forever** — no locking, no audit trail requirement. Charts and the retirement solver recompute from whatever the data currently says.

---

## 9. Out of Scope (v1, confirm)

- Open Banking / automatic balance feeds
- Individual savings pots within a bank
- Full tax modelling beyond the basic toggle (CGT on GIA, dividend tax, LSA limits)
- Debt types beyond mortgage + credit cards (car finance, loans)
- Multi-currency; parties larger than 2

---

## Decisions Log

All 19 open questions resolved:

Q1 full visibility between partners · Q2 pre-fill from last month; per-month account lists with add/archive lifecycle · Q3 no backfill, start fresh · Q4/Q5 house value + mortgage separately, equity derived; both pre-fill/carry forward · Q6 credit cards tracked as member liabilities (flexible count) · Q7 bitcoin as manual £ balance · Q8 no reminders; dashboard "entry due" state only · Q9 balances only, no contribution tracking · Q10/Q11 real & nominal with toggle · Q12 contributions per member per wrapper · Q13 state pension as per-run toggle · Q14 DOBs stored for access ages · Q15 bootstrap Monte Carlo from historical returns · Q16 tax as a toggle (25% tax-free + income tax bands on pension withdrawals, net-amount grossing-up) · Q17 success-rate slider, default 90% · Q18 GBP-only · Q19 snapshots freely editable
