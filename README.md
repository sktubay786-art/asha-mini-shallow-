# ASHA Billing — Fresh App 2.0

A clean, standalone rebuild. It does not load any previous `app.js`, `upgrade.js`, or legacy UI code.

## Included
- Email/password Firebase Authentication (requires your own config)
- Local demo mode
- Customer create/edit/search/delete and customer centre
- New bills with quantity, unit, rate, total and optional initial payment
- Receive payment and separate settlement/adjustment entries
- Customer ledger, bill history, WhatsApp bill reminder, phone call
- Dashboard totals, CSV export, JSON backup/restore, settings and calculator
- Fresh cache policy: unregisters old service workers and deletes Cache Storage on app startup; the new service worker does not cache app files.

## Setup
1. Upload all files in this folder to the GitHub repository root.
2. Copy `firebase-config.example.js` to `firebase-config.js` and fill in your Firebase **web app** config.
3. Enable Email/Password in Firebase Authentication.
4. Create Firestore and publish `firestore.rules`.
5. Enable GitHub Pages over HTTPS.

Without Firebase config, choose **Continue with local demo**. Demo data stays in this browser only.

## Security
- Firestore document path: `ashaUsers/{uid}`.
- Rules allow each signed-in user to access only their own document.
- Firebase browser API keys are identifiers, not server secrets. Restrict the key in Google Cloud; never include service-account keys in this project.
- Do not use demo mode for important production records. Export regular backups.

## Important
This is a fresh baseline implementation. Test all workflows with sample data before production use. WhatsApp reminder opens a prefilled WhatsApp chat; it does not send automatically. Deleting a customer deletes that customer's bills from the app data.
