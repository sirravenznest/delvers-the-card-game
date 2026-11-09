# Delvers: The Card Game

Delvers: The Card Game is an Android WebView app with its game assets in `app/src/main/assets/`.
Progress is saved in the WebView's `localStorage` (key `delvers2`, with older saves migrated).

## 2.2.6

The main menu has its own pixel-art night scene of Hallowspire and an original title theme, "Hallowspire Dawn" (other menu screens keep the calm harp loop).

## 2.2.5

Improved gold readout contrast: dark bordered pill and a cool-toned moon in the menu scene instead of a yellow sun.

## 2.2.4

Landscape-only play, a destination hub and chapter-book Story, a shared six-stat card template, and original cohesive pixel-art sprites/scenes. Hold a card or battlefield creature to zoom and read its rules; mouse hover and right-click also work. Eight interactive lessons lead into a practice fight, and single-player defeats offer Retry at the same difficulty.

All 60 Story encounters now connect through discoveries, original text dialogue and victory transitions. Next encounter continues directly to the following briefing; Continue story resumes the next uncleared encounter. Dialogue is text only. Battle emotes include free text phrases and original graphic pixel emotes unlocked for gold in the Store, usable in solo and online matches. Opponent emotes can be muted; fixed-choice messages are limited to one every three seconds.

The battle Log and result-screen Combat log offer chronological, turn-grouped history with You/Foe labels, roll thresholds, actual damage/healing and action filters. Scrolling back suspends live following; Follow latest resumes it. Reviewing does not pause play or the online timer. Up to 2,000 events are retained until leaving the battle, with an explicit notice if older entries are trimmed.

The set now has 122 cards, including eight additions and two low-cost Legendary creatures. Existing cards, starters and saved collections remain intact. Gold rewards and spare-card prices are reduced; packs remain 100 gold and starters 400. Four original procedural battle tracks shuffle without immediate repeats.

Ranked searches prioritize compatible humans, then automatically match a clearly labelled, rated bot after 20 seconds. Six rank tiers use themed legal decks and different strategy strengths. Bot results and leaving count toward rating; bots never get leaderboard accounts. Friend games remain unranked and human-only. Ratings are still experimental and client-authoritative, not server-verified. Online features require acceptance of the updated [privacy policy](PRIVACY.md).

## Build the APK

Requires `aapt`, `apksigner`, `zipalign`, `smali`, `zip`, a JDK, and the Android API 23 `android.jar`:

```
./build-apk.sh
```

Output: `app/build/outputs/apk/debug/app-debug.apk` (debug-signed with a locally generated keystore).

## First Adventures (Set 1, 122 cards)
Creatures, spells, weapons, armour and magic items. Play on a 4×5 grid, use abilities like haste, poison, paralysis and backstab, move with **initiative**, and use **reach** to hit foes from range. Reach the enemy's side to attack their hero.
Download the latest APK from the [android-latest release](../../releases/tag/android-latest).

## World & campaign
Set in **Vaelmark** during the Long Dusk: the Emberheart is failing and the Hollow is leaking in. 60 encounters (40 skirmishes and 20 named bosses) across nine acts, each with a story briefing; read the Lore tab. Packs are 🪙100 each, and you choose how many to buy.

## Android build & Google sign-in (cloud save)

The Android app is a Gradle project built by GitHub Actions (`.github/workflows/android.yml`) and published to the [android-latest release](../../releases/tag/android-latest). It is signed with the committed debug key in `android-signing/`, so its SHA-1 stays stable for Firebase. The old `build-apk.sh` produces a basic APK without sign-in.

Google sign-in uses Android Credential Manager, then Firebase Auth and Firestore over REST, to cross-save progress. See [CLOUD_SETUP.md](CLOUD_SETUP.md). Sign-in is Android-only.

## Regression checks

Run Node suites with `for f in tests/*.test.js; do node "$f" || exit; done`.
For landscape, zoom, tutorial, save, retry and simulated online UI checks, serve the repository locally with `python3 -m http.server 8765 --bind 127.0.0.1`, then run `tests/ui224.js`, `tests/campaign-ui224.js` and `tests/online-ui224.js` sequentially with Node. Set `PLAYWRIGHT_MODULE` to an installed Playwright module and `CHROME_BIN` if Chrome is not at `/usr/bin/google-chrome`. Campaign checks play real turns with shortened presentation delays; online checks use a local fake database, not production Firebase.

## Legal & privacy
See [PRIVACY.md](PRIVACY.md) and [LEGAL.md](LEGAL.md) (IP notes, SRD 5.1 attribution).
