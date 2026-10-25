ASHA BILLING V74 — CUSTOMER FUNCTIONS AUDIT

What changed
- Rebuilt the selected-customer three-dot menu as a responsive iOS-style action sheet.
- All customer actions are routed through customer-scoped handlers: New Bill, Edit User, Ledger & History, Receive Payment, Settle/Adjust, Bill + Reminder, Private Chat/Notes, WhatsApp Reminder, Call and Delete User.
- Edit User now preserves and edits profile fields including private/land note. Existing bills are not rewritten.
- Receive/settlement use validated amount forms, cannot exceed the live due, allocate against oldest bill balances first, and record carried-forward opening-balance reductions.
- Ledger displays each bill, payment entries and current outstanding balance without replacing the customer detail DOM.
- Customer-list and selected-user quick actions are routed to the same iOS sheet for Receive, Ledger, More and Settle.
- Improved keyboard Escape/backdrop close, focus restoration, safe-area spacing, reduced-motion support and responsive layout.
- Cache and manifest versions bumped to V74.

Validation
- JavaScript syntax, manifest JSON and ZIP integrity checked.
- Static source-level checks only; live Firebase login and real-device end-to-end testing have not been performed.
- Back up the current repository and test bill, payment, settlement, reminder, ledger, edit and delete flows with a test customer before production use.
