# ASHA Billing V104 — Stable Mobile Rebuild

This release keeps the existing vanilla JS + Firebase app and its existing Firestore document structure, while replacing conflicting navigation and calculator behavior with a single stable implementation.

## Run locally
1. Install Node.js 18+.
2. Run `npm install`.
3. Run `npm run dev` for local development or `npm run build` for a production build.
4. Deploy the generated `dist/` directory to your static hosting provider.

## Firebase security
The Firebase web API key in a browser app is a project identifier, not a server secret. Restrict it in Google Cloud to the required APIs and authorized domains. Protect Firestore with Authentication and restrictive Firestore Security Rules. Never add service-account keys or Admin SDK credentials to this repository.

## V104 changes
- One delegated navigation handler for all bottom-tab and quick-action buttons; avoids competing handlers from earlier patches.
- Fixed bottom navigation with safe-area spacing and mobile touch targets.
- Replaced calculator key handling with a deterministic parser (no `eval`/`Function`), supporting brackets, decimals, percentage, operator precedence, delete, clear, and divide-by-zero handling.
- Removed a broken `generate-config.cjs` build prerequisite that was referenced but absent from the supplied ZIP.
- Removed the local `.env` file from the distributable archive.

Existing Firebase document/schema and the established application workflows are retained. Verify login and cloud sync against your Firebase project after deployment.
