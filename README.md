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
Creatures, spells, weapons, armour and magic items. Play on a 4×5 grid, use abilities like haste, poison, paralysis and backstab, move with **initiative**, and use **reach** to hit foes from range. Reach the enemy's side to attack their hero. Twelve opponents to defeat.
Download: `releases/Delvers-1.7.apk` (saves from v1.1 do not carry over).

## World & campaign
Set in **Vaelmark** during the Long Dusk: the Sunforge is failing and the Hollow is leaking in. 36 encounters (24 skirmishes and 12 named bosses) across five acts, each with a story briefing; read the Lore tab. Packs are 🪙100 each, and you choose how many to buy.

## Windows (portable .exe)

A desktop build wraps the same `index.html` in Electron (`windows/`). GitHub Actions builds it on a Windows runner (`.github/workflows/windows.yml`).

- **Download:** after the workflow runs on `main`, grab `Delvers-<version>-windows-portable.exe` from the [windows-latest release](../../releases/tag/windows-latest). On pull requests it is available as the `Delvers-windows-portable` workflow artifact.
- **Play:** double-click the `.exe`; no install needed. Press F11 (or Ctrl+F) for full screen. Progress is saved in your Windows user profile.
- **Build locally (Windows or Linux):** `cd windows && npm install && npm run dist`.
- Windows SmartScreen may warn because the exe is not code-signed. Choose "More info" then "Run anyway".
