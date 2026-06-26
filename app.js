const OWNER_UID="FZIhTAr0JEMoHCeQd3kr2t8cJKk2";
const firebaseConfig={apiKey:"AIzaSyCzC5aFnFbnsYBZ370MktK9XOrjwiLQk0E",authDomain:"asha-app-745be.firebaseapp.com",projectId:"asha-app-745be",storageBucket:"asha-app-745be.firebasestorage.app",messagingSenderId:"309162286021",appId:"1:309162286021:web:bc0d2a92a170c5f9c5c9ac",measurementId:"G-RRGVNEFGZQ"};
let auth=null,db=null,DOC=null;
try{firebase.initializeApp(firebaseConfig);auth=firebase.auth();db=firebase.firestore();DOC=db.collection("ashaMiniShallow").doc("ekramul-main");auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)}catch(e){console.warn(e)}
const KEY="asha_v29_fresh_ios_pro";
const DEFAULT={settings:{company:"আশা মিনি শ্যালো",owner:"SK EKRAMUL Haque",contact:"9564061920",address:"Raghunathpur, Chaklachipur, Ghatal, Paschim Medinipur, 721232",upi:"8710065540@axl",payee:"SK ENAMUL HAQUE",country:"+91",accent:"#075c39",print:"thermal80",template:"premium"},customers:[],bills:[]};
let state=loadState(),currentBill=null,activeCustomer=null,deferredPrompt=null,calcVal="";
function $(id){return document.getElementById(id)}
function loadState(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(DEFAULT)}catch(e){return structuredClone(DEFAULT)}}
function saveState(sync=true){localStorage.setItem(KEY,JSON.stringify(state));renderAll();if(sync&&auth?.currentUser?.uid===OWNER_UID)pushCloud(false)}
function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function initials(n){return String(n||"?").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()}
function phone(p){return String(p||"").replace(/\D/g,"")}
function normalPhone(raw){raw=String(raw||"").trim();if(!raw)return "";let d=raw.replace(/\D/g,"");if(raw.startsWith("+"))return raw;if(d.length===10)return (state.settings.country||"+91")+" "+d;if(d.length>10&&d.startsWith("91"))return "+91 "+d.slice(-10);return (state.settings.country||"+91")+" "+d}
function landToBigha(v,u){v=+v||0;return u==="bigha"?v:u==="katha"?v/20:v/40}
function billPaid(b){return (b.payments||[]).reduce((s,p)=>s+(+p.amount||0),0)}
function billDue(b){return Math.max((+b.allTotal||0)-billPaid(b),0)}
function billStatus(b){return billDue(b)<=0?"Paid":billPaid(b)>0?"Partial":"Due"}
function customerDue(id){let c=state.customers.find(x=>x.id===id);return (+c?.openingDue||0)+state.bills.filter(b=>b.customerId===id).reduce((s,b)=>s+billDue(b),0)}
function nextBillNo(){return "ASHA-"+new Date().getFullYear()+"-"+String(state.bills.length+1).padStart(4,"0")}
function applyTheme(){document.documentElement.style.setProperty("--accent",state.settings.accent||"#075c39");$("companyTitle").textContent=state.settings.company;$("companySub").textContent=state.settings.contact+" • "+state.settings.address}

function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".tabbar button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));if(id==="billPage")previewBill();renderAll(false)}
function renderAll(renderPreview=false){applyTheme();fillSelects();renderDash();renderCustomers();renderHistory();renderReports();renderLandCalc();if(renderPreview)previewBill()}
function fillSelects(){
  const custOpts='<option value="__new">+ New customer manually</option>'+state.customers.map(c=>`<option value="${c.id}">${esc(c.name)} - ${esc(c.phone)}</option>`).join("");
  $("billCustomer").innerHTML=custOpts;
  $("payBill").innerHTML=state.bills.map(b=>`<option value="${b.id}">${esc(b.billNo)} - ${esc(b.customerName)} - Due ${money(billDue(b))}</option>`).join("");
  $("setPrint").innerHTML=$("printMode").innerHTML;$("setTemplate").innerHTML=$("template").innerHTML;
  $("setPrint").value=state.settings.print;$("setTemplate").value=state.settings.template;
  let villages=[...new Set(state.customers.map(c=>c.village).filter(Boolean))];
  let vhtml='<option value="all">All villages</option>'+villages.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
  $("homeVillage").innerHTML=vhtml;$("reportVillage").innerHTML=vhtml;
  toggleManual();updatePayInfo();
}
function renderDash(){
  let month=$("homeMonth").value,vill=$("homeVillage").value||"all";
  let bills=state.bills.filter(b=>(!month||String(b.date).startsWith(month))&&(vill==="all"||b.village===vill));
  let total=bills.reduce((s,b)=>s+(+b.allTotal||0),0),paid=bills.reduce((s,b)=>s+billPaid(b),0),due=state.customers.reduce((s,c)=>s+customerDue(c.id),0);
  $("metrics").innerHTML=[
    ["🧾","Total Bill",money(total)],["✅","Collected",money(paid)],["⚠","Total Due",money(due)],["👥","Customers",state.customers.length]
  ].map(x=>`<div class="metric"><small>${x[0]} ${x[1]}</small><b>${x[2]}</b></div>`).join("");
}
function renderCustomers(){
  let q=$("customerSearch").value.toLowerCase();
  let rows=state.customers.filter(c=>(c.name+c.phone+c.village+c.address).toLowerCase().includes(q));
  $("customerList").innerHTML=rows.length?rows.map(c=>{let due=customerDue(c.id);return `<div class="customer-row" onclick="openChat('${c.id}')"><div class="avatar">${esc(initials(c.name))}</div><div class="cust-main"><div class="cust-name">${esc(c.name)}</div><div class="cust-sub">📞 ${esc(c.phone||"No phone")} • 📍 ${esc(c.village||"No village")}</div><div class="cust-sub">Tap for ledger, pay, call, reminder</div></div><span class="pill ${due>0?'due':'paid'}">${due>0?money(due):'Paid'}</span></div>`}).join(""):`<div class="card muted">No customer yet</div>`;
}
function openCustomer(id=""){let c=id?state.customers.find(x=>x.id===id):null;$("custId").value=c?.id||"";$("custName").value=c?.name||"";$("custPhone").value=(c?.phone||"").replace(/^\+?91\s*/,"");$("custVillage").value=c?.village||"";$("custAddress").value=c?.address||"";$("custOpening").value=c?.openingDue||0;$("customerModal").classList.remove("hidden")}
function closeCustomer(){$("customerModal").classList.add("hidden")}
function saveCustomer(){let id=$("custId").value||uid();let c={id,name:$("custName").value.trim(),phone:normalPhone($("custPhone").value),village:$("custVillage").value.trim(),address:$("custAddress").value.trim(),openingDue:+$("custOpening").value||0};if(!c.name)return alert("Name required");let i=state.customers.findIndex(x=>x.id===id);if(i>=0)state.customers[i]=c;else state.customers.push(c);closeCustomer();saveState()}
function toggleManual(){$("manualCustomer").style.display=$("billCustomer").value==="__new"?"block":"none"}
function makeBillFromForm(){
  let c=null;
  if($("billCustomer").value==="__new"){
    c={id:uid(),name:$("manualName").value.trim()||"New Customer",phone:normalPhone($("manualPhone").value),village:$("manualVillage").value.trim(),address:$("manualAddress").value.trim(),openingDue:0};
  }else c=state.customers.find(x=>x.id===$("billCustomer").value);
  if(!c)return null;
  let bigha=landToBigha($("land").value,$("landUnit").value),rate=+$("rate").value||0,current=bigha*rate,prev=state.customers.find(x=>x.id===c.id)?customerDue(c.id):0,paid=+$("paidNow").value||0;
  return {id:uid(),billNo:nextBillNo(),date:today(),customerId:c.id,customerName:c.name,phone:c.phone,address:c.address,village:c.village,season:$("season").value,landAmount:+$("land").value||0,unit:$("landUnit").value,bigha,rate,current,previousDue:prev,allTotal:current+prev,note:$("billNote").value,payments:paid>0?[{id:uid(),date:today(),amount:paid,mode:$("billPayMode").value,receivedIn:$("receivedIn").value,note:"Initial payment"}]:[]};
}
function saveBill(){let b=makeBillFromForm();if(!b)return alert("Select/add customer");if($("billCustomer").value==="__new"&&!state.customers.find(c=>c.id===b.customerId)){state.customers.push({id:b.customerId,name:b.customerName,phone:b.phone,village:b.village,address:b.address,openingDue:0})}state.bills.push(b);currentBill=b;renderInvoice(b);saveState();alert("Bill saved")}
function previewBill(){let b=makeBillFromForm();if(b){currentBill=b;renderInvoice(b)}}
function renderInvoice(b){
  let mode=$("printMode").value, html="";
  const one=cls=>invoiceHTML(b,cls);
  if(mode==="thermal80")html=one("thermal80");
  if(mode==="a4two"||mode==="a4half")html=`<div class="print-sheet a4p"><div class="slot a5top">${one("a5bill")}</div></div>`;
  if(mode==="a4four"||mode==="a4quarter")html=`<div class="print-sheet a4p"><div class="slot a6q1">${one("a6bill")}</div></div>`;
  if(mode==="a4side")html=`<div class="print-sheet a4p"><div class="slot side">${one("sidebill")}</div></div>`;
  if(mode==="a4land")html=`<div class="print-sheet a4l"><div class="slot land">${one("landbill")}</div></div>`;
  $("billPreview").innerHTML=html||one("thermal80");
}
function qrSrc(amount,billNo){let link=`upi://pay?pa=${encodeURIComponent(state.settings.upi)}&pn=${encodeURIComponent(state.settings.payee)}&am=${Number(amount||0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(billNo||"Asha Bill")}`;return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`}
function invoiceHTML(b,cls){
  let due=billDue(b),paid=billPaid(b),tpl=$("template").value||"premium";
  return `<div class="invoice ${cls} ${tpl}"><h3>${esc(state.settings.company)}</h3><div class="head-small">Owner: ${esc(state.settings.owner)}<br>Contact: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div><div class="line"></div><div class="item"><b>Bill No</b><b>${esc(b.billNo)}</b></div><div class="item"><span>Date</span><span>${esc(b.date)}</span></div><div class="item"><span>Name</span><b>${esc(b.customerName)}</b></div><div class="item"><span>Phone</span><span>${esc(b.phone)}</span></div><div class="item"><span>Village</span><span>${esc(b.village||"")}</span></div><div class="item"><span>Address</span><span>${esc(b.address||"")}</span></div><div class="line"></div><div class="item"><b>Season</b><b>${esc(b.season)}</b></div><div class="item"><span>Land</span><b>${b.landAmount} ${esc(b.unit)}</b></div><div class="item"><span>Converted</span><span>${b.bigha.toFixed(2)} বিঘা</span></div><div class="item"><span>Rate</span><b>${money(b.rate)}/বিঘা</b></div><div class="item"><span>Current Bill</span><b>${money(b.current)}</b></div><div class="item"><span>Previous Due</span><b>${money(b.previousDue)}</b></div><div class="item"><b>All Total</b><b>${money(b.allTotal)}</b></div><div class="item"><span>Paid / Adjusted</span><b>${money(paid)}</b></div><div class="item"><b>Due</b><b>${money(due)}</b></div><div class="item"><span>Status</span><b>${billStatus(b)}</b></div><div class="line"></div><div class="head-small">UPI: ${esc(state.settings.upi)} • Payee: ${esc(state.settings.payee)}</div><img class="qr" src="${qrSrc(due>0?due:b.allTotal,b.billNo)}"><div class="head-small"><b>Scan & Pay ${money(due>0?due:b.allTotal)}</b></div><div class="line"></div><div style="font-size:11px">Note: ${esc(b.note||"-")}</div><div style="text-align:right;font-size:11px;margin-top:8px">Signature: ${esc(state.settings.owner)}</div></div>`;
}
async function invoiceBlob(){let canvas=await html2canvas($("billPreview"),{scale:2,useCORS:true,backgroundColor:"#fff"});return await new Promise(r=>canvas.toBlob(r,"image/png"))}
async function shareBill(){if(!currentBill)return alert("Preview bill first");let blob=await invoiceBlob();let file=new File([blob],`${currentBill.billNo}.png`,{type:"image/png"});let text=reminderTextByBill(currentBill);if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text,title:"Asha Bill Reminder"})}else if(navigator.share){await navigator.share({text,title:"Asha Bill Reminder"});downloadBlob(blob,`${currentBill.billNo}.png`)}else{downloadBlob(blob,`${currentBill.billNo}.png`);alert("Bill image downloaded. Share manually on WhatsApp.")}}
function downloadBlob(blob,name){let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click()}
function reminderTextByBill(b){return `${state.settings.company}\nBill No: ${b.billNo}\nName: ${b.customerName}\nTotal: ${money(b.allTotal)}\nPaid/Adjusted: ${money(billPaid(b))}\nDue: ${money(billDue(b))}\nContact: ${state.settings.contact}\nUPI: ${state.settings.upi}`}
function waText(){if(!currentBill)return alert("Preview bill first");open("https://wa.me/"+phone(currentBill.phone)+"?text="+encodeURIComponent(reminderTextByBill(currentBill)),"_blank")}
async function downloadPDF(){if(!currentBill)return;let blob=await invoiceBlob(),img=URL.createObjectURL(blob);const {jsPDF}=window.jspdf;let pdf=new jsPDF({unit:"mm",format:"a4"});pdf.addImage(img,"PNG",8,8,190,0);pdf.save(currentBill.billNo+".pdf")}
function printBill(){document.body.classList.toggle("printThermal",$("printMode").value==="thermal80");window.print();setTimeout(()=>document.body.classList.remove("printThermal"),300)}

function updatePayInfo(){let b=state.bills.find(x=>x.id===$("payBill").value);$("payInfo").innerHTML=b?`<b>${esc(b.billNo)}</b> • ${esc(b.customerName)}<br>Total ${money(b.allTotal)} • Paid/Adjusted ${money(billPaid(b))} • Due <b>${money(billDue(b))}</b>`:"Select bill"}
function fillDue(){let b=state.bills.find(x=>x.id===$("payBill").value);if(b)$("payAmount").value=billDue(b)}
function quickMode(m){$("payMode").value=m;$("payIn").value=m}
function savePayment(settle=false){let b=state.bills.find(x=>x.id===$("payBill").value);if(!b)return alert("Select bill");let amt=+$("payAmount").value||0;if(amt<=0)return alert("Enter amount");(b.payments=b.payments||[]).push({id:uid(),date:today(),amount:amt,mode:settle?"Settlement":$("payMode").value,receivedIn:settle?"Settled":$("payIn").value,note:settle?"Settled/waived without cash":"Payment received"});saveState();updatePayInfo();if(activeCustomer===b.customerId)renderChat();alert(settle?"Settlement saved":"Payment saved")}
function dueReceipt(){let b=state.bills.find(x=>x.id===$("payBill").value);if(!b)return;currentBill={...b,id:uid(),billNo:b.billNo+"-DUE",payments:[],current:0,previousDue:billDue(b),allTotal:billDue(b),note:"Due receipt only"};showPage("billPage");renderInvoice(currentBill)}
function renderHistory(){$("historyList").innerHTML=state.bills.slice().reverse().map(b=>`<div class="card"><b>${esc(b.billNo)}</b><p>${esc(b.customerName)} • ${esc(b.date)} • Due ${money(billDue(b))}</p><div class="action-bar"><button class="btn" onclick="viewBill('${b.id}')">View</button><button class="btn" onclick="openPayment('${b.id}')">Pay</button></div></div>`).join("")||`<div class="card muted">No history</div>`}
function viewBill(id){let b=state.bills.find(x=>x.id===id);if(!b)return;currentBill=b;showPage("billPage");renderInvoice(b)}
function openPayment(id){showPage("payPage");$("payBill").value=id;updatePayInfo()}
function renderReports(){
  let month=$("reportMonth").value,vill=$("reportVillage").value||"all";let bills=state.bills.filter(b=>(!month||String(b.date).startsWith(month))&&(vill==="all"||b.village===vill));
  let total=0,collected=0,due=0,settled=0,bank={},village={};bills.forEach(b=>{total+=+b.allTotal||0;collected+=billPaid(b);due+=billDue(b);village[b.village||"Unknown"]=(village[b.village||"Unknown"]||0)+billDue(b);(b.payments||[]).forEach(p=>{bank[p.receivedIn||p.mode]=(bank[p.receivedIn||p.mode]||0)+(+p.amount||0);if((p.mode||"").toLowerCase().includes("settle"))settled+=+p.amount||0})});
  const row=(a,b)=>`<div class="report-row"><span>${esc(a)}</span><b>${b}</b></div>`;
  $("reportBox").innerHTML=`<div class="metrics"><div class="metric"><small>Total</small><b>${money(total)}</b></div><div class="metric"><small>Collected</small><b>${money(collected)}</b></div><div class="metric"><small>Due</small><b>${money(due)}</b></div><div class="metric"><small>Settled</small><b>${money(settled)}</b></div></div><div class="card"><h3>Bank / Receive In</h3>${Object.entries(bank).map(([k,v])=>row(k,money(v))).join("")||row("No data","-")}</div><div class="card"><h3>Village-wise Due</h3>${Object.entries(village).map(([k,v])=>row(k,money(v))).join("")||row("No data","-")}</div>`;
}
function exportCSV(){let rows=["Bill,Date,Customer,Village,Total,Paid,Due,Status",...state.bills.map(b=>`${b.billNo},${b.date},${b.customerName},${b.village},${b.allTotal},${billPaid(b)},${billDue(b)},${billStatus(b)}`)];downloadBlob(new Blob([rows.join("\n")],{type:"text/csv"}),"asha_report.csv")}
function backup(){downloadBlob(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),"asha_backup_"+today()+".json")}
function importFile(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);saveState(false);alert("Imported")}catch(err){alert("Invalid file")}};r.readAsText(f)}

function openChat(id){activeCustomer=id;$("chatModal").classList.remove("hidden");renderChat()}
function closeChat(){$("chatModal").classList.add("hidden")}
function renderChat(){
  let c=state.customers.find(x=>x.id===activeCustomer);if(!c)return;
  $("chatAvatar").textContent=initials(c.name);$("chatName").textContent=c.name;$("chatSub").textContent=(c.phone||"No phone")+" • "+(c.village||"No village")+" • Due "+money(customerDue(c.id));
  $("chatCall").onclick=()=>location.href="tel:"+phone(c.phone);$("chatWhats").onclick=()=>open("https://wa.me/"+phone(c.phone),"_blank");$("chatShare").onclick=()=>shareCustomerBill(c.id);
  $("chatBill").onclick=()=>{closeChat();showPage("billPage");$("billCustomer").value=c.id;toggleManual();previewBill()};$("chatPay").onclick=()=>directPay(c.id,false);$("chatSettle").onclick=()=>directPay(c.id,true);$("chatLedger").onclick=()=>renderChatLedger(c.id);$("chatEdit").onclick=()=>openCustomer(c.id);
  let bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||"").localeCompare(b.date||""));let out=[];if((+c.openingDue||0)>0)out.push(`<div class="bubble setB">Opening Due: <b>${money(c.openingDue)}</b></div>`);
  bills.forEach(b=>{out.push(`<div class="day">${esc(b.date)}</div><div class="bubble billB"><b>${esc(b.billNo)}</b><br>Total ${money(b.allTotal)}<br>Paid/Adjusted ${money(billPaid(b))}<br>Due <b>${money(billDue(b))}</b><div class="bubble-actions"><button onclick="viewBill('${b.id}')">View</button><button onclick="openPayment('${b.id}')">Pay</button><button onclick="shareCustomerBill('${c.id}')">Reminder + Bill</button></div></div>`);(b.payments||[]).forEach(p=>out.push(`<div class="bubble ${(p.mode||"").includes("Settlement")?"setB":"payB"}">${esc(p.mode)}<br><b>${money(p.amount)}</b><br>${esc(p.receivedIn)}<br><small>${esc(p.note||"")}</small></div>`))});
  $("chatBody").innerHTML=out.join("")||`<div class="bubble setB">No bill yet</div>`;
}
function directPay(id,settle=false){let amt=+(prompt(settle?"Settle amount?":"Receive amount?",customerDue(id)||"")||0);if(!amt)return;let left=amt;state.bills.filter(b=>b.customerId===id&&billDue(b)>0).forEach(b=>{if(left<=0)return;let pay=Math.min(left,billDue(b));(b.payments=b.payments||[]).push({id:uid(),date:today(),amount:pay,mode:settle?"Settlement":"Cash",receivedIn:settle?"Settled":"Cash",note:settle?"Settled from user chat":"Direct due payment"});left-=pay});let c=state.customers.find(x=>x.id===id);if(left>0&&c)c.openingDue=Math.max((+c.openingDue||0)-left,0);saveState();renderChat()}
function renderChatLedger(id){let c=state.customers.find(x=>x.id===id);let entries=[];state.bills.filter(b=>b.customerId===id).forEach(b=>{entries.push(`<div class="ledger-row"><span>${esc(b.billNo)} bill</span><b class="due">+${money(b.allTotal)}</b></div>`);(b.payments||[]).forEach(p=>entries.push(`<div class="ledger-row"><span>${esc(p.mode)} ${esc(p.date)}</span><b class="paid">-${money(p.amount)}</b></div>`))});$("chatBody").innerHTML=`<div class="bubble setB">Live Due <b>${money(customerDue(id))}</b></div>`+entries.join("")}
async function shareCustomerBill(id){let bills=state.bills.filter(b=>b.customerId===id).sort((a,b)=>(b.date||"").localeCompare(a.date||""));if(!bills.length)return alert("No bill found");currentBill=bills[0];renderInvoice(currentBill);await shareBill()}
function renderLandCalc(){let b=landToBigha($("calcLand").value,$("calcUnit").value),rate=+$("calcRate").value||0;$("landCalcResult").innerHTML=`Converted: <b>${b.toFixed(2)} বিঘা</b><br>Amount: <b>${money(b*rate)}</b>`}
function setupCalc(){let keys=["AC","DEL","%","÷","7","8","9","×","4","5","6","-","1","2","3","+","0",".","="];$("calcKeys").innerHTML=keys.map(k=>`<button class="${['+','-','×','÷','%'].includes(k)?'op':k==='='?'eq':''}" data-k="${k}">${k}</button>`).join("");$("calcKeys").onclick=e=>{let k=e.target.dataset.k;if(!k)return;if(k==="AC")calcVal="";else if(k==="DEL")calcVal=calcVal.slice(0,-1);else if(k==="="){try{calcVal=String(Function("return ("+calcVal.replace(/×/g,"*").replace(/÷/g,"/")+")")())}catch(err){calcVal="Error"}}else{if(calcVal==="Error")calcVal="";calcVal+=k}$("calcScreen").textContent=calcVal||"0"}}
function loadSettings(){$("setCompany").value=state.settings.company;$("setOwner").value=state.settings.owner;$("setContact").value=state.settings.contact;$("setAddress").value=state.settings.address;$("setUpi").value=state.settings.upi;$("setPayee").value=state.settings.payee;$("setCountry").value=state.settings.country;$("setAccent").value=state.settings.accent;$("setPrint").value=state.settings.print;$("setTemplate").value=state.settings.template}
function saveSettings(){Object.assign(state.settings,{company:$("setCompany").value,owner:$("setOwner").value,contact:$("setContact").value,address:$("setAddress").value,upi:$("setUpi").value,payee:$("setPayee").value,country:$("setCountry").value,accent:$("setAccent").value,print:$("setPrint").value,template:$("setTemplate").value});$("printMode").value=state.settings.print;$("template").value=state.settings.template;saveState();alert("Settings saved")}
async function login(){try{let cred=await auth.signInWithEmailAndPassword($("email").value.trim(),$("password").value);if(cred.user.uid!==OWNER_UID){await auth.signOut();$("loginMsg").textContent="Only owner account allowed";return}$("login").classList.add("hidden");$("app").classList.remove("hidden");await pullCloud()}catch(e){$("loginMsg").textContent=e.message}}
async function logout(){await auth.signOut();$("login").classList.remove("hidden");$("app").classList.add("hidden")}
async function pullCloud(){try{let s=await DOC.get();if(s.exists&&s.data().data){state=s.data().data;localStorage.setItem(KEY,JSON.stringify(state));$("cloudStatus").textContent="Cloud loaded"}else $("cloudStatus").textContent="No cloud data";renderAll(true);loadSettings()}catch(e){$("cloudStatus").textContent="Pull failed: "+e.message}}
async function pushCloud(manual=true){try{await DOC.set({data:state,updatedAt:new Date().toISOString()},{merge:true});if(manual)$("cloudStatus").textContent="Cloud saved"}catch(e){$("cloudStatus").textContent="Push failed: "+e.message}}
function bind(){
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $("loginBtn").onclick=login;$("logoutBtn").onclick=logout;$("addCustomerBtn").onclick=()=>openCustomer();$("saveCustomerBtn").onclick=saveCustomer;$("closeCustomerBtn").onclick=closeCustomer;$("customerSearch").oninput=renderCustomers;
  ["billCustomer","season","landUnit","land","rate","paidNow","billPayMode","receivedIn","billNote","template","printMode","manualName","manualPhone","manualVillage","manualAddress"].forEach(id=>$(id).addEventListener("input",previewBill));
  $("billCustomer").addEventListener("change",()=>{toggleManual();previewBill()});$("saveBillBtn").onclick=saveBill;$("previewBtn").onclick=previewBill;$("printBtn").onclick=printBill;$("shareBtn").onclick=shareBill;$("pdfBtn").onclick=downloadPDF;$("waTextBtn").onclick=waText;
  $("payBill").onchange=updatePayInfo;$("fillDueBtn").onclick=fillDue;$("cashBtn").onclick=()=>quickMode("Cash");$("onlineBtn").onclick=()=>quickMode("Online");$("receiveBtn").onclick=()=>savePayment(false);$("settleBtn").onclick=()=>savePayment(true);$("dueReceiptBtn").onclick=dueReceipt;
  ["homeVillage","homeMonth","reportVillage","reportMonth"].forEach(id=>$(id).addEventListener("input",renderAll));$("csvBtn").onclick=exportCSV;$("backupBtn").onclick=backup;$("importBtn").onclick=()=>$("importFile").click();$("importFile").onchange=importFile;
  ["calcLand","calcUnit","calcRate"].forEach(id=>$(id).addEventListener("input",renderLandCalc));$("saveSettingsBtn").onclick=saveSettings;$("cloudPullBtn").onclick=pullCloud;$("cloudPushBtn").onclick=()=>pushCloud(true);$("chatBack").onclick=closeChat;$("installBtn").onclick=()=>deferredPrompt?deferredPrompt.prompt():alert("Browser menu থেকে Add to Home screen চাপুন");
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e});
}
function boot(){bind();setupCalc();renderAll(true);loadSettings();if(auth){auth.onAuthStateChanged(u=>{if(u&&u.uid===OWNER_UID){$("login").classList.add("hidden");$("app").classList.remove("hidden");$("cloudChip").textContent="Cloud: logged in"}else{$("login").classList.remove("hidden");$("app").classList.add("hidden");$("cloudChip").textContent="Cloud: locked"}})}else{$("login").classList.add("hidden");$("app").classList.remove("hidden")}if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{})}
document.addEventListener("DOMContentLoaded",boot);
