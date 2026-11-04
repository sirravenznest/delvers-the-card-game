# Privacy Policy: Delvers: The Card Game

_Last updated: 2026-11-04 (policy version 2026-11-04)_

Delvers: The Card Game ("the game") is a hobby project by the GitHub user `sirravenznest`. This policy explains what data the game handles.

## Your agreement
The app shows this policy in-game. Google sign-in, cloud save, ranked and friends stay switched off until you tap **I agree**. You can read the policy again and **withdraw your agreement** from the Profile tab; online features then switch off again. Playing offline needs no agreement. If this policy changes materially, the app asks you to agree again.

## Playing without an account
By default, all progress (collection, decks, gold, campaign progress, missions, tutorial and starter-deck status) is stored **only on your Android device** in WebView `localStorage`. We do not receive it, and the game contains no ads, analytics, or trackers.

## Signing in with Google (Android, optional)
If you choose **Sign in with Google**, the game uses Google Sign-In and Google Firebase (Authentication and Cloud Firestore) to provide cloud save. When you sign in we process:

- Your Google account's unique ID, email address, and display name (provided by Google).
- Your game save data (collection, decks, gold, progress), stored in Firestore under your account.
- Authentication tokens, stored on your device so you stay signed in.

We use this data only to sign you in and sync your save between your devices. We do not sell or share it, and we do not use it for advertising. Data is processed by Google under [Google's Privacy Policy](https://policies.google.com/privacy) and the [Firebase terms](https://firebase.google.com/terms).

## Retention and deletion
- **Local data:** clear the app's storage or uninstall the app to delete it.
- **Cloud data:** sign out to stop syncing. To have your cloud save and account record deleted, open an issue at https://github.com/sirravenznest/delvers-the-card-game/issues asking for deletion (do not include sensitive details). Deleting your data cannot be undone.

## Children
The game is not directed at children under 13 (or under 16 where local law sets a higher age for consent). Do not sign in or use online features if you are below that age. We do not knowingly collect data from children; if you believe we have, contact us and we will delete it.

## Security
Cloud data is protected by Firebase security rules that only allow you to read and write your own save, and it is transmitted over HTTPS. No system is perfectly secure.

## Changes
Changes will be posted in this file in the repository, with an updated date.

## Contact
Open an issue at https://github.com/sirravenznest/delvers-the-card-game/issues.

## Online play data (ranked and friends)
If you use ranked or friends, we store in Firebase Realtime Database: the public username you choose (not your Google name), your avatar, a friend code, your friend list and requests, your rating and win/loss record, and match action logs (the moves of a match). **Other players can see your username, avatar and rating.** Choose a username that does not identify you. Remove friends in-app; contact the maintainer to delete your data.

## Legal basis and international transfers
Where the GDPR or UK GDPR applies, we rely on your **consent** (the I agree button) for sign-in, cloud save and online play, and you may withdraw it at any time without affecting earlier processing. Google may process data in countries outside your own under its own safeguards.

## Your rights
Depending on where you live you may ask us to access, correct, delete or export your data, and to object to processing. Use the contact below. You may also complain to your local data-protection authority.
