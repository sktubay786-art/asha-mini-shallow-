```javascript
const OWNER_UID = "FZIhTAr0JEMoHCeQd3kr2t8cJKk2";
const firebaseConfig = {
  apiKey: "AIzaSyCzC5aFnFbnsYBZ370MktK9XOrjwiLQk0E",
  authDomain: "asha-app-745be.firebaseapp.com",
  projectId: "asha-app-745be",
  storageBucket: "asha-app-745be.firebasestorage.app",
  messagingSenderId: "309162286021",
  appId: "1:309162286021:web:bc0d2a92a170c5f9c5c9ac",
  measurementId: "G-RRGVNEFGZQ"
};

let auth = null;
let db = null;
let DOC = null;

try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  DOC = db.collection("ashaMiniShallow").doc("ekramul-main");
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
} catch (e) {
  console.error("Firebase initialization failed: ", e);
}

const KEY = "asha_v29_fresh_ios_pro";
const DEFAULT = {
  settings: {
    company: "আশা মিনি শ্যালো",
    owner: "SK EKRAMUL Haque",
    contact: "9564061920",
    address: "Raghunathpur, Chaklachipur, Ghatal, Paschim Medinipur, 721232",
    upi: "8710065540@axl",
    payee: "SK ENAMUL HAQUE",
    country: "+91",
    accent: "#075c39",
    rateBigha: 1600,
    rateKatha: 80,
    reminderTemplate: "প্রিয় {name},\nআশা মিনি শ্যালো এর তরফ থেকে আপনার মোট বকেয়া বিলটি পাঠানো হলো।\n\nবকেয়ার পরিমাণ: ৳ {due}\nঅনুগ্ৰহ করে নিচের দেওয়া UPI আইডি তে বিলটি পরিশোধ করুন।\nUPI ID: {upi}\n\nধন্যবাদ,\n{company}"
  },
  customers: []
};

let state = JSON.parse(localStorage.getItem(KEY)) || JSON.parse(JSON.stringify(DEFAULT));
let activeCustomerId = null;
let currentTab = "customers";

// Helper Functions
function money(val) {
  const num = parseFloat(val) || 0;
  return "৳" + num.toLocaleString("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function genId() {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function logEvent(text) {
  if (!state.logs) state.logs = [];
  state.logs.unshift({
    id: genId(),
    date: new Date().toISOString(),
    text: text
  });
  if (state.logs.length > 100) state.logs.pop();
  saveState();
  renderLogs();
}

function getDiagnostics() {
  let report = `Timestamp: ${new Date().toLocaleString()}\n`;
  report += `Local Customers Count: ${state.customers?.length || 0}\n`;
  report += `Firebase Auth Active: ${auth?.currentUser ? "Yes (" + auth.currentUser.uid + ")" : "No"}\n`;
  report += `Storage Key: ${KEY}\n`;
  return report;
}

function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
  pushCloud();
}

// Push to Cloud with Sync Badge Indicator
async function pushCloud() {
  const syncBtn = document.getElementById("syncStatusBtn");
  if (!auth || !db || !DOC) {
    if (syncBtn) syncBtn.innerHTML = `<span class="status-indicator offline"></span> Off-Cloud`;
    return;
  }

  const user = auth.currentUser;
  if (!user || user.uid !== OWNER_UID) {
    if (syncBtn) syncBtn.innerHTML = `<span class="status-indicator offline"></span> Auth Needed`;
    return;
  }

  try {
    if (syncBtn) syncBtn.innerHTML = `<span class="status-indicator loading"></span> Syncing...`;
    
    // Sanitize state to avoid Firestore undefined key issues
    const sanitized = JSON.parse(JSON.stringify(state));
    if (!sanitized.settings.reminderTemplate) {
      sanitized.settings.reminderTemplate = DEFAULT.settings.reminderTemplate;
    }

    await DOC.set(sanitized);
    if (syncBtn) {
      syncBtn.innerHTML = `<span class="status-indicator online"></span> Cloud Safe`;
    }
  } catch (error) {
    console.error("Firestore push failed: ", error);
    if (syncBtn) {
      syncBtn.innerHTML = `<span class="status-indicator offline"></span> Local Mode`;
    }
    const docLog = document.getElementById("doctorLog");
    if (docLog) {
      docLog.textContent += `\n[Error at ${new Date().toLocaleTimeString()}]: ${error.message}`;
    }
  }
}

// Pull State from Cloud on Load
async function pullCloud() {
  if (!auth || !auth.currentUser || !DOC) return;
  try {
    const snap = await DOC.get();
    if (snap.exists) {
      const cloudData = snap.data();
      if (cloudData && Array.isArray(cloudData.customers)) {
        state = cloudData;
        localStorage.setItem(KEY, JSON.stringify(state));
        renderApp();
        const docLog = document.getElementById("doctorLog");
        if (docLog) docLog.textContent = `[${new Date().toLocaleTimeString()}]: ক্লাউড ডাটা সফলভাবে রিলোড করা হয়েছে।`;
      }
    }
  } catch (e) {
    console.error("Failed to pull from Firestore: ", e);
  }
}

// Calculations
function customerDue(c) {
  let billed = parseFloat(c.openingDue) || 0;
  (c.bills || []).forEach((b) => {
    billed += parseFloat(b.allTotal) || 0;
  });
  
  let paid = 0;
  (c.payments || []).forEach((p) => {
    paid += parseFloat(p.amount) || 0;
  });
  
  return billed - paid;
}

function billPaid(b) {
  let paid = 0;
  (b.payments || []).forEach((p) => {
    paid += parseFloat(p.amount) || 0;
  });
  return paid;
}

function billDue(b) {
  return (parseFloat(b.allTotal) || 0) - billPaid(b);
}

// Render Dashboard Lists
function renderCustomerList() {
  const list = document.getElementById("customerList");
  const query = document.getElementById("searchCust").value.toLowerCase().trim();
  list.innerHTML = "";

  const filtered = state.customers.filter((c) => {
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.phone || "").toLowerCase().includes(query) ||
      (c.village || "").toLowerCase().includes(query)
    );
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">কোনো গ্রাহক পাওয়া যায়নি।</div>`;
    return;
  }

  filtered.forEach((c) => {
    const due = customerDue(c);
    const hasNote = c.note && c.note.trim().length > 0;
    
    const card = document.createElement("div");
    card.className = "customer-card animate-fade";
    card.onclick = () => openCustomerChat(c.id);

    card.innerHTML = `
      <div class="card-left">
        <div class="avatar-circle">${(c.name || "গ").charAt(0)}</div>
        <div class="card-details">
          <h4>${esc(c.name)}</h4>
          <span class="card-sub">📱 ${esc(c.phone || "নম্বর নেই")} | 📍 ${esc(c.village || "গ্রাম নেই")}</span>
          ${hasNote ? `<span class="card-note-badge">🌾 ${esc(c.note)}</span>` : ""}
        </div>
      </div>
      <div class="card-right">
        <span class="due-tag ${due > 0 ? "due" : "clear"}">${due > 0 ? money(due) : "পরিশোধ"}</span>
        <span class="arrow-icon">➔</span>
      </div>
    `;
    list.appendChild(card);
  });
}

function renderLogs() {
  const container = document.getElementById("globalLogs");
  const docLog = document.getElementById("doctorLog");
  if (docLog && docLog.textContent === "কোনো ডায়াগনস্টিক তথ্য নেই।") {
    docLog.textContent = getDiagnostics();
  }

  if (!container) return;
  container.innerHTML = "";

  const logs = state.logs || [];
  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-state">কাজের কোনো ইতিহাস নেই।</div>`;
    return;
  }

  logs.forEach((l) => {
    const item = document.createElement("div");
    item.className = "log-row";
    item.innerHTML = `
      <div class="log-text">
        <strong>${esc(l.text)}</strong>
        <span class="log-time">${new Date(l.date).toLocaleString("bn-BD")}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderApp() {
  if (!state.settings) state.settings = JSON.parse(JSON.stringify(DEFAULT.settings));
  if (!state.customers) state.customers = [];

  let totalDue = 0;
  state.customers.forEach((c) => {
    totalDue += customerDue(c);
  });

  document.getElementById("statTotalDue").textContent = money(totalDue);
  document.getElementById("statTotalCust").textContent = state.customers.length + " জন";

  renderCustomerList();
  renderLogs();
}

// Chat Ledger Details View
function openCustomerChat(id) {
  activeCustomerId = id;
  const c = state.customers.find((cust) => cust.id === id);
  if (!c) return;

  document.getElementById("chatCustName").textContent = c.name;
  document.getElementById("chatCustSub").textContent = `📱 ${c.phone || "N/A"} • 📍 ${c.village || "N/A"}`;
  
  // Note/Land details implementation
  const landNotePill = document.getElementById("chatCustLandNote");
  if (c.note && c.note.trim() !== "") {
    landNotePill.textContent = `🌾 জমির তথ্য ও নোট: ${c.note}`;
    landNotePill.classList.remove("hidden");
  } else {
    landNotePill.textContent = "";
    landNotePill.classList.add("hidden");
  }

  updateChatSummary(c);
  renderChatMessages(c);

  document.getElementById("chatScreen").classList.remove("hidden");
}

function updateChatSummary(c) {
  let totalBilled = parseFloat(c.openingDue) || 0;
  (c.bills || []).forEach((b) => {
    totalBilled += parseFloat(b.allTotal) || 0;
  });

  let totalPaid = 0;
  (c.payments || []).forEach((p) => {
    totalPaid += parseFloat(p.amount) || 0;
  });

  const totalDue = totalBilled - totalPaid;

  document.getElementById("chatTotalBilled").textContent = money(totalBilled);
  document.getElementById("chatTotalPaid").textContent = money(totalPaid);
  document.getElementById("chatTotalDue").textContent = money(totalDue);
}

function renderChatMessages(c) {
  const container = document.getElementById("chatMessages");
  container.innerHTML = "";
  let list = [];

  if (c.openingDue && parseFloat(c.openingDue) > 0) {
    list.push({
      type: "opening",
      date: c.dateCreated || new Date().toISOString(),
      amount: c.openingDue,
      html: `
        <div class="chat-bubble opening-bubble animate-fade">
          <div class="bubble-header">✨ প্রারম্ভিক বকেয়া (Opening Due)</div>
          <div class="bubble-body">
            <h3>${money(c.openingDue)}</h3>
          </div>
        </div>
      `
    });
  }

  (c.bills || []).forEach((b) => {
    const isPaid = billDue(b) <= 0;
    list.push({
      type: "bill",
      date: b.date || new Date().toISOString(),
      amount: b.allTotal,
      html: `
        <div class="chat-bubble bill-bubble animate-fade">
          <div class="bubble-header">
            <span>📝 পানির বিল (বিল আইডি: ${b.id.substring(3, 8)})</span>
            <span class="bubble-badge ${isPaid ? "paid" : "due"}">${isPaid ? "পরিশোধ" : "বকেয়া"}</span>
          </div>
          <div class="bubble-body">
            <div class="bill-stats">
              <div>জমির মাপ: <b>${b.bigha || 0} বিঘা ${b.katha || 0} কাঠা</b></div>
              <div>বিঘা প্রতি রেট: <b>৳${b.rateBigha || 0}</b> | কাঠা প্রতি রেট: <b>৳${b.rateKatha || 0}</b></div>
            </div>
            <div class="bill-total-row">
              <span>মোট বিল: <b>${money(b.allTotal)}</b></span>
              <span>পরিশোধিত: <b class="text-ok">${money(billPaid(b))}</b></span>
            </div>
            <div class="bill-due-row">
              <span>অবशिष्ट বকেয়া: <b class="text-bad">${money(billDue(b))}</b></span>
            </div>
          </div>
          <div class="bubble-actions">
            <button onclick="viewSingleBill('${b.id}')">📄 ভিউ বিল</button>
            <button onclick="openBillPayment('${b.id}')">💵 জমা নিন</button>
            <button class="primary" onclick="shareCustomerBill('${c.id}', '${b.id}')">📲 বিল ও রিমাইন্ডার</button>
          </div>
        </div>
      `
    });
  });

  (c.payments || []).forEach((p) => {
    const isSettle = p.mode === "Settle" || p.mode === "রফা" || String(p.mode).includes("Settle");
    list.push({
      type: "payment",
      date: p.date || new Date().toISOString(),
      amount: p.amount,
      html: `
        <div class="chat-bubble payment-bubble ${isSettle ? "settle-bubble" : ""} animate-fade">
          <div class="bubble-header">
            <span>${isSettle ? "🤝 রফা মীমাংসা (Settlement)" : "💵 টাকা জমা (Payment)"}</span>
          </div>
          <div class="bubble-body">
            <h3>${money(p.amount)}</h3>
            <p class="payment-meta">তারিখ: ${p.date} ${p.receivedIn ? `| পেমেন্ট মাধ্যম: ${p.receivedIn}` : ""}</p>
            ${p.note ? `<p class="payment-note">📝 নোট: ${esc(p.note)}</p>` : ""}
          </div>
          <div class="entry-tools">
            <button class="mini-btn" onclick="editPaymentEntry('${p.id}')">✏️ এডিট</button>
            <button class="mini-btn danger" onclick="undoPaymentEntry('${p.id}')">⌫ ডিলিট</button>
          </div>
        </div>
      `
    });
  });

  list.sort((a, b) => new Date(a.date) - new Date(b.date));
  list.forEach((item) => {
    container.innerHTML += item.html;
  });
  container.scrollTop = container.scrollHeight;
}

// -------------------------------------------------------------
// Rate Conversion Core Formula Linkage (বাগ ৫ এর সঠিক সমাধান)
// -------------------------------------------------------------
function setupRateSync(rateBighaId, rateKathaId) {
  setTimeout(() => {
    const bighaInput = document.getElementById(rateBighaId);
    const kathaInput = document.getElementById(rateKathaId);
    
    if (bighaInput && kathaInput) {
      // When Bigha Rate is changed manually, automatically update Katha Rate (1 Bigha = 20 Katha)
      bighaInput.addEventListener("input", () => {
        const bValue = parseFloat(bighaInput.value) || 0;
        kathaInput.value = (bValue / 20).toFixed(2);
        calculateManualBillTotal();
      });

      // When Katha Rate is changed manually, automatically update Bigha Rate (Katha * 20)
      kathaInput.addEventListener("input", () => {
        const kValue = parseFloat(kathaInput.value) || 0;
        bighaInput.value = (kValue * 20).toFixed(2);
        calculateManualBillTotal();
      });
    }
  }, 100);
}

function calculateManualBillTotal() {
  const bigha = parseFloat(document.getElementById("billBigha").value) || 0;
  const katha = parseFloat(document.getElementById("billKatha").value) || 0;
  const rateBigha = parseFloat(document.getElementById("billRateBigha").value) || 0;
  const rateKatha = parseFloat(document.getElementById("billRateKatha").value) || 0;
  
  // Total bill is calculated 100% using these custom customized form input rates
  const total = (bigha * rateBigha) + (katha * rateKatha);
  const totalField = document.getElementById("billTotal");
  if (totalField) {
    totalField.value = total.toFixed(2);
  }
}

// Create Water Bill Form Builder
document.getElementById("chatNewBill").addEventListener("click", () => {
  const c = state.customers.find((cust) => cust.id === activeCustomerId);
  if (!c) return;

  const title = document.getElementById("actionTitle");
  const body = document.getElementById("actionBody");
  title.textContent = "নতুন পানির বিল তৈরি";
  
  body.innerHTML = `
    <div class="form-group animate-slide-up">
      <label>তারিখ *</label>
      <input id="billDate" type="date" value="${new Date().toISOString().substring(0, 10)}">
      
      <div class="two">
        <div>
          <label>জমির পরিমাণ (বিঘা) *</label>
          <input id="billBigha" type="number" step="any" value="0">
        </div>
        <div>
          <label>জমির পরিমাণ (কাঠা) *</label>
          <input id="billKatha" type="number" step="any" value="0">
        </div>
      </div>
      
      <div class="two mt-2">
        <div>
          <label>বিঘা প্রতি রেট (Manual Rate)</label>
          <input id="billRateBigha" type="number" step="any" value="${state.settings.rateBigha || 1600}">
        </div>
        <div>
          <label>কাঠা প্রতি রেট (Manual Rate)</label>
          <input id="billRateKatha" type="number" step="any" value="${state.settings.rateKatha || 80}">
        </div>
      </div>
      
      <label class="mt-4">মোট বিলের পরিমাণ (স্বয়ংক্রিয় হিসাব)</label>
      <input id="billTotal" type="number" step="any" readonly style="background-color: #f1f5f9; font-weight: 800; font-size: 1.15rem; color: #075c39;">
    </div>
  `;

  // Bind live sync rate conversion formula
  setupRateSync("billRateBigha", "billRateKatha");

  // Re-calculate total dynamically on quantity edits
  const inputs = ["billBigha", "billKatha", "billRateBigha", "billRateKatha"];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calculateManualBillTotal);
  });

  calculateManualBillTotal();

  document.getElementById("actionDelete").classList.add("hidden");

  const saveBtn = document.getElementById("actionSave");
  saveBtn.onclick = () => {
    const bDate = document.getElementById("billDate").value;
    const bBigha = parseFloat(document.getElementById("billBigha").value) || 0;
    const bKatha = parseFloat(document.getElementById("billKatha").value) || 0;
    const rBigha = parseFloat(document.getElementById("billRateBigha").value) || 0;
    const rKatha = parseFloat(document.getElementById("billRateKatha").value) || 0;
    const total = parseFloat(document.getElementById("billTotal").value) || 0;

    if (bBigha <= 0 && bKatha <= 0) {
      alert("অনুগ্রহ করে জমির পরিমাণ (বিঘা অথবা কাঠা) সঠিকভাবে দিন।");
      return;
    }

    if (!c.bills) c.bills = [];
    c.bills.push({
      id: genId(),
      date: bDate,
      bigha: bBigha,
      katha: bKatha,
      rateBigha: rBigha,
      rateKatha: rKatha,
      allTotal: total,
      payments: []
    });

    logEvent(`${c.name} এর জন্য ${bBigha} বিঘা ${bKatha} কাঠা জমিতে ${money(total)} টাকার বিল তৈরি করা হয়েছে।`);
    closeActionModal();
    openCustomerChat(c.id);
  };

  document.getElementById("actionModal").classList.remove("hidden");
});

// Take Payment Form
document.getElementById("chatDirectPay").addEventListener("click", () => {
  const c = state.customers.find((cust) => cust.id === activeCustomerId);
  if (!c) return;

  const title = document.getElementById("actionTitle");
  const body = document.getElementById("actionBody");
  title.textContent = "টাকা জমা নিন";

  body.innerHTML = `
    <div class="form-group animate-slide-up">
      <label>তারিখ *</label>
      <input id="payDate" type="date" value="${new Date().toISOString().substring(0, 10)}">
      
      <label>জমার পরিমাণ (টাকা) *</label>
      <input id="payAmount" type="number" placeholder="৳ কত জমা করলেন">
      
      <label>পেমেন্ট মাধ্যম (Received In)</label>
      <select id="payMedia">
        <option value="Cash">Cash (নগদ টাকা)</option>
        <option value="UPI / Bank">UPI / Bank (অনলাইন)</option>
        <option value="Check">Check (চেক)</option>
      </select>
      
      <label>অতিরিক্ত নোট / বিবরণ</label>
      <textarea id="payNote" placeholder="যেমন: কোনো বিবরণ থাকলে লিখুন"></textarea>
    </div>
  `;

  document.getElementById("actionDelete").classList.add("hidden");

  const saveBtn = document.getElementById("actionSave");
  saveBtn.onclick = () => {
    const pDate = document.getElementById("payDate").value;
    const pAmt = parseFloat(document.getElementById("payAmount").value) || 0;
    const pMedia = document.getElementById("payMedia").value;
    const pNote = document.getElementById("payNote").value;

    if (pAmt <= 0) {
      alert("দয়া করে সঠিক জমার পরিমাণ দিন।");
      return;
    }

    if (!c.payments) c.payments = [];
    c.payments.push({
      id: genId(),
      date: pDate,
      amount: pAmt,
      mode: "Payment",
      receivedIn: pMedia,
      note: pNote
    });

    logEvent(`${c.name} এর থেকে ${money(pAmt)} টাকা পেমেন্ট হিসেবে জমা নেওয়া হয়েছে (${pMedia})।`);
    closeActionModal();
    openCustomerChat(c.id);
  };

  document.getElementById("actionModal").classList.remove("hidden");
});

// Settlement Dialog Settle Action
document.getElementById("chatSettle").addEventListener("click", () => {
  const c = state.customers.find((cust) => cust.id === activeCustomerId);
  if (!c) return;

  const title = document.getElementById("actionTitle");
  const body = document.getElementById("actionBody");
  title.textContent = "গ্রাহকের বকেয়া রফা মীমাংসা (Settle)";

  const currentDue = customerDue(c);

  body.innerHTML = `
    <div class="form-group an
