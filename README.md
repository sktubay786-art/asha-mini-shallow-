# ASHA Billing — Fresh Edition

A clean rebuild with a new responsive interface and a single application code path.

## Firebase compatibility

This app connects to the existing Firebase project `asha-app-745be` and reads/writes the existing Firestore document `ashaMiniShallow/ekramul-main`. It expects the existing data envelope `{ data: { settings, customers, bills } }` and retains the existing customer, invoice and payment field names.

The Firebase Web API key is a public client identifier, not a server secret. Keep Firestore rules owner-restricted and configure API key restrictions in Google Cloud. Never add service-account credentials to this project.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Deploy the built `dist` directory to Firebase Hosting or another static host. If using Firebase Hosting, set `public` to `dist` in `firebase.json` after building.

## Notes

- Existing Firebase Authentication owner UID is retained.
- Existing Firestore document path is retained; this app does not create a new database or collection.
- The UI is a fresh implementation, not a patch layered over previous app generations.
- Test login, cloud read/write, customer CRUD, invoice creation and payment entry in your Firebase project before using it for live accounts.
