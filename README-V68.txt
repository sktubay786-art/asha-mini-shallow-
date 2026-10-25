ASHA BILLING V68 — RATE FIX + PREMIUM iOS DASHBOARD

WHAT CHANGED
- Corrected West Bengal land conversion used by the app: 1 bigha = 20 katha and approximately 33 decimal.
- Bill image preview and Reminder + Bill now derive the land quantity and charge using the saved bill's rate unit. The image's current bill, total and due summary are kept consistent with the displayed rate.
- The rate line uses matching conversion factors: per-katha rate × 20; per-decimal rate × 33.
- Existing saved Settings rates are preserved. The default decimal rate fallback is aligned with 2200 / 33 (about 66.67); review any custom saved rate before issuing bills.
- Dashboard redesigned with a compact overview, polished summary cards, custom SVG icons, premium quick actions, cleaner billing shortcut cards and iOS-inspired bottom navigation.
- Updated service-worker cache and app asset versions to V68.
- Existing customer, payment, Firebase, QR, reminder and bill-mode workflows are retained.

DEPLOY
1. Back up your current GitHub repository / hosting files first.
2. Upload all files in this folder together; do not mix V67 and V68 assets.
3. Deploy / commit the update.
4. Close the installed PWA and reopen the site. If the old interface remains, clear site data/cache and reopen.
5. Test login, one new bill per land unit, an existing customer's 3-dot > Bill + Reminder, image download/share, payment/settlement, print and cloud sync before using it for live billing.

RATE NOTE
The app interprets the rate according to the bill's Rate Unit. For example, 34 katha at ₹2,200 per katha is ₹74,800; the equivalent per-bigha rate is ₹44,000 (20 katha per bigha). If ₹2,200 was intended as the rate per bigha instead, select/enter the rate on a per-bigha basis rather than per katha. Decimal conversion uses the common West Bengal approximation of 33 decimal per bigha; local/custom land standards may vary.

VALIDATION
- JavaScript syntax checks: app.js, upgrade.js and sw.js.
- manifest.json parses successfully.
- Runtime diagnostic available in browser console: ashaAuditV68().
- A live Firebase account was not used for end-to-end testing; verify your own account and bill scenarios after deployment.
