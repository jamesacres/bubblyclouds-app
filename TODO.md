# TODO

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
