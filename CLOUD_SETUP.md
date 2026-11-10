# Cloud save setup (Firebase)

1. Create a project at https://console.firebase.google.com.
2. **Build → Authentication → Sign-in method:** enable **Google**.
3. **Build → Firestore Database:** create a database (production mode), then set these rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
4. **Project settings → Your apps → Android app:** package `com.sirravenznest.delvers`. Add the release signing key's SHA-1 fingerprint as described below. Keep the previous fingerprint registered until users have migrated.
5. Collect three values:
   - `apiKey`: Project settings → General → Web API Key.
   - `projectId`: Project settings → General.
   - `webClientId`: Authentication → Google provider → Web SDK configuration → Web client ID (or Google Cloud → Credentials → "Web client (auto created by Google Service)").
6. Put them in the `CLOUD` constant in `app/src/main/assets/index.html` and merge. CI builds the APK. These are public identifiers, not secrets.

## Release signing key migration (2.2.14)

The previously committed signing key is compromised and must not be used for new releases. Releases from 2.2.14 use a new signing key. Existing installations cannot update across this certificate change: sync progress with Cloud Save, uninstall the old app, and then install the new APK. Uninstalling deletes local-only progress because Android backup is disabled. Installations signed with the new key can update normally from later releases.

Create a new key on a trusted machine and keep an encrypted offline backup. Do not commit the keystore or passwords:

```sh
keytool -genkeypair -v -keystore delvers-release.jks -alias delvers-release -keyalg RSA -keysize 3072 -validity 10000
keytool -list -v -keystore delvers-release.jks -alias delvers-release
```

In the repository's **Settings → Secrets and variables → Actions**, add these repository secrets:

- `ANDROID_SIGNING_KEYSTORE_BASE64`: the base64-encoded keystore file.
- `ANDROID_SIGNING_STORE_PASSWORD`: the keystore password.
- `ANDROID_SIGNING_KEY_ALIAS`: `delvers-release` (or the alias chosen when creating the key).
- `ANDROID_SIGNING_KEY_PASSWORD`: the private-key password.

On Linux or macOS with GitHub CLI authenticated, stream the keystore directly into the repository secret without printing its contents:

```sh
base64 delvers-release.jks | tr -d '\n' | gh secret set ANDROID_SIGNING_KEYSTORE_BASE64 --repo sirravenznest/delvers-the-card-game
```

Set the three password/alias secrets through the same repository settings page.

Register the new key's SHA-1 fingerprint with the Firebase Android app and Google OAuth Android client before publishing; retain the old fingerprint temporarily so users can sync from the previous release. Remove the old fingerprint after migration. Pull-request builds use a temporary debug key and never need release-signing secrets. Main-branch release builds fail explicitly until all four secrets are configured.

To verify signing before merging, run **Actions → Android build → Run workflow**, select the feature branch, and enable **Build and verify a signed APK without publishing a release**. This checks that the secrets exist, builds a release APK, verifies its signature and reports the public certificate fingerprints. It uploads an APK artifact but never publishes or replaces the public release. Secret values are not printed.

## Online play (ranked, friends, private games)

1. In the Firebase console enable **Realtime Database** (free Spark plan, no billing).
2. Open its **Rules** tab and paste the contents of `database.rules.json`, then publish.
3. Put the database URL (e.g. `https://YOUR-PROJECT-default-rtdb.firebaseio.com`) into `CLOUD.dbUrl` in `index.html`.

Turn limits: 75 s per turn in ranked, 120 s in friendly games. An idle turn ends automatically; three idle turns in a row forfeit the match.
