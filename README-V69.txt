ASHA BILLING V69 — iOS MOTION + USER CENTER

CHANGES
- Removed the entire Home screen “Billing shortcuts / Quick guide” flashcard section requested in the screenshot.
- Kept the dashboard summary and primary business actions.
- Added subtle iOS-inspired motion to bottom navigation icons and dashboard action icons, including active-state pop, press feedback and reduced-motion support.
- Redesigned the existing customer three-dot action sheet as a glassy iOS-style bottom sheet with custom SVG action icons, clearer labels, improved spacing and touch targets. Existing action button IDs and handlers are retained.
- Updated app asset versions and service-worker cache to V69.
- Kept existing bill, payment, reminder, Firebase, customer and rate logic intact.

DEPLOY
1. Back up your current GitHub repository first.
2. Upload all files from this ZIP together; do not mix versions.
3. Commit/deploy, close the installed PWA, then reopen. Clear site cache if the old screen persists.
4. Test the Users three-dot menu actions: New Bill, Edit User, Ledger, Receive, Settle, Bill + Reminder, Normal Reminder, Call and Delete. Test bill/QR/share and Firebase sync before live use.

VALIDATION
- Run node --check app.js, node --check upgrade.js, node --check sw.js.
- Validate manifest JSON.
- Runtime diagnostic: ashaAuditV69() in browser console.
- Live Firebase account testing was not performed.
