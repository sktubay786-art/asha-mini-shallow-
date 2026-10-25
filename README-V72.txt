ASHA Billing V72 — Premium iOS Responsive Navigation

Changes:
- Bottom navigation now has exactly seven destinations: Home, Users, Bill, Pay, History, Calculator, Settings.
- Report removed from bottom navigation (the report page and dashboard shortcut remain available).
- Consistent SVG icons with iOS-inspired active states, animation, glass dock, safe-area handling, and reduced-motion support.
- Responsive layout for narrow mobile screens, tablets, and desktop browsers.
- Updated asset query versions and service-worker cache to V72.
- Existing billing, land-rate conversion, Firebase and user action logic retained from V71.

Deploy: replace the app files in your GitHub Pages repository with the files in this ZIP, commit, then reopen the PWA. If old styles remain, close the installed PWA and clear site data/cache once.

Validation performed: JSON parse, JavaScript syntax check, ZIP integrity, navigation destination audit. Live Firebase end-to-end testing has not been performed.
