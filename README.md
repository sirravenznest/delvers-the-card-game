# Delvers: The Card Game

Delvers: The Card Game is an Android WebView app with its game assets in `app/src/main/assets/`.
Progress is saved in the WebView's `localStorage` (key `delvers2`, with older saves migrated).

## 2.2.15

One-time testing reset for signed-in accounts: the updated app replaces pre-reset saves on their next successful cloud sync. Cards, decks, gold, packs, starter-deck ownership, cosmetics, missions, tutorial and campaign progress return to new-game defaults. Google accounts, ranked records, friends and online matches are not reset. Offline-only players are unchanged until signing in.

A separate cloud reset marker prevents repeating the reset on later launches or other updated devices. No Firebase configuration or rules changes are required. Older APKs can still upload pre-reset saves; updated apps reject those saves rather than restoring them or repeating the reset. All test devices should update to 2.2.15.

## 2.2.14

The Android release signing key has been replaced after its previous private key was exposed in the public repository. Existing installs must sync progress to Cloud Save, uninstall the previous app and install this APK; uninstalling removes device-only saves. Future installs can update normally. Release builds now use protected signing secrets; see [CLOUD_SETUP.md](CLOUD_SETUP.md#release-signing-key-migration-2214).

The Windows/Electron desktop wrapper has been discontinued and removed. Android is the supported app.

## Deck builder layout

The Android landscape deck builder separates the card browser and current-deck editor into balanced, independently scrolling panes. Search, sorting and expandable filters stay in the browser pane; deck status, saved builds and copy controls stay in the editor pane. Expanded filters and saved builds have bounded scrolling areas so neither covers the card gallery or deck list. Deck names wrap instead of overlapping copy controls.

## 2.2.13

Profile pictures use dedicated character portraits rather than reused card sprites. Story and cosmetic backgrounds render their location-specific artwork, with a dark battlefield overlay to keep controls readable. The Profile page previews the current Story scene.

Story uses labeled Previous/Next chapter and encounter-page controls, a cleared-encounter progress bar, and a Back to Hub button. Book pages scroll normally without overlay scroll arrows. Existing saves, cosmetic ownership and campaign progress are preserved.

## 2.2.12

Ranked and friendly battle intros stay mounted during network refreshes, preventing the entrance animation from restarting and preserving button focus and scroll position.

Castable hand cards use their green border and background highlight without visible status strips. Unavailable cards retain muted dashed borders, and screen-reader labels retain availability and blocked reasons.

## 2.2.11

Turn changes have a full-width status banner above the battlefield and a brief border highlight, without turn sounds or vibration. The banner stays outside the card and control areas and respects reduced-motion preferences.

The battle header identifies both players by name and avatar, with explicit YOU and FOE labels and a BOT marker for rated bots. Names wrap instead of being truncated.

Both profile panels show larger labelled HP and mana values and remain tappable hero targets. Hand cards use solid green borders and a PLAYABLE label when usable, or dashed borders with a blocked reason (mana, target, deployment space or turn). Combat sounds and attack, hit, healing, spell and summon animations remain available; the visual-only choice applies to turn notifications.

The hand stays anchored across the bottom of the landscape screen, below the battlefield, independently of the profile header and right-side controls.

## 2.2.10

The Deck list keeps category headings and copy controls clear of card names. Deck cards retain rules, rarity and all six creature stats at compact landscape sizes without overlapping text or artwork. Battle-hand cards show the same printed stats as Deck and Collection; battlefield units continue to show live health and movement. Existing saves and progress are unchanged.

## 2.2.9

The Deck screen groups deck status and saved builds above the searchable, sortable, filterable card gallery and current-deck list. Compact landscape layouts keep card controls visible and remove redundant scroll arrows. Existing deck rules, saved builds, collections and progress are preserved.

## 2.2.8

Combat restores a full-width hand along the bottom, with compact readable cards and full details on hold/hover/right-click. The 4×5 battlefield stays above it, with status and controls on the right. Every unit has a persistent YOU (blue solid) or FOE (red dashed) marker that follows ownership across rows and online seat mirroring, independent of class, rarity, readiness or targeting.

Emotes are for active combat only: there is no separate menu destination, Profile section or result-screen emote button. All six base text phrases are included automatically for new and existing saves; optional graphic emotes remain 350 gold each. The Store shows one category at a time: card packs, starter decks, graphic emotes, or avatars/backgrounds. Existing purchases and progress are preserved.

## 2.2.7

Ranked now uses the normal deck rules: 20–30 cards and up to 3 copies of any card, regardless of rarity. Both human matches and rated bots accept these decks. Online opponents must update to this version because older clients enforce the removed restrictions. Existing saved decks and collections are unchanged.

Emotes have their own main-menu collection, previews, Profile access, and direct Store navigation. The battle picker shows full phrases with separate text and graphic groups, scrolling, keyboard focus, and Escape support. All owned emotes are available without equipping; text unlocks remain free and graphic emotes cost 350 gold. Opponent-mute preferences are shared between the menu and battle.

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

The Android app is a Gradle project built by GitHub Actions (`.github/workflows/android.yml`) and published to the [android-latest release](../../releases/tag/android-latest). Main-branch release builds use the protected signing secrets documented in [CLOUD_SETUP.md](CLOUD_SETUP.md#release-signing-key-migration-2214). Pull requests use a temporary debug key. The legacy `build-apk.sh` also requires the protected release signing environment variables.

Google sign-in uses Android Credential Manager, then Firebase Auth and Firestore over REST, to cross-save progress. See [CLOUD_SETUP.md](CLOUD_SETUP.md). Sign-in is Android-only.

Every app launch opens the original pixel-art Delvers title scene with its own synthesized theme and ember chime. Begin offline or Continue is immediately available, without waiting for the animation. Returning players keep their progress, privacy consent and audio preferences. Google sign-in is optional, and privacy consent is required before online features.

After the title, new players without story progress get a dedicated Learn to play / Skip welcome screen. Completing or skipping the tutorial keeps it from interrupting later launches; it remains replayable from Guide. Set details appear only on Collection, Deck and Packs.

## Regression checks

Run Node suites with `for f in tests/*.test.js; do node "$f" || exit; done`.
For landscape, zoom, tutorial, save, retry and simulated online UI checks, serve the repository locally with `python3 -m http.server 8765 --bind 127.0.0.1`, then run `tests/ui224.js`, `tests/cloud-ui224.js`, `tests/campaign-ui224.js` and `tests/online-ui224.js` sequentially with Node. Set `PLAYWRIGHT_MODULE` to an installed Playwright module and `CHROME_BIN` if Chrome is not at `/usr/bin/google-chrome`. Campaign checks play real turns with shortened presentation delays; cloud-reset and online checks use simulated services, not production Firebase.

## Legal & privacy
See [PRIVACY.md](PRIVACY.md) and [LEGAL.md](LEGAL.md) (IP notes, SRD 5.1 attribution).
