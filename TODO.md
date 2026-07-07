# TODO



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

apps/unblockrace is currently a skeleton scaffolded from apps/sudoku with the
sudoku-specific game logic and pages removed. The generic app shell (auth,
parties/invites, testers, credits, premium features) is wired up; the actual
sliding-block puzzle game still needs to be built.

### Features

- Implement the sliding-block puzzle game logic (grid/board state, move
  validation, win detection) as a new `@bubblyclouds-app/unblockrace` package,
  following the same layering as `@sudoku` (depends on `@games`, `@template`,
  `@auth`, `@ui`, `@types`)
- Implement the puzzle board UI component(s) and wire them into
  `src/app/puzzle/page.tsx` (currently stubbed)
- Implement daily challenge puzzle generation/fetching and wire up
  `openUnblockRaceOfTheDay` in `src/app/page.tsx`
- Implement the monthly collection page (`src/app/collection/page.tsx`,
  currently a placeholder) - equivalent to the sudoku puzzle book but without
  the "book" framing
- Implement `SimpleStateWrapper`/`GameState` in `src/app/page.tsx` (currently
  stubbed) for the My Puzzles / Friends tabs
- Regenerate Android/iOS signing and app-specific assets (assetlinks.json
  fingerprints, apple-app-site-association appID, app icons/splash) - these
  were carried over from the sudoku app as placeholders

### Server project

- revenuecat new project and apps and api keys
- google play and app store new apps
- api add support for revenuecat api key and switching based on app before giving entitlement
- api add support for unblock collections
- node upgrade
