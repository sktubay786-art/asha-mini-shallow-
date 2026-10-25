ASHA Billing V73 — Premium User Center

What changed
- Redesigned Users tab into responsive iOS-inspired customer cards with search, due status, latest bill information, and direct Bill / Ledger / Receive / More actions.
- Redesigned selected-user detail view with a customer account overview, live due, total billed, collected, bill count, optional customer note, and quick actions for New Bill, Receive, Settle, Full Ledger, Bill + Reminder, and More.
- Improved mobile and desktop layouts, safe-area padding, touch feedback, and reduced-motion behavior.
- Existing billing, rate conversion, customer storage, Firebase, bill rendering, and payment functions are retained; this is a UI-layer upgrade.
- Cache version bumped to V73.

Deploy
1. Extract the ZIP.
2. Replace the corresponding files in the existing GitHub Pages repository.
3. Commit and wait for deployment.
4. Close/reopen the installed PWA. If needed, clear the site cache.
5. Test Users search, opening a customer, New Bill, Receive, Settle, Full Ledger, Bill + Reminder, and cloud save on a test record.

Validation performed: JavaScript syntax checks, manifest JSON validation, ZIP integrity, and static checks for required functions/IDs. Live Firebase end-to-end testing was not performed. Keep a backup of the current repository before replacing production files.
