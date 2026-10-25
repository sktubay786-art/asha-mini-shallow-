ASHA Billing V67 — iOS Studio Upgrade

Included files:
- index.html: app shell with the new Billing Shortcuts flashcards
- app.js: original V66 app logic retained to reduce risk to existing billing, customer, payment, QR, Firebase, and report workflows
- style.css: iOS-inspired visual layer, responsive layout, animations, card surfaces, safer-area navigation
- upgrade.js: isolated visual interactions and preview refresh bindings
- manifest.json, sw.js: PWA version/cache updates
- icon-192.png and icon-512.png: app icons
- firestore.rules: original owner-only rule file supplied with the project

V67 changes:
- iOS-inspired responsive dashboard, smooth transitions, frosted bottom navigation, improved cards and button feedback
- Interactive flashcards for Normal Bill, Print/PDF, and Reminder + Bill
- Improved mobile navigation and dashboard metric layout
- Cache version raised to V67 so installed PWA clients can receive the new files
- Added an extra rapid-tap guard to the Save Bill button
- Existing bill templates and print modes retained

Important notes:
1. This is a source-level upgrade. Firebase authentication/cloud sync and sharing must be smoke-tested in the actual deployed Firebase project because this environment does not have your signed-in session or live Firestore access.
2. Review your billing rates in Settings (rate per বিঘা / কাঠা / ডেসিমেল) before issuing bills. The code keeps the existing unit-based rate logic and does not guess your business's actual tariff.
3. Keep firestore.rules restricted to the intended owner UID. Never publish service-account credentials. The client Firebase API key is normally public configuration, but access must be controlled by Firebase Auth and Firestore rules.
4. Upload/replace the files together in the same hosting folder. Do not upload only index.html or only CSS/JS.
5. After deployment, if an installed PWA shows the old build, close it fully and reopen it; if needed clear the site's cached data and reinstall.

Checks completed: app.js and upgrade.js syntax checks; service worker syntax check; manifest JSON parse.
