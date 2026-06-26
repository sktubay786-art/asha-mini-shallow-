Asha Mini Shallow V32 Dynamic QR Fix

Fixes:
- Dynamic QR is now generated inside the app using QRCode.js canvas.
- QR fallback image is available if QR library fails.
- Dynamic QR amount uses due amount when due exists, otherwise total amount.
- Static QR still works if selected and uploaded.
- If static QR is selected but no image exists, app automatically switches to dynamic QR.
- Share bill waits for QR render before capturing bill image.
