ASHA Billing V75 — Whole-App Rate Consistency + Clean UI

Land conversion standard: 1 bigha = 20 katha = 40 decimal.
The saved Settings rate per bigha is the canonical rate. Unit rates are derived as:
- per katha = rate per bigha / 20
- per decimal = rate per bigha / 40
Bill amount = entered land quantity × rate for that selected unit.
Example for ₹2,200/bigha: 1 bigha = ₹2,200; 10 katha = ₹1,100; 10 decimal = ₹550.

UI: version/cache bumped to V75; compacted nonessential helper copy while preserving functional controls.

Deploy: back up the repository, replace the app files with these files, commit and deploy. Reopen the PWA; clear site cache if old assets remain.

Validation performed: JavaScript syntax, manifest JSON, ZIP integrity and conversion examples. Live Firebase end-to-end testing has not been performed. Test a new bill, bill+reminder, save, payments and ledger before using for real transactions. Historical saved bills are not bulk-recalculated.
