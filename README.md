# Delvers: The Card Game

Delvers: The Card Game is an Android WebView app with its game assets in `app/src/main/assets/`.
Progress is saved in the WebView's `localStorage` (key `delvers2`, with older saves migrated).

## 2.2.31

Breakdown confirmations identify each card's rarity alongside its name and copy ID.

## 2.2.30

Both players' battlefield units show their pixel artwork beneath the existing stats and indicators. The board keeps its existing size, ownership markers, gear, abilities and cosmetic effects. `tests/battlefield-art-ui.js` checks visible artwork and unit details across landscape sizes.

## 2.2.28

Audio unlock is retried on completed clicks/taps and keyboard input, including when a track is already selected but the audio context is suspended. Returning to the app resumes audio, with rejected audio operations reported to the console. Music and global mute retain their separate settings.

Full cards retain their intended height inside column layouts instead of using their width as their flex height. Wrapped titles have room to grow, and taller-screen deck cards leave enough space for titles, stats and rarity labels without crossing the border. Battlefield cosmetics, abilities, gear and live stats are unchanged.

`tests/music-playback-ui.js` checks real generated audio samples for all five music modes with touch activation restrictions, mute controls and suspend/recovery. `tests/card-text-ui.js` measures painted text against card borders for the entire collection, deck gallery and hand at seven landscape sizes. Battle hand cards show pixel artwork alongside their class band, abilities and stats; `tests/hand-card-art-ui.js` checks these and cosmetic layers across landscape sizes.

## 2.2.27

The deck list no longer repeats every card as a separate slot menu. Each grouped card instead opens Copies & cosmetics directly, with deck-copy choices shown above the treatments; owned copies already in the deck are marked. Purchases, individual copy selections and saved builds remain unchanged. Collection filters share the tools panel's single scroll surface, without overlapping scroll arrows.

`tests/deck-cosmetics-filters-ui.js` covers deck-copy selection and swaps, saved-build restoration, and filter layout and interaction at seven landscape sizes.

## 2.2.26

Story encounter briefings and the dice/avatar opening use compact landscape layouts, keeping Begin, Back and Roll controls visible without scrolling. Story dialogue, difficulty choices, rewards, avatars and PvP ranks remain present. Battlefield foil and holographic finishes cover the inner unit surface and remain visible through translucent stat panels; metallic names keep their opaque backing, while all live stats, ability tags, gear and buff markers remain above the finishes.

`tests/battle-intro-fit-ui.js` checks all 60 Story briefings and battle openings, difficulty states and PvP ranks across seven landscape sizes. `tests/battle-cosmetics-ui.js` compares actual rendered finish pixels at five sizes and three shimmer phases, including real equipped gear and Bless, alongside existing lettering, layer and reduced-motion checks.

## 2.2.25

Every normal battle now starts with an **opposed d20 roll**: each player taps **Roll d20**, highest goes first, and ties reroll automatically. Story, human Ranked, rated bots and friendly matches all use the same rule. Both online players replay the same seeded results; independent, immutable roll acknowledgements cannot collide, change a result or consume gameplay action numbers. Play waits for both rolls, the normal turn timer starts after the second roll, and a player who never rolls forfeits after the opening time limit. Reconnecting restores rolls and the original dice, not a new chance. The second player retains the extra opening card regardless of seat. Guided practice and lessons remain player-first, without an opening roll.

**Store → Custom d20s** sells permanent cosmetic dice for gold only: Emberheart **250**, Deep Anvil **400**, Gloamwood **550**, and Starless Court **800**. Guild Ivory is free. Buying equips the die; switching owned dice is free. Profile links to dice selection. The chosen die is used in Story and every other normal mode, and both online players see each other's choices. No Story dice rewards are granted. Dice ownership and selection survive local reloads and cloud restores; failed saves roll purchases/equips back with an error. Appearances never change roll odds.

Dice have original faceted artwork, a short tumble animation and synthesized rattle/settle effects. Muting suppresses the effects; reduced motion skips tumbling. Background refreshes preserve active dice nodes rather than restarting animations. Battle results dismiss any pending roll screen.

`node tests/dice.test.js` checks 10,000 seeded openings, every face, tied rerolls, seat fairness, second-player cards, ownership, gold purchases and deterministic replay. `node tests/dice-net.test.js` covers concurrent rolls, opponent ownership, reconnects, clocks, network failures and bots using the simulated database. Run `tests/dice-ui.js` with the browser setup below for four-size Store/Story, purchase rollback, real audio/mute, animation/reduced-motion and practice coverage; `tests/online-ui224.js` covers actual manual rolls and custom dice in ranked, friendly and bot matches.

## 2.2.24

First Adventures now contains **130 cards**. Eight additions cover the five player classes and three spells; no monsters, new Legendaries or automatic card grants are added. Existing collections, starter lists, pack prices, rarity/cosmetic rates and reward gates remain unchanged. The ten Legendary names retain their individual pull odds. Pull rates derives rarity counts from the current set, discloses duplicates, and shows the actual probability of at least one specific card rather than its expected copy count. Every pack tier has a collapsible card pool grouped by rarity, including all eight additions.

| Card | Class | Cost | Rarity | Role |
|---|---|---:|---|---|
| Ashen Standard-Bearer | Fighter | 3 | Uncommon | Modest front line with hero healing |
| Lanternbound Adept | Wizard | 2 | Common | Small Warded caster |
| Emberheart Confessor | Cleric | 4 | Rare | Spell-resistant alternative to a healer |
| Vaultstep Infiltrator | Thief | 3 | Uncommon | Sturdier, slower Backstab option |
| Embertrail Archer | Ranger | 3 | Common | Accessible Reach-2 support |
| Lantern Study | Wizard spell | 1 | Common | Cycle one card without gaining hand advantage |
| Hearthward Prayer | Cleric spell | 2 | Uncommon | Creature-only healing |
| Ashen Reprisal | Wizard spell | 4 | Rare | A weaker, cheaper three-target chain |

**Warded** reduces spell damage by one after Saves, never reducing positive damage below one; zero damage stays zero. It does not prevent physical damage, Poison, retaliation or control. Deep Anvil Charm grants it using the existing magic-item slot, and Lanternbound Adept has it naturally. Repeated grants do not stack. Cera now has two health and Regenerate alongside Heal; Nim now has two health and Haste alongside Backstab. Costs and rarities stay unchanged.

Story's book-style **Index** provides nine chapter destinations, saved star totals and the current encounter, with one shared chapter scroll surface. Future chapters remain browsable but their fights stay locked. Enemy decks use twenty faction profiles, with thematic new cards gated by the encounter's existing rarity cap. Health, mana, AI levels and rewards are unchanged. Earlier enemies favour more cheap bodies rather than a stronger midrange curve.

The Haste lesson now requires **summon, move and attack in the same turn**, rather than finishing at summon. It explains each phase, accepts missed attacks, and cannot waste its movement on an irrelevant tile. Battlefield metallic lettering remains intact on an opaque header backing; unchanged name/header nodes survive background renders, and filtered-text compositing is removed from small unit labels. Foil, holographic finishes, ownership markers and exhausted colours remain.

The glossary is the first expandable Guide section, directly below tutorial controls. Guide and card wording distinguish Tough from Warded, describe Backstab's extra Attack damage even on critical hits, and clarify ranged Thorns and Turn Undead's existing magic-resistance bypass. These wording corrections do not change the original cards' combat rules.

`tests/final-set.test.js` compares one and three copies of every new card against all starters in both seats (100 fixed seeds per matchup). Observed starter win-rate changes range from -6.2 to +4.7 percentage points. Cheap-Legend comparisons and early/mid/late campaign comparisons run separately. These are heuristic regression samples, not proof of optimal-play balance.

## Tutorial pack and menu lessons

Winning practice awards **one free Standard pack**, alongside the existing free starter choice. After selecting the starter, the tutorial continues through real pack opening, the full card-results/optional breakdown summary, gold and Arcane Dust, and the Deck UI. The deck lesson requires changing a card quantity and finishing with 20–30 cards; players may restore their original quantities. No currency spending or breakdown is required.

Existing players who already earned their starter receive the missing pack when continuing from the title, without another starter or changes to their deck. The saved `tutorialMenus` reward/progress marker prevents repeat grants on reload, tutorial replay or restore from a current cloud save. Unfinished menu lessons can be resumed from the Hub. Closing during pack opening resumes its saved card summary rather than granting or opening another pack. Save failures roll pack acquisition and reward grants back with a visible error.

Pack and deck guidance is confined to the dedicated tutorial; normal Packs and Deck screens remain free of tutorial banners. Leaving the tutorial preserves unfinished real-lesson progress. Opening the awarded Standard pack normally records its cards for the later lesson, even when opening multiple packs; later ordinary openings remain available. On a completed tutorial replay, the pack lesson uses explicitly labelled example cards, not a real reward: no cards, currency or packs are granted or consumed.

During pack reveals, **Open all** immediately shows every obtained card in the summary; it does not discard cards. The separate Packs-menu **Open all** opens all unopened packs outside the guided free-pack lesson.

Run `tests/tutorial-menus-ui.js` with the local-server/Playwright setup below to cover tutorial rewards, existing-player grants, save failures, resumable real-menu lessons and replay protection. Cloud UI checks also cover delayed sync and restored one-time reward markers.

The creature-ability lesson demonstrates Haste through actual summon-turn movement and an attack. Summoning or selecting alone cannot finish it; an attack that misses still completes the demonstration. `tests/tutorial-abilities-ui.js` covers all four deployment columns, restricted movement, short-screen objective layouts and reward neutrality.

## Card cosmetics & Arcane Dust (development)

Collection, Deck and pack results have **Copies & cosmetics** controls. Each individual copy can combine a metallic frame, metallic title lettering, holographic background and foil shine. Holographic, Gold holographic and Foil shine share the **Finishes** section; backgrounds and foil can still be combined. Previewing is free; a confirmed purchase permanently unlocks the treatment on that copy, and switching unlocked treatments is free. Deck slots and saved builds retain the exact chosen copies. Existing collections migrate to plain copies without changing quantities, gold or decks.

| Treatment | Arcane Dust per copy |
|---|---:|
| Silver, red or blue frame/title lettering | 25 each |
| Gold frame/title lettering | 75 each |
| Foil | 300 |
| Holographic background | 600 |
| Gold holographic background | 1,200 |

Plain spare breakdown keeps at least **three total copies per card name** and pays the existing gold reward plus **5 / 15 / 50 / 150 Arcane Dust** for Common / Uncommon / Rare / Legendary. Purchased-cosmetic copies cannot be broken down, even with their default appearance selected. Pack-only cosmetic spares require a separate confirmation and pay normal gold and rarity Dust plus **6% of their granted treatment's price, rounded down** (1 / 4 / 18 / 36 / 72 bonus Dust for basic colours / gold / foil / holographic / gold holographic). Bulk breakdown never includes cosmetic copies. Purchasing any additional treatment permanently protects an originally pack-granted copy too.

The **end-of-opening summary** shows every card obtained and offers **Review & break down extras**, listing the exact plain spare copies and both rewards before confirmation. It considers every pack in the current opening, including mixed-tier **Open all**, never older collection copies. The guided tutorial retains its separate five-card receipt. Closing the summary keeps remaining cards; obtained-card review and pack-extra breakdown are not shown in the Packs menu. Saved copy ownership and currencies prevent consumed copies paying twice; the persisted latest-pack receipt remains five cards and does not reopen a closed batch.

Every packed card independently has a **0.25% / 0.75% / 1.5%** cosmetic chance in Standard / Veteran / Legendary packs, without changing card-rarity odds. A cosmetic drop unlocks and equips one treatment for free. Basic foil and silver/red/blue treatments are possible even on Common cards in Standard packs. Gold treatments require at least Uncommon, holographic requires Rare or Legendary, and gold holographic requires Legendary. Higher card rarity improves the treatment mix; higher pack tiers weight gold, foil and holographic treatments more heavily. Exact conditional treatment odds are shown under Pull rates.

Finishes use original procedural CSS, not third-party game assets. They appear in menus, pack reveals, full-card previews, battle hands and battlefield units. Gameplay colours always take precedence: playable/blocked cards, blue/red ownership, readiness, targets, changed stats, class bands and rarity indicators keep their original colours. Battle holographic finishes cover the inner card surface at reduced opacity rather than being squeezed into a thin strip, and shimmer keeps its phase across background refreshes. Exhausted unit names retain their muted appearance. All campaign difficulties, human ranked, rated bots and friendly matches support cosmetics. Tutorial lessons and guided practice use plain cards. Reduced-motion settings disable animated shimmer.

Spells and gear show the actual played card front and center for two seconds, identifying who played it and its target. A simple fade replaces the moving/scaling entrance. The latest rapid cast replaces the previous presentation and receives its own lifetime; resizing refits it, and battle results or leaving clear it immediately. It requires no dismissal, never takes focus and never blocks controls. Equipped units show gear markers; select or hold a unit to identify every item and inspect its effects. Larger battle views also show gear names beside the unit name. Run `tests/battle-feedback-ui.js` with the local-server/Playwright setup below.

Battle-hand cards retain their class-coloured identity band even on compact screens, explicitly labelling Creature, Spell, Consumable or Gear alongside class or equipment slot. Single-use magic items are Consumables, not permanent gear. The band remains separate from playable/blocked borders, selection outlines and cosmetic finishes.

Auto-play, campaign AI and ranked bots evaluate draw spells using actual deck and hand space, including the slot freed by casting. They avoid empty-deck/fatal-fatigue draws and save Potion of Speed for useful restored attacks or movement instead of refreshing unused actions. Auto-play and campaign AI reconsider cards after units act, so Speed can grant a genuine extra action that turn. Ranked bots do not randomly end a turn while a useful action remains.

Pack openings have an original Delvers seal, tear effects, rarity-specific halos and particles, and a distinct shimmer celebration and label for cosmetic discoveries. Muting still controls all generated sounds; reduced motion removes animated effects, and Skip stays reachable during every stage. Reveal effects never change the already-granted pack contents or rewards.

Pack cards settle gently into view without a white opening flash or edge-on flip. Background cloud/online updates retain the active reveal instead of restarting its animation. Finishing or skipping opens the card summary with gold/Dust rewards, a separate destructive confirmation, and a keep-cards option. Cosmetics still require individual review.

Cloud saves include Dust, individual-copy identifiers, unlock provenance, equipped treatments, deck choices and the latest pack receipt. Online protocol 8 also isolates the opening-roll rules from older clients, and shares only equipped appearances with match participants. Both players must use a compatible build. No Firebase rules changes are required.

## 2.2.23

Story reopens on the encounter page containing the next uncleared fight, including after reloads, returning from battles and chapter transitions. Manual browsing remains available while reading. Each encounter shows earned stars out of three; the briefing distinguishes cleared, next and locked difficulty tiers. Wins, losses and higher-star replays retain the existing saved progress and one-time rewards.

## 2.2.22

Restores class-coloured Creature/Spell/Gear labels in battle hands, improves cosmetic finish visibility and groups the three finishes together. Played spells and gear briefly appear front and center; equipped units identify their items. Auto-play, campaign AI and ranked bots use draw spells more reliably and save Potion of Speed for useful extra actions.

## 2.2.21

Keeps pack and deck guidance in the dedicated tutorial, leaving the normal screens clean. Tutorial replays use a clearly labelled practice pack with example cards and no rewards after the free pack has been opened.

## 2.2.20

Adds a one-time free Standard pack after tutorial completion, with guided pack-opening, currency and hands-on deck-building sections. Existing tutorial graduates receive the pack if missing, without another starter; saved progress prevents repeat grants and resumes unfinished lessons.

## 2.2.19

Smooths pack reveals without the opening flash or animation restarts. Finishing or skipping shows all obtained cards and confirmed extra-copy breakdown together; the Packs menu no longer retains results or breakdown controls.

## 2.2.18

Adds individual-card cosmetic finishes, Arcane Dust, cosmetic pack drops, protected breakdown rules, and upgraded pack reveals. Finishes preserve gameplay colour cues across menus and battles.

## 2.2.17

Practice is manual-only, without Auto-play. Each practice objective opens automatically only once per fight, even when selecting cards, deselecting units or changing turns returns to an earlier objective. The Objective button still allows manual review; starting a new practice fight resets these reminders.

## 2.2.16

Tutorial lessons and practice objectives are focused pop-ups, replacing the cramped side panel. Confirm an objective to clear the battle screen, and reopen it at any time using the Objective button in battle controls. Completing a guided action opens the next objective automatically.

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

## First Adventures (Set 1, 130 cards)
Creatures, spells, weapons, armour and magic items. Play on a 4×5 grid, use abilities like haste, poison, paralysis and backstab, move with **initiative**, and use **reach** to hit foes from range. Reach the enemy's side to attack their hero.
Download the latest APK from the [android-latest release](../../releases/tag/android-latest).

## World & campaign
Set in **Vaelmark** during the Long Dusk: the Emberheart is failing and the Hollow is leaking in. 60 encounters (40 skirmishes and 20 named bosses) across nine acts, each with a story briefing; read the Lore tab. Packs are 🪙100 each, and you choose how many to buy.

## Android build & Google sign-in (cloud save)

The Android app is a Gradle project built by GitHub Actions (`.github/workflows/android.yml`) and published to the [android-latest release](../../releases/tag/android-latest). Main-branch release builds use the protected signing secrets documented in [CLOUD_SETUP.md](CLOUD_SETUP.md#release-signing-key-migration-2214). Pull requests use a temporary debug key. The legacy `build-apk.sh` also requires the protected release signing environment variables.

Google sign-in uses Android Credential Manager, then Firebase Auth and Firestore over REST, to cross-save progress. See [CLOUD_SETUP.md](CLOUD_SETUP.md). Sign-in is Android-only.

Every app launch opens the original pixel-art Delvers title scene with its own synthesized theme and ember chime. Begin offline or Continue is immediately available, without waiting for the animation. Returning players keep their progress, privacy consent and audio preferences. Google sign-in is optional, and privacy consent is required before online features.

After the title, new players without story progress get a dedicated Learn to play / Skip welcome screen. Tutorial lessons and practice objectives open as focused pop-ups; confirm each objective to clear the board, and reopen it from battle controls whenever needed. Completing or skipping the tutorial keeps it from interrupting later launches; it remains replayable from Guide. Set details appear only on Collection, Deck and Packs.

## Regression checks

Run Node suites with `for f in tests/*.test.js; do node "$f" || exit; done`.
Focused browser checks for this pass are `tests/story-index-ui.js`, `tests/story-progress-ui.js`, `tests/pack-opening-ui.js`, `tests/tutorial-abilities-ui.js`, `tests/battle-cosmetics-ui.js`, `tests/battle-feedback-ui.js` and `tests/set-cohesion-ui.js`. They use the same local-server setup below.
For landscape, zoom, tutorial, save, retry and simulated online UI checks, serve the repository locally with `python3 -m http.server 8765 --bind 127.0.0.1`, then run `tests/ui224.js`, `tests/card-cosmetics-ui.js`, `tests/practice-ui.js`, `tests/cloud-ui224.js`, `tests/campaign-ui224.js` and `tests/online-ui224.js` sequentially with Node. Set `PLAYWRIGHT_MODULE` to an installed Playwright module and `CHROME_BIN` if Chrome is not at `/usr/bin/google-chrome`. Cosmetic checks exercise per-copy purchases, menus, previews, persistence, pack rewards and salvage. Practice checks cover one-time objectives, manual review and replay. Campaign checks play real turns with shortened presentation delays and cosmetic-equipped decks at all difficulties; cloud-reset and online checks use simulated services, not production Firebase. Online checks verify both players' finishes in human ranked, friendly and bot battles.

## Legal & privacy
See [PRIVACY.md](PRIVACY.md) and [LEGAL.md](LEGAL.md) (IP notes, SRD 5.1 attribution).
