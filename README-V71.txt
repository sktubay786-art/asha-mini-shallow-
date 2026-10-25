ASHA BILLING V71 — CORRECT LAND RATE CONVERSION

Conversion standard used throughout this build:
- 1 Bigha = 20 Katha = 40 Decimal
- Bigha rate is the master rate in Settings.
- Katha rate = Bigha rate / 20
- Decimal rate = Bigha rate / 40

Example when Settings Bigha rate = ₹2,200:
- 1 Bigha = ₹2,200
- 1 Katha = ₹110; 10 Katha = ₹1,100
- 1 Decimal = ₹55; 10 Decimal = ₹550

The bill rate input follows the selected land unit. New bills calculate amount × rate in that same unit. Invoice totals and reminder bill views use the same unit/rate pair. Settings shows derived Katha and Decimal rates when the Bigha rate is changed.

Deployment:
1. Extract this ZIP.
2. Replace the corresponding files in the existing GitHub Pages repository with these files.
3. Commit and wait for deployment.
4. Close/reopen the installed PWA; if needed, clear the site cache once.
5. Verify Settings rate, create a test bill for 1 Bigha, 10 Katha, and 10 Decimal, then verify normal bill and Bill + Reminder.

Important: Existing historical bills are not silently rewritten because that could alter accounting records. Create test bills first and verify Firebase sync before using for real collections. Live Firebase end-to-end testing has not been performed in this environment.
