Asha Mini Shallow V32 Dynamic QR Fix

Fixes:
- Dynamic QR is now generated inside the app using QRCode.js canvas.
- QR fallback image is available if QR library fails.
- Dynamic QR amount uses due amount when due exists, otherwise total amount.
- Static QR still works if selected and uploaded.
- If static QR is selected but no image exists, app automatically switches to dynamic QR.
- Share bill waits for QR render before capturing bill image.


V33 fixes:
- WhatsApp number now auto adds country code for 10-digit phones.
- Chat header buttons enlarged and made more touch-friendly.
- Reminder+Bill button calls native share after rendering latest bill.
- Added new bill template: Phone View Compact.
- Added new print mode: Phone View Image.
- Compact bill combines status/payment/received to save space.


V34:
- Premium chat header/buttons
- Specific bill Reminder+Bill shares the selected bill
- Phone View Compact bill template + phoneview print mode
- More menu upgraded to quick action sheet
- WhatsApp fallback improved with country code handling


V35:
- Ultra premium customer list
- Better chat summary and quick actions
- Direct Pay / Settle modal
- Mini compact bill template
- Better WhatsApp country code handling
- Pay page auto-fill from chat


V36:
- Chat buttons fixed (View/Pay/Reminder+Bill/Call/WhatsApp/More)
- WhatsApp auto country code handling
- Better chat UI and quick summary
- Direct Pay / Settle modal
- Better customer list info
- Compact bill layout for phone view / mini templates


V37:
- Better reminder + bill sharing
- Better WhatsApp reminder note
- Compact / mini / phone bill design upgraded
- Rate per বিঘা and rate per কাঠা in settings
- App font and bill font settings
- Improved land wording on bills


V38 Research Ultra:
- Smart dashboard with today collection, village-wise due, top due customers.
- Reminder template setting.
- Default bill note setting.
- Rate per বিঘা / কাঠা / ডেসিমেল settings.
- App font and bill font settings.
- Compact bill meta show/hide.
- Due list CSV export.
- Today collection CSV export.
- Duplicate phone cleanup.
- Reminder + Bill uses compact/mini bill automatically for sharing.
- Improved compact bill wording and land amount line.
- Better WhatsApp/SMS reminder text with owner thank-you line.


V39 Bill Calculation Fix:
- Fixed disturbed calculation from V38.
- Rate is now based on selected land unit:
  বিঘা = land × rate/bigha
  কাঠা = land × rate/katha
  ডেসিমেল = land × rate/decimal
- Customer due no longer double-counts previous due.
- Bill summary restored:
  আগের বাকি, বর্তমান বিল, মোট টাকা, মোট জমা, মোট বাকি.
- Direct payment now records on latest bill to avoid double-counting old statements.
- All bill modes use stable V39 bill layout.
- Reminder + Bill uses stable compact bill.


V40 iOS Calculator + Icons:
- New custom iOS-like PWA app icons generated.
- Tab bar, quick actions and chat buttons polished with iOS-style rounded icons.
- Calculator redesigned like iOS scientific calculator.
- Calculator supports sin, cos, tan, log, ln, sqrt, powers, factorial, memory, DEG/RAD, copy result.
- No third-party trademark icons copied; icons are custom CSS/PWA designs.


V41 Premium Settings:
- Settings page redesigned in iOS/Material premium list style.
- Company profile, payment setup, billing configuration, reminder, appearance and cloud tools separated.
- Existing settings logic preserved: company, owner, contact, address, UPI, QR upload/remove, rates, fonts, template, print mode, cloud sync.
- Compact bill meta toggle added as iOS-style switch.


V42:
- Billing mode now visually changes bill design.
- Customer detail/chat screen updated with premium action bar and working buttons.
- Calculator added as separate bottom tab and home quick action.
- Login remember checkbox added using Firebase LOCAL persistence + saved email.
- Rate line shows bigha rate note when unit is katha/decimal.
- Indian rupee logic preserved.


V43 Responsive Icons Users:
- Bottom navigation rebuilt to remove duplicate/misaligned icons.
- Mobile bottom nav is now horizontally scrollable when all tabs do not fit.
- Calculator page display fixed with black background and white result text.
- Calculator kept as a separate tab.
- User detail/chat buttons re-bound and fixed.
- Customer list click/tap behavior improved.
- Phone/tablet/web responsive layout improved.
