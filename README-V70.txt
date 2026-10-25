ASHA BILLING V70 — SETTINGS RATE + USER ACTIONS

Changes:
- New bill current charge is calculated as selected land amount × rate per the selected unit.
- Settings rates are the source for the default Rate field: rateBigha, rateKatha, rateDecimal.
- Each bill stores rateUnit so the invoice/reminder renderer can show the proper unit rate and equivalent amount.
- The Users tab now exposes Bill, Ledger, Receive, and More actions on each user card; More opens the full user action sheet.
- Added compact iOS-style user action buttons with touch animation.
- Updated service-worker cache key and app version to V70.

Important:
- Before deployment, check Settings and verify the configured rates per বিঘা, কাঠা, and ডেসিমেল. The app uses the saved Settings values; if they are inconsistent, it will faithfully use the rate for the selected unit.
- Example: 38 কাঠা at ₹2,200/কাঠা = ₹83,600. Equivalent rate is ₹44,000/বিঘা when 20 কাঠা = 1 বিঘা.
- Existing historical bills are not rewritten in storage. New bills use the V70 calculation.
- Test New Bill, Save, Reminder + Bill, payment, ledger, cloud sync, and settings after deploying.
