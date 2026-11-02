# Privacy Policy: Delvers: The Card Game

_Last updated: 2026-11-02_

Delvers: The Card Game ("the game") is a hobby project by the GitHub user `sirravenznest`. This policy explains what data the game handles.

## Playing without an account
By default, all progress (collection, decks, gold, campaign progress) is stored **only on your Android device** in WebView `localStorage`. We do not receive it, and the game contains no ads, analytics, or trackers.

## Signing in with Google (Android, optional)
If you choose **Sign in with Google**, the game uses Google Sign-In and Google Firebase (Authentication and Cloud Firestore) to provide cloud save. When you sign in we process:

- Your Google account's unique ID, email address, and display name (provided by Google).
- Your game save data (collection, decks, gold, progress), stored in Firestore under your account.
- Authentication tokens, stored on your device so you stay signed in.

We use this data only to sign you in and sync your save between your devices. We do not sell or share it, and we do not use it for advertising. Data is processed by Google under [Google's Privacy Policy](https://policies.google.com/privacy) and the [Firebase terms](https://firebase.google.com/terms).

## Ranked multiplayer (planned)
When ranked multiplayer is released, we will also store a public display name, your rating, and match results. This policy will be updated before then.

## Retention and deletion
- **Local data:** clear the app's storage or uninstall the app to delete it.
- **Cloud data:** sign out to stop syncing. To have your cloud save and account record deleted, open an issue at https://github.com/sirravenznest/delvers-the-card-game/issues asking for deletion (do not include sensitive details). Deleting your data cannot be undone.

## Children
The game is not directed at children under 13, and we do not knowingly collect data from them.

## Security
Cloud data is protected by Firebase security rules that only allow you to read and write your own save, and it is transmitted over HTTPS. No system is perfectly secure.

## Changes
Changes will be posted in this file in the repository, with an updated date.

## Contact
Open an issue at https://github.com/sirravenznest/delvers-the-card-game/issues.

## Online play data
If you use ranked or friends, we store in Firebase Realtime Database: the public username you choose (not your Google name), a friend code, your friend list and requests, your rating and win/loss record, and match action logs. Remove friends in-app; contact the maintainer to delete your data.
