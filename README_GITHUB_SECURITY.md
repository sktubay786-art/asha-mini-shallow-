# ASHA Billing V96 — GitHub Pages & Firebase security

## Deploy
1. Upload all project files from this folder to the root of your GitHub repository.
2. In GitHub, open **Settings → Pages** and publish from your chosen branch/root folder.
3. In Firebase Console, publish the included `firestore.rules` in **Firestore Database → Rules**.

## Firebase key safety
- The `apiKey` in `app.js` is a Firebase **web app API key**. Browser apps must include their Firebase web configuration; it is not a service-account private key.
- Never put a Firebase Admin SDK service-account JSON, private key, or other server secret in this repository. No service-account private key is included in this ZIP.
- Restrict this web API key in Google Cloud Console using **HTTP referrer website restrictions** for your real GitHub Pages domain and only the APIs the app needs.
- Keep Firestore rules published. The included rules restrict reads and writes to an authenticated owner UID and the single expected document. Test rules in Firebase Emulator/Rules Playground before changing them.
- Enable Firebase Authentication protections and use a strong unique password for the owner account.

## V96 changes
- Users search results keep the same card structure after searching.
- Pay section separates selected bill/account summary from the payment-entry form and action buttons.
- Existing input IDs and payment handlers are retained; the update groups existing controls for presentation only.
