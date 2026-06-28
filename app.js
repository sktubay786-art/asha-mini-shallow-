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

/* ==== V38 RESEARCH ULTRA UPDATE ==== */
(function(){
function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,220)); else setTimeout(fn,220); }

ready(function(){
  state.settings = Object.assign({
    reminderTemplate: "আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে",
    defaultBillNote: "",
    showCompactMeta: true,
    rateBigha: 2200,
    rateKatha: 110,
    rateDecimal: 55,
    autoBackup: true,
    appFont: "Inter",
    billFont: "Hind Siliguri"
  }, state.settings || {});

  const chip = document.querySelector('.hero-chips span:last-child');
  if(chip) chip.textContent = 'V38 Research Ultra';

  function ensureSettingsV38(){
    const card = document.querySelector('#settingsPage .card');
    if(!card || document.getElementById('setReminderTemplate')) return;
    const block = document.createElement('div');
    block.innerHTML = `
      <label>WhatsApp / SMS Reminder Message</label>
      <textarea id="setReminderTemplate" class="template-area"></textarea>
      <label>Default Bill Note</label>
      <input id="setDefaultBillNote" placeholder="যেমন: নির্দিষ্ট সময়ের মধ্যে বিল পরিশোধ করুন">
      <div class="two">
        <div><label>Rate per বিঘা</label><input id="setRateBigha" type="number"></div>
        <div><label>Rate per কাঠা</label><input id="setRateKatha" type="number"></div>
        <div><label>Rate per ডেসিমেল</label><input id="setRateDecimal" type="number"></div>
        <div><label>Compact Bill Meta</label><select id="setShowCompactMeta"><option value="yes">Show</option><option value="no">Hide</option></select></div>
      </div>
      <div class="two">
        <div><label>App Font</label><select id="setAppFont"><option>Inter</option><option>Poppins</option><option>Nunito</option><option>System</option></select></div>
        <div><label>Bill Font</label><select id="setBillFont"><option>Hind Siliguri</option><option>Inter</option><option>Poppins</option><option>Nunito</option></select></div>
      </div>
      <div class="settings-tools">
        <button class="btn" id="toolDuplicate">Clean duplicate phones</button>
        <button class="btn" id="toolDueCSV">Export due list CSV</button>
        <button class="btn" id="toolTodayCSV">Export today collection</button>
        <button class="btn" id="toolBackupNow">Instant backup JSON</button>
      </div>
    `;
    const actionBar = card.querySelector('.action-bar');
    card.insertBefore(block, actionBar);
  }
  ensureSettingsV38();

  function loadSettingsV38Only(){
    if(document.getElementById('setReminderTemplate')) document.getElementById('setReminderTemplate').value = state.settings.reminderTemplate || "";
    if(document.getElementById('setDefaultBillNote')) document.getElementById('setDefaultBillNote').value = state.settings.defaultBillNote || "";
    if(document.getElementById('setRateBigha')) document.getElementById('setRateBigha').value = state.settings.rateBigha || 2200;
    if(document.getElementById('setRateKatha')) document.getElementById('setRateKatha').value = state.settings.rateKatha || 110;
    if(document.getElementById('setRateDecimal')) document.getElementById('setRateDecimal').value = state.settings.rateDecimal || 55;
    if(document.getElementById('setShowCompactMeta')) document.getElementById('setShowCompactMeta').value = state.settings.showCompactMeta ? "yes" : "no";
    if(document.getElementById('setAppFont')) document.getElementById('setAppFont').value = state.settings.appFont || "Inter";
    if(document.getElementById('setBillFont')) document.getElementById('setBillFont').value = state.settings.billFont || "Hind Siliguri";
  }

  const prevLoad = window.loadSettings;
  window.loadSettings = function(){
    if(prevLoad) prevLoad();
    ensureSettingsV38();
    loadSettingsV38Only();
  };

  const prevSave = window.saveSettings;
  window.saveSettings = function(){
    state.settings.reminderTemplate = document.getElementById('setReminderTemplate')?.value || state.settings.reminderTemplate;
    state.settings.defaultBillNote = document.getElementById('setDefaultBillNote')?.value || "";
    state.settings.rateBigha = +(document.getElementById('setRateBigha')?.value || state.settings.rateBigha || 2200);
    state.settings.rateKatha = +(document.getElementById('setRateKatha')?.value || state.settings.rateKatha || 110);
    state.settings.rateDecimal = +(document.getElementById('setRateDecimal')?.value || state.settings.rateDecimal || 55);
    state.settings.showCompactMeta = (document.getElementById('setShowCompactMeta')?.value || "yes") === "yes";
    state.settings.appFont = document.getElementById('setAppFont')?.value || state.settings.appFont || "Inter";
    state.settings.billFont = document.getElementById('setBillFont')?.value || state.settings.billFont || "Hind Siliguri";
    if(prevSave) prevSave(); else saveState();
    applyFontV38();
  };

  function applyFontV38(){
    const appMap={Inter:'"Inter",system-ui,sans-serif',Poppins:'"Poppins",system-ui,sans-serif',Nunito:'"Nunito",system-ui,sans-serif',System:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'};
    const billMap={'Hind Siliguri':'"Hind Siliguri",system-ui,sans-serif',Inter:'"Inter",system-ui,sans-serif',Poppins:'"Poppins",system-ui,sans-serif',Nunito:'"Nunito",system-ui,sans-serif'};
    document.documentElement.style.setProperty('--app-font', appMap[state.settings.appFont]||appMap.Inter);
    document.documentElement.style.setProperty('--bill-font', billMap[state.settings.billFont]||billMap['Hind Siliguri']);
  }
  applyFontV38();

  function autoRate(unit){
    if(unit==='katha') return +(state.settings.rateKatha || 110);
    if(unit==='decimal') return +(state.settings.rateDecimal || 55);
    return +(state.settings.rateBigha || 2200);
  }

  function updateRateV38(force=false){
    const unit = document.getElementById('landUnit')?.value || 'bigha';
    const rate = document.getElementById('rate');
    if(!rate) return;
    const label = rate.closest('div')?.querySelector('label');
    if(label) label.textContent = unit==='katha' ? 'Rate / কাঠা' : unit==='decimal' ? 'Rate / ডেসিমেল' : 'Rate / বিঘা';
    if(force || rate.dataset.auto !== '0') {
      rate.value = autoRate(unit);
      rate.dataset.auto = '1';
    }
  }
  window.updateRateV38 = updateRateV38;
  document.getElementById('landUnit')?.addEventListener('change',()=>{updateRateV38(true);previewBill();});
  document.getElementById('rate')?.addEventListener('input',()=>{document.getElementById('rate').dataset.auto='0';});
  updateRateV38();

  const prevMakeBill = window.makeBillFromForm;
  window.makeBillFromForm = function(){
    const b = prevMakeBill ? prevMakeBill() : null;
    if(b && !b.note && state.settings.defaultBillNote) b.note = state.settings.defaultBillNote;
    return b;
  };

  function unitLabel(unit){ return unit==='katha' ? 'কাঠা' : unit==='decimal' ? 'ডেসিমেল' : 'বিঘা'; }
  function rateSuffix(unit){ return unit==='katha' ? '/কাঠা' : unit==='decimal' ? '/ডেসিমেল' : '/বিঘা'; }
  function reminderLine(){ return state.settings.reminderTemplate || "আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে"; }

  window.reminderTextByBill = function(b){
    return `${state.settings.company}
Bill No: ${b.billNo}
Name: ${b.customerName}
জমির পরিমাণ: ${b.landAmount} ${unitLabel(b.unit)}
All Total: ${money(b.allTotal)}
Paid/Adjusted: ${money(billPaid(b))}
Due: ${money(billDue(b))}
${reminderLine()}
Thank you: ${state.settings.owner} (owner)
Contact: ${state.settings.contact}
UPI: ${state.settings.upi}`;
  };

  window.customerReminderText = function(c){
    const bills = state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    if(bills[0]) return reminderTextByBill(bills[0]);
    return `${state.settings.company}
Name: ${c.name}
Current Due: ${money(customerDue(c.id))}
${reminderLine()}
Thank you: ${state.settings.owner} (owner)`;
  };

  function ensureSmartPanel(){
    const home=document.getElementById('homePage');
    if(!home || document.getElementById('smartPanel')) return;
    const box=document.createElement('div');
    box.id='smartPanel';
    home.appendChild(box);
  }

  function todayCollected(){
    const d=today();
    let sum=0;
    state.bills.forEach(b=>(b.payments||[]).forEach(p=>{ if((p.date||'')===d) sum += +p.amount||0; }));
    return sum;
  }

  function villageDueRows(){
    const m={};
    state.customers.forEach(c=>{ const k=c.village||'Unknown'; m[k]=(m[k]||0)+customerDue(c.id); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }

  const prevRenderDash=window.renderDash;
  window.renderDash=function(){
    if(prevRenderDash) prevRenderDash();
    ensureSmartPanel();
    const panel=document.getElementById('smartPanel');
    if(!panel) return;
    const dueCustomers=state.customers.map(c=>({c,due:customerDue(c.id)})).filter(x=>x.due>0).sort((a,b)=>b.due-a.due).slice(0,5);
    panel.innerHTML = `
      <div class="card">
        <h2>Smart Business Summary</h2>
        <div class="research-grid">
          <div class="research-card"><b>${money(todayCollected())}</b><small>Today collection</small></div>
          <div class="research-card"><b>${dueCustomers.length}</b><small>Top due customers shown below</small></div>
          <div class="research-card"><b>${villageDueRows().length}</b><small>Village groups with due</small></div>
          <div class="research-card"><b>${state.bills.length}</b><small>Total bills saved</small></div>
        </div>
      </div>
      <div class="card">
        <h3>Village-wise Due</h3>
        <div class="village-pills">${villageDueRows().map(([v,d])=>`<button type="button">${esc(v)} • ${money(d)}</button>`).join('') || '<span class="muted">No due</span>'}</div>
        <h3>Top Due Customers</h3>
        <div class="smart-list">${dueCustomers.map(x=>`<div class="smart-row" onclick="openChat('${x.c.id}')"><div class="left"><b>${esc(x.c.name)}</b><small>${esc(x.c.village||'No village')} • ${esc(safePhoneLabel(x.c.phone)||x.c.phone||'No phone')}</small></div><b class="small-danger">${money(x.due)}</b></div>`).join('') || '<div class="muted">No pending due</div>'}</div>
      </div>`;
  };

  window.exportDueCSVV38=function(){
    const rows=["Customer,Phone,Village,Due",...state.customers.map(c=>`${c.name},${safePhoneLabel(c.phone)||c.phone||''},${c.village||''},${customerDue(c.id)}`).filter(r=>!r.endsWith(",0"))];
    downloadBlob(new Blob([rows.join("\n")],{type:"text/csv"}),"asha_due_list.csv");
  };
  window.exportTodayCSVV38=function(){
    const d=today(); const rows=["Bill,Customer,Date,Amount,Mode,Received"];
    state.bills.forEach(b=>(b.payments||[]).forEach(p=>{if((p.date||'')===d) rows.push(`${b.billNo},${b.customerName},${p.date},${p.amount},${p.mode},${p.receivedIn}`)}));
    downloadBlob(new Blob([rows.join("\n")],{type:"text/csv"}),"asha_today_collection.csv");
  };
  window.cleanDuplicatePhonesV38=function(){
    const seen=new Set(); let removed=0;
    state.customers=state.customers.filter(c=>{ const k=(safePhoneLabel(c.phone)||c.phone||c.name).toLowerCase(); if(seen.has(k)){removed++; return false;} seen.add(k); return true; });
    saveState(); alert(`Removed ${removed} duplicate customer(s)`);
  };

  document.getElementById('toolDuplicate')?.addEventListener('click',cleanDuplicatePhonesV38);
  document.getElementById('toolDueCSV')?.addEventListener('click',exportDueCSVV38);
  document.getElementById('toolTodayCSV')?.addEventListener('click',exportTodayCSVV38);
  document.getElementById('toolBackupNow')?.addEventListener('click',backup);

  const prevInvoice=window.invoiceHTML;
  window.invoiceHTML=function(b,cls){
    const tpl=(document.getElementById('template')?.value||state.settings.template||'premium');
    const compact = ['mini','phone','compact'].includes(tpl) || cls==='phoneview';
    if(!compact) return prevInvoice ? prevInvoice(b,cls) : '';
    const due=billDue(b), paid=billPaid(b), payAmount=due>0?due:b.allTotal;
    const upi = makeUpiLink ? makeUpiLink(payAmount,b.billNo) : `upi://pay?pa=${encodeURIComponent(state.settings.upi)}&pn=${encodeURIComponent(state.settings.owner)}&am=${Number(payAmount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(b.billNo)}`;
    const fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    const meta = state.settings.showCompactMeta ? `<div class="chips"><div class="chip"><b>${money(b.allTotal)}</b>All Total</div><div class="chip"><b>${money(paid)}</b>Paid</div><div class="chip"><b>${billStatus(b)}</b>Status</div></div>` : "";
    return `<div class="invoice v38smart ${esc(cls||'')} ${esc(tpl)}">
      <div class="head"><h3>${esc(state.settings.company)}</h3><div class="sub">Pro: ${esc(state.settings.owner)}<br>☎ / WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div>
      <div class="sec"><div class="line"><span>Bill No</span><b>${esc(b.billNo)}</b></div><div class="line"><span>Date</span><b>${esc(b.date)}</b></div></div>
      <div class="sec"><span class="label">Customer Details</span><div class="cust"><b>${esc(b.customerName)}</b><br>${esc(safePhoneLabel(b.phone)||b.phone||'')}<br>${esc(b.address||b.village||'')}</div></div>
      <div class="sec"><div class="line"><span>Season</span><b>${esc(b.season)}</b></div><div class="line"><span>জমির পরিমাণ</span><b>${esc(b.landAmount)} ${unitLabel(b.unit)} (${Number(b.bigha||0).toFixed(2)} বিঘা)</b></div><div class="line"><span>Rate</span><b>${money(b.rate)} ${rateSuffix(b.unit)}</b></div><div class="line"><span>Current Bill</span><b>${money(b.current)}</b></div><div class="line"><span>Previous Due</span><b>${money(b.previousDue)}</b></div>${meta}<div class="totalLine"><small>Payable Due</small><b>${money(due)}</b></div>${b.note?`<div class="mutedline">Note: ${esc(b.note)}</div>`:''}</div>
      <div class="sec qrbox"><div style="font-size:11px;margin-bottom:6px">UPI: ${esc(state.settings.upi)}</div><div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div><div class="mutedline"><b>Scan & Pay ${money(payAmount)}</b></div></div>
      <div class="foot">${esc(reminderLine())}<br>Thank you: ${esc(state.settings.owner)} (owner)</div>
    </div>`;
  };

  window.shareBill=async function(){
    if(!currentBill) return alert('Preview bill first');
    const t=document.getElementById('template'); const old=t?t.value:null;
    if(t && !['mini','phone','compact'].includes(t.value)) t.value='mini';
    renderInvoice(currentBill); if(window.renderQRCodes) renderQRCodes();
    await new Promise(r=>setTimeout(r,280));
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
    if(t && old){ t.value=old; renderInvoice(currentBill); if(window.renderQRCodes) setTimeout(renderQRCodes,60); }
  };

  loadSettings();
  fillSelects();
  renderDash();
  updateRateV38(true);
  applyFontV38();
  previewBill();
});
})();

/* ==== V39 BILL CALCULATION FIX ==== */
(function(){
function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,240)); else setTimeout(fn,240); }

ready(function(){
  const chip=document.querySelector('.hero-chips span:last-child');
  if(chip) chip.textContent='V39 Bill Calc Fix';

  state.settings = Object.assign({
    rateBigha:2200,
    rateKatha:110,
    rateDecimal:55,
    reminderTemplate:"আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে"
  }, state.settings||{});

  function unitLabel(u){ return u==='katha' ? 'কাঠা' : u==='decimal' ? 'ডেসিমেল' : 'বিঘা'; }
  function rateSuffix(u){ return u==='katha' ? '/কাঠা' : u==='decimal' ? '/ডেসিমেল' : '/বিঘা'; }
  function rateByUnit(u){
    if(u==='katha') return +(state.settings.rateKatha || ((state.settings.rateBigha||2200)/20));
    if(u==='decimal') return +(state.settings.rateDecimal || ((state.settings.rateBigha||2200)/40));
    return +(state.settings.rateBigha || 2200);
  }
  function currentCharge(land, unit, rate){
    land=+land||0; rate=+rate||0;
    // V39 rule: rate field belongs to selected land unit.
    // বিঘা হলে land × rate/bigha, কাঠা হলে land × rate/katha, decimal হলে land × rate/decimal.
    return land * rate;
  }
  window.currentChargeV39=currentCharge;

  function allPaymentsForCustomer(id){
    return state.bills.filter(b=>b.customerId===id)
      .reduce((s,b)=>s+(b.payments||[]).reduce((x,p)=>x+(+p.amount||0),0),0);
  }

  // V39 fixed customer due:
  // Opening due + sum of only current bills - all payments.
  // This avoids previous due being counted again and again.
  window.customerDue = function(id){
    const c=state.customers.find(x=>x.id===id);
    const opening=+c?.openingDue||0;
    const currentSum=state.bills.filter(b=>b.customerId===id).reduce((s,b)=>s+(+b.current||0),0);
    const paid=allPaymentsForCustomer(id);
    return Math.max(opening + currentSum - paid, 0);
  };

  // Statement due for a printed bill.
  window.billDue = function(b){
    return Math.max((+b.allTotal||0) - billPaid(b), 0);
  };

  const oldToggle=window.toggleManual;
  window.toggleManual=function(){
    if(oldToggle) oldToggle();
    updateRateLabelV39(false);
  };

  function updateRateLabelV39(force=false){
    const u=document.getElementById('landUnit')?.value||'bigha';
    const r=document.getElementById('rate');
    if(!r) return;
    const label=r.closest('div')?.querySelector('label');
    if(label) label.textContent = u==='katha' ? 'Rate / কাঠা' : u==='decimal' ? 'Rate / ডেসিমেল' : 'Rate / বিঘা';
    if(force || r.dataset.auto!=='0'){
      r.value = rateByUnit(u);
      r.dataset.auto='1';
    }
  }
  window.updateRateLabelV39=updateRateLabelV39;

  document.getElementById('landUnit')?.addEventListener('change',()=>{updateRateLabelV39(true);previewBill();});
  document.getElementById('rate')?.addEventListener('input',()=>{document.getElementById('rate').dataset.auto='0';});

  window.makeBillFromForm = function(){
    let c=null;
    if($("billCustomer").value==="__new"){
      c={id:uid(),name:$("manualName").value.trim()||"New Customer",phone:normalPhone($("manualPhone").value),village:$("manualVillage").value.trim(),address:$("manualAddress").value.trim(),openingDue:0};
    }else c=state.customers.find(x=>x.id===$("billCustomer").value);
    if(!c)return null;

    const unit=$("landUnit").value;
    const land=+$("land").value||0;
    const rate=+$("rate").value||0;
    const bigha=landToBigha(land,unit);
    const current=currentCharge(land,unit,rate);

    // previous due is customer's real live due BEFORE this new bill.
    const savedCustomer=state.customers.find(x=>x.id===c.id);
    const prev=savedCustomer ? customerDue(c.id) : 0;

    const paid=+$("paidNow").value||0;
    const allTotal=current+prev;

    return {
      id:uid(),
      billNo:nextBillNo(),
      date:today(),
      customerId:c.id,
      customerName:c.name,
      phone:c.phone,
      address:c.address,
      village:c.village,
      season:$("season").value,
      landAmount:land,
      unit,
      bigha,
      rate,
      rateUnit:unit,
      current,
      previousDue:prev,
      allTotal,
      note:$("billNote").value || state.settings.defaultBillNote || "",
      payments:paid>0?[{id:uid(),date:today(),amount:paid,mode:$("billPayMode").value,receivedIn:$("receivedIn").value,note:"Initial payment"}]:[]
    };
  };

  // Direct pay: record to latest bill only; avoids old due being paid twice.
  window.directPay=function(id,settle=false){
    const c=state.customers.find(x=>x.id===id); if(!c) return;
    actionContext={type:'v39directpay',customerId:id,settle};
    $("actionTitle").textContent=settle?'Settle Due':'Receive Payment';
    $("actionBody").innerHTML=`<div class="action-sheet"><div class="info-box"><b>${esc(c.name)}</b><br>Live Due <b>${money(customerDue(id))}</b></div><label>Amount</label><input id="v39PayAmount" type="number" value="${customerDue(id)||0}"><div class="two"><div><label>Mode</label><select id="v39PayMode"><option>${settle?'Settlement':'Cash'}</option><option>Cash</option><option>UPI</option><option>Bank</option><option>Online</option><option>Settlement</option></select></div><div><label>Received In</label><input id="v39PayIn" value="${settle?'Settled':'Cash'}"></div></div><label>Note</label><input id="v39PayNote" value="${settle?'Settled/adjusted without cash':'Payment received'}"></div>`;
    $("actionSave").classList.remove("hidden");
    $("actionDelete").classList.add("hidden");
    $("actionModal").classList.remove("hidden");
  };

  const oldSaveAction=window.saveAction;
  window.saveAction=function(){
    if(actionContext && actionContext.type==='v39directpay'){
      const id=actionContext.customerId;
      const amt=+($("v39PayAmount").value||0);
      if(amt<=0) return alert('Amount দিন');
      const mode=$("v39PayMode").value;
      const receivedIn=$("v39PayIn").value||mode;
      const note=$("v39PayNote").value||"Payment received";
      let bills=state.bills.filter(b=>b.customerId===id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      let target=bills[0];
      if(!target){
        alert('এই customer-এর কোনো bill নেই। আগে bill তৈরি করুন।');
        return;
      }
      (target.payments=target.payments||[]).push({id:uid(),date:today(),amount:amt,mode,receivedIn,note});
      saveState();
      if(activeCustomer) renderChat();
      closeAction();
      return;
    }
    return oldSaveAction ? oldSaveAction() : undefined;
  };

  window.updatePayInfo=function(){
    let b=state.bills.find(x=>x.id===$("payBill").value);
    if(!b){$("payInfo").innerHTML="Select bill"; return;}
    const liveDue=customerDue(b.customerId);
    $("payInfo").innerHTML=`<b>${esc(b.billNo)}</b> • ${esc(b.customerName)}<br>Current Bill ${money(b.current)} • Previous Due ${money(b.previousDue)}<br>Bill Total ${money(b.allTotal)} • Paid/Joma ${money(billPaid(b))}<br>Live Due <b>${money(liveDue)}</b>`;
  };

  window.fillDue=function(){
    let b=state.bills.find(x=>x.id===$("payBill").value);
    if(b)$("payAmount").value=customerDue(b.customerId);
  };

  // Better reminder text
  window.reminderTextByBill=function(b){
    return `${state.settings.company}
Bill No: ${b.billNo}
Name: ${b.customerName}
জমির পরিমাণ: ${b.landAmount} ${unitLabel(b.unit)}
বর্তমান বিল: ${money(b.current)}
আগের বাকি: ${money(b.previousDue)}
মোট টাকা: ${money(b.allTotal)}
জমা: ${money(billPaid(b))}
বাকি: ${money(billDue(b))}
${state.settings.reminderTemplate || "আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে"}
Thank you: ${state.settings.owner} (owner)
Contact: ${state.settings.contact}`;
  };

  function qrBlockV39(amount,billNo){
    const upi = makeUpiLink ? makeUpiLink(amount,billNo) : `upi://pay?pa=${encodeURIComponent(state.settings.upi)}&pn=${encodeURIComponent(state.settings.owner)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(billNo)}`;
    const fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    return `<div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div>`;
  }

  window.invoiceHTML=function(b,cls){
    const due=billDue(b), paid=billPaid(b), payable=due>0?due:b.allTotal;
    const tpl=(document.getElementById('template')?.value||state.settings.template||'premium');
    const compact=['mini','phone','compact'].includes(tpl)||cls==='phoneview';
    const meta = compact ? `<div class="mini-grid"><div><b>${money(b.current)}</b>বর্তমান বিল</div><div><b>${money(b.previousDue)}</b>আগের বাকি</div><div><b>${money(paid)}</b>মোট জমা</div></div>` : "";
    return `<div class="invoice v39bill ${esc(cls||'')} ${esc(tpl)}">
      <div class="top">
        <h3>${esc(state.settings.company)}</h3>
        <div class="sub">Pro: ${esc(state.settings.owner)}<br>☎ / WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div>
      </div>

      <div class="sec">
        <span class="sec-title">Bill Details</span>
        <div class="row"><span>Bill No</span><b>${esc(b.billNo)}</b></div>
        <div class="row"><span>Date</span><b>${esc(b.date)}</b></div>
      </div>

      <div class="sec">
        <span class="sec-title">Customer Details</span>
        <div class="customer-box">
          <b>${esc(b.customerName)}</b><br>
          ${esc(safePhoneLabel ? (safePhoneLabel(b.phone)||b.phone||'') : (b.phone||''))}<br>
          ${esc(b.address||b.village||'')}
        </div>
      </div>

      <div class="sec">
        <span class="sec-title">Land / Charge</span>
        <div class="row"><span>Season</span><b>${esc(b.season)}</b></div>
        <div class="row"><span>জমির পরিমাণ</span><b>${esc(b.landAmount)} ${unitLabel(b.unit)} (${Number(b.bigha||0).toFixed(2)} বিঘা)</b></div>
        <div class="row"><span>Rate</span><b>${money(b.rate)} ${rateSuffix(b.rateUnit||b.unit)}</b></div>
        <div class="row"><span>বর্তমান বিল</span><b>${money(b.current)}</b></div>
      </div>

      <div class="sec">
        <span class="sec-title">Payment Summary</span>
        <div class="amount-box">
          <div class="row"><span>আগের বাকি</span><b>${money(b.previousDue)}</b></div>
          <div class="row"><span>বর্তমান বিল</span><b>${money(b.current)}</b></div>
          <div class="row"><span>মোট টাকা</span><b>${money(b.allTotal)}</b></div>
          <div class="row"><span>মোট জমা</span><b>${money(paid)}</b></div>
          <div class="row"><span>Status</span><b>${esc(billStatus(b))}</b></div>
        </div>
        ${meta}
        <div class="grand"><small>মোট বাকি / Payable Due</small><b>${money(due)}</b></div>
        ${b.note?`<div class="mutedline">Note: ${esc(b.note)}</div>`:''}
      </div>

      <div class="sec qrbox">
        <span class="sec-title">Payment QR</span>
        <div style="font-size:11px;margin-bottom:6px">UPI: ${esc(state.settings.upi)}</div>
        ${qrBlockV39(payable,b.billNo)}
        <div class="mutedline"><b>Scan & Pay ${money(payable)}</b></div>
      </div>

      <div class="foot">
        ${esc(state.settings.reminderTemplate || "আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে")}<br>
        Thank you: ${esc(state.settings.owner)} (owner)
      </div>
    </div>`;
  };

  const oldRenderInvoice=window.renderInvoice;
  window.renderInvoice=function(b){
    let mode=$("printMode").value, html="";
    const one=cls=>invoiceHTML(b,cls);
    if(mode==="thermal80")html=one("thermal80");
    if(mode==="a4two"||mode==="a4half")html=`<div class="print-sheet a4p"><div class="slot a5top">${one("a5bill")}</div></div>`;
    if(mode==="a4four"||mode==="a4quarter")html=`<div class="print-sheet a4p"><div class="slot a6q1">${one("a6bill")}</div></div>`;
    if(mode==="a4side")html=`<div class="print-sheet a4p"><div class="slot side">${one("sidebill")}</div></div>`;
    if(mode==="a4land")html=`<div class="print-sheet a4l"><div class="slot land">${one("landbill")}</div></div>`;
    if(mode==="phoneview")html=one("phoneview");
    $("billPreview").innerHTML=html||one("thermal80");
    if(window.renderQRCodes) setTimeout(renderQRCodes,80);
  };

  // V39 share always uses the stable compact bill.
  window.shareBill=async function(){
    if(!currentBill)return alert("Preview bill first");
    const t=document.getElementById('template');
    const old=t?t.value:null;
    if(t)t.value='mini';
    renderInvoice(currentBill);
    if(window.renderQRCodes) renderQRCodes();
    await new Promise(r=>setTimeout(r,250));
    let blob=await invoiceBlob();
    let file=new File([blob],`${currentBill.billNo}.png`,{type:"image/png"});
    let text=reminderTextByBill(currentBill);
    try{
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],text,title:"Asha Bill Reminder"});
      }else if(navigator.share){
        await navigator.share({text,title:"Asha Bill Reminder"});
        downloadBlob(blob,`${currentBill.billNo}.png`);
      }else{
        downloadBlob(blob,`${currentBill.billNo}.png`);
        if(window.openWhatsApp) openWhatsApp(currentBill.phone,text);
      }
    }catch(e){console.warn(e)}
    if(t&&old){t.value=old;renderInvoice(currentBill);}
  };

  const oldFill=window.fillSelects;
  window.fillSelects=function(){
    if(oldFill)oldFill();
    updateRateLabelV39(false);
  };

  updateRateLabelV39(true);
  renderAll(true);
});
})();

/* ==== V40 iOS calculator + icon polish ==== */
(function(){
function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,260)); else setTimeout(fn,260); }

ready(function(){
  const chip=document.querySelector('.hero-chips span:last-child');
  if(chip) chip.textContent='V40 iOS Calc + Icons';

  function iosIconize(){
    const qa=[...document.querySelectorAll('.quick-actions button')];
    qa.forEach(btn=>{
      if(btn.dataset.iosDone) return;
      const first=btn.childNodes[0];
      let raw='';
      if(first && first.nodeType===3){ raw=first.textContent.trim(); first.textContent=''; }
      if(raw) btn.insertAdjacentHTML('afterbegin',`<span class="ios-mini-icon">${raw}</span>`);
      btn.dataset.iosDone='1';
    });
    const ch={chatShare:'⇪',chatCall:'✆',chatWhats:'Ⓦ',chatMore:'⋯'};
    Object.entries(ch).forEach(([id,val])=>{const el=document.getElementById(id); if(el) el.textContent=val;});
  }

  window.calcStateV40={expr:'',display:'0',rad:false,memory:0};

  function calcEval(raw){
    let expr=String(raw||'').trim();
    if(!expr) return 0;
    const rad=window.calcStateV40.rad;
    expr=expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
    expr=expr.replace(/π/g,'Math.PI').replace(/\be\b/g,'Math.E');
    expr=expr.replace(/√\(/g,'Math.sqrt(');
    expr=expr.replace(/\bln\(/g,'Math.log(').replace(/\blog\(/g,'Math.log10(');
    expr=expr.replace(/\bsin\(([^()]+)\)/g,(m,a)=>`Math.sin(${rad?a:`(${a})*Math.PI/180`})`);
    expr=expr.replace(/\bcos\(([^()]+)\)/g,(m,a)=>`Math.cos(${rad?a:`(${a})*Math.PI/180`})`);
    expr=expr.replace(/\btan\(([^()]+)\)/g,(m,a)=>`Math.tan(${rad?a:`(${a})*Math.PI/180`})`);
    expr=expr.replace(/\^/g,'**');
    expr=expr.replace(/(\d+)!/g,(m,n)=>{n=Number(n); let v=1; for(let i=2;i<=n;i++)v*=i; return String(v);});
    return Function('"use strict"; return ('+expr+')')();
  }

  function updateCalcDisplay(){
    const screen=document.getElementById('calcScreen');
    if(!screen) return;
    const s=window.calcStateV40;
    screen.innerHTML=`<div class="calcTop"><span>9:41</span><span>${s.rad?'RAD':'DEG'} • Scientific</span></div><div class="calcDisplay"><div class="calcExpression">${esc(s.expr||'')}</div><div class="calcValue">${esc(s.display||'0')}</div></div>`;
  }

  function appendToken(tok){
    const s=window.calcStateV40;
    if(s.display==='Error'){s.expr='';s.display='0'}
    if(tok==='AC'){s.expr='';s.display='0';return}
    if(tok==='DEL'){s.expr=s.expr.slice(0,-1);s.display=s.expr||'0';return}
    if(tok==='='){
      try{
        let v=calcEval(s.expr);
        if(!isFinite(v)) throw new Error('bad');
        s.display=String(Number(v.toFixed(10)));
        s.expr=s.display;
      }catch(e){s.display='Error'}
      return;
    }
    if(tok==='+/-'){if(s.expr.startsWith('-')) s.expr=s.expr.slice(1); else s.expr='-'+(s.expr||'0'); s.display=s.expr;return;}
    if(tok==='mc'){s.memory=0;return}
    if(tok==='m+'){try{s.memory+=Number(calcEval(s.expr)||0)}catch(e){} return}
    if(tok==='m-'){try{s.memory-=Number(calcEval(s.expr)||0)}catch(e){} return}
    if(tok==='mr'){s.expr+=String(s.memory);s.display=s.expr;return}
    const map={'÷':'÷','×':'×','−':'−','+':'+','%':'%','.':'.','π':'π','e':'e','sin':'sin(','cos':'cos(','tan':'tan(','ln':'ln(','log':'log(','√':'√(','x²':'^2','x³':'^3','xʸ':'^','1/x':'1/(','x!':'!','(':'(',')':')'};
    s.expr += map[tok] || tok;
    s.display=s.expr || '0';
  }

  window.setupCalc=function(){
    const calc=document.querySelector('.calc');
    if(!calc) return;
    calc.classList.add('iosCalc');
    const keys=[
      ['(', 'sci'], [')','sci'], ['mc','sci'], ['m+','sci'],
      ['m-','sci'], ['mr','sci'], ['x²','sci'], ['x³','sci'],
      ['xʸ','sci'], ['e','sci'], ['π','sci'], ['ln','sci'],
      ['log','sci'], ['√','sci'], ['sin','sci'], ['cos','sci'],
      ['tan','sci'], ['1/x','sci'], ['x!','sci'], ['DEL','fn'],
      ['AC','fn'], ['+/-','fn'], ['%','fn'], ['÷','op'],
      ['7',''], ['8',''], ['9',''], ['×','op'],
      ['4',''], ['5',''], ['6',''], ['−','op'],
      ['1',''], ['2',''], ['3',''], ['+','op'],
      ['0','wide'], ['.',''], ['=','eq']
    ];
    const keyBox=document.getElementById('calcKeys');
    keyBox.className='iosKeys';
    keyBox.innerHTML=keys.map(([k,c])=>`<button class="${c}" data-k="${k}">${k}</button>`).join('');
    document.getElementById('calcScreen').className='iosScreen';
    updateCalcDisplay();
    keyBox.onclick=e=>{const k=e.target.dataset.k;if(!k) return;appendToken(k);updateCalcDisplay();};
    if(!document.querySelector('.calcModeLine')){
      calc.insertAdjacentHTML('beforeend',`<div class="calcModeLine"><button id="degBtn" class="active">DEG</button><button id="radBtn">RAD</button><button id="copyCalc">Copy Result</button></div>`);
      document.getElementById('degBtn').onclick=()=>{window.calcStateV40.rad=false;document.getElementById('degBtn').classList.add('active');document.getElementById('radBtn').classList.remove('active');updateCalcDisplay();};
      document.getElementById('radBtn').onclick=()=>{window.calcStateV40.rad=true;document.getElementById('radBtn').classList.add('active');document.getElementById('degBtn').classList.remove('active');updateCalcDisplay();};
      document.getElementById('copyCalc').onclick=()=>navigator.clipboard?.writeText(window.calcStateV40.display||'0');
    }
  };

  const oldBindV40=window.bind;
  if(oldBindV40){window.bind=function(){oldBindV40();iosIconize();};}

  const oldRenderAllV40=window.renderAll;
  window.renderAll=function(renderPreview=false){if(oldRenderAllV40) oldRenderAllV40(renderPreview);iosIconize();};

  iosIconize();
  setupCalc();
});
})();

/* ==== V41 Premium Settings UI Patch ==== */
(function(){
function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,260)); else setTimeout(fn,260); }

ready(function(){
  const chip=document.querySelector('.hero-chips span:last-child');
  if(chip) chip.textContent='V41 Premium Settings';

  state.settings = Object.assign({
    company:"আশা মিনি শ্যালো",
    owner:"SK EKRAMUL Haque",
    contact:"9564061920",
    address:"Raghunathpur, Chaklachipur, Ghatal, Paschim Medinipur, 721232",
    upi:"8710065540@axl",
    accent:"#075c39",
    rateBigha:2200,
    rateKatha:110,
    rateDecimal:55,
    appFont:"Inter",
    billFont:"Hind Siliguri",
    reminderTemplate:"আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে",
    defaultBillNote:"",
    qrMode:"dynamic",
    showCompactMeta:true
  }, state.settings||{});

  function v41Icon(name){
    const map={
      person:'👤', call:'☎', location:'⌖', wallet:'▣', qr:'▦', rate:'₹',
      bill:'▤', print:'⎙', font:'Aa', theme:'●', reminder:'◷',
      cloud:'☁', tools:'⚙', backup:'⇩', logout:'↪'
    };
    return map[name]||'●';
  }

  function buildPremiumSettings(){
    const page=document.getElementById('settingsPage');
    if(!page || document.getElementById('v41Settings')) return;

    page.innerHTML = `
      <div id="v41Settings" class="v41-settings">
        <div class="v41-hero">
          <h2>Settings</h2>
          <p>Manage business profile, payment, billing, reminder, fonts and cloud sync.</p>
        </div>

        <div class="v41-section-title">Company Profile</div>
        <div class="v41-card">
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('person')}</div>
            <div class="v41-main"><b>Company Name</b><small id="v41CompanySmall"></small><input id="setCompany"></div>
          </div>
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('person')}</div>
            <div class="v41-main"><b>Owner / Proprietor</b><small id="v41OwnerSmall"></small><input id="setOwner"></div>
          </div>
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('call')}</div>
            <div class="v41-main"><b>Contact Number</b><small id="v41ContactSmall"></small><input id="setContact"></div>
          </div>
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('location')}</div>
            <div class="v41-main"><b>Business Address</b><small id="v41AddressSmall"></small><textarea id="setAddress"></textarea></div>
          </div>
        </div>

        <div class="v41-section-title">Payment Setup</div>
        <div class="v41-card">
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('wallet')}</div>
            <div class="v41-main"><b>UPI ID</b><small id="v41UpiSmall"></small><input id="setUpi"></div>
          </div>
          <div class="v41-row v41-file-row">
            <div class="v41-icon">${v41Icon('qr')}</div>
            <div class="v41-main"><b>Payment QR Code</b><small id="v41QrSmall">Dynamic amount QR / Uploaded QR</small><select id="setQrMode"><option value="dynamic">Dynamic amount QR</option><option value="static">Uploaded static QR</option></select><input id="setQrImage" type="file" accept="image/*"></div>
          </div>
          <div class="v41-actions"><button class="btn" id="removeQrBtn">Remove QR</button><button class="btn" id="testQrBtn">Preview QR in Bill</button></div>
        </div>

        <div class="v41-section-title">Billing Configuration</div>
        <div class="v41-card">
          <div class="v41-grid">
            <div class="v41-field"><label>Rate per বিঘা</label><input id="setRateBigha" type="number"></div>
            <div class="v41-field"><label>Rate per কাঠা</label><input id="setRateKatha" type="number"></div>
            <div class="v41-field"><label>Rate per ডেসিমেল</label><input id="setRateDecimal" type="number"></div>
            <div class="v41-field"><label>Theme Colour</label><input id="setAccent" type="color"></div>
            <div class="v41-field"><label>Default Print Size</label><select id="setPrint"></select></div>
            <div class="v41-field"><label>Default Bill Template</label><select id="setTemplate"></select></div>
          </div>
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('bill')}</div>
            <div class="v41-main"><b>Compact Bill Meta</b><small>Status / payment / received chips on compact bill</small></div>
            <div id="compactMetaSwitch" class="v41-switch"></div>
          </div>
        </div>

        <div class="v41-section-title">Reminder & Notes</div>
        <div class="v41-card">
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('reminder')}</div>
            <div class="v41-main"><b>WhatsApp / SMS Reminder Message</b><small>Used in Reminder + Bill</small><textarea id="setReminderTemplate"></textarea></div>
          </div>
          <div class="v41-row">
            <div class="v41-icon">${v41Icon('bill')}</div>
            <div class="v41-main"><b>Default Bill Note</b><small>Auto note for new bills if note is empty</small><input id="setDefaultBillNote"></div>
          </div>
        </div>

        <div class="v41-section-title">Appearance</div>
        <div class="v41-card">
          <div class="v41-grid">
            <div class="v41-field"><label>App Font</label><select id="setAppFont"><option>Inter</option><option>Poppins</option><option>Nunito</option><option>System</option></select></div>
            <div class="v41-field"><label>Bill Font</label><select id="setBillFont"><option>Hind Siliguri</option><option>Inter</option><option>Poppins</option><option>Nunito</option></select></div>
          </div>
        </div>

        <div class="v41-section-title">Cloud & Data Tools</div>
        <div class="v41-card">
          <div class="v41-actions">
            <button class="btn primary" id="saveSettingsBtn">Save Settings</button>
            <button class="btn" id="cloudPullBtn">Pull Cloud</button>
            <button class="btn" id="cloudPushBtn">Push Cloud</button>
            <button class="btn" id="toolBackupNow">Instant Backup</button>
            <button class="btn" id="toolDueCSV">Due CSV</button>
            <button class="btn" id="toolTodayCSV">Today CSV</button>
            <button class="btn" id="toolDuplicate">Clean Duplicate Phones</button>
            <button class="btn danger" id="logoutBtn">Logout</button>
          </div>
          <p id="cloudStatus" class="v41-status"></p>
        </div>

        <input id="setPayee" type="hidden">
        <input id="setCountry" type="hidden" value="+91">
      </div>`;
  }

  buildPremiumSettings();

  function setValue(id,val){ const el=document.getElementById(id); if(el) el.value = val ?? ""; }
  function syncSmall(){
    const pairs=[
      ['v41CompanySmall',state.settings.company],
      ['v41OwnerSmall',state.settings.owner],
      ['v41ContactSmall',state.settings.contact],
      ['v41AddressSmall',state.settings.address],
      ['v41UpiSmall',state.settings.upi]
    ];
    pairs.forEach(([id,val])=>{const el=document.getElementById(id); if(el) el.textContent=val||'';});
    const sw=document.getElementById('compactMetaSwitch');
    if(sw) sw.classList.toggle('active',!!state.settings.showCompactMeta);
  }

  const oldLoadSettings = window.loadSettings;
  window.loadSettings = function(){
    buildPremiumSettings();

    setValue('setCompany',state.settings.company);
    setValue('setOwner',state.settings.owner);
    setValue('setContact',state.settings.contact);
    setValue('setAddress',state.settings.address);
    setValue('setUpi',state.settings.upi);
    setValue('setPayee',state.settings.owner||state.settings.payee||'');
    setValue('setCountry','+91');
    setValue('setAccent',state.settings.accent||'#075c39');

    if(document.getElementById('setPrint')) document.getElementById('setPrint').innerHTML=document.getElementById('printMode')?.innerHTML||'';
    if(document.getElementById('setTemplate')) document.getElementById('setTemplate').innerHTML=document.getElementById('template')?.innerHTML||'';

    setValue('setPrint',state.settings.print||'thermal80');
    setValue('setTemplate',state.settings.template||'premium');
    setValue('setQrMode',state.settings.qrMode||'dynamic');
    setValue('setRateBigha',state.settings.rateBigha||2200);
    setValue('setRateKatha',state.settings.rateKatha||110);
    setValue('setRateDecimal',state.settings.rateDecimal||55);
    setValue('setReminderTemplate',state.settings.reminderTemplate||'');
    setValue('setDefaultBillNote',state.settings.defaultBillNote||'');
    setValue('setAppFont',state.settings.appFont||'Inter');
    setValue('setBillFont',state.settings.billFont||'Hind Siliguri');
    syncSmall();
  };

  window.saveSettings = function(){
    Object.assign(state.settings,{
      company:document.getElementById('setCompany')?.value||state.settings.company,
      owner:document.getElementById('setOwner')?.value||state.settings.owner,
      contact:document.getElementById('setContact')?.value||state.settings.contact,
      address:document.getElementById('setAddress')?.value||state.settings.address,
      upi:document.getElementById('setUpi')?.value||state.settings.upi,
      payee:document.getElementById('setOwner')?.value||state.settings.owner,
      country:'+91',
      accent:document.getElementById('setAccent')?.value||state.settings.accent,
      print:document.getElementById('setPrint')?.value||state.settings.print,
      template:document.getElementById('setTemplate')?.value||state.settings.template,
      qrMode:document.getElementById('setQrMode')?.value||state.settings.qrMode,
      rateBigha:+(document.getElementById('setRateBigha')?.value||state.settings.rateBigha||2200),
      rateKatha:+(document.getElementById('setRateKatha')?.value||state.settings.rateKatha||110),
      rateDecimal:+(document.getElementById('setRateDecimal')?.value||state.settings.rateDecimal||55),
      reminderTemplate:document.getElementById('setReminderTemplate')?.value||state.settings.reminderTemplate,
      defaultBillNote:document.getElementById('setDefaultBillNote')?.value||'',
      appFont:document.getElementById('setAppFont')?.value||state.settings.appFont||'Inter',
      billFont:document.getElementById('setBillFont')?.value||state.settings.billFont||'Hind Siliguri'
    });
    if(document.getElementById('printMode')) document.getElementById('printMode').value=state.settings.print;
    if(document.getElementById('template')) document.getElementById('template').value=state.settings.template;
    saveState();
    syncSmall();
    alert('Settings saved');
  };

  function bindV41(){
    document.getElementById('saveSettingsBtn')?.addEventListener('click',saveSettings);
    document.getElementById('cloudPullBtn')?.addEventListener('click',pullCloud);
    document.getElementById('cloudPushBtn')?.addEventListener('click',()=>pushCloud(true));
    document.getElementById('logoutBtn')?.addEventListener('click',logout);
    document.getElementById('removeQrBtn')?.addEventListener('click',removeQr);
    document.getElementById('setQrImage')?.addEventListener('change',loadQr);
    document.getElementById('testQrBtn')?.addEventListener('click',()=>{showPage('billPage');previewBill();});
    document.getElementById('toolBackupNow')?.addEventListener('click',backup);
    document.getElementById('toolDueCSV')?.addEventListener('click',()=>window.exportDueCSVV38?exportDueCSVV38():exportCSV());
    document.getElementById('toolTodayCSV')?.addEventListener('click',()=>window.exportTodayCSVV38?exportTodayCSVV38():exportCSV());
    document.getElementById('toolDuplicate')?.addEventListener('click',()=>window.cleanDuplicatePhonesV38?cleanDuplicatePhonesV38():alert('Duplicate cleanup unavailable'));
    document.getElementById('compactMetaSwitch')?.addEventListener('click',()=>{
      state.settings.showCompactMeta=!state.settings.showCompactMeta;
      syncSmall();
      saveState(false);
    });
    ['setCompany','setOwner','setContact','setAddress','setUpi'].forEach(id=>{
      document.getElementById(id)?.addEventListener('input',()=>{
        const tmp={
          setCompany:'v41CompanySmall',
          setOwner:'v41OwnerSmall',
          setContact:'v41ContactSmall',
          setAddress:'v41AddressSmall',
          setUpi:'v41UpiSmall'
        };
        const el=document.getElementById(tmp[id]); if(el) el.textContent=document.getElementById(id).value;
      });
    });
  }

  const oldShowPage=window.showPage;
  window.showPage=function(id){
    if(oldShowPage) oldShowPage(id);
    if(id==='settingsPage'){
      buildPremiumSettings();
      loadSettings();
      bindV41();
    }
  };

  buildPremiumSettings();
  loadSettings();
  bindV41();
});
})();


/* ==== V42 billing modes + customer detail + login remember ==== */
(function(){
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,260));else setTimeout(fn,260)}
ready(function(){
  const chip=document.querySelector('.hero-chips span:last-child'); if(chip) chip.textContent='V42 User UI + Bill Modes';

  const savedEmail=localStorage.getItem('ashaRememberEmail')||'';
  if(document.getElementById('email') && savedEmail) document.getElementById('email').value=savedEmail;
  if(document.getElementById('rememberLogin')) document.getElementById('rememberLogin').checked=!!savedEmail;

  window.login=async function(){
    try{
      const remember=!!document.getElementById('rememberLogin')?.checked;
      if(auth && firebase?.auth){ await auth.setPersistence(remember?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION); }
      let cred=await auth.signInWithEmailAndPassword($('email').value.trim(),$('password').value);
      if(cred.user.uid!==OWNER_UID){await auth.signOut();$('loginMsg').textContent='Only owner account allowed';return}
      if(remember) localStorage.setItem('ashaRememberEmail',$('email').value.trim()); else localStorage.removeItem('ashaRememberEmail');
      $('login').classList.add('hidden');$('app').classList.remove('hidden');await pullCloud();
    }catch(e){$('loginMsg').textContent=e.message}
  };
  if(document.getElementById('loginBtn')) document.getElementById('loginBtn').onclick=login;

  function unitLabel(u){return u==='katha'?'কাঠা':u==='decimal'?'ডেসিমেল':'বিঘা'}
  function rateSuffix(u){return u==='katha'?'/কাঠা':u==='decimal'?'/ডেসিমেল':'/বিঘা'}
  function bighaRateNote(b){
    const rb=+(state.settings.rateBigha||2200);
    if((b.rateUnit||b.unit)==='bigha') return '';
    return `<span class="rate-note">বিঘা rate: ${money(rb)}/বিঘা</span>`;
  }
  function qrBlock(amount,billNo){
    const upi = makeUpiLink ? makeUpiLink(amount,billNo) : `upi://pay?pa=${encodeURIComponent(state.settings.upi)}&pn=${encodeURIComponent(state.settings.owner)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(billNo)}`;
    const fallback=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
    return `<div class="qr-live" data-qr="${esc(upi)}" data-fallback="${esc(fallback)}"></div>`;
  }

  window.invoiceHTML=function(b,cls){
    const tpl=(document.getElementById('template')?.value||state.settings.template||'premium');
    const due=billDue(b), paid=billPaid(b), payable=due>0?due:b.allTotal;
    const showMeta=['mini','phone','compact'].includes(tpl)||cls==='phoneview'||tpl==='thermal';
    const meta=showMeta?`<div class="mini-grid"><div><b>${money(b.current)}</b>বর্তমান বিল</div><div><b>${money(b.previousDue)}</b>আগের বাকি</div><div><b>${money(paid)}</b>মোট জমা</div></div>`:'';
    return `<div class="invoice v42bill ${esc(cls||'')} ${esc(tpl)}">
      <div class="top"><h3>${esc(state.settings.company)}</h3><div class="sub">Pro: ${esc(state.settings.owner)}<br>☎ / WhatsApp: ${esc(state.settings.contact)}<br>${esc(state.settings.address)}</div></div>
      <div class="sec"><span class="sec-title">Bill Details</span><div class="row"><span>Bill No</span><b>${esc(b.billNo)}</b></div><div class="row"><span>Date</span><b>${esc(b.date)}</b></div></div>
      <div class="sec"><span class="sec-title">Customer Details</span><div class="customer-box"><b>${esc(b.customerName)}</b><br>${esc(safePhoneLabel?(safePhoneLabel(b.phone)||b.phone||''):(b.phone||''))}<br>${esc(b.address||b.village||'')}</div></div>
      <div class="sec"><span class="sec-title">Land / Charge</span><div class="row"><span>Season</span><b>${esc(b.season)}</b></div><div class="row"><span>জমির পরিমাণ</span><b>${esc(b.landAmount)} ${unitLabel(b.unit)} (${Number(b.bigha||0).toFixed(2)} বিঘা)</b></div><div class="row"><span>Rate</span><b>${money(b.rate)} ${rateSuffix(b.rateUnit||b.unit)}${bighaRateNote(b)}</b></div><div class="row"><span>বর্তমান বিল</span><b>${money(b.current)}</b></div></div>
      ${tpl==='qrfirst'?`<div class="sec qrbox pay-section"><span class="sec-title">Payment QR</span><div style="font-size:11px;margin-bottom:6px">UPI: ${esc(state.settings.upi)}</div>${qrBlock(payable,b.billNo)}<div class="mutedline"><b>Scan & Pay ${money(payable)}</b></div></div>`:''}
      <div class="sec"><span class="sec-title">Payment Summary</span><div class="amount-box"><div class="row"><span>আগের বাকি</span><b>${money(b.previousDue)}</b></div><div class="row"><span>বর্তমান বিল</span><b>${money(b.current)}</b></div><div class="row"><span>মোট টাকা</span><b>${money(b.allTotal)}</b></div><div class="row"><span>মোট জমা</span><b>${money(paid)}</b></div><div class="row"><span>Status</span><b>${esc(billStatus(b))}</b></div></div>${meta}<div class="grand"><small>মোট বাকি / Payable Due</small><b>${money(due)}</b></div>${b.note?`<div class="mutedline">Note: ${esc(b.note)}</div>`:''}</div>
      ${tpl!=='qrfirst'?`<div class="sec qrbox pay-section"><span class="sec-title">Payment QR</span><div style="font-size:11px;margin-bottom:6px">UPI: ${esc(state.settings.upi)}</div>${qrBlock(payable,b.billNo)}<div class="mutedline"><b>Scan & Pay ${money(payable)}</b></div></div>`:''}
      <div class="foot">${esc(state.settings.reminderTemplate||'আপনাকে পুরো বিল শীঘ্রই পরিশোধের জন্য বলা হচ্ছে')}<br>Thank you: ${esc(state.settings.owner)} (owner)</div>
    </div>`;
  };

  window.renderInvoice=function(b){
    let mode=$('printMode').value, html='';
    const one=cls=>invoiceHTML(b,cls);
    if(mode==='thermal80')html=one('thermal80');
    if(mode==='a4two'||mode==='a4half')html=`<div class="print-sheet a4p"><div class="slot a5top">${one('a5bill')}</div></div>`;
    if(mode==='a4four'||mode==='a4quarter')html=`<div class="print-sheet a4p"><div class="slot a6q1">${one('a6bill')}</div></div>`;
    if(mode==='a4side')html=`<div class="print-sheet a4p"><div class="slot side">${one('sidebill')}</div></div>`;
    if(mode==='a4land')html=`<div class="print-sheet a4l"><div class="slot land">${one('landbill')}</div></div>`;
    if(mode==='phoneview')html=one('phoneview');
    $('billPreview').innerHTML=html||one('thermal80');
    if(window.renderQRCodes)setTimeout(renderQRCodes,70);
  };
  document.getElementById('template')?.addEventListener('change',()=>{state.settings.template=document.getElementById('template').value;previewBill();});
  document.getElementById('printMode')?.addEventListener('change',()=>{state.settings.print=document.getElementById('printMode').value;previewBill();});

  window.openPayment=function(id){closeChat();showPage('payPage');$('payBill').value=id;updatePayInfo();let b=state.bills.find(x=>x.id===id);if(b)$('payAmount').value=billDue(b);setTimeout(()=>$('payAmount')?.focus(),80)};
  window.chatViewBill=function(id){closeChat();viewBill(id)};
  window.chatDeleteBill=function(id){if(confirm('Delete this bill?'))deleteBill(id)};

  window.openChat=function(id){activeCustomer=id;$('chatModal').classList.remove('hidden');$('chatModal').classList.add('v42-chat');renderChat()};

  window.renderChat=function(){
    const c=state.customers.find(x=>x.id===activeCustomer); if(!c)return;
    $('chatAvatar').textContent=initials(c.name);$('chatName').textContent=c.name;$('chatSub').textContent=(safePhoneLabel?(safePhoneLabel(c.phone)||c.phone||'No phone'):(c.phone||'No phone'))+' • '+(c.village||'No village');
    $('chatBack').onclick=closeChat;$('chatCall').onclick=()=>{let d=(phoneDigitsV36?phoneDigitsV36(c.phone):phone(c.phone));if(!d)return alert('Phone number নেই');location.href='tel:+'+d};$('chatWhats').onclick=()=>openWhatsApp(c.phone,customerReminderText(c));$('chatShare').onclick=()=>shareCustomerBill(c.id);$('chatBill').onclick=()=>{closeChat();showPage('billPage');$('billCustomer').value=c.id;toggleManual();previewBill()};$('chatPay').onclick=()=>directPay(c.id,false);$('chatSettle').onclick=()=>directPay(c.id,true);$('chatLedger').onclick=()=>renderChatLedger(c.id);$('chatEdit').onclick=()=>openCustomer(c.id);$('chatMore').onclick=()=>openMoreMenu(c.id);
    const bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    const total=bills.reduce((s,b)=>s+(+b.allTotal||0),0), paid=bills.reduce((s,b)=>s+billPaid(b),0), due=customerDue(c.id);
    let out=`<div class="v42-actionbar"><button id="v42NewBill">▤<br>বিল</button><button id="v42Pay">₹<br>পেমেন্ট</button><button id="v42Settle">✓<br>নিষ্পত্তি</button></div><div class="v42-summary"><small>Current Balance Due</small><b>${money(due)}</b><div class="chat-topnote">Total ${money(total)} • Paid ${money(paid)}</div></div>`;
    let lastDate='';
    bills.forEach(b=>{
      if(b.date!==lastDate){out+=`<div class="v42-date"><span>${esc(b.date)}</span></div>`;lastDate=b.date;}
      out+=`<div class="v42-bubble v42-bill"><div class="v42-bubble-title"><span>▤ ${esc(b.billNo)}</span><span class="due">${money(billDue(b))}</span></div><div class="line"><span>মোট টাকা</span><b>${money(b.allTotal)}</b></div><div class="line"><span>মোট জমা</span><b>${money(billPaid(b))}</b></div><div class="line"><span>বাকি</span><b class="due">${money(billDue(b))}</b></div><p class="muted">${esc(b.season||'')} • ${esc(b.landAmount)} ${unitLabel(b.unit)}</p><div class="v42-bubble-actions"><button data-act="view" data-id="${b.id}">View</button><button data-act="pay" data-id="${b.id}">Pay</button><button data-act="reminder" data-id="${b.id}">Reminder + Bill</button><button data-act="delete" data-id="${b.id}">Delete</button></div></div>`;
      (b.payments||[]).forEach(p=>{out+=`<div class="v42-bubble ${String(p.mode).toLowerCase().includes('settle')?'v42-settle':'v42-pay'}"><div class="v42-bubble-title"><span>${String(p.mode).toLowerCase().includes('settle')?'✓ Settlement':'✓ Payment Received'}</span><span>${money(p.amount)}</span></div><p class="muted">${esc(p.receivedIn||'')} • ${esc(p.note||'')}</p><div class="v42-bubble-actions"><button data-act="editpay" data-id="${p.id}">Edit</button><button data-act="editpay" data-id="${p.id}">Undo/Delete</button></div></div>`});
    });
    out+=`<div class="v42-sticky-reminder"><button id="v42SendReminder">Send Reminder</button></div>`;
    $('chatBody').innerHTML=out;
    $('v42NewBill')?.addEventListener('click',()=>$('chatBill').click());$('v42Pay')?.addEventListener('click',()=>$('chatPay').click());$('v42Settle')?.addEventListener('click',()=>$('chatSettle').click());$('v42SendReminder')?.addEventListener('click',()=>shareCustomerBill(c.id));
    $('chatBody').onclick=e=>{const btn=e.target.closest('button[data-act]');if(!btn)return;const act=btn.dataset.act,id=btn.dataset.id;if(act==='view')chatViewBill(id);if(act==='pay')openPayment(id);if(act==='reminder')shareCustomerBill(c.id,id);if(act==='delete')chatDeleteBill(id);if(act==='editpay')editEntry(id)};
  };

  const prevSetupCalc=window.setupCalc;
  window.setupCalc=function(){if(prevSetupCalc)prevSetupCalc();};
  fillSelects();renderAll(true);
});
})();

/* ==== V43: tabbar duplicate fix, responsive nav, calculator display, user buttons ==== */
(function(){
function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(fn,300)); else setTimeout(fn,300); }

ready(function(){
  const chip=document.querySelector('.hero-chips span:last-child');
  if(chip) chip.textContent='V43 Responsive Fix';

  function realIcon(name){
    const map={
      home:'⌂',
      users:'◉',
      bill:'▤',
      pay:'₹',
      history:'◷',
      report:'▥',
      calc:'▦',
      settings:'⚙',
      call:'✆',
      whatsapp:'Ⓦ',
      share:'⇪',
      more:'⋯',
      edit:'✎',
      delete:'⌫',
      ledger:'☷',
      settle:'✓'
    };
    return map[name]||'●';
  }

  window.normalizeTabsV43=function(){
    const tab=document.querySelector('.tabbar');
    if(!tab) return;

    const pages=[
      ['homePage',realIcon('home'),'Home'],
      ['customersPage',realIcon('users'),'Users'],
      ['billPage',realIcon('bill'),'Bill'],
      ['payPage',realIcon('pay'),'Pay'],
      ['historyPage',realIcon('history'),'History'],
      ['reportsPage',realIcon('report'),'Report'],
      ['calcPage',realIcon('calc'),'Calc'],
      ['settingsPage',realIcon('settings'),'Set']
    ];

    // Remove duplicates and rebuild once. This fixes two/three icons issue.
    tab.innerHTML=pages.map(([page,ico,label],idx)=>`<button data-page="${page}" class="${idx===0?'active':''}"><i>${ico}</i><span>${label}</span></button>`).join('');

    tab.querySelectorAll('button[data-page]').forEach(btn=>{
      btn.onclick=()=>{
        const page=btn.dataset.page;
        if(page==='calcPage' && !document.getElementById('calcPage')) createCalcPageV43();
        showPage(page);
        setTimeout(()=>btn.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'}),50);
      };
    });
  };

  window.createCalcPageV43=function(){
    if(document.getElementById('calcPage')) return;
    const main=document.querySelector('main') || document.getElementById('app') || document.body;
    const sec=document.createElement('section');
    sec.id='calcPage';
    sec.className='page';
    sec.innerHTML=`<div class="card"><h2>Scientific Calculator</h2><div class="calc"><div id="calcScreen"></div><div id="calcKeys" class="calc-keys"></div></div></div>`;
    main.appendChild(sec);
    if(window.setupCalc) setupCalc();
  };

  // Create calculator page if missing, separate tab route.
  createCalcPageV43();

  // Strong calculator display fix
  const oldSetupCalc=window.setupCalc;
  window.setupCalc=function(){
    if(oldSetupCalc) oldSetupCalc();
    const screen=document.getElementById('calcScreen');
    if(screen){
      screen.style.background='#050505';
      screen.style.color='#fff';
    }
    const calc=document.querySelector('.calc');
    if(calc) calc.classList.add('iosCalc');
    const keys=document.getElementById('calcKeys');
    if(keys) keys.classList.add('iosKeys');
  };

  function safePhoneDigits(raw){
    let d=String(raw||'').replace(/\D/g,'');
    if(d.length===10) return '91'+d;
    if(d.length===12 && d.startsWith('91')) return d;
    if(d.length>10) return d;
    return d ? '91'+d.slice(-10) : '';
  }
  window.safePhoneDigitsV43=safePhoneDigits;
  window.openWhatsApp=function(raw,text=''){
    const d=safePhoneDigits(raw);
    if(!d || d.length<12) return alert('Valid phone number নেই। 10 digit number দিন।');
    window.open('https://wa.me/'+d+(text?('?text='+encodeURIComponent(text)):''),'_blank');
  };

  window.chatViewBill=function(id){
    closeChat();
    viewBill(id);
  };
  window.chatOpenPay=function(id){
    closeChat();
    openPayment(id);
    setTimeout(()=>{const a=document.getElementById('payAmount'); if(a) a.focus();},120);
  };
  window.chatDeleteBill=function(id){
    if(!confirm('Delete this bill?')) return;
    deleteBill(id);
  };

  window.renderCustomers=function(){
    const list=document.getElementById('customerList');
    if(!list) return;
    let q=(document.getElementById('customerSearch')?.value||'').toLowerCase().trim();
    let rows=state.customers.filter(c=>(c.name+c.phone+c.village+c.address).toLowerCase().includes(q));
    list.innerHTML=rows.length?rows.map(c=>{
      let due=customerDue(c.id);
      let bills=state.bills.filter(b=>b.customerId===c.id);
      let last=(bills.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0]||{}).date||'-';
      return `<div class="customer-row" role="button" tabindex="0" onclick="openChat('${c.id}')">
        <div class="avatar">${esc(initials(c.name))}</div>
        <div class="cust-main">
          <div class="cust-name">${esc(c.name||'Unnamed')}</div>
          <div class="cust-sub">📞 ${esc(c.phone||'No phone')} • 📍 ${esc(c.village||'No village')}</div>
          <div class="cust-sub">Bills ${bills.length} • Last ${esc(last)} • Tap to open ledger</div>
        </div>
        <span class="pill ${due>0?'due':'paid'}">${due>0?money(due):'Paid'}</span>
      </div>`;
    }).join(''):`<div class="card muted">No customer yet</div>`;
  };

  window.renderChat=function(){
    let c=state.customers.find(x=>x.id===activeCustomer); if(!c) return;

    chatAvatar.textContent=initials(c.name);
    chatName.textContent=c.name;
    chatSub.textContent=(c.phone||'No phone')+' • '+(c.village||'No village')+' • Due '+money(customerDue(c.id));

    chatCall.textContent=realIcon('call');
    chatWhats.textContent=realIcon('whatsapp');
    chatShare.textContent=realIcon('share');
    if(chatMore) chatMore.textContent=realIcon('more');

    chatCall.onclick=()=>{const d=safePhoneDigits(c.phone); if(!d)return alert('Phone number নেই'); location.href='tel:+'+d;};
    chatWhats.onclick=()=>openWhatsApp(c.phone, customerReminderText(c));
    chatShare.onclick=()=>shareCustomerBill(c.id);
    chatBill.onclick=()=>{closeChat(); showPage('billPage'); billCustomer.value=c.id; toggleManual(); previewBill();};
    chatPay.onclick=()=>directPay(c.id,false);
    chatSettle.onclick=()=>directPay(c.id,true);
    chatLedger.onclick=()=>renderChatLedger(c.id);
    chatEdit.onclick=()=>openCustomer(c.id);
    if(chatMore) chatMore.onclick=()=>openMoreMenu(c.id);

    const bills=state.bills.filter(b=>b.customerId===c.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    const total=bills.reduce((s,b)=>s+(+b.allTotal||0),0);
    const paid=bills.reduce((s,b)=>s+billPaid(b),0);
    let out=[`<div class="chat-summary"><div class="sum-card"><small>Live Due</small><b>${money(customerDue(c.id))}</b></div><div class="sum-card"><small>Total Bill</small><b>${money(total)}</b></div><div class="sum-card"><small>Collected</small><b>${money(paid)}</b></div></div>`];

    if((+c.openingDue||0)>0){
      out.push(`<div class="bubble setB"><b>Opening Due</b><br><b>${money(c.openingDue)}</b></div>`);
    }

    bills.forEach(b=>{
      out.push(`<div class="day">${esc(b.date)}</div>
        <div class="bubble billB">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
            <div><b>${esc(b.billNo)}</b><div class="chat-topnote">${esc(b.season||'-')} • ${esc(String(b.landAmount||''))} ${esc(b.unit||'')}</div></div>
            <div style="text-align:right"><b>${money(billDue(b))}</b><div class="chat-topnote">Due</div></div>
          </div>
          <div style="margin-top:8px;line-height:1.58">Total ${money(b.allTotal)}<br>Paid/Joma ${money(billPaid(b))}${b.note?`<br><small>Note: ${esc(b.note)}</small>`:''}</div>
          <div class="bubble-actions">
            <button type="button" onclick="chatViewBill('${b.id}')">View</button>
            <button type="button" class="primary" onclick="chatOpenPay('${b.id}')">Pay</button>
            <button type="button" onclick="shareCustomerBill('${c.id}','${b.id}')">Reminder + Bill</button>
            <button type="button" onclick="chatDeleteBill('${b.id}')">Delete</button>
          </div>
        </div>`);
      (b.payments||[]).forEach(p=>{
        out.push(`<div class="bubble ${String(p.mode||'').toLowerCase().includes('settle')?'setB':'payB'}">
          <b>${esc(p.mode||'Payment')}</b><div class="chat-topnote">${esc(p.date||'')} • ${esc(p.receivedIn||'')}</div>
          <b>${money(p.amount)}</b><br><small>${esc(p.note||'')}</small>
          <div class="entry-tools">
            <button type="button" onclick="editEntry('${p.id}')">Edit</button>
            <button type="button" onclick="editEntry('${p.id}')">Undo/Delete</button>
          </div>
        </div>`);
      });
    });

    chatBody.innerHTML=out.join('') || `<div class="bubble setB">No bill yet</div>`;
  };

  const oldShow=window.showPage;
  window.showPage=function(id){
    if(id==='calcPage') createCalcPageV43();
    if(oldShow) oldShow(id);
    document.querySelectorAll('.tabbar button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
    const active=document.querySelector(`.tabbar button[data-page="${id}"]`);
    if(active) active.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
    if(id==='calcPage' && window.setupCalc) setupCalc();
  };

  // Repair tabbar after all older patches are loaded.
  normalizeTabsV43();
  setupCalc();
  renderCustomers();
});
})();
