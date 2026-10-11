# App Store screenshots

Localised App Store screenshots, rebuilt from the English set designed in
Picasso. Picasso has no CLI, so the English export of each screen is reused as
the frame (gradient, device bezel) and only two things change per language: the
headline and subtitle, and the app capture inside the device.

```
captions/<locale>.json  ->  headline + subtitle per screen
shots/<locale>/NN.png   ->  raw simulator capture per screen
frames/NN.jpeg          ->  Picasso English export (bezel + gradient)
                              |
                       compose.swift
                              v
out/<App Store locale>/NN.jpeg   (1290x2796, no alpha)
```

## Requirements

- macOS with Xcode command line tools (`swiftc`, `xcrun simctl`).
- A booted 6.3" iPhone simulator (iPhone 16 Pro or 17 Pro; captures must be
  1206x2622), with its window shown from Xcode (Device Hub).
- Cocoapods and Xcode set up as for a normal Capacitor iOS build.

## Workflow

1. Boot the simulator and show its window (Xcode Device Hub).
2. Capture. The script first builds the app with
   `NEXT_PUBLIC_SCREENSHOT_SERVER` set and installs it on the booted simulator
   (`--no-build` skips this when the installed build is already current). Then,
   for each screen you navigate once and it cycles through every locale for
   that screen before asking for the next one:

   ```bash
   pnpm screenshots:capture --app unblockrace
   pnpm screenshots:capture --app unblockrace --no-build --only 03 --locale de,fr   # redo
   pnpm screenshots:capture --app unblockrace --no-build --from 03 --overwrite      # redo 03 onwards
   ```

   The script serves the wanted locale on `http://localhost:8787/locale` and the
   app polls it (`useScreenshotLocale`), calling `setLocale` in place, so the
   screen you navigated to is kept and no iOS prompt appears. It refuses to start
   if the app never connects. Screenshot builds also skip the 3-2-1 race countdown, so a language switch
   never leaves the overlay on screen. Raise `--settle` (ms) if a capture is
   taken before the new language has rendered; the stored preference is cleared at the end.

   When the run ends, including on Ctrl-C or a failure, the script deletes
   `apps/<app>/out`, `apps/<app>/dist` and the synced
   `apps/<app>/ios/App/App/public`. All three are gitignored, so a leftover
   screenshot build would not show in `git status`; with them gone, a release
   cannot pick it up and must run `pnpm build:<app>:capacitor` first. The app
   already installed on the simulator keeps the screenshot build.

3. Compose:

   ```bash
   pnpm screenshots:compose --app unblockrace
   pnpm screenshots:compose --app unblockrace --locale de,ja
   ```

   Captions that do not fit are reported (`OVERFLOW` fails the locale, `small`
   is a warning) so the caption can be shortened in `captions/<locale>.json`.

4. Upload:

   ```bash
   pnpm screenshots:upload --app unblockrace --version 1.2.3
   pnpm screenshots:upload --app unblockrace --version 1.2.3 --locale de,fr   # subset
   ```

   It checks every locale has all 10 images, skips locales that are not on
   that App Store version (and says which), shows the `asc` dry run, then asks you to type the
   version before it deletes the existing 6.9" screenshots (`--replace`) and
   uploads. `--yes` skips the prompt. The App Store Connect app ID comes from
   `ascAppId` in the app's `config.json`.

5. Upload to Google Play:

   ```bash
   pnpm screenshots:upload-play --app unblockrace
   pnpm screenshots:upload-play --app unblockrace --locale de,fr   # subset
   ```

   Uses the same images as the App Store (no resize). It opens a `gplay` edit,
   matches your locales to the languages on the Play listing
   (`play-locales.json`), replaces their phone screenshots and asks you to type
   the package name before validating and committing. Nothing is live until the
   commit; cancelling or any failure discards the edit. Play takes 2 to 8 phone
   screenshots, so `play.screens` in `config.json` picks the first 8 of the 10.
   Transient Play errors (500 `backendError`, 429, timeouts) restart that locale
   with backoff, up to `--retries` times (default 4), and failed locales get two
   more passes; `--delay` (ms, default 300) paces the calls. A permanent error
   such as a deleted edit stops at once. If any locale still fails, the edit is
   discarded rather than committed with a partial set.
   It uploads file by file with `gplay images upload` rather than
   `gplay images sync`, which requests a `promoGraphic` image type that the Play
   API rejects (400) for every locale.

Raw captures and output live in `.data/` (gitignored). Back up `.data/<app>/shots`
if the manual navigation matters; compose is cheap to re-run.

## Layout rules (copied from Picasso)

- Headline: Outfit 150pt, centred, one line, shrinks to fit 1000px, top at
  y=100.
- Subtitle: Outfit 60pt, centred, up to two lines in 1032px, top at y=294.
- Text outside Outfit's coverage (Arabic, Hebrew, Thai, Indic, CJK) falls back
  to system fonts. RTL is shaped by CoreText.
- The top 520px is repainted from a plane fitted to the frame's own gradient,
  so a frame's background colour is picked up automatically.

## Adding an app or device

Copy `unblockrace/` and change `config.json` (bundle ID, `screen` rect,
`frames`). The `screen` rect is measured by template-matching a raw capture
against the Picasso export; the numbers for iPhone 16 Pro are scale 0.909 at
(97, 577) in a 1290x2796 canvas. `restoreFromFrame` re-draws the Dynamic Island
from the frame because Picasso overlays it on the capture.

`locales.json` maps app locale tags to App Store Connect locale codes; a tag
can map to several codes (English is shared by `en-US`, `en-GB`, `en-AU` and
`en-CA`, so compose writes the same images to each). Verify the codes with
`asc localizations list` before the first upload.
