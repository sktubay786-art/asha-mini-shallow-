# ASHA Billing V100 — Premium User Center

## What's new
- Rebuilt the Users list as responsive premium customer cards.
- Rebuilt the individual customer view as a dedicated customer workspace.
- Added a 3×3 action grid: New Bill, Edit User, Ledger, Payment Receive, Settle, Bill Reminder, Reminder, Call, Delete User.
- Added a customer ledger timeline and inline payment/settlement form.
- Preserved the existing bill, payment, reminder, customer edit, Firebase authentication and cloud-sync code paths.
- Updated app script and service-worker cache versions to V100.

## Deploy
1. Back up the current GitHub repository and Firebase data.
2. Extract this ZIP and upload all files to the repository root, replacing the matching app files.
3. Deploy the existing Firestore rules only after reviewing them against your Firebase project; this ZIP preserves the existing `firestore.rules` file.
4. Reload the app and sign in with the authorized owner account.

## Firebase key note
The Firebase Web API key is a client identifier, not a server-side secret. Restrict it in Google Cloud Console using the allowed HTTP referrers and API restrictions. Keep Firestore access controlled by authenticated owner-only rules. Never put service-account private keys in this frontend repository.

## Validation
JavaScript syntax was checked with Node.js. The app was not connected to a live Firebase project for end-to-end payment, messaging, or deletion testing in this build environment. Test with a backup or test account before production use.
