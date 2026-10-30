# ASHA Billing V103 — Complete App Refresh

## Included updates
- Unified iOS-inspired green/white visual system across Home, Users, Bill, Pay, History, Calculator, and Settings.
- Updated responsive spacing, cards, forms, metrics, navigation, and action controls.
- Preserved the existing app.js / upgrade.js / V101 / V102 feature scripts and Firebase document path.
- Updated app build labels, manifest version, asset query versions, and service-worker cache to V103.
- Fixed local date generation so bill/payment dates use the device's local calendar date rather than UTC.

## Deploy
1. Keep a backup of the current GitHub repository.
2. Extract this ZIP and upload all files to the repository root, replacing matching files.
3. Deploy/publish the site.
4. If an installed PWA shows stale assets, close it fully and reopen after the service worker updates.

## Firebase security notes
- Firestore rules remain restricted to the configured owner UID and the `ashaMiniShallow/ekramul-main` document. Review that UID before publishing if ownership has changed.
- Firebase browser API keys are identifiers, not server-side secrets. Restrict the key in Google Cloud Console by the production website referrer and enable only required APIs.
- Do not commit service-account JSON files or private server credentials.
- Keep Firebase Authentication enabled and publish the Firestore rules in Firebase Console.

## Validation
- JavaScript parser checks are run on app.js, upgrade.js, v101-user.js, and v102-user.js.
- ZIP archive integrity is checked before delivery.
- Live Firebase authentication, cloud sync, printing, payment recording, and device-specific PWA behavior still require testing in the actual Firebase project and browser.
