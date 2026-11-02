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
4. **Project settings → Your apps → Add Android app:** package `com.sirravenznest.delvers`, SHA-1 `F2:57:2E:6B:48:F6:92:99:13:DC:B3:FF:C7:2D:36:D9:D2:88:E5:A2` (SHA-256 `3E:C5:1E:23:66:5B:9D:93:DE:3F:62:6F:F3:4D:B5:F8:5A:C7:63:DD:4C:65:11:05:30:F0:30:E3:D8:17:F5:92`).
5. Collect three values:
   - `apiKey`: Project settings → General → Web API Key.
   - `projectId`: Project settings → General.
   - `webClientId`: Authentication → Google provider → Web SDK configuration → Web client ID (or Google Cloud → Credentials → "Web client (auto created by Google Service)").
6. Put them in the `CLOUD` constant in `app/src/main/assets/index.html` and merge. CI builds the APK. These are public identifiers, not secrets.

## Online play (ranked, friends, private games)

1. In the Firebase console enable **Realtime Database** (free Spark plan, no billing).
2. Open its **Rules** tab and paste the contents of `database.rules.json`, then publish.
3. Put the database URL (e.g. `https://YOUR-PROJECT-default-rtdb.firebaseio.com`) into `CLOUD.dbUrl` in `index.html`.

Turn limits: 75 s per turn in ranked, 120 s in friendly games. An idle turn ends automatically; three idle turns in a row forfeit the match.
