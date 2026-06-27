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


/* ===== V30 FINAL PATCH LAYER ===== */
(function(){
function ready(fn){ if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(fn,120)); else setTimeout(fn,120); }

ready(function(){
  const V30_KEY="asha_v30_final_app";
  if(localStorage.getItem("asha_v29_fresh_ios_pro") && !localStorage.getItem(V30_KEY)){
    localStorage.setItem(V30_KEY, localStorage.getItem("asha_v29_fresh_ios_pro"));
  }
  try{ state = mergeDefaults(JSON.parse(localStorage.getItem(V30_KEY)) || state); }catch(e){}
  window.saveState=function(sync=true){localStorage.setItem(V30_KEY,JSON.stringify(state));renderAll();if(sync&&auth?.currentUser?.uid===OWNER_UID)pushCloud(false)}

  if(document.querySelector(".hero-chips span:last-child")) document.querySelector(".hero-chips span:last-child").textContent="V30 Final iOS Pro";

  window.normalPhone=function(raw){
    raw=String(raw||"").trim(); if(!raw)return "";
    let d=raw.replace(/\D/g,"");
    if(raw.startsWith("+"))return raw;
    if(d.length===10)return "+91 "+d;
    if(d.length>10&&d.startsWith("91"))return "+91 "+d.slice(-10);
    return "+91 "+d;
  }

  const oldFill=window.fillSelects;
  window.fillSelects=function(){
    if(oldFill) oldFill();
    if($("setTemplate")){
      $("setTemplate").innerHTML='<option value="premium">Premium Colour</option><option value="standard">Standard Clean</option><option value="normal">Normal Black</option><option value="thermal">Thermal Compact</option><option value="classic">Classic Bill</option><option value="boxed">Boxed Modern</option><option value="bengali">Bengali Heavy</option><option value="compact">Compact A6</option><option value="qrfirst">QR Focused</option>';
      $("setTemplate").value=state.settings.template||"premium";
    }
    if($("setQrMode")) $("setQrMode").value=state.settings.qrMode||"dynamic";
    updatePayInfo();
  }

  window.qrSrc=function(amount,billNo){
    if(state.settings.qrMode==="static"&&state.settings.qrImage)return state.settings.qrImage;
    let link=`upi://pay?pa=${encodeURIComponent(state.settings.upi)}&pn=${encodeURIComponent(state.settings.owner||state.settings.payee||"Asha")}&am=${Number(amount||0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(billNo||"Asha Bill")}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;
  }

  window.invoiceHTML=function(b,cls){
    let due=billDue(b),paid=billPaid(b),tpl=$("template")?.value||state.settings.template||"premium";
    let rows=[["Bill No",b.billNo],["Date",b.date],["Name",b.customerName],["Phone",b.phone||""],["Village",b.village||""],["Address",b.address||""],["Season",b.season],["জমির পরিমাণ",`${b.landAmount} ${b.unit}`],["Converted",`${b.bigha.toFixed(2)} বিঘা`],["Rate",`${money(b.rate)}/বিঘা`],["Current Bill",money(b.current)],["Previous Due",money(b.previousDue)],["All Total",money(b.allTotal)],["Paid / Adjusted",money(paid)],["Due",money(due)],["Status",billStatus(b)],["Payment",b.payments?.[0]?.mode||"-"],["Received",b.payments?.[0]?.receivedIn||"-"]];
    return `<div class="invoice ${cls} ${tpl}"><h3>${esc(state.settings.company)}</h3><div class="head-small">Pro: ${esc(state.settings.owner)}<br>☎/WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div><div class="line"></div>${rows.map(([l,v])=>`<div class="item"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join("")}<div class="line"></div><div class="head-small">UPI: ${esc(state.settings.upi)}</div><img class="qr" src="${qrSrc(due>0?due:b.allTotal,b.billNo)}"><div class="head-small"><b>Scan & Pay ${money(due>0?due:b.allTotal)}</b></div><div class="line"></div>${b.note?`<div style="font-size:11px"><b>Note:</b> ${esc(b.note)}</div>`:""}<div class="head-small">ধন্যবাদ। সময়মতো বিল পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।</div><div style="text-align:right;font-size:11px;margin-top:8px">Sign: ${esc(state.settings.owner)}</div><div style="text-align:center;font-size:11px;color:#777">Thank you</div></div>`;
  }

  window.reminderTextByBill=function(b){
    return `${state.settings.company}\nBill No: ${b.billNo}\nName: ${b.customerName}\nTotal: ${money(b.allTotal)}\nPaid/Adjusted: ${money(billPaid(b))}\nDue: ${money(billDue(b))}\nNote: ${b.note||"-"}\nContact: ${state.settings.contact}\nUPI: ${state.settings.upi}`;
  }

  window.findPayment=function(paymentId){
    for(const b of state.bills){let p=(b.payments||[]).find(x=>x.id===paymentId);if(p)return {bill:b,p};}
    return null;
  }
  window.editEntry=function(paymentId){
    let fp=findPayment(paymentId); if(!fp)return;
    actionContext={type:"payment",paymentId};
    $("actionTitle").textContent=(fp.p.mode==="Settlement"?"Edit Settlement":"Edit Payment");
    $("actionBody").innerHTML=`<label>Amount</label><input id="editAmount" type="number" value="${fp.p.amount}"><label>Mode</label><select id="editMode"><option>Cash</option><option>UPI</option><option>Bank</option><option>Online</option><option>Settlement</option></select><label>Received In</label><input id="editReceived" value="${esc(fp.p.receivedIn||"")}"><label>Note</label><input id="editNote" value="${esc(fp.p.note||"")}">`;
    $("editMode").value=fp.p.mode;
    $("actionSave").classList.remove("hidden"); $("actionDelete").classList.remove("hidden"); $("actionModal").classList.remove("hidden");
  }
  window.saveAction=function(){
    if(!actionContext)return closeAction();
    let fp=findPayment(actionContext.paymentId); if(!fp)return closeAction();
    fp.p.amount=+$("editAmount").value||0; fp.p.mode=$("editMode").value; fp.p.receivedIn=$("editReceived").value; fp.p.note=$("editNote").value;
    saveState(); if(activeCustomer)renderChat(); closeAction();
  }
  window.deleteAction=function(){
    if(!actionContext)return closeAction();
    let fp=findPayment(actionContext.paymentId); if(!fp)return closeAction();
    if(confirm("Delete this entry?")){fp.bill.payments=(fp.bill.payments||[]).filter(p=>p.id!==actionContext.paymentId);saveState();if(activeCustomer)renderChat();}
    closeAction();
  }
  window.closeAction=function(){actionContext=null;$("actionModal").classList.add("hidden");$("actionSave").classList.remove("hidden");$("actionDelete").classList.remove("hidden");}

  window.deleteCustomer=function(id){
    if(!confirm("Delete this customer and all bills?"))return;
    state.customers=state.customers.filter(c=>c.id!==id);state.bills=state.bills.filter(b=>b.customerId!==id);
    closeChat();closeAction();saveState();
  }
  window.deleteBill=function(id){
    if(!confirm("Delete this bill?"))return;
    state.bills=state.bills.filter(b=>b.id!==id);saveState();if(activeCustomer)renderChat();
  }

  window.openMoreMenu=function(id){
    let c=state.customers.find(x=>x.id===id); if(!c)return;
    actionContext={type:"more",customerId:id};
    $("actionTitle").textContent="User Actions";
    $("actionBody").innerHTML=`<div class="action-sheet"><button class="btn" onclick="openCustomer('${id}');closeAction()">Edit User</button><button class="btn" onclick="smsReminder('${id}')">SMS Reminder</button><button class="btn" onclick="waCustomerText('${id}')">WhatsApp Reminder</button><button class="btn" onclick="renderChatLedger('${id}');closeAction()">View Ledger</button><button class="btn danger" onclick="deleteCustomer('${id}')">Delete User</button></div>`;
    $("actionSave").classList.add("hidden");$("actionDelete").classList.add("hidden");$("actionModal").classList.remove("hidden");
  }

  window.customerReminderText=function(c){return `${state.settings.company}\nName: ${c.name}\nDue: ${money(customerDue(c.id))}\nContact: ${state.settings.contact}\nUPI: ${state.settings.upi}`}
  window.waCustomerText=function(id){let c=state.customers.find(x=>x.id===id);if(!c)return;open("https://wa.me/"+phone(c.phone)+"?text="+encodeURIComponent(customerReminderText(c)),"_blank")}
  window.smsReminder=function(id){let c=state.customers.find(x=>x.id===id);if(!c)return;location.href="sms:"+phone(c.phone)+"?body="+encodeURIComponent(customerReminderText(c))}

  window.renderChat=function(){
    let c=state.customers.find(x=>x.id===activeCustomer);if(!c)return;
    $("chatAvatar").textContent=initials(c.name);$("chatName").textContent=c.name;$("chatSub").textContent=(c.phone||"No phone")+" • "+(c.village||"No village")+" • Due "+money(customerDue(c.id));
    $("chatCall").onclick=()=>location.href="tel:"+phone(c.phone);$("chatWhats").onclick=()=>open("https://wa.me/"+phone(c.phone),"_blank");$("chatShare").onclick=()=>shareCustomerBill(c.id);
    $("chatBill").onclick=()=>{closeChat();showPage("billPage");$("billCustomer").value=c.id;toggleManual();previewBill()};
    $("chatPay").onclick=()=>directPay(c.id,false);$("chatSettle").onclick=()=>directPay(c.id,true);$("chatLedger").onclick=()=>renderChatLedger(c.id);$("chatEdit").onclick=()=>openCustomer(c.id);
    if($("chatMore"))$("chatMore").onclick=()=>openMoreMenu(c.id);
    let bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
    let out=[];if((+c.openingDue||0)>0)out.push(`<div class="bubble setB">Opening Due: <b>${money(c.openingDue)}</b></div>`);
    bills.forEach(b=>{out.push(`<div class="day">${esc(b.date)}</div><div class="bubble billB"><b>${esc(b.billNo)}</b><br>Total ${money(b.allTotal)}<br>Paid/Adjusted ${money(billPaid(b))}<br>Due <b>${money(billDue(b))}</b><br>${b.note?`<small>Note: ${esc(b.note)}</small>`:""}<div class="bubble-actions"><button onclick="viewBill('${b.id}')">View</button><button onclick="openPayment('${b.id}')">Pay</button><button onclick="shareCustomerBill('${c.id}')">Reminder + Bill</button><button onclick="deleteBill('${b.id}')">Delete</button></div></div>`);(b.payments||[]).forEach(p=>out.push(`<div class="bubble ${(p.mode||"").includes("Settlement")?"setB":"payB"}">${esc(p.mode)}<br><b>${money(p.amount)}</b><br>${esc(p.receivedIn)}<br><small>${esc(p.note||"")}</small><div class="entry-tools"><button onclick="editEntry('${p.id}')">Edit</button><button onclick="editEntry('${p.id}')">Undo/Delete</button></div></div>`))});
    $("chatBody").innerHTML=out.join("")||`<div class="bubble setB">No bill yet</div>`;
  }

  window.renderChatLedger=function(id){
    let entries=[];state.bills.filter(b=>b.customerId===id).forEach(b=>{entries.push(`<div class="ledger-row"><span>${esc(b.billNo)} bill</span><b class="due">+${money(b.allTotal)}</b></div>`);(b.payments||[]).forEach(p=>entries.push(`<div class="ledger-row"><span>${esc(p.mode)} ${esc(p.date)} <button onclick="editEntry('${p.id}')">Edit</button></span><b class="paid">-${money(p.amount)}</b></div>`))});
    $("chatBody").innerHTML=`<div class="bubble setB">Live Due <b>${money(customerDue(id))}</b></div>`+entries.join("");
  }

  window.renderHistory=function(){
    $("historyList").innerHTML=state.bills.slice().reverse().map(b=>`<div class="card"><b>${esc(b.billNo)}</b><p>${esc(b.customerName)} • ${esc(b.date)} • Due ${money(billDue(b))}</p><div class="action-bar"><button class="btn" onclick="viewBill('${b.id}')">View</button><button class="btn" onclick="openPayment('${b.id}')">Pay</button><button class="btn danger" onclick="deleteBill('${b.id}')">Delete</button></div></div>`).join("")||`<div class="card muted">No history</div>`;
  }

  window.renderReports=function(){
    let month=$("reportMonth").value,vill=$("reportVillage").value||"all";
    let bills=state.bills.filter(b=>(!month||String(b.date).startsWith(month))&&(vill==="all"||b.village===vill));
    let total=0,collected=0,due=0,settled=0,bank={},village={},custDue={};
    bills.forEach(b=>{total+=+b.allTotal||0;collected+=billPaid(b);due+=billDue(b);village[b.village||"Unknown"]=(village[b.village||"Unknown"]||0)+billDue(b);custDue[b.customerName]=(custDue[b.customerName]||0)+billDue(b);(b.payments||[]).forEach(p=>{bank[p.receivedIn||p.mode]=(bank[p.receivedIn||p.mode]||0)+(+p.amount||0);if((p.mode||"").toLowerCase().includes("settle"))settled+=+p.amount||0})});
    const row=(a,b)=>`<div class="report-row"><span>${esc(a)}</span><b>${b}</b></div>`;
    $("reportBox").innerHTML=`<div class="metrics"><div class="metric"><small>Total</small><b>${money(total)}</b></div><div class="metric"><small>Collected</small><b>${money(collected)}</b></div><div class="metric"><small>Due</small><b>${money(due)}</b></div><div class="metric"><small>Settled</small><b>${money(settled)}</b></div></div><div class="card"><h3>Bank / Receive In</h3>${Object.entries(bank).map(([k,v])=>row(k,money(v))).join("")||row("No data","-")}</div><div class="card"><h3>Village-wise Due</h3>${Object.entries(village).map(([k,v])=>row(k,money(v))).join("")||row("No data","-")}</div><div class="card"><h3>Customer-wise Due</h3>${Object.entries(custDue).filter(([,v])=>v>0).map(([k,v])=>row(k,money(v))).join("")||row("No due","-")}</div>`;
  }

  window.loadQr=function(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{state.settings.qrImage=r.result;state.settings.qrMode="static";saveState();loadSettings();alert("QR uploaded")};r.readAsDataURL(f)}
  window.removeQr=function(){state.settings.qrImage="";state.settings.qrMode="dynamic";saveState();loadSettings();alert("QR removed")}
  const oldLoadSettings=window.loadSettings;
  window.loadSettings=function(){
    oldLoadSettings();
    if($("setQrMode"))$("setQrMode").value=state.settings.qrMode||"dynamic";
    if($("setPayee"))$("setPayee").value=state.settings.owner;
    if($("setCountry"))$("setCountry").value="+91";
  }
  window.saveSettings=function(){
    Object.assign(state.settings,{company:$("setCompany").value,owner:$("setOwner").value,contact:$("setContact").value,address:$("setAddress").value,upi:$("setUpi").value,payee:$("setOwner").value,country:"+91",accent:$("setAccent").value,print:$("setPrint").value,template:$("setTemplate").value,qrMode:$("setQrMode")?.value||"dynamic"});
    $("printMode").value=state.settings.print;$("template").value=state.settings.template;saveState();alert("Settings saved");
  }

  if($("setQrImage"))$("setQrImage").onchange=loadQr;
  if($("removeQrBtn"))$("removeQrBtn").onclick=removeQr;
  if($("actionSave"))$("actionSave").onclick=saveAction;
  if($("actionDelete"))$("actionDelete").onclick=deleteAction;
  if($("actionClose"))$("actionClose").onclick=closeAction;

  renderAll(true);loadSettings();
});
})();


/* ===== V31 BILL DESIGN PATCH ===== */
(function(){
function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(fn,120));else setTimeout(fn,120)}
ready(function(){
  if(document.querySelector(".hero-chips span:last-child"))document.querySelector(".hero-chips span:last-child").textContent="V31 Bill Design Pro";
  function billTemplateOptions(){return '<option value="classic">Classic Official Bill</option><option value="premium">Premium Green Bill</option><option value="boxed">Boxed Modern Bill</option><option value="bengali">Bengali Heavy Bill</option><option value="qrfirst">QR Focused Bill</option><option value="standard">Standard Clean Bill</option><option value="normal">Normal Black Bill</option><option value="thermal">Thermal Compact Bill</option><option value="compact">Compact A6 Bill</option>'}
  const oldFillSelects=window.fillSelects;
  window.fillSelects=function(){
    if(oldFillSelects)oldFillSelects();
    const t=document.getElementById("template");
    if(t){
      const current=state.settings.template||t.value||"classic";
      t.innerHTML=billTemplateOptions();
      t.value=current;
      if(!document.querySelector(".bill-design-hint"))t.insertAdjacentHTML("afterend",'<div class="bill-design-hint">Bill design এখান থেকেই change করুন — change করলেই পাশে live preview দেখাবে।</div>');
      t.onchange=()=>{state.settings.template=t.value;previewBill()};
    }
    const st=document.getElementById("setTemplate");
    if(st){st.innerHTML=billTemplateOptions();st.value=state.settings.template||"classic"}
  };
  window.invoiceHTML=function(b,cls){
    let due=billDue(b),paid=billPaid(b),tpl=document.getElementById("template")?.value||state.settings.template||"classic";
    let rowsTop=[["Bill No",b.billNo],["Date",b.date]];
    let landRows=[["Season",b.season],["জমির পরিমাণ",`${b.landAmount} ${b.unit}`],["Converted",`${b.bigha.toFixed(2)} বিঘা`],["Rate",`${money(b.rate)}/বিঘা`]];
    let amountRows=[["Current Bill",money(b.current)],["Previous Due",money(b.previousDue)],["All Total",money(b.allTotal)],["Paid / Adjusted",money(paid)],["Due",money(due)],["Status",billStatus(b)],["Payment",b.payments?.[0]?.mode||"-"],["Received",b.payments?.[0]?.receivedIn||"-"]];
    let row=(l,v,cls2="")=>`<div class="v31-row ${cls2}"><span>${esc(l)}</span><b>${esc(v)}</b></div>`;
    let section=(title,html,extra="")=>`<div class="v31-section ${extra}"><div class="v31-section-title">${title}</div>${html}</div>`;
    let customerBlock=`<div class="customer-lines"><b>Name:</b> ${esc(b.customerName)}<br><b>Phone:</b> ${esc(b.phone||"")}<br><b>Address:</b> ${esc(b.address||b.village||"")}</div>`;
    let noteBlock=b.note?section("Note / Remarks",`<div class="customer-lines">${esc(b.note)}</div>`):"";
    return `<div class="invoice v31bill ${cls} ${tpl}">
      <div class="v31-head"><h3>${esc(state.settings.company)}</h3><div class="subline">Pro: ${esc(state.settings.owner)}<br>☎/WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div>
      ${section("Bill Details",rowsTop.map(x=>row(x[0],x[1])).join(""))}
      ${section("Customer Details",customerBlock)}
      ${section("Land / Season",landRows.map(x=>row(x[0],x[1])).join(""))}
      ${section("Amount Summary",amountRows.map((x,i)=>row(x[0],x[1],i>=2?"v31-total":"")).join(""))}
      <div class="v31-section v31-pay-section"><div class="v31-section-title">Payment QR</div><div class="head-small">UPI: ${esc(state.settings.upi)}</div><img class="qr" src="${qrSrc(due>0?due:b.allTotal,b.billNo)}"><div class="head-small"><b>Scan & Pay ${money(due>0?due:b.allTotal)}</b></div></div>
      ${noteBlock}
      <div class="footer-note">ধন্যবাদ। সময়মতো বিল পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।</div>
      <div style="text-align:right;font-size:11px;margin-top:8px">Sign: ${esc(state.settings.owner)}</div>
      <div style="text-align:center;font-size:11px;color:#777">Thank you</div>
    </div>`;
  };
  const oldSaveSettings=window.saveSettings;
  window.saveSettings=function(){if(document.getElementById("template"))state.settings.template=document.getElementById("template").value||state.settings.template||"classic";if(oldSaveSettings)oldSaveSettings()};
  renderAll(true);
});
})();


/* ===== V32 DYNAMIC QR FIX ===== */
(function(){
function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(fn,150));else setTimeout(fn,150)}
ready(function(){
  if(document.querySelector(".hero-chips span:last-child"))document.querySelector(".hero-chips span:last-child").textContent="V32 Dynamic QR Fix";

  window.makeUpiLink=function(amount,billNo){
    let pa=(state.settings.upi||"").trim();
    let pn=(state.settings.owner||state.settings.payee||state.settings.company||"Asha Mini Shallow").trim();
    let am=Number(amount||0).toFixed(2);
    let tn=billNo||"Asha Bill";
    return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
  };

  window.renderQRCodes=function(){
    document.querySelectorAll(".qr-live").forEach(el=>{
      let data=el.getAttribute("data-qr")||"";
      let fallback=el.getAttribute("data-fallback")||"";
      el.innerHTML="";
      if(window.QRCode){
        try{
          new QRCode(el,{text:data,width:106,height:106,correctLevel:QRCode.CorrectLevel.M});
          return;
        }catch(e){}
      }
      let img=document.createElement("img");
      img.crossOrigin="anonymous";
      img.alt="QR";
      img.src=fallback || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;
      el.appendChild(img);
    });
  };

  const oldRenderInvoice=window.renderInvoice;
  window.renderInvoice=function(b){
    oldRenderInvoice(b);
    setTimeout(renderQRCodes,50);
  };

  window.invoiceHTML=function(b,cls){
    let due=billDue(b),paid=billPaid(b),tpl=document.getElementById("template")?.value||state.settings.template||"classic";
    let payAmount=due>0?due:b.allTotal;
    let upi=makeUpiLink(payAmount,b.billNo);
    let fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    let rowsTop=[["Bill No",b.billNo],["Date",b.date]];
    let landRows=[["Season",b.season],["জমির পরিমাণ",`${b.landAmount} ${b.unit}`],["Converted",`${b.bigha.toFixed(2)} বিঘা`],["Rate",`${money(b.rate)}/বিঘা`]];
    let amountRows=[["Current Bill",money(b.current)],["Previous Due",money(b.previousDue)],["All Total",money(b.allTotal)],["Paid / Adjusted",money(paid)],["Due",money(due)],["Status",billStatus(b)],["Payment",b.payments?.[0]?.mode||"-"],["Received",b.payments?.[0]?.receivedIn||"-"]];
    let row=(l,v,cls2="")=>`<div class="v31-row ${cls2}"><span>${esc(l)}</span><b>${esc(v)}</b></div>`;
    let section=(title,html,extra="")=>`<div class="v31-section ${extra}"><div class="v31-section-title">${title}</div>${html}</div>`;
    let customerBlock=`<div class="customer-lines"><b>Name:</b> ${esc(b.customerName)}<br><b>Phone:</b> ${esc(b.phone||"")}<br><b>Address:</b> ${esc(b.address||b.village||"")}</div>`;
    let noteBlock=b.note?section("Note / Remarks",`<div class="customer-lines">${esc(b.note)}</div>`):"";
    let qrBlock="";
    if(state.settings.qrMode==="static" && state.settings.qrImage){
      qrBlock=`<img class="qr" src="${state.settings.qrImage}">`;
    }else{
      qrBlock=`<div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div><div class="qr-status">Dynamic QR • Amount ${money(payAmount)}</div>`;
    }
    return `<div class="invoice v31bill ${cls} ${tpl}">
      <div class="v31-head"><h3>${esc(state.settings.company)}</h3><div class="subline">Pro: ${esc(state.settings.owner)}<br>☎/WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div>
      ${section("Bill Details",rowsTop.map(x=>row(x[0],x[1])).join(""))}
      ${section("Customer Details",customerBlock)}
      ${section("Land / Season",landRows.map(x=>row(x[0],x[1])).join(""))}
      ${section("Amount Summary",amountRows.map((x,i)=>row(x[0],x[1],i>=2?"v31-total":"")).join(""))}
      <div class="v31-section v31-pay-section"><div class="v31-section-title">Payment QR</div><div class="head-small">UPI: ${esc(state.settings.upi)}</div>${qrBlock}<div class="head-small"><b>Scan & Pay ${money(payAmount)}</b></div></div>
      ${noteBlock}
      <div class="footer-note">ধন্যবাদ। সময়মতো বিল পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।</div>
      <div style="text-align:right;font-size:11px;margin-top:8px">Sign: ${esc(state.settings.owner)}</div>
      <div style="text-align:center;font-size:11px;color:#777">Thank you</div>
    </div>`;
  };

  const oldShareBill=window.shareBill;
  window.shareBill=async function(){
    if(!currentBill)return alert("Preview bill first");
    renderQRCodes();
    await new Promise(r=>setTimeout(r,200));
    return oldShareBill();
  };

  // Force dynamic mode when user selects dynamic in settings and make it visible.
  const qrMode=document.getElementById("setQrMode");
  if(qrMode){
    qrMode.onchange=()=>{state.settings.qrMode=qrMode.value;saveState(false);previewBill();};
  }

  // If no static QR exists, keep dynamic mode.
  if(state.settings.qrMode==="static" && !state.settings.qrImage){
    state.settings.qrMode="dynamic";
    saveState(false);
  }

  setTimeout(()=>{previewBill();renderQRCodes();},300);
});
})();


/* ===== V33 CHAT + WA + COMPACT BILL FIX ===== */
(function(){
function ccDigits(){return String(state.settings.country||'+91').replace(/\D/g,'')||'91'}
window.phoneDigits=function(raw){
  let d=String(raw||'').replace(/\D/g,'');
  if(!d) return '';
  if(d.length===10) return ccDigits()+d;
  if(d.length>10 && d.startsWith(ccDigits())) return d;
  if(d.length>10) return d;
  return ccDigits()+d;
}
window.safePhoneLabel=function(raw){let d=phoneDigits(raw);return d?('+'+d):''}
window.openWhatsApp=function(raw,text=''){
  const d=phoneDigits(raw);
  if(!d || d.length<12) return alert('Valid phone number নেই। Customer phone-এ 10 digit number দিন, country code auto add হবে।');
  const url='https://wa.me/'+d+(text?('?text='+encodeURIComponent(text)):'');
  window.open(url,'_blank');
}
window.waText=function(){if(!currentBill)return alert('Preview bill first');openWhatsApp(currentBill.phone, reminderTextByBill(currentBill));}
window.waCustomerText=function(id){let c=state.customers.find(x=>x.id===id);if(!c)return;openWhatsApp(c.phone, customerReminderText(c));}
window.smsReminder=function(id){let c=state.customers.find(x=>x.id===id);if(!c)return;location.href='sms:'+phoneDigits(c.phone)+'?body='+encodeURIComponent(customerReminderText(c))}

const oldRenderCustomers=window.renderCustomers||renderCustomers;
window.renderCustomers=function(){ oldRenderCustomers(); document.querySelectorAll('.customer-row').forEach(r=>r.style.cursor='pointer'); }

window.customerReminderText=function(c){
  return `${state.settings.company}\nName: ${c.name}\nPhone: ${safePhoneLabel(c.phone)}\nDue: ${money(customerDue(c.id))}\nContact: ${state.settings.contact}\nUPI: ${state.settings.upi}`
}

window.shareCustomerBill=async function(id){
  let bills=state.bills.filter(b=>b.customerId===id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(!bills.length) return alert('No bill found');
  currentBill=bills[0];
  renderInvoice(currentBill);
  setTimeout(async()=>{
    try{await shareBill()}catch(e){console.warn(e); alert('Reminder + Bill share failed. আবার try করুন।')}
  },220);
}

window.compactBillExtras=function(b){
  return `<div class="compact-grid">
    <div class="compact-chip"><b>Status</b><br>${esc(billStatus(b))}</div>
    <div class="compact-chip"><b>Payment</b><br>${esc(b.payments?.[0]?.mode||'-')}</div>
    <div class="compact-chip"><b>Received</b><br>${esc(b.payments?.[0]?.receivedIn||'-')}</div>
    <div class="compact-chip"><b>Note</b><br>${esc(b.note||'-')}</div>
  </div>`
}

window.invoiceHTML=function(b,cls){
  let due=billDue(b), paid=billPaid(b), tpl=(document.getElementById('template')?.value||state.settings.template||'classic');
  let payAmount=due>0?due:b.allTotal;
  let upi=makeUpiLink(payAmount,b.billNo);
  let fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
  let row=(l,v,cls2='')=>`<div class="v31-row ${cls2}"><span>${esc(l)}</span><b>${esc(v)}</b></div>`;
  let section=(title,html,extra='')=>`<div class="v31-section ${extra}"><div class="v31-section-title">${title}</div>${html}</div>`;
  let rowsTop=[['Bill No',b.billNo],['Date',b.date]];
  let landRows=[['Season',b.season],['জমির পরিমাণ',`${b.landAmount} ${b.unit}`],['Converted',`${Number(b.bigha||0).toFixed(2)} বিঘা`],['Rate',`${money(b.rate)}/বিঘা`]];
  let amountRows=[['Current Bill',money(b.current)],['Previous Due',money(b.previousDue)],['All Total',money(b.allTotal)],['Paid / Adjusted',money(paid)],['Due',money(due)]];
  let customerBlock=`<div class="customer-lines"><b>Name:</b> ${esc(b.customerName)}<br><b>Phone:</b> ${esc(safePhoneLabel(b.phone)||b.phone||'')}<br><b>Address:</b> ${esc(b.address||b.village||'')}</div>`;
  let noteBlock=b.note?section('Note / Remarks',`<div class="customer-lines">${esc(b.note)}</div>`):'';
  let qrBlock=(state.settings.qrMode==='static' && state.settings.qrImage)
    ? `<img class="qr" src="${state.settings.qrImage}">`
    : `<div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div><div class="qr-status">Dynamic QR • Amount ${money(payAmount)}</div>`;
  let compact = tpl==='phone' || tpl==='compact' || cls==='phoneview';
  let extraCompact = compact ? compactBillExtras(b) : section('Payment Details', [
      ['Status',billStatus(b)],['Payment',b.payments?.[0]?.mode||'-'],['Received',b.payments?.[0]?.receivedIn||'-']
    ].map((x,i)=>row(x[0],x[1],i===0?'v31-total':'' )).join(''));
  return `<div class="invoice v31bill ${cls} ${tpl}">
      <div class="v31-head"><h3>${esc(state.settings.company)}</h3><div class="subline">Pro: ${esc(state.settings.owner)}<br>☎/WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div>
      ${section('Bill Details',rowsTop.map(x=>row(x[0],x[1])).join(''))}
      ${section('Customer Details',customerBlock)}
      ${section('Land / Season',landRows.map(x=>row(x[0],x[1])).join(''))}
      ${section('Amount Summary',amountRows.map((x,i)=>row(x[0],x[1],i>=2?'v31-total':'' )).join(''))}
      ${extraCompact}
      <div class="v31-section v31-pay-section"><div class="v31-section-title">Payment QR</div><div class="head-small">UPI: ${esc(state.settings.upi)}</div>${qrBlock}<div class="head-small"><b>Scan & Pay ${money(payAmount)}</b></div></div>
      ${noteBlock}
      <div class="footer-note">ধন্যবাদ। সময়মতো বিল পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।</div>
      <div style="text-align:right;font-size:11px;margin-top:8px">Sign: ${esc(state.settings.owner)}</div>
      <div style="text-align:center;font-size:11px;color:#777">Thank you</div>
    </div>`;
  }

window.printBill=function(){
  let m=(document.getElementById('printMode')?.value||'');
  document.body.classList.toggle('printThermal',m==='thermal80');
  document.body.classList.toggle('printPhone',m==='phoneview');
  window.print();
  setTimeout(()=>{document.body.classList.remove('printThermal');document.body.classList.remove('printPhone')},400);
}

window.renderChat=function(){
  let c=state.customers.find(x=>x.id===activeCustomer); if(!c) return;
  chatAvatar.textContent=initials(c.name); chatName.textContent=c.name;
  chatSub.textContent=(safePhoneLabel(c.phone)||'No phone')+' • '+(c.village||'No village')+' • Due '+money(customerDue(c.id));
  chatCall.onclick=()=>{let d=phoneDigits(c.phone); if(!d) return alert('Phone number নেই'); location.href='tel:+'+d;};
  chatWhats.onclick=()=>openWhatsApp(c.phone, customerReminderText(c));
  chatShare.onclick=()=>shareCustomerBill(c.id);
  chatBill.onclick=()=>{closeChat();showPage('billPage');billCustomer.value=c.id;toggleManual();previewBill()};
  chatPay.onclick=()=>directPay(c.id,false); chatSettle.onclick=()=>directPay(c.id,true); chatLedger.onclick=()=>renderChatLedger(c.id); chatEdit.onclick=()=>openCustomer(c.id);
  if(chatMore) chatMore.onclick=()=>openMoreMenu(c.id);
  let bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  let out=[];
  if((+c.openingDue||0)>0) out.push(`<div class="bubble setB">Opening Due: <b>${money(c.openingDue)}</b></div>`);
  bills.forEach(b=>{
    out.push(`<div class="day">${esc(b.date)}</div><div class="bubble billB"><b>${esc(b.billNo)}</b><br>Total ${money(b.allTotal)}<br>Paid/Adjusted ${money(billPaid(b))}<br>Due <b>${money(billDue(b))}</b>${b.note?`<br><small>Note: ${esc(b.note)}</small>`:''}<div class="bubble-actions"><button type="button" onclick="event.stopPropagation();viewBill('${b.id}')">View</button><button type="button" onclick="event.stopPropagation();openPayment('${b.id}')">Pay</button><button type="button" onclick="event.stopPropagation();shareCustomerBill('${c.id}')">Reminder + Bill</button><button type="button" onclick="event.stopPropagation();deleteBill('${b.id}')">Delete</button></div></div>`);
    (b.payments||[]).forEach(p=>out.push(`<div class="bubble ${(p.mode||'').includes('Settlement')?'setB':'payB'}">${esc(p.mode)}<br><b>${money(p.amount)}</b><br>${esc(p.receivedIn)}<br><small>${esc(p.note||'')}</small><div class="entry-tools"><button type="button" onclick="event.stopPropagation();editEntry('${p.id}')">Edit</button><button type="button" onclick="event.stopPropagation();editEntry('${p.id}')">Undo/Delete</button></div></div>`))
  });
  chatBody.innerHTML=out.join('')||`<div class="bubble setB">No bill yet</div>`;
}

window.renderActionSheetHint=function(){
  if(document.querySelector('.chat-head')) document.querySelectorAll('.chat-head button').forEach(b=>b.title=b.textContent==='W'?'WhatsApp':(b.textContent==='✆'?'Call':'Share Bill'));
}
setTimeout(renderActionSheetHint,500)
})();


/* ===== V34 ULTRA PATCH ===== */
(function(){
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,180));else setTimeout(fn,180)}
ready(function(){
  const versionChip=document.querySelector('.hero-chips span:last-child');
  if(versionChip) versionChip.textContent='V34 Premium Chat + Compact';

  function templateOptions(){
    return '<option value="classic">Classic Official Bill</option><option value="premium">Premium Green Bill</option><option value="boxed">Boxed Modern Bill</option><option value="bengali">Bengali Heavy Bill</option><option value="qrfirst">QR Focused Bill</option><option value="standard">Standard Clean Bill</option><option value="normal">Normal Black Bill</option><option value="thermal">Thermal Compact Bill</option><option value="compact">Compact A6 Bill</option><option value="phone">Phone View Compact</option>';
  }
  const oldFill=window.fillSelects;
  window.fillSelects=function(){
    if(oldFill) oldFill();
    const t=document.getElementById('template');
    const st=document.getElementById('setTemplate');
    const current=state.settings.template||'premium';
    if(t){t.innerHTML=templateOptions(); t.value=current; t.onchange=()=>{state.settings.template=t.value; previewBill();};}
    if(st){st.innerHTML=templateOptions(); st.value=current;}
    const cm=document.getElementById('chatMore'); if(cm) cm.textContent='⋯';
    const sh=document.getElementById('chatShare'); if(sh) {sh.textContent='⇪'; sh.title='Share bill image';}
    const ca=document.getElementById('chatCall'); if(ca) {ca.textContent='☎'; ca.title='Phone call';}
    const wa=document.getElementById('chatWhats'); if(wa) {wa.textContent='Ⓦ'; wa.title='WhatsApp';}
  }

  window.normalPhone=function(raw){
    raw=String(raw||'').trim(); if(!raw) return '';
    let d=raw.replace(/\D/g,''); let cc='+'+(String(state.settings.country||'+91').replace(/\D/g,'')||'91');
    if(raw.startsWith('+')) return raw;
    if(d.length===10) return cc+' '+d;
    if(d.length===12 && d.startsWith(cc.replace(/\D/g,''))) return '+'+d.slice(0,2)+' '+d.slice(2);
    if(d.length>10) return '+'+d;
    return cc+' '+d;
  }

  window.shareBill=async function(){
    if(!currentBill) return alert('Preview bill first');
    renderInvoice(currentBill); if(window.renderQRCodes) renderQRCodes();
    await new Promise(r=>setTimeout(r,280));
    const blob=await invoiceBlob();
    const file=new File([blob],`${currentBill.billNo}.png`,{type:'image/png'});
    const text=reminderTextByBill(currentBill);
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],text,title:'Asha Bill Reminder'});
      return;
    }
    if(navigator.share){
      await navigator.share({text:`${text}

Bill image auto-download হবে, না হলে নিচের download ব্যবহার করুন।`,title:'Asha Bill Reminder'}).catch(()=>{});
    }
    downloadBlob(blob,`${currentBill.billNo}.png`);
    try{ openWhatsApp(currentBill.phone,text); }catch(e){}
    alert('এই browser direct image attach support না করলে bill image download হবে এবং WhatsApp text open হবে।');
  }

  window.shareCustomerBill=async function(customerId,billId){
    let target=null;
    if(billId) target=state.bills.find(b=>b.id===billId && b.customerId===customerId);
    if(!target){
      let bills=state.bills.filter(b=>b.customerId===customerId).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      target=bills[0];
    }
    if(!target) return alert('No bill found');
    currentBill=target;
    renderInvoice(currentBill); if(window.renderQRCodes) renderQRCodes();
    return shareBill();
  }

  window.openMoreMenu=function(id){
    const c=state.customers.find(x=>x.id===id); if(!c) return;
    actionContext={type:'more',customerId:id};
    document.getElementById('actionTitle').textContent='User Quick Actions';
    document.getElementById('actionBody').innerHTML=`
      <div class="action-sheet">
        <div class="more-grid">
          <button class="btn" onclick="openCustomer('${id}');closeAction()">✏ Edit User</button>
          <button class="btn" onclick="renderChatLedger('${id}');closeAction()">📒 Ledger</button>
          <button class="btn" onclick="waCustomerText('${id}');closeAction()">Ⓦ WhatsApp</button>
          <button class="btn" onclick="smsReminder('${id}');closeAction()">✉ SMS</button>
          <button class="btn" onclick="directPay('${id}',false);closeAction()">₹ Receive</button>
          <button class="btn" onclick="directPay('${id}',true);closeAction()">✓ Settle</button>
        </div>
        <button class="btn danger" onclick="deleteCustomer('${id}')">🗑 Delete User</button>
      </div>`;
    document.getElementById('actionSave').classList.add('hidden');
    document.getElementById('actionDelete').classList.add('hidden');
    document.getElementById('actionModal').classList.remove('hidden');
  }

  window.renderChat=function(){
    let c=state.customers.find(x=>x.id===activeCustomer); if(!c) return;
    chatAvatar.textContent=initials(c.name); chatName.textContent=c.name;
    chatSub.textContent=(safePhoneLabel(c.phone)||'No phone')+' • '+(c.village||'No village')+' • Due '+money(customerDue(c.id));
    chatCall.onclick=()=>{let d=phoneDigits(c.phone); if(!d) return alert('Phone number নেই'); location.href='tel:+'+d;};
    chatWhats.onclick=()=>openWhatsApp(c.phone, customerReminderText(c));
    chatShare.onclick=()=>shareCustomerBill(c.id);
    chatBill.onclick=()=>{closeChat();showPage('billPage');billCustomer.value=c.id;toggleManual();previewBill()};
    chatPay.onclick=()=>directPay(c.id,false);
    chatSettle.onclick=()=>directPay(c.id,true);
    chatLedger.onclick=()=>renderChatLedger(c.id);
    chatEdit.onclick=()=>openCustomer(c.id);
    if(chatMore) chatMore.onclick=()=>openMoreMenu(c.id);

    let bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    let out=[];
    if((+c.openingDue||0)>0){
      out.push(`<div class="bubble setB"><b>Opening Due</b><div class="chat-topnote">আগের বাকি</div><b>${money(c.openingDue)}</b></div>`);
    }
    bills.forEach(b=>{
      out.push(`<div class="day">${esc(b.date)}</div>
        <div class="bubble billB">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b>${esc(b.billNo)}</b><div class="chat-topnote">${esc(b.customerName)}</div></div><div style="text-align:right"><div><b>${money(billDue(b))}</b></div><div class="chat-topnote">Due</div></div></div>
          <div style="margin-top:8px;line-height:1.55">Total ${money(b.allTotal)}<br>Paid/Adjusted ${money(billPaid(b))}${b.note?`<br><small>Note: ${esc(b.note)}</small>`:''}</div>
          <div class="bubble-actions">
            <button type="button" onclick="viewBill('${b.id}')">View</button>
            <button type="button" class="primary" onclick="openPayment('${b.id}')">Pay</button>
            <button type="button" onclick="shareCustomerBill('${c.id}','${b.id}')">Reminder + Bill</button>
            <button type="button" onclick="deleteBill('${b.id}')">Delete</button>
          </div>
        </div>`);
      (b.payments||[]).forEach(p=>out.push(`<div class="bubble ${(p.mode||'').toLowerCase().includes('settle')?'setB':'payB'}"><b>${esc(p.mode)}</b><br><b>${money(p.amount)}</b><br>${esc(p.receivedIn||'')}<br><small>${esc(p.note||'')}</small><div class="entry-tools"><button type="button" onclick="editEntry('${p.id}')">Edit</button><button type="button" onclick="editEntry('${p.id}')">Undo/Delete</button></div></div>`));
    });
    chatBody.innerHTML=out.join('')||`<div class="bubble setB">No bill yet</div>`;
  }

  const baseInvoice=window.invoiceHTML;
  window.invoiceHTML=function(b,cls){
    let tpl=(document.getElementById('template')?.value||state.settings.template||'premium');
    // let previous template engine render most variants except compact phone ones
    if(!(tpl==='phone' || tpl==='compact' || cls==='phoneview')) return baseInvoice(b,cls);
    let due=billDue(b), paid=billPaid(b), payAmount=due>0?due:b.allTotal;
    let upi=makeUpiLink(payAmount,b.billNo);
    let fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    let customerLine=`<div class="customer-lines"><b>${esc(b.customerName)}</b><br>${esc(safePhoneLabel(b.phone)||b.phone||'')}<br>${esc(b.address||b.village||'')}</div>`;
    return `<div class="invoice v31bill phone ${cls} ${tpl}">
      <div class="v31-head"><h3>${esc(state.settings.company)}</h3><div class="subline">Pro: ${esc(state.settings.owner)}<br>☎/WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div>
      <div class="v31-section"><div class="v31-row"><span>Bill No</span><b>${esc(b.billNo)}</b></div><div class="v31-row"><span>Date</span><b>${esc(b.date)}</b></div></div>
      <div class="v31-section"><div class="v31-section-title">Customer</div>${customerLine}</div>
      <div class="v31-section"><div class="v31-row"><span>Season</span><b>${esc(b.season)}</b></div><div class="v31-row"><span>Land</span><b>${esc(b.landAmount)} ${esc(b.unit)}</b></div><div class="v31-row"><span>Converted</span><b>${Number(b.bigha||0).toFixed(2)} বিঘা</b></div><div class="v31-row"><span>Rate</span><b>${money(b.rate)}/বিঘা</b></div></div>
      <div class="v31-section"><div class="v31-row"><span>Current Bill</span><b>${money(b.current)}</b></div><div class="v31-row"><span>Previous Due</span><b>${money(b.previousDue)}</b></div><div class="v31-row v31-total"><span>All Total</span><b>${money(b.allTotal)}</b></div><div class="v31-row"><span>Paid</span><b>${money(paid)}</b></div><div class="v31-row v31-total"><span>Due</span><b>${money(due)}</b></div></div>
      <div class="compact-grid"><div class="compact-chip"><b>Status</b><br>${esc(billStatus(b))}</div><div class="compact-chip"><b>Mode</b><br>${esc(b.payments?.[0]?.mode||'-')}</div><div class="compact-chip"><b>Received</b><br>${esc(b.payments?.[0]?.receivedIn||'-')}</div><div class="compact-chip"><b>Note</b><br>${esc(b.note||'-')}</div></div>
      <div class="v31-section v31-pay-section"><div class="v31-section-title">Payment QR</div><div class="head-small">UPI: ${esc(state.settings.upi)}</div><div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div><div class="head-small"><b>Scan & Pay ${money(payAmount)}</b></div></div>
      <div class="footer-note">ধন্যবাদ। সময়মতো বিল পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।</div>
      <div style="text-align:right;font-size:11px;margin-top:8px">Sign: ${esc(state.settings.owner)}</div>
    </div>`;
  }

  const oldRenderInv=window.renderInvoice;
  window.renderInvoice=function(b){
    let mode=document.getElementById('printMode')?.value||'thermal80';
    if(mode==='phoneview'){
      document.getElementById('billPreview').innerHTML=window.invoiceHTML(b,'phoneview');
      if(window.renderQRCodes) setTimeout(renderQRCodes,60);
      return;
    }
    oldRenderInv(b); if(window.renderQRCodes) setTimeout(renderQRCodes,60);
  }

  const oldLoad=window.loadSettings;
  window.loadSettings=function(){
    if(oldLoad) oldLoad();
    if(document.getElementById('setCountry')) document.getElementById('setCountry').value='+91';
    if(document.getElementById('setPayee')) document.getElementById('setPayee').value=state.settings.owner||state.settings.payee||'';
  }

  const oldSave=window.saveSettings;
  window.saveSettings=function(){
    if(document.getElementById('setPayee')) document.getElementById('setPayee').value=document.getElementById('setOwner').value;
    return oldSave();
  }

  fillSelects(); loadSettings(); renderAll(true);
});
})();



/* ===== V35 ULTRA PREMIUM PATCH ===== */
(function(){
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,220));else setTimeout(fn,220)}
ready(function(){
  function fmtPhone(raw){
    let d=String(raw||'').replace(/\D/g,'');
    let cc=String(state.settings.country||'+91').replace(/\D/g,'')||'91';
    if(!d) return '';
    if(d.length===10) return '+'+cc+' '+d;
    if(d.length===11 && d.startsWith('0')) return '+'+cc+' '+d.slice(1);
    if(d.startswith){} // harmless no-op
    if(d.length>10 && d.startsWith(cc)) return '+'+cc+' '+d.slice(cc.length);
    if(d.length>10) return '+'+d;
    return '+'+cc+' '+d;
  }
  window.safePhoneLabel=function(raw){return fmtPhone(raw)};
  window.phoneDigits=function(raw){return fmtPhone(raw).replace(/\D/g,'')};
  window.openWhatsApp=function(raw,text=''){
    const d=phoneDigits(raw);
    if(!d || d.length<12) return alert('Valid phone number নেই। 10 digit phone দিন, country code auto +91 হবে।');
    const url='https://wa.me/'+d+(text?('?text='+encodeURIComponent(text)):'');
    window.open(url,'_blank');
  };

  window.openPayment=function(id){
    showPage('payPage');
    $('payBill').value=id;
    updatePayInfo();
    const b=state.bills.find(x=>x.id===id); if(b) $('payAmount').value=Math.max(0,billDue(b));
    setTimeout(()=>$('payAmount').focus(),60);
  };

  window.renderCustomers=function(){
    let q=$('customerSearch').value.toLowerCase().trim();
    let rows=state.customers.filter(c=>(c.name+c.phone+c.village+c.address).toLowerCase().includes(q));
    $('customerList').innerHTML=rows.length?rows.map(c=>{
      let due=customerDue(c.id);
      let bills=state.bills.filter(b=>b.customerId===c.id);
      let last=(bills.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0]||{}).date||'-';
      return `<div class="customer-row" onclick="openChat('${c.id}')"><div class="avatar">${esc(initials(c.name))}</div><div class="cust-main"><div class="cust-name">${esc(c.name)}</div><div class="cust-sub">📞 ${esc(safePhoneLabel(c.phone)||'No phone')} • 📍 ${esc(c.village||'No village')}</div><div class="cust-mini"><span class="mini-chip">Bills ${bills.length}</span><span class="mini-chip">Last ${esc(last)}</span><span class="mini-chip ${due>0?'red':'green'}">${due>0?('Due '+money(due)):'Paid'}</span></div></div><span class="pill ${due>0?'due':'paid'}">${due>0?money(due):'Paid'}</span></div>`;
    }).join(''):`<div class="card muted">No customer yet</div>`;
  };

  window.directPay=function(id,settle=false){
    const c=state.customers.find(x=>x.id===id); if(!c) return;
    actionContext={type:'directpay',customerId:id,settle};
    $('actionTitle').textContent=settle?'Settle Due':'Receive Payment';
    $('actionBody').innerHTML=`<div class="action-sheet"><div class="info-box">${esc(c.name)} • Live Due <b>${money(customerDue(id))}</b></div><label>Amount</label><input id="dpAmount" type="number" value="${customerDue(id)||0}"><div class="two"><div><label>Mode</label><select id="dpMode"><option>Cash</option><option>UPI</option><option>Bank</option><option>Online</option><option>Settlement</option></select></div><div><label>Received In</label><input id="dpReceived" value="${settle?'Settled':'Cash'}"></div></div><label>Note</label><input id="dpNote" value="${settle?'Settled from user chat':'Direct due payment'}"></div>`;
    $('actionSave').classList.remove('hidden'); $('actionDelete').classList.add('hidden'); $('actionModal').classList.remove('hidden');
    $('dpMode').value=settle?'Settlement':'Cash';
  };

  const _saveAction=window.saveAction;
  window.saveAction=function(){
    if(actionContext && actionContext.type==='directpay'){
      let id=actionContext.customerId, settle=!!actionContext.settle;
      let amt=+($('dpAmount').value||0); if(!amt) return alert('Amount দিন');
      let mode=$('dpMode').value|| (settle?'Settlement':'Cash');
      let received=$('dpReceived').value|| (settle?'Settled':'Cash');
      let note=$('dpNote').value|| (settle?'Settled from user chat':'Direct due payment');
      let left=amt;
      state.bills.filter(b=>b.customerId===id && billDue(b)>0).forEach(b=>{
        if(left<=0) return;
        let pay=Math.min(left,billDue(b));
        (b.payments=b.payments||[]).push({id:uid(),date:today(),amount:pay,mode,receivedIn:received,note});
        left-=pay;
      });
      let c=state.customers.find(x=>x.id===id);
      if(left>0 && c) c.openingDue=Math.max((+c.openingDue||0)-left,0);
      saveState(); if(activeCustomer) renderChat(); closeAction(); return;
    }
    return _saveAction ? _saveAction() : undefined;
  };

  window.openMoreMenu=function(id){
    const c=state.customers.find(x=>x.id===id); if(!c) return;
    actionContext={type:'more',customerId:id};
    $('actionTitle').textContent='User Quick Actions';
    $('actionBody').innerHTML=`<div class="action-sheet"><div class="info-box"><b>${esc(c.name)}</b><br>${esc(safePhoneLabel(c.phone)||'No phone')} • ${esc(c.village||'No village')}<br>Live Due <b>${money(customerDue(id))}</b></div><div class="more-grid"><button class="btn" onclick="openCustomer('${id}');closeAction()">✏ Edit</button><button class="btn" onclick="renderChatLedger('${id}');closeAction()">📒 Ledger</button><button class="btn" onclick="directPay('${id}',false);closeAction()">₹ Receive</button><button class="btn" onclick="directPay('${id}',true);closeAction()">✓ Settle</button><button class="btn" onclick="waCustomerText('${id}');closeAction()">Ⓦ WhatsApp</button><button class="btn" onclick="smsReminder('${id}');closeAction()">✉ SMS</button></div><button class="btn danger" onclick="deleteCustomer('${id}')">🗑 Delete User</button></div>`;
    $('actionSave').classList.add('hidden'); $('actionDelete').classList.add('hidden'); $('actionModal').classList.remove('hidden');
  };

  window.renderChatLedger=function(id){
    let c=state.customers.find(x=>x.id===id); if(!c) return;
    let entries=[];
    state.bills.filter(b=>b.customerId===id).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(b=>{
      entries.push(`<div class="bubble billB"><b>${esc(b.billNo)}</b><div class="chat-topnote">${esc(b.date)} • Bill raised</div><div><b>+${money(b.allTotal)}</b></div></div>`);
      (b.payments||[]).forEach(p=>entries.push(`<div class="bubble ${(String(p.mode).toLowerCase().includes('settle'))?'setB':'payB'}"><b>${esc(p.mode)}</b><div class="chat-topnote">${esc(p.date)} • ${esc(p.receivedIn||'')}</div><div><b>-${money(p.amount)}</b></div><small>${esc(p.note||'')}</small><div class="entry-tools"><button type="button" onclick="editEntry('${p.id}')">Edit</button><button type="button" onclick="editEntry('${p.id}')">Undo/Delete</button></div></div>`));
    });
    $('chatBody').innerHTML=`<div class="chat-summary"><div class="sum-card"><small>Live Due</small><b>${money(customerDue(id))}</b></div><div class="sum-card"><small>Total Bills</small><b>${state.bills.filter(b=>b.customerId===id).length}</b></div><div class="sum-card"><small>Customer</small><b>${esc(c.village||'-')}</b></div></div><div class="chat-stack">${entries.join('')||'<div class="bubble setB">No ledger entry yet</div>'}</div>`;
  };

  window.renderChat=function(){
    let c=state.customers.find(x=>x.id===activeCustomer); if(!c) return;
    chatAvatar.textContent=initials(c.name); chatName.textContent=c.name;
    chatSub.textContent=(safePhoneLabel(c.phone)||'No phone')+' • '+(c.village||'No village')+' • Due '+money(customerDue(c.id));
    chatCall.onclick=()=>{let d=phoneDigits(c.phone); if(!d) return alert('Phone number নেই'); location.href='tel:+'+d;};
    chatWhats.onclick=()=>openWhatsApp(c.phone, customerReminderText(c));
    chatShare.onclick=()=>shareCustomerBill(c.id);
    chatBill.onclick=()=>{closeChat();showPage('billPage');billCustomer.value=c.id;toggleManual();previewBill();};
    chatPay.onclick=()=>directPay(c.id,false);
    chatSettle.onclick=()=>directPay(c.id,true);
    chatLedger.onclick=()=>renderChatLedger(c.id);
    chatEdit.onclick=()=>openCustomer(c.id);
    if(chatMore) chatMore.onclick=()=>openMoreMenu(c.id);
    let bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    let paidTotal=bills.reduce((s,b)=>s+billPaid(b),0), totalTotal=bills.reduce((s,b)=>s+(+b.allTotal||0),0);
    let out=[`<div class="chat-summary"><div class="sum-card"><small>Live Due</small><b>${money(customerDue(c.id))}</b></div><div class="sum-card"><small>Total Bill</small><b>${money(totalTotal)}</b></div><div class="sum-card"><small>Collected</small><b>${money(paidTotal)}</b></div></div><div class="chat-stack">`];
    if((+c.openingDue||0)>0){out.push(`<div class="bubble setB"><b>Opening Due</b><div class="chat-topnote">আগের বাকি</div><b>${money(c.openingDue)}</b></div>`);}    
    bills.forEach(b=>{
      out.push(`<div class="day">${esc(b.date)}</div><div class="bubble billB"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b>${esc(b.billNo)}</b><div class="chat-topnote">${esc(b.season)} • ${esc(b.landAmount)} ${esc(b.unit)}</div></div><div style="text-align:right"><div><b>${money(billDue(b))}</b></div><div class="chat-topnote">Due</div></div></div><div style="margin-top:8px;line-height:1.6">Total ${money(b.allTotal)}<br>Paid/Adjusted ${money(billPaid(b))}${b.note?`<br><small>Note: ${esc(b.note)}</small>`:''}</div><div class="bubble-actions"><button type="button" onclick="viewBill('${b.id}')">View</button><button type="button" class="primary" onclick="openPayment('${b.id}')">Pay</button><button type="button" onclick="shareCustomerBill('${c.id}','${b.id}')">Reminder + Bill</button><button type="button" onclick="deleteBill('${b.id}')">Delete</button></div></div>`);
      (b.payments||[]).forEach(p=>out.push(`<div class="bubble ${(String(p.mode).toLowerCase().includes('settle'))?'setB':'payB'}"><b>${esc(p.mode)}</b><div class="chat-topnote">${esc(p.date)} • ${esc(p.receivedIn||'')}</div><div><b>${money(p.amount)}</b></div><small>${esc(p.note||'')}</small><div class="entry-tools"><button type="button" onclick="editEntry('${p.id}')">Edit</button><button type="button" onclick="editEntry('${p.id}')">Undo/Delete</button></div></div>`));
    });
    out.push('</div>');
    chatBody.innerHTML=out.join('')||`<div class="bubble setB">No bill yet</div>`;
  };

  const originalInvoiceHTML=window.invoiceHTML;
  window.invoiceHTML=function(b,cls){
    let tpl=(document.getElementById('template')?.value||state.settings.template||'premium');
    if(!(tpl==='mini' || tpl==='phone' || tpl==='compact')) return originalInvoiceHTML(b,cls);
    let due=billDue(b), paid=billPaid(b), payAmount=due>0?due:b.allTotal;
    let upi=makeUpiLink(payAmount,b.billNo);
    let fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    return `<div class="invoice mini ${cls} ${tpl}"><div class="v31-head"><h3>${esc(state.settings.company)}</h3><div class="subline">Pro: ${esc(state.settings.owner)}<br>☎/WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div><div class="v31-section"><div class="v31-row"><span>Bill No</span><b>${esc(b.billNo)}</b></div><div class="v31-row"><span>Date</span><b>${esc(b.date)}</b></div></div><div class="v31-section"><div class="v31-section-title">Customer</div><div class="customer-lines"><b>${esc(b.customerName)}</b><br>${esc(safePhoneLabel(b.phone)||b.phone||'')}<br>${esc(b.address||b.village||'')}</div></div><div class="v31-section"><div class="v31-row"><span>Season</span><b>${esc(b.season)}</b></div><div class="v31-row"><span>Land</span><b>${esc(b.landAmount)} ${esc(b.unit)}</b></div><div class="v31-row"><span>Rate</span><b>${money(b.rate)}/বিঘা</b></div><div class="v31-row"><span>Current</span><b>${money(b.current)}</b></div><div class="v31-row"><span>Previous</span><b>${money(b.previousDue)}</b></div><div class="v31-row v31-total"><span>All Total</span><b>${money(b.allTotal)}</b></div><div class="v31-row"><span>Paid</span><b>${money(paid)}</b></div><div class="v31-row v31-total"><span>Due</span><b>${money(due)}</b></div></div><div class="compact-grid"><div class="compact-chip"><b>Status</b><br>${esc(billStatus(b))}</div><div class="compact-chip"><b>Payment</b><br>${esc(b.payments?.[0]?.mode||'-')}</div><div class="compact-chip"><b>Received</b><br>${esc(b.payments?.[0]?.receivedIn||'-')}</div><div class="compact-chip"><b>Note</b><br>${esc((b.note||'-').slice(0,28))}</div></div><div class="v31-section v31-pay-section"><div class="v31-section-title">Payment QR</div><div class="head-small">UPI: ${esc(state.settings.upi)}</div><div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div><div class="head-small"><b>Scan & Pay ${money(payAmount)}</b></div></div><div class="footer-note">ধন্যবাদ। সময়মতো বিল পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।</div><div style="text-align:right;font-size:11px;margin:8px 12px 12px">Sign: ${esc(state.settings.owner)}</div></div>`;
  };

  const oldFillSelects=window.fillSelects;
  window.fillSelects=function(){
    if(oldFillSelects) oldFillSelects();
    const t=document.getElementById('template');
    const st=document.getElementById('setTemplate');
    const opts=`<option value="classic">Classic Official Bill</option><option value="premium">Premium Green Bill</option><option value="boxed">Boxed Modern Bill</option><option value="bengali">Bengali Heavy Bill</option><option value="qrfirst">QR Focused Bill</option><option value="standard">Standard Clean Bill</option><option value="normal">Normal Black Bill</option><option value="thermal">Thermal Compact Bill</option><option value="compact">Compact A6 Bill</option><option value="phone">Phone View Compact</option><option value="mini">Mini Compact Bill</option>`;
    const cur=state.settings.template||'premium';
    if(t){t.innerHTML=opts; if(!Array.from(t.options).some(o=>o.value===cur)) t.value='premium'; else t.value=cur; t.onchange=()=>{state.settings.template=t.value; previewBill();};}
    if(st){st.innerHTML=opts; st.value=cur;}
  };

  const oldRenderInvoice=window.renderInvoice;
  window.renderInvoice=function(b){ oldRenderInvoice(b); if(window.renderQRCodes) setTimeout(renderQRCodes,80); };
  const oldViewBill=window.viewBill;
  window.viewBill=function(id){ oldViewBill(id); if(window.renderQRCodes) setTimeout(renderQRCodes,80); };

  fillSelects(); renderCustomers(); if(activeCustomer) renderChat(); previewBill();
});
})();



/* ==== V36 premium patch ==== */
(function(){
function v36Ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,160));else setTimeout(fn,160)}
v36Ready(function(){
  function normalizePhone(raw){
    let d=String(raw||'').replace(/\D/g,'');
    let cc=String((state.settings.country||'+91')).replace(/\D/g,'') || '91';
    if(!d) return '';
    if(d.length===10) return cc+d;
    if(d.length===11 && d.startsWith('0')) return cc+d.slice(1);
        if(d.length===12 && d.startsWith(cc)) return d;
    if(d.length>10 && d.startsWith(cc)) return d;
    if(d.length>10 && d.startsWith('91')) return d;
    return cc+d.slice(-10);
  }
  window.phoneDigitsV36 = normalizePhone;
  window.safePhoneLabel = function(raw){ let d=normalizePhone(raw); return d?('+'+d.slice(0,d.length-10)+' '+d.slice(-10)):''; };
  window.openWhatsApp = function(raw,text=''){
    const d = normalizePhone(raw);
    if(!d || d.length < 12) return alert('WhatsApp এর জন্য valid 10 digit phone number দিন। Country code auto +91 ধরা হবে।');
    const url = 'https://wa.me/'+d+(text?('?text='+encodeURIComponent(text)):'');
    window.open(url,'_blank');
  };
  window.smsReminder = function(id){ const c=state.customers.find(x=>x.id===id); if(!c) return; const d=normalizePhone(c.phone); if(!d) return alert('Phone number নেই'); location.href='sms:+'+d+'?body='+encodeURIComponent(customerReminderText(c)); };
  window.waCustomerText = function(id){ const c=state.customers.find(x=>x.id===id); if(!c) return; openWhatsApp(c.phone, customerReminderText(c)); };
  window.waText = function(){ if(!currentBill) return alert('Preview bill first'); openWhatsApp(currentBill.phone, reminderTextByBill(currentBill)); };

  window.chatViewBill = function(id){ closeChat(); viewBill(id); };
  window.chatOpenPay = function(id){ closeChat(); openPayment(id); setTimeout(()=>{ if(document.getElementById('payAmount')) document.getElementById('payAmount').focus(); },80); };
  window.chatDeleteBill = function(id){ if(!confirm('Delete this bill?')) return; deleteBill(id); };

  window.renderCustomers = function(){
    let q=(document.getElementById('customerSearch').value||'').toLowerCase().trim();
    let rows=state.customers.filter(c=>(c.name+c.phone+c.village+c.address).toLowerCase().includes(q));
    document.getElementById('customerList').innerHTML = rows.length ? rows.map(c=>{
      let due=customerDue(c.id); let bills=state.bills.filter(b=>b.customerId===c.id);
      let last=(bills.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0]||{}).date||'-';
      return `<div class="customer-row" onclick="openChat('${c.id}')"><div class="avatar">${esc(initials(c.name))}</div><div class="cust-main"><div class="cust-name">${esc(c.name)}</div><div class="cust-sub">📞 ${esc(safePhoneLabel(c.phone)||'No phone')} • 📍 ${esc(c.village||'No village')}</div><div class="cust-mini"><span class="mini-chip">Bills ${bills.length}</span><span class="mini-chip">Last ${esc(last)}</span><span class="mini-chip ${due>0?'red':'green'}">${due>0?('Due '+money(due)):'Paid'}</span></div></div><span class="pill ${due>0?'due':'paid'}">${due>0?money(due):'Paid'}</span></div>`;
    }).join('') : `<div class="card muted">No customer yet</div>`;
  };

  window.openPayment = function(id){
    showPage('payPage'); document.getElementById('payBill').value=id; updatePayInfo();
    const b=state.bills.find(x=>x.id===id); if(b) document.getElementById('payAmount').value = Math.max(0,billDue(b));
  };

  window.directPay = function(id,settle=false){
    let c=state.customers.find(x=>x.id===id); if(!c) return;
    actionContext={type:'v36directpay',customerId:id,settle:settle};
    document.getElementById('actionTitle').textContent = settle?'Settle Due':'Receive Payment';
    document.getElementById('actionBody').innerHTML = `<div class="action-sheet"><div class="info-box"><b>${esc(c.name)}</b><br>${esc(safePhoneLabel(c.phone)||'No phone')} • ${esc(c.village||'No village')}<br>Live Due <b>${money(customerDue(id))}</b></div><label>Amount</label><input id="v36Amount" type="number" value="${customerDue(id)||0}"><div class="two"><div><label>Mode</label><select id="v36Mode"><option>${settle?'Settlement':'Cash'}</option><option>UPI</option><option>Bank</option><option>Online</option><option>Cash</option><option>Settlement</option></select></div><div><label>Received In</label><input id="v36Received" value="${settle?'Settled':'Cash'}"></div></div><label>Note</label><input id="v36Note" value="${settle?'Settled from user chat':'Direct due payment'}"></div>`;
    document.getElementById('actionSave').classList.remove('hidden');
    document.getElementById('actionDelete').classList.add('hidden');
    document.getElementById('actionModal').classList.remove('hidden');
  };

  const oldSaveActionV36 = window.saveAction;
  window.saveAction = function(){
    if(actionContext && actionContext.type==='v36directpay'){
      let id=actionContext.customerId, settle=!!actionContext.settle;
      let amt=+(document.getElementById('v36Amount').value||0); if(!amt) return alert('Amount দিন');
      let mode=document.getElementById('v36Mode').value || (settle?'Settlement':'Cash');
      let received=document.getElementById('v36Received').value || (settle?'Settled':'Cash');
      let note=document.getElementById('v36Note').value || (settle?'Settled from user chat':'Direct due payment');
      let left=amt;
      state.bills.filter(b=>b.customerId===id && billDue(b)>0).forEach(b=>{
        if(left<=0) return;
        let pay=Math.min(left,billDue(b));
        (b.payments=b.payments||[]).push({id:uid(),date:today(),amount:pay,mode,receivedIn:received,note});
        left-=pay;
      });
      let c=state.customers.find(x=>x.id===id); if(left>0 && c) c.openingDue=Math.max((+c.openingDue||0)-left,0);
      saveState(); if(activeCustomer) renderChat(); closeAction(); return;
    }
    return oldSaveActionV36 ? oldSaveActionV36() : undefined;
  };

  window.renderChatLedger = function(id){
    let c=state.customers.find(x=>x.id===id); if(!c) return;
    let entries=[];
    state.bills.filter(b=>b.customerId===id).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(b=>{
      entries.push(`<div class="bubble billB"><b>${esc(b.billNo)}</b><div class="chat-topnote">${esc(b.date)} • Bill raised</div><div><b>+${money(b.allTotal)}</b></div></div>`);
      (b.payments||[]).forEach(p=>entries.push(`<div class="bubble ${(String(p.mode).toLowerCase().includes('settle'))?'setB':'payB'}"><b>${esc(p.mode)}</b><div class="chat-topnote">${esc(p.date)} • ${esc(p.receivedIn||'')}</div><div><b>-${money(p.amount)}</b></div><small>${esc(p.note||'')}</small><div class="entry-tools"><button type="button" onclick="editEntry('${p.id}')">Edit</button><button type="button" onclick="editEntry('${p.id}')">Undo/Delete</button></div></div>`));
    });
    document.getElementById('chatBody').innerHTML = `<div class="chat-summary"><div class="sum-card"><small>Live Due</small><b>${money(customerDue(id))}</b></div><div class="sum-card"><small>Total Bills</small><b>${state.bills.filter(b=>b.customerId===id).length}</b></div><div class="sum-card"><small>Village</small><b>${esc(c.village||'-')}</b></div></div><div class="chat-stack">${entries.join('')||'<div class="bubble setB">No ledger entry yet</div>'}</div>`;
  };

  window.renderChat = function(){
    let c=state.customers.find(x=>x.id===activeCustomer); if(!c) return;
    chatAvatar.textContent=initials(c.name);
    chatName.textContent=c.name;
    chatSub.textContent=(safePhoneLabel(c.phone)||'No phone')+' • '+(c.village||'No village')+' • Due '+money(customerDue(c.id));
    chatCall.onclick=()=>{ const d=normalizePhone(c.phone); if(!d) return alert('Phone number নেই'); location.href='tel:+'+d; };
    chatWhats.onclick=()=>openWhatsApp(c.phone, customerReminderText(c));
    chatShare.onclick=()=>shareCustomerBill(c.id);
    chatBill.onclick=()=>{ closeChat(); showPage('billPage'); billCustomer.value=c.id; toggleManual(); previewBill(); };
    chatPay.onclick=()=>directPay(c.id,false);
    chatSettle.onclick=()=>directPay(c.id,true);
    chatLedger.onclick=()=>renderChatLedger(c.id);
    chatEdit.onclick=()=>openCustomer(c.id);
    if(chatMore) chatMore.onclick=()=>openMoreMenu(c.id);

    let bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    let totalBill=bills.reduce((s,b)=>s+(+b.allTotal||0),0), totalPaid=bills.reduce((s,b)=>s+billPaid(b),0);
    let out=[`<div class="chat-summary"><div class="sum-card"><small>Live Due</small><b>${money(customerDue(c.id))}</b></div><div class="sum-card"><small>Total Bill</small><b>${money(totalBill)}</b></div><div class="sum-card"><small>Collected</small><b>${money(totalPaid)}</b></div></div><div class="chat-stack">`];
    if((+c.openingDue||0)>0) out.push(`<div class="bubble setB"><b>Opening Due</b><div class="chat-topnote">আগের বাকি</div><b>${money(c.openingDue)}</b></div>`);
    bills.forEach(b=>{
      out.push(`<div class="day">${esc(b.date)}</div><div class="bubble billB"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b>${esc(b.billNo)}</b><div class="chat-topnote">${esc(b.season||'-')} • ${esc(String(b.landAmount||''))} ${esc(b.unit||'')}</div></div><div style="text-align:right"><div><b>${money(billDue(b))}</b></div><div class="chat-topnote">Due</div></div></div><div style="margin-top:8px;line-height:1.58">Total ${money(b.allTotal)}<br>Paid/Adjusted ${money(billPaid(b))}${b.note?`<br><small>Note: ${esc(b.note)}</small>`:''}</div><div class="bubble-actions"><button type="button" onclick="chatViewBill('${b.id}')">View</button><button type="button" class="primary" onclick="chatOpenPay('${b.id}')">Pay</button><button type="button" onclick="shareCustomerBill('${c.id}','${b.id}')">Reminder + Bill</button><button type="button" onclick="chatDeleteBill('${b.id}')">Delete</button></div></div>`);
      (b.payments||[]).forEach(p=>out.push(`<div class="bubble ${(String(p.mode).toLowerCase().includes('settle'))?'setB':'payB'}"><b>${esc(p.mode)}</b><div class="chat-topnote">${esc(p.date)} • ${esc(p.receivedIn||'')}</div><div><b>${money(p.amount)}</b></div><small>${esc(p.note||'')}</small><div class="entry-tools"><button type="button" onclick="editEntry('${p.id}')">Edit</button><button type="button" onclick="editEntry('${p.id}')">Undo/Delete</button></div></div>`));
    });
    out.push('</div>');
    chatBody.innerHTML = out.join('') || `<div class="bubble setB">No bill yet</div>`;
    const cm=document.getElementById('chatMore'); if(cm){ cm.textContent='⋯'; cm.title='More'; }
    const sh=document.getElementById('chatShare'); if(sh){ sh.textContent='⇪'; sh.title='Share bill image'; }
    const ca=document.getElementById('chatCall'); if(ca){ ca.textContent='✆'; ca.title='Call'; }
    const wa=document.getElementById('chatWhats'); if(wa){ wa.textContent='Ⓦ'; wa.title='WhatsApp'; }
  };

  window.shareCustomerBill = async function(customerId,billId){
    let bills=state.bills.filter(b=>b.customerId===customerId).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    if(!bills.length) return alert('No bill found');
    currentBill = billId ? (state.bills.find(b=>b.id===billId) || bills[0]) : bills[0];
    renderInvoice(currentBill); if(window.renderQRCodes) renderQRCodes();
    const blob = await invoiceBlob();
    const file = new File([blob], `${currentBill.billNo}.png`, {type:'image/png'});
    const text = reminderTextByBill(currentBill);
    try{
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({title:'Asha Bill Reminder', text, files:[file]});
      }else if(navigator.share){
        await navigator.share({title:'Asha Bill Reminder', text});
        downloadBlob(blob, `${currentBill.billNo}.png`);
      }else{
        downloadBlob(blob, `${currentBill.billNo}.png`);
        openWhatsApp(currentBill.phone, text);
      }
    }catch(e){ console.warn(e); }
  };

  const prevInvoiceHTML = window.invoiceHTML;
  window.invoiceHTML = function(b, cls){
    const tpl=(document.getElementById('template')?.value || state.settings.template || 'premium');
    const isCompact = (cls==='phoneview' || tpl==='mini' || tpl==='phone' || tpl==='compact');
    if(!isCompact) return prevInvoiceHTML(b, cls);
    let due=billDue(b), paid=billPaid(b), payAmount=due>0?due:b.allTotal;
    let upi=makeUpiLink(payAmount,b.billNo);
    let fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    return `<div class="invoice v36compact ${esc(cls||'')} ${esc(tpl)}"><div class="v36-head"><h3>${esc(state.settings.company)}</h3><div class="sub">Pro: ${esc(state.settings.owner)}<br>☎/WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div><div class="v36-sec"><div class="row"><span>Bill No</span><b>${esc(b.billNo)}</b></div><div class="row"><span>Date</span><b>${esc(b.date)}</b></div></div><div class="v36-sec"><div class="customer-box"><b>${esc(b.customerName)}</b><br>${esc(safePhoneLabel(b.phone)||b.phone||'')}<br>${esc(b.address||b.village||'')}</div></div><div class="v36-sec"><div class="row"><span>Season</span><b>${esc(b.season)}</b></div><div class="row"><span>Land</span><b>${esc(b.landAmount)} ${esc(b.unit)}</b></div><div class="row"><span>Rate</span><b>${money(b.rate)}/বিঘা</b></div><div class="row"><span>Current</span><b>${money(b.current)}</b></div><div class="row"><span>Previous</span><b>${money(b.previousDue)}</b></div><div class="row total"><span>Due</span><b>${money(due)}</b></div></div><div class="v36-sec"><div class="chips"><div class="chip"><b>All Total</b><br>${money(b.allTotal)}</div><div class="chip"><b>Paid</b><br>${money(paid)}</div><div class="chip"><b>Status</b><br>${esc(billStatus(b))}</div><div class="chip"><b>Note</b><br>${esc((b.note||'-').slice(0,24))}</div></div></div><div class="v36-sec"><div class="qrbox"><div style="font-size:11px;margin-bottom:6px">UPI: ${esc(state.settings.upi)}</div><div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div><div style="font-size:12px;margin-top:6px"><b>Scan & Pay ${money(payAmount)}</b></div></div></div><div class="foot">ধন্যবাদ। সময়মতো বিল পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।<br>Sign: ${esc(state.settings.owner)}</div></div>`;
  };

  const prevRenderInvoice = window.renderInvoice;
  window.renderInvoice = function(b){ prevRenderInvoice(b); if(window.renderQRCodes) setTimeout(renderQRCodes,70); };
  const prevViewBill = window.viewBill;
  window.viewBill = function(id){ prevViewBill(id); if(window.renderQRCodes) setTimeout(renderQRCodes,70); };

  const oldFillSelects = window.fillSelects;
  window.fillSelects = function(){
    if(oldFillSelects) oldFillSelects();
    const t=document.getElementById('template');
    const st=document.getElementById('setTemplate');
    const opts=`<option value="classic">Classic Official Bill</option><option value="premium">Premium Green Bill</option><option value="boxed">Boxed Modern Bill</option><option value="bengali">Bengali Heavy Bill</option><option value="qrfirst">QR Focused Bill</option><option value="standard">Standard Clean Bill</option><option value="normal">Normal Black Bill</option><option value="thermal">Thermal Compact Bill</option><option value="compact">Compact A6 Bill</option><option value="phone">Phone View Compact</option><option value="mini">Mini Compact Bill</option>`;
    const cur=state.settings.template || 'premium';
    if(t){ t.innerHTML=opts; t.value=cur; }
    if(st){ st.innerHTML=opts; st.value=cur; }
  };

  fillSelects(); renderCustomers(); if(activeCustomer) renderChat(); previewBill();
});
})();


/* ==== V37 ultra polish patch ==== */
(function(){
  const fontLink=document.createElement('link');
  fontLink.rel='stylesheet';
  fontLink.href='https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap';
  document.head.appendChild(fontLink);
  state.settings = Object.assign({rateBigha:2200,rateKatha:110,appFont:'Inter',billFont:'Hind Siliguri'}, state.settings||{});

  function setAppFonts(){
    const appMap={Inter:'"Inter",system-ui,sans-serif',Poppins:'"Poppins",system-ui,sans-serif',Nunito:'"Nunito",system-ui,sans-serif',System:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'};
    const billMap={'Hind Siliguri':'"Hind Siliguri",system-ui,sans-serif',Inter:'"Inter",system-ui,sans-serif',Poppins:'"Poppins",system-ui,sans-serif',Nunito:'"Nunito",system-ui,sans-serif'};
    document.documentElement.style.setProperty('--app-font', appMap[state.settings.appFont]||appMap.Inter);
    document.documentElement.style.setProperty('--bill-font', billMap[state.settings.billFont]||billMap['Hind Siliguri']);
  }

  const prevApplyThemeV37 = window.applyTheme;
  window.applyTheme = function(){ if(prevApplyThemeV37) prevApplyThemeV37(); setAppFonts(); };

  function injectV37Settings(){
    const settingsCard=document.querySelector('#settingsPage .card');
    if(!settingsCard || document.getElementById('setRateBigha')) return;
    const block=document.createElement('div');
    block.innerHTML=`
      <div class="settings-inline-note">V37 premium controls: default rate, font, compact bill style.</div>
      <div class="two">
        <div><label>Rate per বিঘা</label><input id="setRateBigha" type="number"></div>
        <div><label>Rate per কাঠা</label><input id="setRateKatha" type="number"></div>
      </div>
      <div class="font-grid">
        <div><label>App Font</label><select id="setAppFont"><option>Inter</option><option>Poppins</option><option>Nunito</option><option>System</option></select></div>
        <div><label>Bill Font</label><select id="setBillFont"><option>Hind Siliguri</option><option>Inter</option><option>Poppins</option><option>Nunito</option></select></div>
      </div>`;
    const actionBar=settingsCard.querySelector('.action-bar');
    settingsCard.insertBefore(block, actionBar);
  }
  injectV37Settings();

  const prevLoadSettingsV37 = window.loadSettings;
  window.loadSettings = function(){
    if(prevLoadSettingsV37) prevLoadSettingsV37();
    injectV37Settings();
    if(document.getElementById('setRateBigha')) document.getElementById('setRateBigha').value = state.settings.rateBigha ?? 2200;
    if(document.getElementById('setRateKatha')) document.getElementById('setRateKatha').value = state.settings.rateKatha ?? 110;
    if(document.getElementById('setAppFont')) document.getElementById('setAppFont').value = state.settings.appFont || 'Inter';
    if(document.getElementById('setBillFont')) document.getElementById('setBillFont').value = state.settings.billFont || 'Hind Siliguri';
  };

  const prevSaveSettingsV37 = window.saveSettings;
  window.saveSettings = function(){
    state.settings.rateBigha = +(document.getElementById('setRateBigha')?.value || state.settings.rateBigha || 2200);
    state.settings.rateKatha = +(document.getElementById('setRateKatha')?.value || state.settings.rateKatha || 110);
    state.settings.appFont = document.getElementById('setAppFont')?.value || state.settings.appFont || 'Inter';
    state.settings.billFont = document.getElementById('setBillFont')?.value || state.settings.billFont || 'Hind Siliguri';
    if(prevSaveSettingsV37) prevSaveSettingsV37();
    setAppFonts();
    updateRateByUnit();
  };

  function rateByUnit(unit){
    if(unit==='katha') return +(state.settings.rateKatha || ((state.settings.rateBigha||2200)/20));
    if(unit==='decimal') return +(((state.settings.rateBigha||2200)/40).toFixed(2));
    return +(state.settings.rateBigha || 2200);
  }
  window.rateByUnit = rateByUnit;
  function rateLabel(unit){ return unit==='katha' ? 'Rate / কাঠা' : unit==='decimal' ? 'Rate / ডেসিমেল' : 'Rate / বিঘা'; }
  function updateRateByUnit(force=false){
    const u=document.getElementById('landUnit')?.value || 'bigha';
    const rate=document.getElementById('rate');
    if(!rate) return;
    const wrap=rate.closest('div');
    const label=wrap ? wrap.querySelector('label') : null;
    if(label) label.textContent = rateLabel(u);
    if(force || !rate.dataset.touched || rate.dataset.auto==='1'){
      rate.value = rateByUnit(u);
      rate.dataset.auto='1';
    }
  }
  window.updateRateByUnit = updateRateByUnit;

  const prevFillV37 = window.fillSelects;
  window.fillSelects = function(){
    if(prevFillV37) prevFillV37();
    const templateOpts=`<option value="classic">Classic Official Bill</option><option value="premium">Premium Green Bill</option><option value="boxed">Boxed Modern Bill</option><option value="bengali">Bengali Heavy Bill</option><option value="qrfirst">QR Focused Bill</option><option value="standard">Standard Clean Bill</option><option value="normal">Normal Black Bill</option><option value="thermal">Thermal Compact Bill</option><option value="compact">Compact A6 Bill</option><option value="phone">Phone View Compact</option><option value="mini">Mini Compact Bill</option>`;
    if(document.getElementById('template')){ document.getElementById('template').innerHTML=templateOpts; document.getElementById('template').value=state.settings.template||'premium'; }
    if(document.getElementById('setTemplate')){ document.getElementById('setTemplate').innerHTML=templateOpts; document.getElementById('setTemplate').value=state.settings.template||'premium'; }
    updateRateByUnit();
  };

  function landUnitLabel(unit){ return unit==='katha' ? 'কাঠা' : unit==='decimal' ? 'ডেসিমেল' : 'বিঘা'; }
  function compactStatusLine(b){
    const paid=billPaid(b), due=billDue(b), mode=b.payments?.[0]?.mode||'Cash', received=b.payments?.[0]?.receivedIn||'Cash';
    return `${billStatus(b)} • ${mode} • ${received}`;
  }

  window.reminderTextByBill = function(b){
    return `${state.settings.company}
Bill No: ${b.billNo}
Name: ${b.customerName}
জমির পরিমাণ: ${b.landAmount} ${landUnitLabel(b.unit)}
All Total: ${money(b.allTotal)}
Paid/Adjusted: ${money(billPaid(b))}
Due: ${money(billDue(b))}
আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে
Thank you: ${state.settings.owner} (owner)
Contact: ${state.settings.contact}`;
  };

  window.customerReminderText = function(c){
    const bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    const last=bills[0];
    if(last) return reminderTextByBill(last);
    return `${state.settings.company}
Name: ${c.name}
Current Due: ${money(customerDue(c.id))}
আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে
Thank you: ${state.settings.owner} (owner)`;
  };

  const oldInvoiceHTMLV37 = window.invoiceHTML;
  window.invoiceHTML = function(b, cls){
    const tpl=(document.getElementById('template')?.value || state.settings.template || 'premium');
    const compactMode = ['phone','mini','compact'].includes(tpl) || cls==='phoneview';
    if(!compactMode) return oldInvoiceHTMLV37 ? oldInvoiceHTMLV37(b, cls) : '';
    const due=billDue(b), paid=billPaid(b), payAmount=due>0?due:b.allTotal;
    const unitLabel=landUnitLabel(b.unit);
    const rateSuffix = b.unit==='katha' ? '/কাঠা' : b.unit==='decimal' ? '/ডেসিমেল' : '/বিঘা';
    const upi = makeUpiLink ? makeUpiLink(payAmount,b.billNo) : `upi://pay?pa=${encodeURIComponent(state.settings.upi)}&pn=${encodeURIComponent(state.settings.owner)}&am=${Number(payAmount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(b.billNo)}`;
    const fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    const extraNote=(b.note||'').trim();
    const modeClass = tpl==='mini' ? 'v37share' : 'v37compact';
    return `<div class="invoice ${modeClass} ${esc(cls||'')} ${esc(tpl)}"><div class="v37-head"><h3>${esc(state.settings.company)}</h3><div class="v37-sub">Pro: ${esc(state.settings.owner)}<br>☎ / WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div><div class="v37-sec"><div class="v37-grid2"><div><span class="label">Bill No</span><b>${esc(b.billNo)}</b></div><div style="text-align:right"><span class="label">Date</span><b>${esc(b.date)}</b></div></div></div><div class="v37-sec"><div class="label">Customer</div><div class="cust"><b>${esc(b.customerName)}</b><br>${esc(safePhoneLabel(b.phone)||b.phone||'')}<br>${esc(b.address||b.village||'')}</div></div><div class="v37-sec"><div class="v37-grid2"><div class="mini-stat"><span class="label">Season</span><b>${esc(b.season)}</b></div><div class="mini-stat"><span class="label">জমির পরিমাণ</span><b>${esc(b.landAmount)} ${unitLabel}</b><span>${b.bigha.toFixed(2)} বিঘা</span></div><div class="mini-stat"><span class="label">Rate</span><b>${money(b.rate)}</b><span>${rateSuffix}</span></div><div class="mini-stat"><span class="label">Current Bill</span><b>${money(b.current)}</b><span>${compactStatusLine(b)}</span></div></div><div class="v37-total"><div class="mini-stat"><span class="label">All Total</span><b>${money(b.allTotal)}</b></div><div class="mini-stat"><span class="label">Paid</span><b>${money(paid)}</b></div><div class="mini-stat"><span class="label">Previous</span><b>${money(b.previousDue)}</b></div></div><div class="duebar"><small>Payable Due</small><b>${money(due)}</b></div>${extraNote?`<div class="mutedline">Note: ${esc(extraNote)}</div>`:''}</div><div class="v37-sec"><div class="qrwrap"><div style="font-size:11px;margin-bottom:6px">UPI: ${esc(state.settings.upi)}</div><div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div><div class="compact-strip"><span>Status: ${esc(billStatus(b))}</span><span>${esc(b.payments?.[0]?.mode||'Cash')}</span><span>${esc(b.payments?.[0]?.receivedIn||'Cash')}</span></div><div class="mutedline"><b>Scan & Pay ${money(payAmount)}</b></div></div></div><div class="v37-foot">আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে<br>Thank you: ${esc(state.settings.owner)} (owner)</div></div>`;
  };

  const prevWaTextV37 = window.waText;
  window.waText = function(){
    if(!currentBill) return alert('Preview bill first');
    openWhatsApp(currentBill.phone, reminderTextByBill(currentBill));
  };

  window.shareBill = async function(){
    if(!currentBill) return alert('Preview bill first');
    const templateEl=document.getElementById('template');
    const prevTemplate=templateEl ? templateEl.value : null;
    if(templateEl) templateEl.value = ['phone','mini','compact'].includes(prevTemplate) ? prevTemplate : 'mini';
    renderInvoice(currentBill); if(window.renderQRCodes) setTimeout(renderQRCodes,60);
    const blob=await invoiceBlob();
    const file=new File([blob],`${currentBill.billNo}.png`,{type:'image/png'});
    const text=reminderTextByBill(currentBill);
    try{
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({title:'Asha Bill Reminder',text,files:[file]});
      }else if(navigator.share){
        await navigator.share({title:'Asha Bill Reminder',text});
        downloadBlob(blob,`${currentBill.billNo}.png`);
      }else{
        downloadBlob(blob,`${currentBill.billNo}.png`);
        openWhatsApp(currentBill.phone,text);
      }
    }catch(e){ console.warn(e); }
    if(templateEl && prevTemplate){ templateEl.value=prevTemplate; renderInvoice(currentBill); if(window.renderQRCodes) setTimeout(renderQRCodes,60); }
  };

  window.shareCustomerBill = async function(id,billId){
    const bills=state.bills.filter(b=>b.customerId===id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    if(!bills.length) return alert('No bill found');
    currentBill = billId ? (state.bills.find(b=>b.id===billId) || bills[0]) : bills[0];
    await shareBill();
  };

  function enhanceChatIcons(){
    const a=document.getElementById('chatShare'), b=document.getElementById('chatCall'), c=document.getElementById('chatWhats'), d=document.getElementById('chatMore');
    if(a){a.textContent='⇪';a.title='Reminder + Bill';}
    if(b){b.textContent='✆';b.title='Call';}
    if(c){c.textContent='Ⓦ';c.title='WhatsApp note';}
    if(d){d.textContent='⋯';d.title='More';}
  }

  document.addEventListener('input',e=>{ if(e.target&&e.target.id==='rate'){ e.target.dataset.touched='1'; e.target.dataset.auto='0'; } });
  document.addEventListener('change',e=>{ if(e.target&&e.target.id==='landUnit') updateRateByUnit(true); if(e.target&&e.target.id==='template'){ previewBill(); } });
  document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>{ loadSettings(); fillSelects(); setAppFonts(); updateRateByUnit(true); enhanceChatIcons(); if(activeCustomer) renderChat(); },120); });
  setTimeout(()=>{ loadSettings(); fillSelects(); setAppFonts(); updateRateByUnit(true); enhanceChatIcons(); if(activeCustomer) renderChat(); },180);
})();
