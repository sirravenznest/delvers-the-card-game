# Delvers: The Card Game

Delvers: The Card Game is an Android WebView app wrapping the single-file HTML game in `app/src/main/assets/index.html`.
Progress is saved in the WebView's `localStorage` (key `delvers1`).

## Build the APK

Requires `aapt`, `apksigner`, `zipalign`, `smali`, `zip`, a JDK, and the Android API 23 `android.jar`:

```
./build-apk.sh
```

Output: `app/build/outputs/apk/debug/app-debug.apk` (debug-signed with a locally generated keystore).

## First Adventures (Set 1, 90 cards)
Creatures, spells, weapons, armour and magic items. Play on a 4×5 grid, use abilities like haste, poison, paralysis and backstab, move with **initiative**, and use **reach** to hit foes from range. Reach the enemy's side to attack their hero. Twelve opponents to defeat.
Download: `releases/Delvers-1.7.apk` (saves from v1.1 do not carry over).

## World & campaign
Set in **Vaelmark** during the Long Dusk: the Sunforge is failing and the Hollow is leaking in. 36 encounters (24 skirmishes and 12 named bosses) across five acts, each with a story briefing; read the Lore tab. Packs are 🪙100 each, and you choose how many to buy.

## Android build & Google sign-in (cloud save)

The Android app is a Gradle project built by GitHub Actions (`.github/workflows/android.yml`) and published to the [android-latest release](../../releases/tag/android-latest). It is signed with the committed debug key in `android-signing/`, so its SHA-1 stays stable for Firebase. The old `build-apk.sh` produces a basic APK without sign-in.

Google sign-in uses Android Credential Manager, then Firebase Auth and Firestore over REST, to cross-save progress. See [CLOUD_SETUP.md](CLOUD_SETUP.md). Sign-in is Android-only.

## Legal & privacy
See [PRIVACY.md](PRIVACY.md) and [LEGAL.md](LEGAL.md) (IP notes, SRD 5.1 attribution).
