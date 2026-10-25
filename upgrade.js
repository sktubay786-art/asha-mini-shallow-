/* ASHA Billing V70 — settings-driven rates and user actions, streamlined dashboard and user action sheet. Preserves billing/Firebase logic. */
(() => {
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    document.documentElement.classList.add('asha-v67');
    const chip = document.querySelector('.hero-chips span:nth-child(2)');
    if (chip) chip.textContent = 'V70 · Settings Rate + User Actions';
    document.querySelectorAll('.flashcard').forEach(card => {
      card.setAttribute('aria-pressed','false');
      card.addEventListener('click', () => {
        const flipped = card.classList.toggle('is-flipped');
        card.setAttribute('aria-pressed', String(flipped));
        const title = card.querySelector('b');
        const small = card.querySelector('small');
        const hint = card.querySelector('.flip-hint');
        if (flipped) {
          title.textContent = card.dataset.front || 'Quick tip';
          small.textContent = card.dataset.back || '';
          hint.textContent = 'Tap to turn back ↻';
        } else {
          title.textContent = ({'NORMAL BILL':'Normal Bill','PRINT / PDF':'Print & PDF','REMINDER + BILL':'Reminder + Bill'})[card.dataset.front] || card.dataset.front;
          small.textContent = ({'NORMAL BILL':'Calculate · Save · Preview','PRINT / PDF':'Paper sizes · Clear layout','REMINDER + BILL':'Share image · Send reminder'})[card.dataset.front] || 'Tap to view tip';
          hint.textContent = 'Tap to flip ↻';
        }
      });
    });
    // Avoid accidental double-save on rapid taps without changing save semantics.
    const save = document.getElementById('saveBillBtn');
    if (save) save.addEventListener('click', () => {
      if (save.dataset.busy === '1') return;
      save.dataset.busy = '1';
      setTimeout(() => { save.dataset.busy = '0'; }, 900);
    }, true);
    // Keep preview responsive as print/template modes change.
    ['template','printMode','landUnit','rate','land','previousDue','paidNow'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.v67Bound) {
        el.dataset.v67Bound = '1';
        el.addEventListener('change', () => { if (typeof window.previewBill === 'function') window.previewBill(); });
      }
    });
  });
})();


/* V69: decorate the existing user action buttons without replacing their event handlers. */
(() => {
  const icons = {
    v52NewBill:'<path d="M7 3.5h7l4 4V20H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>',
    v52Edit:'<path d="m4 16.8-.8 4 4-.8L19 8.2 15.8 5z"/><path d="m14.8 6 3.2 3.2"/>',
    v52Ledger:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    v52Receive:'<path d="M12 3v18M17 7.5c0-2-2-3-5-3s-5 1-5 3 2 3 5 4.5 5 2.5 5 4.5-2 3.5-5 3.5-5-1.5-5-3.5"/>',
    v52Settle:'<path d="m5 12 4.2 4.2L19 6.5"/>',
    v52BillReminder:'<path d="M7 3.5h7l4 4V20H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h4"/><path d="M18.5 15.5v2.8M18.5 20.5h.01"/>',
    v52Normal:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    v52Call:'<path d="M7 3.8 10 7l-2 2.2a13 13 0 0 0 6.8 6.8l2.2-2 3.2 3-1.5 3c-.4.8-1.3 1.2-2.2 1C9.8 19.3 4.7 14.2 3 7.5c-.2-.9.2-1.8 1-2.2z"/>',
    v52Delete:'<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7"/>'
  };
  const labels = {v52NewBill:'New Bill',v52Edit:'Edit User',v52Ledger:'Ledger & History',v52Receive:'Receive Payment',v52Settle:'Settle Balance',v52BillReminder:'Bill + Reminder',v52Normal:'Normal Reminder',v52Call:'Call Customer',v52Delete:'Delete User'};
  const decorate = () => {
    const menu = document.getElementById('v52Menu');
    if (!menu) return;
    menu.querySelectorAll('.v52-actions button').forEach(btn => {
      const id = btn.id;
      if (!icons[id] || btn.dataset.iosDecorated === '1') return;
      btn.dataset.iosDecorated = '1';
      btn.innerHTML = `<span class="ios-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[id]}</svg></span><span>${labels[id] || btn.textContent.trim()}</span>`;
      btn.setAttribute('aria-label', labels[id] || btn.textContent.trim());
    });
  };
  const prior = window.openUserMenuV52;
  if (typeof prior === 'function' && !prior.__v69Wrapped) {
    const wrapped = function(...args) {
      const result = prior.apply(this,args);
      setTimeout(decorate,30);
      return result;
    };
    wrapped.__v69Wrapped = true;
    window.openUserMenuV52 = wrapped;
    window.openUserMenu = wrapped;
    window.openMoreMenu = wrapped;
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#v52Menu')) setTimeout(decorate,35);
  });
  window.ashaAuditV69 = () => ({build:'V69 iOS Motion + User Center',quickGuideRemoved:!document.querySelector('.studio-section[aria-label="Quick billing shortcuts"]'),iosNavAnimations:!!document.querySelector('.tabbar'),userActionSheet:!!document.getElementById('v52Menu')});
})();


/* ================= ASHA BILLING V73 — User tab + selected customer experience ================= */
(() => {
  const $ = id => document.getElementById(id);
  const safe = value => typeof esc === 'function' ? esc(value == null ? '' : String(value)) : String(value == null ? '' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => {
    const p={
      bill:'<path d="M6.5 3.5h8l4 4V21h-12zM14.5 3.5v4h4M9 12h7M9 15.5h7M9 19h4"/>',
      ledger:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
      receive:'<path d="M12 3v18M17 7.5c0-2-2-3-5-3s-5 1-5 3 2 2.7 5 4 5 2.2 5 4.5-2 3.5-5 3.5-5-1.5-5-3.5"/>',
      settle:'<path d="m4.5 12.5 5 5L20 7"/>',
      reminder:'<path d="M7 3.5h8l4 4V21H7zM15 3.5v4h4M9.5 12h5M9.5 15.5h4"/><path d="M18 16v3M18 21h.01"/>',
      more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      phone:'<path d="M7 3.5 10 7l-2 2a13 13 0 0 0 7 7l2-2 3.5 3-1.5 3c-.4.8-1.3 1.2-2.2 1C9.7 19.3 4.7 14.3 3 7.5c-.2-.9.2-1.8 1-2.2z"/>',
      users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-1.5a6 6 0 0 1 12 0V20M16 5.5a3 3 0 0 1 0 5.5M18 14a4 4 0 0 1 3 4v2"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${p[name]||p.more}</svg>`;
  };
  const listIcon = {bill:'bill',ledger:'ledger',receive:'receive',more:'more'};
  function customerBills(cid){return (state.bills||[]).filter(b=>b.customerId===cid)}
  function totals(cid){
    const bills=customerBills(cid);
    return {bills:bills.length,total:bills.reduce((s,b)=>s+(+b.current||+b.allTotal||0),0),collected:bills.reduce((s,b)=>s+(typeof billPaid==='function'?billPaid(b):(b.payments||[]).reduce((p,x)=>p+(+x.amount||0),0)),0),due:typeof customerDue==='function'?customerDue(cid):0};
  }
  function runQuick(cid, action){
    const c=(state.customers||[]).find(x=>x.id===cid); if(!c)return;
    if(action==='open'){ if(window.openChat)window.openChat(cid); return; }
    if(action==='bill'){ if(window.ashaUserQuickActionV70)window.ashaUserQuickActionV70(cid,'bill'); else {window.showPage?.('billPage'); if($('billCustomer'))$('billCustomer').value=cid;} return; }
    if(action==='receive'){ if(window.directPay)window.directPay(cid,false); else if(window.openPayment)window.openPayment(''); return; }
    if(action==='settle'){ if(window.directPay)window.directPay(cid,true); return; }
    if(action==='ledger'){ if(window.openChat)window.openChat(cid); setTimeout(()=>{if(window.renderChatLedger)window.renderChatLedger(cid); setTimeout(()=>insertOverview(cid),30)},30); return; }
    if(action==='reminder'){ const fn=window.v66BillReminder||window.v65BillReminder||window.v63BillReminder; if(fn){fn(cid);return;} if(window.openUserMenuV52)window.openUserMenuV52(cid);return; }
    if(action==='more'){ if(window.openUserMenuV52)window.openUserMenuV52(cid); else if(window.openUserMenu)window.openUserMenu(cid); return; }
  }
  window.ashaUserQuickActionV73=runQuick;
  function renderUserList(){
    const list=$('customerList'); if(!list)return;
    const search=($('customerSearch')?.value||'').trim().toLocaleLowerCase();
    const customers=(state.customers||[]).filter(c=>[c.name,c.phone,c.village,c.address,c.note,c.landNote].some(v=>String(v||'').toLocaleLowerCase().includes(search)));
    list.classList.add('v73-customer-list');
    const addBtn=$('addCustomerBtn'); if(addBtn){addBtn.innerHTML='<span aria-hidden="true">＋</span> Add User';addBtn.setAttribute('aria-label','Add user');}
    const heading=$('customersPage')?.querySelector('.row-head');
    if(heading){heading.classList.add('v73-users-heading');const h=heading.querySelector('h2');if(h)h.textContent='Users';const p=heading.querySelector('.muted');if(p)p.textContent='Customer profiles · bills · payments';let count=heading.querySelector('.v73-count');if(!count){count=document.createElement('span');count.className='v73-count';heading.insertBefore(count,addBtn||null)}count.textContent=`${customers.length} ${customers.length===1?'user':'users'}`;}
    $('customerSearch')?.classList.add('v73-search');
    const searchInput=$('customerSearch');
    if(searchInput && !searchInput.parentElement.classList.contains('v73-search-wrap')){const wrap=document.createElement('div');wrap.className='v73-search-wrap';searchInput.parentNode.insertBefore(wrap,searchInput);wrap.appendChild(searchInput);searchInput.placeholder='Search user, phone, village…';searchInput.setAttribute('aria-label','Search users by name, phone, village');}
    if(!customers.length){list.innerHTML=`<div class="v73-empty"><b>${search?'No matching users':'Your user list is empty'}</b><span>${search?'Try another name, phone number or village.':'Add a customer to start creating bills and tracking payments.'}</span></div>`;return;}
    list.innerHTML=customers.map(c=>{
      const t=totals(c.id), bills=customerBills(c.id).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))), last=bills[0];
      const name=safe(c.name||'Unnamed user'), phone=safe(c.phone||'No phone number'), village=safe(c.village||'Village not added');
      const due=t.due>0?`<span class="pill due">Due ${safe(money(t.due))}</span>`:`<span class="pill paid">Settled</span>`;
      const meta=`<div class="v73-user-meta"><span class="v73-meta-chip">${icon('phone')}${phone}</span><span class="v73-meta-chip">${icon('users')}${village}</span>${last?`<span class="v73-meta-chip">${icon('bill')}${safe(last.billNo||'Latest bill')} · ${safe(last.date||'')}</span>`:''}</div>`;
      return `<article class="customer-row v73-customer-card" data-v73-customer="${safe(c.id)}" tabindex="0" role="button" aria-label="Open ${name}"><div class="avatar">${safe(typeof initials==='function'?initials(c.name):String(c.name||'?').slice(0,2).toUpperCase())}</div><div class="cust-main"><div class="cust-name">${name}</div><div class="cust-sub">${phone}</div><div class="cust-sub">${village}</div></div>${due}${meta}<div class="v70-user-actions v73-user-actions"><button type="button" data-action="bill" aria-label="New bill for ${name}"><span>${icon('bill')}</span>Bill</button><button type="button" data-action="ledger" aria-label="Open ledger for ${name}"><span>${icon('ledger')}</span>Ledger</button><button type="button" data-action="receive" aria-label="Receive payment from ${name}"><span>${icon('receive')}</span>Receive</button><button type="button" data-action="more" aria-label="More actions for ${name}"><span>${icon('more')}</span>More</button></div></article>`;
    }).join('');
  }
  window.renderCustomers=renderUserList;
  // Some older app code calls the lexical global function rather than window property.
  try{renderCustomers=renderUserList}catch(e){}
  function listEvents(){
    const list=$('customerList'); if(!list||list.dataset.v73Events)return; list.dataset.v73Events='1';
    list.addEventListener('click',e=>{
      const card=e.target.closest('[data-v73-customer]');if(!card)return;
      const cid=card.dataset.v73Customer;const btn=e.target.closest('button[data-action]');
      if(btn){e.preventDefault();e.stopPropagation();runQuick(cid,btn.dataset.action);return;}
      runQuick(cid,'open');
    });
    list.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-v73-customer]')){e.preventDefault();runQuick(e.target.dataset.v73Customer,'open')}});
    $('customerSearch')?.addEventListener('input',renderUserList);
  }
  function overviewHTML(cid){
    const c=(state.customers||[]).find(x=>x.id===cid);if(!c)return '';
    const t=totals(cid), bills=customerBills(cid).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))), last=bills[0];
    const due=t.due>0;
    return `<section class="v73-user-overview" aria-label="Customer account summary"><div class="v73-user-overview-top"><div><span class="v73-user-overview-kicker">CUSTOMER ACCOUNT</span><h3>${safe(c.name||'Customer')}</h3><p>${safe(c.phone||'No phone number')} · ${safe(c.village||'Village not added')}</p></div><span class="v73-due-badge ${due?'':'paid'}">${due?'OUTSTANDING':'SETTLED'}<br>${safe(money(t.due))}</span></div><div class="v73-user-stats"><div class="v73-user-stat"><span>Total billed</span><b>${safe(money(t.total))}</b></div><div class="v73-user-stat"><span>Collected</span><b>${safe(money(t.collected))}</b></div><div class="v73-user-stat due"><span>Bill entries</span><b>${t.bills}</b></div></div>${(c.note||c.landNote)?`<p style="margin-top:12px;padding:10px 12px;border-radius:13px;background:#f2f8f4;border:1px solid #e3eee6;color:#617469"><b style="color:#2a4735">Note:</b> ${safe(c.note||c.landNote)}</p>`:''}${last?`<p style="margin-top:10px;font-size:11px">Latest bill: <b>${safe(last.billNo||'Bill')}</b> · ${safe(last.date||'')}</p>`:''}</section><section class="v73-user-actions-panel" aria-label="Customer actions"><div class="v73-user-actions-title"><b>Quick actions</b><span>Choose an action</span></div><div class="v73-detail-actions"><button class="primary" data-v73-detail-action="bill">${icon('bill')}<span>New Bill</span></button><button data-v73-detail-action="receive">${icon('receive')}<span>Receive</span></button><button data-v73-detail-action="settle">${icon('settle')}<span>Settle</span></button><button data-v73-detail-action="ledger">${icon('ledger')}<span>Full Ledger</span></button><button data-v73-detail-action="reminder">${icon('reminder')}<span>Bill + Reminder</span></button><button data-v73-detail-action="more">${icon('more')}<span>More</span></button></div></section><div class="v73-activity-label"><span>Account activity</span><small>${t.bills} bill${t.bills===1?'':'s'}</small></div>`;
  }
  function insertOverview(cid){
    const body=$('chatBody');if(!body||!cid)return;
    body.querySelector('.v73-user-overview')?.remove();body.querySelector('.v73-user-actions-panel')?.remove();body.querySelector('.v73-activity-label')?.remove();
    body.insertAdjacentHTML('afterbegin',overviewHTML(cid));
    body.querySelectorAll('[data-v73-detail-action]').forEach(btn=>{
      btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();runQuick(cid,btn.dataset.v73DetailAction)});
    });
    $('chatModal')?.classList.add('v73-user-detail');
    const close=$('chatBack');if(close){close.setAttribute('aria-label','Back to users');close.title='Back to users';}
  }
  const oldRenderChat=window.renderChat;
  window.renderChat=function(){if(oldRenderChat)oldRenderChat();const cid=typeof activeCustomer!=='undefined'?activeCustomer:null;if(cid)setTimeout(()=>insertOverview(cid),0);};
  try{renderChat=window.renderChat}catch(e){}
  const oldOpenChat=window.openChat;
  window.openChat=function(cid){$('chatModal')?.classList.add('v73-user-detail');if(oldOpenChat)oldOpenChat(cid);else{activeCustomer=cid;$('chatModal')?.classList.remove('hidden');window.renderChat?.()}setTimeout(()=>insertOverview(cid),25)};
  try{openChat=window.openChat}catch(e){}
  const oldCloseChat=window.closeChat;
  window.closeChat=function(){ $('chatModal')?.classList.remove('v73-user-detail');if(oldCloseChat)oldCloseChat();else $('chatModal')?.classList.add('hidden');};
  try{closeChat=window.closeChat}catch(e){}
  document.addEventListener('DOMContentLoaded',()=>{listEvents();setTimeout(()=>{renderUserList();const chip=document.querySelector('.hero-chips span:last-child');if(chip)chip.textContent='V73 · Premium User Center';const meta=document.querySelector('meta[name="app-build"]');if(meta)meta.content='V73 Premium User Center';},650)});
  if(document.readyState!=='loading'){listEvents();setTimeout(()=>{renderUserList();const chip=document.querySelector('.hero-chips span:last-child');if(chip)chip.textContent='V73 · Premium User Center';const meta=document.querySelector('meta[name="app-build"]');if(meta)meta.content='V73 Premium User Center';},650)}
  window.ashaAuditV73=()=>({build:'V73 Premium User Center',customUserCards:!!document.querySelector('#customerList.v73-customer-list'),particularUserOverview:!!document.querySelector('#chatModal.v73-user-detail .v73-user-overview'),userQuickActions:!!document.querySelector('#customerList .v73-user-actions')});
})();
