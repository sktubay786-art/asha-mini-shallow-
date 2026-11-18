# ASHA Billing — Fresh rebuild

A clean ES-module application using the existing ASHA Billing visual assets and the same Firebase project / Firestore document identity.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.

## Data safety

- Firebase project: `asha-app-745be`
- Firestore path: `ashaMiniShallow/ekramul-main`
- Existing local-storage key is retained for local data continuity.
- This project does not run any cloud deletion, collection migration, or document reset.
- Firebase web API configuration is public client configuration; authorization must be enforced by Firebase Authentication and Firestore Security Rules.

## Notes

The original styles and visual assets are retained as design references. Application logic has been replaced with a new, consolidated module. Verify the owner login and a cloud backup before using it for live billing. The production build should be run with `npm install && npm run build` in an environment with package-registry access.
