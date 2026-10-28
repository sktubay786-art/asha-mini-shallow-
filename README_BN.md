# ASHA Billing V95 — VS Code Setup

## চালানোর নিয়ম
1. ZIP extract করে ফোল্ডারটি VS Code-এ খুলুন।
2. Node.js LTS ইনস্টল থাকতে হবে।
3. VS Code Terminal খুলে চালান: `npm install`
4. `.env` ফাইলে আপনার Firebase Web App configuration রাখা আছে। অন্য Firebase project ব্যবহার করলে `.env.example` দেখে `.env` আপডেট করুন।
5. চালান: `npm run dev`
6. Terminal-এ দেখানো local URL (সাধারণত `http://localhost:5173`) ব্রাউজারে খুলুন।
7. production build পরীক্ষা করতে: `npm run build` — তৈরি ফাইল `dist/` ফোল্ডারে থাকবে।

## গুরুত্বপূর্ণ নিরাপত্তা কথা
- `.env` Git-এ commit না করার জন্য `.gitignore`-এ রাখা হয়েছে। `public/config.js` প্রতিবার dev/build শুরুতে `.env` থেকে তৈরি হয় এবং সেটিও Git-এ ignore করা।
- **Firebase browser API key-কে `.env`-এ রাখলেই browser থেকে গোপন থাকে না**—চালু app-কে Firebase-এ connect করতে key browser-এ পাঠাতেই হয়। Firebase Web API key public identifier-এর মতো; নিরাপত্তা নিশ্চিত করতে Google Cloud Console-এ API/application restrictions এবং Firebase Authentication/Firestore Security Rules ঠিক রাখতে হবে।
- `firestore.rules`-এ আগের owner UID এবং `ashaMiniShallow/ekramul-main` document scope অক্ষত রাখা হয়েছে। Firebase Console-এ deploy করা rules-ও মিলিয়ে নেবেন।
- `.env`-এর API key GitHub-এ বা public repo-তে দেবেন না। কোনো অস্বাভাবিক billing/API usage দেখলে Google Cloud Console-এ key restrictions ও usage পরীক্ষা করুন।

## V95 পরিবর্তন
- Firebase config hard-coded `app.js` থেকে সরিয়ে local `.env` workflow করা হয়েছে।
- Dashboard-এর metric/action cards mobile ও narrow screen-এ overflow/অস্বাভাবিক সংকোচন কমাতে responsive layout refresh করা হয়েছে।
- Pay page-এ বড় generic heading সরল করে `Receive Payment` করা হয়েছে; payment, settlement, receipt-এর controls রাখা হয়েছে।
- পুরোনো app features, Firebase document path, owner UID, bill/customer logic, icons, PWA files এবং `firestore.rules` রাখা হয়েছে।
