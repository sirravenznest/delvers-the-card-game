# Delvers: The Card Game (Android)

Delvers: The Card Game is an Android WebView app wrapping the single-file HTML game in `app/src/main/assets/index.html`.
Progress is saved in the WebView's `localStorage` (key `delvers1`).

## Build the APK

Requires `aapt`, `apksigner`, `zipalign`, `smali`, `zip`, a JDK, and the Android API 23 `android.jar`:

```
./build-apk.sh
```

Output: `app/build/outputs/apk/debug/app-debug.apk` (debug-signed with a locally generated keystore).

## First Adventures (Set 1, 90 cards)
Creatures, spells, weapons, armour and magic items. Play on a 3×3 grid, move with **initiative**, and use **reach** to hit foes from range. Reach the enemy's side to attack their hero. Twelve opponents to defeat.
Download: `releases/Delvers-1.5.apk` (saves from v1.1 do not carry over).

## World & campaign
Set in **Vaelmark** during the Long Dusk: the Sunforge is failing and the Hollow is leaking in. 36 encounters (24 skirmishes and 12 named bosses) across five acts, each with a story briefing; read the Lore tab. Packs are 🪙100 each, and you choose how many to buy.
