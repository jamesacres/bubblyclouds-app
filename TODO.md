# TODO

Waitlist, only allow us two to login for now
update with stephens improvements

fix invite page redirect
improve puzzle grid stars and time one line, show par on all tiles?
lobby should show number of moved not just the solved time for those who have completed it and in progress?
improve ease of going to the next puzzle via button when complete, always show same text?
fix leaderboard scoring guidance
fix rerendering on every timer tick

- Star rating according to par on the tile, at end animate the stars and the points going up on the leaderboard. Needs to be as addictive as possible to press continue to next puzzle in the monthly collection and the daily stage. On both sudoku and unblock, Need to add rate app button on homepage, below completed puzzle. Premium gate after 3rd stage on the puzzle of the day - unlock remaining stages or try one from the collection. Maybe hint and undo. Leaderboard puzzles per day multiplier to encourage more. Lock off 50% of puzzles per difficulty in the collection when opening one or going to next it allows going back to collection or purchase. getting plus unlocks entire pack each month only 3.99 lifetime or 0.99 one month. Try an easier puzzle from the collection prompt on the 3rd puzzle. Max 5 puzzles per day without plus.
- Level system
- Make the hints behind the paywall don't limit the daily so they're more likely to buy the hints, allow 2 free. Highlight the hint button rainbow plus speech bubble? Allow retrying and going back to previous stage should be at the top? Are you sure reset button etc. beginner name difficulty
- Undo reset premium limit




Fixes and improvements (all done on feature/money-bags-init)
* [x] We added new accounts but it did not allow us to update them on the current month after when we had already set some values. — profile accounts now merge into existing saved snapshots
* [x] The mark month as complete, is that necessary? — removed; a month is "entered" once a snapshot exists
* [x] Homepage has multiple buttons which go to the same page? — removed redundant History/Settings nav cards (footer already has them)
* [x] Remove need to press save — autosave on blur/navigation across entry + settings
* [x] Add ability to delete an account permenantly if it's only just been added with no data? — delete when no snapshot references it, else archive-only
* [x] Add ability to edit an investment type after it's been saved? — inline kind/wrapper editing in AccountManager
* [x] Reorder by dragging? — native HTML5 drag-to-reorder (up/down kept for keyboard)
* [x] needs to graph the monte carlo simulations — MonteCarloPathsChart spaghetti + percentile bands
* [x] withdrawal amount adjusted by inflation? — engine is real-terms; added explicit real/nominal view
* [x] needs to support all the different withdrawal strategies: all 8 Morningstar income strategies — fixed-real, fixed-%, guardrails (Guyton-Klinger), RMD/lifetime-expectancy, forgo-inflation-after-loss, Vanguard dynamic, spending-declines-with-age, endowment 10-yr average, probability guardrails (funded-ratio proxy)
* [x] personal-vs-household clarity — each partner runs their own personal plan (own pots, withdrawal, strategy, access ages); household headline is the combined rollup (fail if either fails); Retirement / Projection / Dashboard / Settings each label personal vs combined
https://www.youtube.com/watch?v=Qpjxv74htog
https://www.morningstar.com/retirement/morningstars-retirement-income-research-finding-your-safe-withdrawal-rate






Something similar to bulb Rush game

* end game state sudoku, needs to reappear to avoid blank screen, and take learnings from unblock race for leaderboard points and continue buttons
* need to make it clear that the collection/pack refreshes monthly and they're paying to get all new puzzles every month
* need to check the how scoring works to check that it reads okay for unblock race
* confirm no mentions of book for unblock race
* app store admin, revenue cat admin, update app ids and api keys
* serverside upgrades and add new endpoints for unblock race monthly and daily
* check multiplayer stages, check it works okay when moving between stages and the refreshable stats at the end etc

See Sudoku TODOs....

# Framework

- remove electron and add https://blackboard.sh/electrobun/docs/

# Apps

## Stephen

- need to compare to export to find missing / mismatches
- cindy lee missing in data, and numbers dont match 100% need to compare export with what's missing
- al green still in love with you re-rated
- fix stephen music album images not loading with quotes

## Blog

- update projects
- write ai tool progress over past year since last post and learnings
- write retro post
- update stephens ratings, and add his long form content
- tidy up new home assistant post

## Sudoku

improve cold start click link to sudoku
lobby should show signing in state, or sign in button?
need to ensure the state is successfully saved, otherwise others wont see them in the lobby
we should see others in lobby from cold start

chat gpt app?

Solver Test coverage
Solver PR review

### Features

## v3 ideas
- achievements google play, beat expert, bumblebee etc

- avatar selection for self, see other peoples
- powers to distrupt/help with other players
- feedback box
- speech bubbles for rivals from the race track which appear when the player pauses

- for existing users:
- if auth data stored without app version - start storing app version locally
- now with sudoku intelligence
- homepage sell the new intelligent hint conversation, and agents in local race
- what's new popup showing the new features when they open the app
- say support leave a review or email

- say working hard, if you have feedback please send to XYZ
- would be great if you can leave a review

- import from text option, support hodoku 729 char strings for state import too
  from other apps
- solver option for the import, some people will just want to solve and learn
- fix invalid puzzle book front cover

- Check cell/grid Feature cost points on leaderboard

### Bugs

- fix electron auth

## Unblock Race

The sliding-block puzzle game is implemented per SPEC.md: the
`@bubblyclouds-app/unblockrace` package (board model, drag interaction,
useGameState, 5-puzzle chain runs, mock seed data from Fogleman's database)
and the app pages (puzzle, home daily run, monthly collection) are wired up.
Puzzle content is mocked from a static fixture until the real API exists.

### Features

- Update RaceTrack's hardcoded "Puzzle book" button
  (`packages/games/src/components/RaceTrack.tsx`) to say "Collection" for this
  app - make the label a prop so sudoku keeps "Puzzle book"
- Replace the mock puzzle-content source (`helpers/mockData.ts` /
  `CollectionProvider`) with the real API once the server supports unblock
  collections (see Server project below)
- Regenerate Android/iOS signing and app-specific assets (assetlinks.json
  fingerprints, apple-app-site-association appID, app icons/splash) - these
  were carried over from the sudoku app as placeholders
- AI opponents/agents for local races (explicit non-goal of the v1 spec)
- Vehicle theming/skins (explicit non-goal of the v1 spec)

### Server project

- revenuecat new project and apps and api keys
- google play and app store new apps
- api add support for revenuecat api key and switching based on app before giving entitlement
- api add support for unblock collections
- node upgrade

## Money Bags Race

Household net worth / retirement tracker built on the unblockrace/sudoku
pattern: dashboard, monthly entry (`/state?month=YYYY-MM`), history,
projection, retirement, and settings screens over the
`packages/moneybagsrace` domain package (types, Monte Carlo retirement
engine, data provider/hooks, chart components).

### Features

- Regenerate Android/iOS signing and app-specific assets (assetlinks.json
  fingerprints, apple-app-site-association appID, app icons/splash, StoreKit
  product ids) - these were carried over from unblockrace as placeholders
- Replace placeholder icons/logo assets with Money Bags Race branding

### Server project

- revenuecat new project and apps and api keys
- google play and app store new apps
- api add support for revenuecat api key and switching based on app before giving entitlement
