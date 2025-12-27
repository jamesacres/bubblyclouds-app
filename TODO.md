# Framework

- finish lint issues following upgrade
- ensure lint and test runs on push
- upgrade mac, xcode then capacitor to v8
- review and merge 003 into 004
- rename package and turbo config from sudoku-web to bubblyclouds-app

- move bubblyclouds repo (main website) into apps directory then delete separate
  repo

- remove vercel and introduce open next and sst

- re-test capacitor xcode and android and complete puzzle in full
- re-test electron

- review and merge 004 into main

# Apps

## Sudoku

### Features

- Add contact + manage subscription link
  https://www.revenuecat.com/docs/subscription-guidance/managing-subscriptions#using-the-managementurl-to-help-customers-cancel-a-subscription
- Add credits to readme and about section - sudoku coach generator, qqwing for
- Start button clear CTA then ask how difficult, remove the social ticker.
- Check cell/grid Feature cost points on leaderboard

### Bugs

- Sign in button on invite page header should redirect back to the invite
- fix electron auth
