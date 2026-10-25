ASHA Billing V76 — iOS Rate + Customer Actions

FIXED RATE RULE
The Settings value “Rate per Bigha” is the single source of truth. Unit rates are fixed and derived automatically:
- 1 bigha = 20 katha = 40 decimal
- per katha = per-bigha rate / 20
- per decimal = per-bigha rate / 40
- new bill amount = selected land quantity × fixed rate for that unit
The bill-rate field is now read-only and updates when the land unit changes. Converted Settings fields are read-only. Existing saved historical bills are not bulk-recalculated.

CUSTOMER UI
Includes the existing customer ledger, payments, settlement/adjustment, edit profile, new bill, bill reminder, WhatsApp reminder, private chat/notes, call, and delete actions with a refined iOS-style glass/action sheet and line icons. Customer detail is refreshed after profile updates.

DEPLOY
1. Back up your existing repository and Firebase data.
2. Replace the deployed app files with the files at the ZIP root.
3. Commit and deploy.
4. Reopen the installed PWA and refresh/clear old site cache if an old build remains.

VALIDATION
JavaScript syntax, manifest JSON, ZIP integrity, and rate arithmetic have been checked. A real browser/Firebase end-to-end test has not been performed here. Test saving Settings, previewing/saving a new bill in all three units, payment/settlement, customer editing, reminders, and ledger before real transactions.
