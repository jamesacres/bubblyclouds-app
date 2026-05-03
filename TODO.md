# TODO

Bounds for agents track metadata for which agents were selected on server

use timings to improve ai timings

Metrics it would likely move:

- Single-session churn — biggest opportunity; those 25 bounced users probably
  saw a dead party lobby
- Same-day second puzzle — if beating the bot triggers a "rematch?" prompt, this
  directly pushes free users toward the paid-behaviour threshold
- Free-to-paid conversion — more return sessions = more chances to hit 2+
  puzzles/day

One risk to flag:

If the bot is too easy to beat, it loses novelty fast. If it's too hard, it's
discouraging. The data shows your paid users' median solve times (7–17 min
depending on difficulty) — a bot calibrated to that range would give free users
something to aspire to rather than something to beat once and forget.

Action: Target users with 4+ sessions and/or party membership with a "play one
more today" prompt — e.g. a completion screen that says "You're on a roll — try
another?" or a daily streak mechanic.

- Make party creation/joining more prominent — it's the #1 retention driver
- Add a "challenge a friend" flow after completing a puzzle (especially for SOTD
  where there's a shared puzzle)
- Surface party leaderboards more visibly; users in 2+ parties are your most
  loyal cohort (7 users, 120 sessions, all paid/near-paid)

┌──────────┬─────────────────────────────────────────────────────┬──────────────────────────────────────────────────┐
│ Priority │ Action │ Signal │\
├──────────┼─────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 1 │ Party invite/share flow after each completed puzzle │ Party membership →
11x more sessions │\
├──────────┼─────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 2 │ "Play another today" nudge on completion screen │ 6 free users need just 1
more same-day play │\
├──────────┼─────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤\
│ 3 │ Onboarding: nickname + party join for new users │ 9 churned users had no
nickname, no party │\
├──────────┼─────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤\
│ 5 │ Frame Sudoku Book level 7+ as a premium unlock │ Natural paywall already
in the data │
├──────────┼─────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤

1. 179 dormant members — your biggest untapped audience

226 unique users joined a party. Only 57 ever played. That means 179 people
accepted an invite or joined a party and never touched a puzzle. This is a
larger audience than your entire active user base and they're already inside
your system with an account. A single well-timed "your party is\
waiting" push notification or email could activate a meaningful chunk of them —
they've already demonstrated interest by joining.

2. 99 out of 160 parties have zero active players

More than half of all parties were created but never played in. Some of these
are likely the dormant members above. Parties are being created (which is a
positive signal — people want to race someone), but the invite-to-play
conversion is very poor. The friction is happening between "join party" and
"start a puzzle."

3. Saturday is by far the biggest play day

┌──────────┬──────────┐\
│ Day │ Sessions │ ├──────────┼──────────┤\
│ Saturday │ 106 │\
├──────────┼──────────┤ │ Friday │ 69 │ ├──────────┼──────────┤ │ Sunday │ 63 │
├──────────┼──────────┤\
│ Thu │ 60 │ ├──────────┼──────────┤\
│ Wed │ 58 │\
├──────────┼──────────┤ │ Tue │ 56 │ ├──────────┼──────────┤ │ Mon │ 45 │
└──────────┴──────────┘

Saturday has 54% more sessions than the next busiest day. This strongly suggests
people are playing with friends/family on weekends. If you push\
notifications or run any promotions, Saturday morning is the highest-leverage
window.

4. Two peak play windows (UTC)

- 19:00–22:00 UTC (the biggest spike — ~130 sessions) — evening in Europe/UK
- 03:00–05:00 UTC (~62 sessions) — evening in Americas

Your user base appears to span at least two timezones. If you have a "puzzle of
the day" or any time-sensitive mechanic, consider whether it resets at a time
that works for both.

avatar selection for self, see other peoples

feedback box for how rivals performed...

agents, new timingCurve screen to choose which to race against RacingPromptModal
speech bubbles from the race track which appear when the player pauses for more
and 10 seconds

- for existing users:
- if auth data stored without app version - start storing app version locally
- now with sudoku intelligence
- new logo with rainbow grid like new ai copilot style?
- homepage sell the new intelligent hint conversation, and agents in local race
- hint button rainbow effect shows after 1 minute of no completed cells?
- what's new popup showing the new features when they open the app
- say support leave a review or email

- say working hard, if you have feedback please send to XYZ
- would be great if you can leave a review

- Tidy solver make it open source, remove from main repo
- force remove the other solver package!!
- allow already noted skip to next hint for eliminations, if already filled in
  all notes and excluded auto skip?
- Cross out the candidates e.g. locked pointing eliminating
- Solver animated solution steps with chain arrows etc. Convert to gif. Make it
  easy to import and share animated solution step to Reddit. Timeline of whole
  solution. Assistant talks you through it. Watermark for sudoku race and link
  below gif to the page to open the step in sudoku race.

- Animated mascots - ai race mode

- Local Party - Sudoku intelligent agents - with settings when starting a
  puzzle, invite agents automatically on/off?
- as the % completion goes up the easier techniques take less time to find
- render the hints visually on the grid

- import from text option, support hodoku 729 char strings for state import too
  from other apps
- solver option for the import, some people will just want to solve and learn
- fix invalid puzzle book front cover

- fix stephen music album images not loading with quotes
- fix sudoku import

# Framework

- usage analytics from db
- remove electron and add https://blackboard.sh/electrobun/docs/

# Apps

## Blog

- update projects
- write ai tool progress over past year since last post and learnings
- write retro post
- update stephens ratings, and add his long form content
- tidy up new home assistant post

## Sudoku

### Features

- add solver, hint, education
- Add contact + manage subscription link
  https://www.revenuecat.com/docs/subscription-guidance/managing-subscriptions#using-the-managementurl-to-help-customers-cancel-a-subscription
- Add credits to readme and about section - sudoku coach generator, qqwing for
- Start button clear CTA then ask how difficult, remove the social ticker.
- Check cell/grid Feature cost points on leaderboard

### Bugs

- Sign in button on invite page header should redirect back to the invite
- fix electron auth

## Sliding BLock

### Features

- Implement
