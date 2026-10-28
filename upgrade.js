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
          title.textContent = ({'NORMAL BILL':'Normal Bill','PRINT / PDF':'Print & PDF','REMINDER + BILL':'Bill Reminder'})[card.dataset.front] || card.dataset.front;
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
  const labels = {v52NewBill:'New Bill',v52Edit:'Edit User',v52Ledger:'Ledger & History',v52Receive:'Receive Payment',v52Settle:'Settle Balance',v52BillReminder:'Bill Reminder',v52Normal:'Normal Reminder',v52Call:'Call Customer',v52Delete:'Delete User'};
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
    const c=(state.customers||[]).find(x=>String(x.id)===String(cid)); const openingCollected=(c?.openingDueHistory||[]).filter(x=>x.type==='payment').reduce((s,x)=>s+(Number(x.amount)||0),0); return {bills:bills.length,total:bills.reduce((s,b)=>s+(+b.current||+b.allTotal||0),0),collected:bills.reduce((s,b)=>s+(typeof billPaid==='function'?billPaid(b):(b.payments||[]).reduce((p,x)=>p+(+x.amount||0),0)),0)+openingCollected,due:typeof customerDue==='function'?customerDue(cid):0};
  }
  function runQuick(cid, action){
    const c=(state.customers||[]).find(x=>x.id===cid); if(!c)return;
    if(action==='open'){ if(window.openChat)window.openChat(cid); return; }
    if(action==='bill'){ if(window.ashaUserQuickActionV70)window.ashaUserQuickActionV70(cid,'bill'); else {window.showPage?.('billPage'); if($('billCustomer'))$('billCustomer').value=cid;} return; }
    if(action==='receive'){ if(window.ashaOpenUserSheetV74)return window.ashaOpenUserSheetV74(cid,'receive'); if(window.directPay)window.directPay(cid,false); else if(window.openPayment)window.openPayment(''); return; }
    if(action==='settle'){ if(window.ashaOpenUserSheetV74)return window.ashaOpenUserSheetV74(cid,'settle'); if(window.directPay)window.directPay(cid,true); return; }
    if(action==='ledger'){ if(window.ashaOpenUserSheetV74)return window.ashaOpenUserSheetV74(cid,'ledger'); if(window.openChat)window.openChat(cid); setTimeout(()=>{if(window.renderChatLedger)window.renderChatLedger(cid); setTimeout(()=>insertOverview(cid),30)},30); return; }
    if(action==='reminder'){ const fn=window.v66BillReminder||window.v65BillReminder||window.v63BillReminder; if(fn){fn(cid);return;} if(window.openUserMenuV52)window.openUserMenuV52(cid);return; }
    if(action==='more'){ if(window.ashaOpenUserSheetV74)return window.ashaOpenUserSheetV74(cid,'actions'); if(window.openUserMenuV52)window.openUserMenuV52(cid); else if(window.openUserMenu)window.openUserMenu(cid); return; }
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
    return `<section class="v73-user-overview" aria-label="Customer account summary"><div class="v73-user-overview-top"><div><span class="v73-user-overview-kicker">CUSTOMER ACCOUNT</span><h3>${safe(c.name||'Customer')}</h3><p>${safe(c.phone||'No phone number')} · ${safe(c.village||'Village not added')}</p></div><span class="v73-due-badge ${due?'':'paid'}">${due?'OUTSTANDING':'SETTLED'}<br>${safe(money(t.due))}</span></div><div class="v73-user-stats"><div class="v73-user-stat"><span>Total billed</span><b>${safe(money(t.total))}</b></div><div class="v73-user-stat"><span>Collected</span><b>${safe(money(t.collected))}</b></div><div class="v73-user-stat due"><span>Bill entries</span><b>${t.bills}</b></div></div>${(c.note||c.landNote)?`<p style="margin-top:12px;padding:10px 12px;border-radius:13px;background:#f2f8f4;border:1px solid #e3eee6;color:#617469"><b style="color:#2a4735">Note:</b> ${safe(c.note||c.landNote)}</p>`:''}${last?`<p style="margin-top:10px;font-size:11px">Latest bill: <b>${safe(last.billNo||'Bill')}</b> · ${safe(last.date||'')}</p>`:''}</section><section class="v73-user-actions-panel" aria-label="Customer actions"><div class="v73-user-actions-title"><b>Quick actions</b><span>Choose an action</span></div><div class="v73-detail-actions"><button class="primary" data-v73-detail-action="bill">${icon('bill')}<span>New Bill</span></button><button data-v73-detail-action="receive">${icon('receive')}<span>Receive</span></button><button data-v73-detail-action="settle">${icon('settle')}<span>Settle</span></button><button data-v73-detail-action="ledger">${icon('ledger')}<span>Full Ledger</span></button><button data-v73-detail-action="reminder">${icon('reminder')}<span>Bill Reminder</span></button><button data-v73-detail-action="more">${icon('more')}<span>More</span></button></div></section><div class="v73-activity-label"><span>Account activity</span><small>${t.bills} bill${t.bills===1?'':'s'}</small></div>`;
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

/* ASHA Billing V74 — audited customer actions, safe iOS action sheet, particular-user ledger/forms */
(() => {
  const $ = id => document.getElementById(id);
  const safe = value => typeof esc === 'function' ? esc(value == null ? '' : String(value)) : String(value == null ? '' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const customer = cid => (state.customers || []).find(c => String(c.id) === String(cid));
  const billsFor = cid => (state.bills || []).filter(b => String(b.customerId) === String(cid));
  const dueFor = cid => typeof customerDue === 'function' ? Math.max(0, Number(customerDue(cid)) || 0) : 0;
  const icons = {
    bill:'<path d="M6.5 3.5h8l4 4V21h-12zM14.5 3.5v4h4M9 12h7M9 15.5h7M9 19h4"/>',
    edit:'<path d="m4 16.8-.8 4 4-.8L19 8.2 15.8 5zM14.8 6l3.2 3.2"/>',
    ledger:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
    receive:'<path d="M12 3v18M17 7.5c0-2-2-3-5-3s-5 1.2-5 3 2 2.8 5 4 5 2.5 5 4.5-2 3.5-5 3.5-5-1.5-5-3.5"/>',
    settle:'<path d="m4.5 12.5 5 5L20 7"/>',
    reminder:'<path d="M7 3.5h8l4 4V21H7zM15 3.5v4h4M9.5 12h5M9.5 15.5h4M18 16v3M18 21h.01"/>',
    chat:'<path d="M4 5.5h16v11H9l-5 3zM8 9h8M8 12.5h5"/>',
    phone:'<path d="M7 3.8 10 7l-2 2a13 13 0 0 0 7 7l2-2 3.5 3-1.5 3c-.4.8-1.3 1.2-2.2 1C9.7 19.3 4.7 14.3 3 7.5c-.2-.9.2-1.8 1-2.2z"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    back:'<path d="m15 18-6-6 6-6M9 12h11"/>'
  };
  const svg = key => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key] || icons.bill}</svg>`;
  let lastFocus = null;

  function ensureSheet(){
    let root = $('v52Menu');
    if (!root) {
      document.body.insertAdjacentHTML('beforeend', '<div id="v52Menu" aria-hidden="true"><section class="v52-panel v74-panel" role="dialog" aria-modal="true" aria-labelledby="v52Name"><div class="v52-title"><div><b id="v52Name"></b><small id="v52Sub"></small></div><button type="button" class="v52-close" id="v52Close" aria-label="Close">×</button></div><div id="v52Body" class="v52-actions"></div><div id="v52Status" class="v52-status"></div></section></div>');
      root = $('v52Menu');
    }
    const close = $('v52Close');
    if (close) close.onclick = closeSheet;
    if (root && root.dataset.v74Backdrop !== '1') {
      root.dataset.v74Backdrop = '1';
      root.addEventListener('click', e => { if (e.target === root) closeSheet(); });
    }
    return root;
  }
  function closeSheet(){
    const root = $('v52Menu');
    if (root) { root.classList.remove('open'); root.setAttribute('aria-hidden','true'); }
    document.body.classList.remove('v74-sheet-open');
    if (lastFocus && typeof lastFocus.focus === 'function') { try { lastFocus.focus({preventScroll:true}); } catch (_) {} }
  }
  function showSheet(cid, title='User actions', sub=''){
    const c = customer(cid); if (!c) { alert('User not found.'); return null; }
    lastFocus = document.activeElement;
    ensureSheet();
    $('v52Name').textContent = title;
    $('v52Sub').textContent = sub || `${c.name || 'User'} · ${c.phone || 'No phone'} · Due ${money(dueFor(cid))}`;
    $('v52Status').textContent = '';
    $('v52Menu').classList.add('open'); $('v52Menu').setAttribute('aria-hidden','false');
    document.body.classList.add('v74-sheet-open');
    return c;
  }
  function bindAction(id, fn){ const b=$(id); if (b) b.onclick = e => { e.preventDefault(); e.stopPropagation(); fn(); }; }
  function actionButton(action,label,ico,cls='') { return `<button type="button" class="${cls}" data-v74-action="${action}"><span class="ios-action-icon">${svg(ico)}</span><span>${label}</span></button>`; }
  function openActions(cid){
    const c = showSheet(cid, 'User actions'); if (!c) return;
    const b = $('v52Body'); b.className = 'v52-actions v74-action-grid';
    b.innerHTML = [
      actionButton('bill','New Bill','bill','primary'), actionButton('edit','Edit User','edit'),
      actionButton('ledger','Ledger & History','ledger'), actionButton('receive','Receive Payment','receive'),
      actionButton('settle','Settle / Adjust','settle'), actionButton('reminder','Bill Reminder','reminder','primary'),
      actionButton('chat','Private Chat / Notes','chat'), actionButton('normal','WhatsApp Reminder','chat'),
      actionButton('call','Call Customer','phone'), actionButton('delete','Delete User','trash','danger')
    ].join('');
    $('v52Status').textContent = billsFor(cid).length ? `Latest bill: ${safe(latestBill(cid)?.billNo || 'Available')} · Choose an action` : 'No bill yet · Create a bill before sharing a bill reminder.';
    b.querySelectorAll('[data-v74-action]').forEach(btn => btn.addEventListener('click', () => runAction(cid, btn.dataset.v74Action)));
    setTimeout(() => b.querySelector('button')?.focus({preventScroll:true}), 30);
  }
  function latestBill(cid){ return billsFor(cid).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')) || String(b.billNo||'').localeCompare(String(a.billNo||'')))[0] || null; }
  function openNewBill(cid){
    closeSheet();
    try { if (window.closeChat) window.closeChat(); } catch (_) {}
    try { if (window.closeUserDetailV51) window.closeUserDetailV51(); } catch (_) {}
    if (typeof showPage === 'function') showPage('billPage');
    setTimeout(() => { const sel=$('billCustomer'); if(sel){sel.value=String(cid); if(typeof toggleManual==='function')toggleManual(); if(typeof updatePreviousDueV55==='function')updatePreviousDueV55(true); if(typeof previewBill==='function')previewBill();} }, 140);
  }
  function openEdit(cid){
    const c=customer(cid); if(!c)return;
    showSheet(cid,'Edit user', `${c.name || 'User'} · update profile`);
    const b=$('v52Body'); b.className='v53-form v74-form';
    b.innerHTML=`<label for="v74Name">Full name</label><input id="v74Name" maxlength="120" value="${safe(c.name||'')}"><label for="v74Phone">Phone</label><input id="v74Phone" inputmode="tel" maxlength="24" value="${safe(c.phone||'')}"><div class="v74-two"><div><label for="v74Village">Village</label><input id="v74Village" maxlength="120" value="${safe(c.village||'')}"></div><div><label for="v74Opening">Opening due (₹)</label><input id="v74Opening" type="number" min="0" step="0.01" value="${Math.max(0,Number(c.openingDue)||0)}"></div></div><label for="v74Address">Address</label><textarea id="v74Address" maxlength="500">${safe(c.address||'')}</textarea><label for="v74Note">Private note / land note</label><textarea id="v74Note" maxlength="1000">${safe(c.note||c.landNote||'')}</textarea><div class="v74-form-actions"><button type="button" class="v74-secondary" id="v74Cancel">Cancel</button><button type="button" class="v74-primary" id="v74Save">Save changes</button></div>`;
    $('v52Status').textContent='Profile and opening balance will update; existing bills and payment entries remain unchanged.';
    bindAction('v74Cancel',()=>openActions(cid));
    bindAction('v74Save',()=>{
      const name=$('v74Name').value.trim(); const opening=Number($('v74Opening').value);
      if(!name){alert('Please enter the customer name.');$('v74Name').focus();return;}
      if(!Number.isFinite(opening)||opening<0){alert('Opening due must be zero or a positive amount.');$('v74Opening').focus();return;}
      c.name=name; c.phone=typeof normalPhone==='function'?normalPhone($('v74Phone').value):$('v74Phone').value.trim(); c.village=$('v74Village').value.trim(); c.address=$('v74Address').value.trim(); c.openingDue=opening;
      const note=$('v74Note').value.trim(); c.note=note; if('landNote' in c) c.landNote=note;
      if(typeof saveState==='function')saveState(); closeSheet();
      if(typeof activeCustomer!=='undefined' && String(activeCustomer)===String(cid) && window.renderChat)window.renderChat();
      if(window.ashaAuditV74){};
    });
  }
  function openLedger(cid){
    const c=customer(cid); if(!c)return;
    showSheet(cid,'Ledger & history', `${c.name || 'User'} · live due ${money(dueFor(cid))}`);
    const b=$('v52Body'); b.className='v74-ledger';
    const bills=billsFor(cid).slice().sort((a,z)=>String(z.date||'').localeCompare(String(a.date||'')));
    let rows='';
    if((Number(c.openingDue)||0)>0) rows+=`<div class="v74-ledger-row opening"><div><b>Opening balance remaining</b><small>Carried forward</small></div><strong>${money(c.openingDue)}</strong></div>`;
    (c.openingDueHistory||[]).slice().sort((a,z)=>String(z.date||'').localeCompare(String(a.date||''))).forEach(h=>{rows+=`<div class="v74-payment-row"><span>${safe(h.type==='adjustment'?'Opening balance adjustment':'Opening balance payment')} · ${safe(h.date||'')}<small>${safe(h.note||h.mode||'')}</small></span><b>${h.type==='adjustment'?'Adjusted':'−'}${money(h.amount)}</b></div>`;});
    bills.forEach(bill=>{
      const paid=typeof billPaid==='function'?billPaid(bill):(bill.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0);
      const total=Number(bill.allTotal)||0; const due=typeof billDue==='function'?billDue(bill):Math.max(0,total-paid);
      rows+=`<article class="v74-ledger-bill"><div class="v74-ledger-row"><div><b>${safe(bill.billNo||'Bill')}</b><small>${safe(bill.date||'No date')} · ${safe(bill.season||'')}</small></div><strong>${money(total)}</strong></div><div class="v74-ledger-pills"><span>Paid ${money(paid)}</span><span class="${due>0?'due':'paid'}">Due ${money(due)}</span></div>${(bill.payments||[]).map(p=>`<div class="v74-payment-row"><span>${safe(p.mode||'Payment')} · ${safe(p.date||'')}<small>${safe(p.note||p.receivedIn||'')}</small></span><b>−${money(p.amount)}</b></div>`).join('')}<button type="button" class="v74-view-bill" data-v74-view-bill="${safe(bill.id)}">View bill</button></article>`;
    });
    b.innerHTML=`<div class="v74-ledger-total"><span>Current outstanding</span><b>${money(dueFor(cid))}</b></div>${rows||'<div class="v74-empty">No bill or payment entries yet.</div>'}<button type="button" class="v74-secondary v74-wide" id="v74LedgerBack">Back to user actions</button>`;
    b.querySelectorAll('[data-v74-view-bill]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.v74ViewBill;closeSheet();if(typeof viewBill==='function')viewBill(id);else{const bill=(state.bills||[]).find(x=>String(x.id)===String(id));if(bill){currentBill=bill;if(typeof renderInvoice==='function')renderInvoice(bill);if(typeof showPage==='function')showPage('billPage');}}});
    bindAction('v74LedgerBack',()=>openActions(cid));
  }
  function openPaymentForm(cid,settle=false){
    const c=customer(cid);if(!c)return;
    const due=dueFor(cid);
    showSheet(cid,settle?'Settle / adjust balance':'Receive payment', `${c.name || 'User'} · outstanding ${money(due)}`);
    const b=$('v52Body');b.className='v53-form v74-form';
    b.innerHTML=`<div class="v74-due-callout"><span>Outstanding balance</span><b>${money(due)}</b></div><label for="v74Amount">${settle?'Settlement amount':'Amount received'} (₹)</label><input id="v74Amount" type="number" min="0.01" max="${due}" step="0.01" inputmode="decimal" value="${due>0?due:''}" placeholder="Enter amount" ${due<=0?'disabled':''}>${settle?'<label for="v74PayNote">Adjustment note</label><input id="v74PayNote" maxlength="180" value="Settled / adjusted">':'<div class="v74-two"><div><label for="v74PayMode">Payment mode</label><select id="v74PayMode"><option>Cash</option><option>Online</option><option>UPI</option><option>Bank</option><option>Other</option></select></div><div><label for="v74ReceivedIn">Received in</label><select id="v74ReceivedIn"><option>Cash</option><option>Bank</option><option>UPI</option><option>Other</option></select></div></div><label for="v74PayNote">Note (optional)</label><input id="v74PayNote" maxlength="180" placeholder="Payment note">'}<div class="v74-form-actions"><button type="button" class="v74-secondary" id="v74PayCancel">Cancel</button><button type="button" class="v74-primary" id="v74PaySave" ${due<=0?'disabled':''}>${settle?'Save adjustment':'Save payment'}</button></div>`;
    $('v52Status').textContent=settle?'Settlement reduces the due; it is recorded as an adjustment, not cash collected.':'Payment is allocated against this customer’s oldest outstanding bills first.';
    bindAction('v74PayCancel',()=>openActions(cid));
    bindAction('v74PaySave',()=>{
      const amount=Number($('v74Amount').value); const currentDue=dueFor(cid);
      if(!Number.isFinite(amount)||amount<=0){alert('Enter an amount greater than zero.');return;}
      if(amount>currentDue+0.009){alert(`Amount cannot exceed the current due of ${money(currentDue)}.`);return;}
      let left=Math.round(amount*100)/100;
      const billList=billsFor(cid).filter(x=>(typeof billDue==='function'?billDue(x):Math.max(0,(Number(x.allTotal)||0)-(typeof billPaid==='function'?billPaid(x):0)))>0).sort((a,z)=>String(a.date||'').localeCompare(String(z.date||'')));
      billList.forEach(bill=>{
        if(left<=0.0001)return;
        const billBal=typeof billDue==='function'?billDue(bill):Math.max(0,(Number(bill.allTotal)||0)-(typeof billPaid==='function'?billPaid(bill):0));
        const applied=Math.min(left,billBal); if(applied<=0)return;
        (bill.payments||(bill.payments=[])).push({id:typeof uid==='function'?uid():String(Date.now()),date:typeof today==='function'?today():new Date().toISOString().slice(0,10),amount:Math.round(applied*100)/100,mode:settle?'Settlement':$('v74PayMode').value,receivedIn:settle?'Adjusted':$('v74ReceivedIn').value,note:($('v74PayNote')?.value||'').trim()||(settle?'Settled / adjusted':'Payment received')});
        left=Math.round((left-applied)*100)/100;
      });
      if(left>0.0001){
        const opening=Math.max(0,Number(c.openingDue)||0); const applied=Math.min(opening,left);
        if(applied>0){
          c.openingDue=Math.round((opening-applied)*100)/100;
          (c.openingDueHistory||(c.openingDueHistory=[])).push({id:typeof uid==='function'?uid():String(Date.now()),date:typeof today==='function'?today():new Date().toISOString().slice(0,10),amount:applied,mode:settle?'Settlement':$('v74PayMode').value,note:($('v74PayNote')?.value||'').trim()||(settle?'Opening balance adjusted':'Opening balance payment'),type:settle?'adjustment':'payment'});
        }
      }
      if(typeof saveState==='function')saveState();closeSheet();
      if(typeof activeCustomer!=='undefined' && String(activeCustomer)===String(cid) && window.renderChat)window.renderChat();
      try { if(typeof renderDash==='function')renderDash(); if(typeof renderReports==='function')renderReports(); } catch(_) {}
    });
  }
  function runAction(cid,action){
    const c=customer(cid);if(!c)return;
    if(action==='bill')return openNewBill(cid);
    if(action==='edit')return openEdit(cid);
    if(action==='ledger')return openLedger(cid);
    if(action==='receive')return openPaymentForm(cid,false);
    if(action==='settle')return openPaymentForm(cid,true);
    if(action==='reminder'){
      const fn=window.v66BillReminder||window.v65BillReminder||window.v64BillReminder||window.v63BillReminder||window.shareCustomerBill;
      if(typeof fn==='function'){closeSheet();return fn(cid);} alert('Bill reminder is unavailable in this build.');return;
    }
    if(action==='chat'){
      closeSheet();const fn=window.openManualChatV64||window.openManualChatV63;
      if(typeof fn==='function')return fn(cid);
      if(window.openChat)return window.openChat(cid);
      alert('Chat/notes are unavailable in this build.');return;
    }
    if(action==='normal'){
      closeSheet();const digits=String(c.phone||'').replace(/\D/g,'');const number=digits.length===10?'91'+digits:digits;
      const text=`${state.settings.company||'ASHA Billing'}\nName: ${c.name||''}\nOutstanding due: ${money(dueFor(cid))}\nআপনার বকেয়া বিল পরিশোধ করার অনুরোধ রইল।\nThank you, ${state.settings.owner||''}\nContact: ${state.settings.contact||''}`;
      if(!number){alert('Add a valid phone number first.');return;}
      if(typeof openWhatsApp==='function')return openWhatsApp(c.phone,text);
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`,'_blank','noopener');return;
    }
    if(action==='call'){
      closeSheet();const digits=String(c.phone||'').replace(/\D/g,'');if(!digits){alert('Add a phone number first.');return;}location.href='tel:'+digits;return;
    }
    if(action==='delete'){
      closeSheet();
      // Existing deletion function owns the confirmation and canonical state cleanup.
      if(typeof deleteCustomer==='function')deleteCustomer(cid);else{if(!confirm(`Delete ${c.name||'this user'} and all associated bills/payment history? This cannot be undone.`))return;state.customers=state.customers.filter(x=>String(x.id)!==String(cid));state.bills=state.bills.filter(x=>String(x.customerId)!==String(cid));if(typeof saveState==='function')saveState();}
    }
  }
  window.openUserMenuV52 = openActions;
  window.openUserMenu = openActions;
  window.openMoreMenu = openActions;
  window.ashaOpenUserSheetV74 = (cid,view='actions') => view==='receive'?openPaymentForm(cid,false):view==='settle'?openPaymentForm(cid,true):view==='ledger'?openLedger(cid):openActions(cid);
  window.closeUserSheetV74 = closeSheet;
  // Include payments applied to carried-forward opening balances in the dashboard collection metric.
  try {
    const baseDash = window.renderDash;
    if (typeof baseDash === 'function' && !baseDash.__v74OpeningDue) {
      const wrappedDash = function(){
        baseDash();
        const node = document.querySelectorAll('#metrics .metric b')[1];
        if (node) {
          const billCollections = (state.bills||[]).reduce((sum,b)=>sum+(typeof billPaid==='function'?billPaid(b):0),0);
          const openingCollections = (state.customers||[]).reduce((sum,c)=>sum+(c.openingDueHistory||[]).filter(h=>h.type==='payment').reduce((n,h)=>n+(Number(h.amount)||0),0),0);
          node.textContent = money(billCollections + openingCollections);
        }
      };
      wrappedDash.__v74OpeningDue = true;
      window.renderDash = wrappedDash;
      renderDash = wrappedDash;
    }
  } catch (_) {}
  window.ashaAuditV74 = () => ({build:'V74 Customer Functions Audit',userMenu:!!$('v52Menu'),actionButtons:!!$('v52Body')?.querySelector('[data-v74-action]'),selectedCustomer:typeof activeCustomer!=='undefined'?activeCustomer:null,customerCount:(state.customers||[]).length,billCount:(state.bills||[]).length,hasReminder:typeof (window.v66BillReminder||window.v65BillReminder)==='function',hasPaymentForm:typeof openPaymentForm==='function'});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('v52Menu')?.classList.contains('open'))closeSheet();});
  // Re-route V73 quick actions through reliable, customer-scoped views instead of prompt/DOM replacement flows.
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-v73-detail-action]');if(!btn)return;
    const cid=typeof activeCustomer!=='undefined'?activeCustomer:null;if(!cid)return;
    const action=btn.dataset.v73DetailAction;
    if(['receive','settle','ledger','more'].includes(action)){e.preventDefault();e.stopImmediatePropagation();if(action==='more')openActions(cid);else if(action==='ledger')openLedger(cid);else openPaymentForm(cid,action==='settle');}
  },true);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#customerList [data-action]');if(!btn)return;
    const card=btn.closest('[data-v73-customer]');if(!card)return;
    const action=btn.dataset.action;if(!['receive','ledger','more'].includes(action))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(action==='receive')openPaymentForm(card.dataset.v73Customer,false);else if(action==='ledger')openLedger(card.dataset.v73Customer);else openActions(card.dataset.v73Customer);
  },true);
  document.documentElement.classList.add('asha-v74');
  // Keep the historical customer-action styles/features, but never overwrite the current build label.
})();

/* ===================== V75 WHOLE-APP RATE CONSISTENCY + CLEAN UI ===================== */
(function(){
  const q=id=>document.getElementById(id);
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0;};
  const KATHA_PER_BIGHA=20, DECIMAL_PER_BIGHA=40;
  const unitOf=u=>u==='katha'?'katha':u==='decimal'?'decimal':'bigha';
  function baseRate(){return Math.max(0,n(state?.settings?.rateBigha ?? 2200));}
  function rateFor(unit){const r=baseRate();return unit==='katha'?r/KATHA_PER_BIGHA:unit==='decimal'?r/DECIMAL_PER_BIGHA:r;}
  function toBigha(amount,unit){const a=n(amount);return unit==='katha'?a/KATHA_PER_BIGHA:unit==='decimal'?a/DECIMAL_PER_BIGHA:a;}
  function normalize(b){if(!b)return b;const unit=unitOf(b.unit||'bigha');const land=n(b.landAmount);const rateUnit=unitOf(b.rateUnit||unit);const rate=n(b.rate);const amount=land*rate;return {...b,unit,rateUnit,landAmount:land,bigha:toBigha(land,unit),rate,current:Math.round((amount+Number.EPSILON)*100)/100,allTotal:Math.round((n(b.previousDue)+amount+Number.EPSILON)*100)/100};}
  window.ashaRateForV75=rateFor;window.ashaLandToBighaV75=toBigha;window.ashaNormalizeBillV75=normalize;
  function syncSettingsDisplay(){
    const r=baseRate();
    if(q('setRateBigha'))q('setRateBigha').value=String(r);
    if(q('setRateKatha'))q('setRateKatha').value=(r/KATHA_PER_BIGHA).toFixed(2).replace(/\.00$/,'');
    if(q('setRateDecimal'))q('setRateDecimal').value=(r/DECIMAL_PER_BIGHA).toFixed(2).replace(/\.00$/,'');
  }
  function syncBillRate(force){const unit=unitOf(q('landUnit')?.value||'bigha'),input=q('rate');if(!input)return;if(force||input.dataset.v75Auto==='1'||!input.value){input.value=String(rateFor(unit));input.dataset.v75Auto='1';}const label=input.closest('div')?.querySelector('label');if(label)label.textContent='Rate / '+(unit==='katha'?'কাঠা':unit==='decimal'?'ডেসিমেল':'বিঘা');}
  // Always derive all unit rates from the saved per-bigha rate, preventing stale converted rates.
  const oldSettingsSave=window.saveSettings;
  if(typeof oldSettingsSave==='function'&&!oldSettingsSave.__v75){const wrapped=function(){if(q('setRateBigha'))state.settings.rateBigha=Math.max(0,n(q('setRateBigha').value));state.settings.rateKatha=rateFor('katha');state.settings.rateDecimal=rateFor('decimal');const out=oldSettingsSave.apply(this,arguments);state.settings.rateKatha=rateFor('katha');state.settings.rateDecimal=rateFor('decimal');syncSettingsDisplay();syncBillRate(true);return out;};wrapped.__v75=true;window.saveSettings=wrapped;try{saveSettings=wrapped;}catch(_){}}
  document.addEventListener('input',e=>{if(e.target?.id==='setRateBigha'){const r=Math.max(0,n(e.target.value));if(q('setRateKatha'))q('setRateKatha').value=(r/20).toFixed(2);if(q('setRateDecimal'))q('setRateDecimal').value=(r/40).toFixed(2);}});
  document.addEventListener('change',e=>{if(e.target?.id==='landUnit'){syncBillRate(true);if(typeof previewBill==='function')previewBill();}});
  if(q('rate'))q('rate').addEventListener('input',()=>{q('rate').dataset.v75Auto='0';});
  const oldBuilder=window.makeBillFromForm;
  if(typeof oldBuilder==='function'&&!oldBuilder.__v75){const wrapped=function(){const b=oldBuilder.apply(this,arguments);if(!b)return b;const unit=unitOf(q('landUnit')?.value||b.unit||'bigha');const land=n(q('land')?.value??b.landAmount);const rate=(q('rate')?.dataset.v75Auto==='1'||!q('rate')?.value)?rateFor(unit):n(q('rate').value);return normalize({...b,unit,rateUnit:unit,landAmount:land,rate});};wrapped.__v75=true;window.makeBillFromForm=wrapped;try{makeBillFromForm=wrapped;}catch(_){}}
  const oldInvoice=window.renderInvoice;
  if(typeof oldInvoice==='function'&&!oldInvoice.__v75){const wrapped=function(b){return oldInvoice.call(this,b?.rateUnit?normalize(b):b,...Array.prototype.slice.call(arguments,1));};wrapped.__v75=true;window.renderInvoice=wrapped;try{renderInvoice=wrapped;}catch(_){}}
  // Compact non-essential helper copy without hiding fields, totals, or functional controls.
  const css=document.createElement('style');css.id='v75-clean-ui';css.textContent=`
    .v75-muted,.helper-text,.help-text,.quick-guide,.billing-shortcuts,.subtitle-helper{display:none!important}
    .v74-sheet .v74-subtitle,.v74-sheet .v74-description{display:none!important}
    button,[role=button]{-webkit-tap-highlight-color:transparent}
    @media(max-width:600px){.v74-sheet{padding-bottom:max(16px,env(safe-area-inset-bottom))}.v74-sheet button{min-height:44px}}
  `;document.head.appendChild(css);
  const ready=()=>{const meta=q('meta[name="app-build"]');if(meta)meta.content='V75 Rate Consistency + Clean UI';const chip=document.querySelector('.hero-chips span:last-child');if(chip)chip.textContent='V75 · Updated';window.ASHA_BUILD='V75 Rate Consistency + Clean UI';syncSettingsDisplay();syncBillRate(false);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  [500,1500,3500].forEach(t=>setTimeout(ready,t));
  window.ashaAuditV75=()=>({build:'V75',conversion:'1 bigha = 20 katha = 40 decimal',rateBigha:baseRate(),rateKatha:rateFor('katha'),rateDecimal:rateFor('decimal'),examples:{bigha1:rateFor('bigha'),katha10:10*rateFor('katha'),decimal10:10*rateFor('decimal')}});
})();
/* ASHA Billing V76 — authoritative fixed rates + polished iOS customer actions */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
  const round=v=>Math.round((num(v)+Number.EPSILON)*100)/100;
  const unit=v=>v==='katha'?'katha':v==='decimal'?'decimal':'bigha';
  const baseRate=()=>Math.max(0,num((typeof state!=='undefined'?state.settings:window.state?.settings)?.rateBigha ?? 2200));
  const rateFor=u=>round(baseRate()/(unit(u)==='katha'?20:unit(u)==='decimal'?40:1));
  const bighaFor=(qty,u)=>round(num(qty)/(unit(u)==='katha'?20:unit(u)==='decimal'?40:1));
  const amountFor=(qty,u)=>round(num(qty)*rateFor(u));
  function setBillRate(){
    const input=$('rate'),u=unit($('landUnit')?.value);
    if(!input)return;
    input.value=String(rateFor(u));
    input.readOnly=true; input.setAttribute('aria-readonly','true'); input.title='Fixed from Settings → Rate per Bigha';
    input.dataset.ashaFixedRate='1'; input.dataset.v75Auto='1'; input.dataset.v71Auto='1'; input.dataset.v70Auto='1'; input.dataset.auto='1';
    const label=input.closest('div')?.querySelector('label');
    if(label)label.textContent='Fixed rate / '+(u==='katha'?'কাঠা':u==='decimal'?'ডেসিমেল':'বিঘা');
  }
  function setSettingsRates(){
    if(typeof state==='undefined'&&!window.state) return;
    state.settings=state.settings||{};
    const b=$('setRateBigha');
    if(b && b.value!=='' && Number.isFinite(Number(b.value))) state.settings.rateBigha=Math.max(0,num(b.value));
    if(state.settings.rateBigha==null)state.settings.rateBigha=2200;
    state.settings.rateKatha=round(num(state.settings.rateBigha)/20);
    state.settings.rateDecimal=round(num(state.settings.rateBigha)/40);
    if($('setRateBigha'))$('setRateBigha').value=String(state.settings.rateBigha);
    if($('setRateKatha'))$('setRateKatha').value=String(state.settings.rateKatha);
    if($('setRateDecimal'))$('setRateDecimal').value=String(state.settings.rateDecimal);
  }
  // The bigha value is the only editable source of truth. Converted fields are display-only.
  document.addEventListener('input',e=>{
    if(e.target?.id==='setRateBigha'){
      const r=Math.max(0,num(e.target.value));
      if($('setRateKatha'))$('setRateKatha').value=String(round(r/20));
      if($('setRateDecimal'))$('setRateDecimal').value=String(round(r/40));
    }
  },true);
  document.addEventListener('focusin',e=>{if(['setRateKatha','setRateDecimal'].includes(e.target?.id))e.target.readOnly=true;},true);
  document.addEventListener('change',e=>{if(e.target?.id==='landUnit'){setBillRate();if(typeof window.previewBill==='function')window.previewBill();}},true);
  document.addEventListener('input',e=>{if(e.target?.id==='land' && typeof window.previewBill==='function')window.previewBill();},true);

  // Replace stacked legacy wrappers with one deterministic bill builder.
  function buildFixedBill(){
    const sel=$('billCustomer'); if(!sel)return null;
    let c=null;
    if(sel.value==='__new'){
      c={id:typeof window.uid==='function'?window.uid():String(Date.now()),name:$('manualName')?.value.trim()||'New Customer',phone:typeof window.normalPhone==='function'?window.normalPhone($('manualPhone')?.value):($('manualPhone')?.value||''),village:$('manualVillage')?.value.trim()||'',address:$('manualAddress')?.value.trim()||'',openingDue:0};
    } else c=(state.customers||[]).find(x=>String(x.id)===String(sel.value));
    if(!c)return null;
    const u=unit($('landUnit')?.value),qty=Math.max(0,num($('land')?.value)),rate=rateFor(u),current=amountFor(qty,u);
    const existing=(state.customers||[]).some(x=>String(x.id)===String(c.id));
    const previousDue=existing?(typeof window.customerDue==='function'?num(window.customerDue(c.id)):0):0;
    const paid=Math.max(0,num($('paidNow')?.value));
    return {id:typeof window.uid==='function'?window.uid():String(Date.now()),billNo:typeof window.nextBillNo==='function'?window.nextBillNo():'ASHA-'+Date.now(),date:typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10),customerId:c.id,customerName:c.name,phone:c.phone||'',address:c.address||'',village:c.village||'',season:$('season')?.value||'',landAmount:qty,unit:u,rateUnit:u,bigha:bighaFor(qty,u),rate,current,previousDue,allTotal:round(previousDue+current),note:$('billNote')?.value||'',payments:paid>0?[{id:typeof window.uid==='function'?window.uid():String(Date.now()+1),date:typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10),amount:paid,mode:$('billPayMode')?.value||'Cash',receivedIn:$('receivedIn')?.value||'Cash',note:'Initial payment'}]:[]};
  }
  window.makeBillFromForm=buildFixedBill;
  try{makeBillFromForm=buildFixedBill}catch(_){}
  window.ashaRateFor=rateFor;
  window.ashaLandToBigha=bighaFor;
  window.ashaCalculateBill=(qty,u)=>({quantity:num(qty),unit:unit(u),rate:rateFor(u),bigha:bighaFor(qty,u),amount:amountFor(qty,u)});
  window.ashaAuditV76=()=>({build:'V76 iOS Rate Fix',conversion:'1 bigha = 20 katha = 40 decimal',rateBigha:baseRate(),rateKatha:rateFor('katha'),rateDecimal:rateFor('decimal'),examples:{oneBigha:amountFor(1,'bigha'),tenKatha:amountFor(10,'katha'),tenDecimal:amountFor(10,'decimal')}});

  // Settings save preserves every existing setting but always normalizes rates from the master value.
  window.saveSettings=function(){
    if(typeof state==='undefined'&&!window.state)return;
    const fields={company:'setCompany',owner:'setOwner',contact:'setContact',address:'setAddress',upi:'setUpi',payee:'setPayee',country:'setCountry',accent:'setAccent',print:'setPrint',template:'setTemplate'};
    for(const [key,id] of Object.entries(fields)){const el=$(id);if(el)state.settings[key]=el.value;}
    setSettingsRates();
    if($('printMode')&&state.settings.print)$('printMode').value=state.settings.print;
    if($('template')&&state.settings.template)$('template').value=state.settings.template;
    if(typeof window.saveState==='function')window.saveState();
    setSettingsRates();setBillRate();
    if(typeof window.applyTheme==='function')window.applyTheme();
    if(typeof window.previewBill==='function' && $('billPage')?.classList.contains('active'))window.previewBill();
    const status=$('settingsSaveStatus');if(status)status.textContent='Saved';
    if(!window.__ashaV76SilentSave)alert('Settings saved');
  };
  try{saveSettings=window.saveSettings}catch(_){}
  // Prevent legacy settings renderers from leaving stale converted values behind.
  const priorLoad=window.loadSettings;
  window.loadSettings=function(){if(typeof priorLoad==='function')priorLoad();setSettingsRates();setBillRate();};
  try{loadSettings=window.loadSettings}catch(_){}

  // Refresh the currently open customer detail after any successful profile/payment save.
  const refreshDetail=cid=>{try{if(cid!=null&&String(typeof activeCustomer!=='undefined'?activeCustomer:window.activeCustomer)===String(cid)&&typeof window.renderChat==='function')window.renderChat();if(typeof window.renderCustomers==='function')window.renderCustomers();}catch(_){}};
  window.ashaRefreshCustomerV76=refreshDetail;
  // Fix profile edit save: keep the customer object, save, and redraw the actual detail page.
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#v74Save');if(!btn)return;
    const cid=window.__ashaEditingCustomerV76;if(cid==null)return;
    setTimeout(()=>refreshDetail(cid),80);
  },true);
  // Make edit view remember its current customer and update details immediately after saving.
  const editObserver=new MutationObserver(()=>{
    const name=$('v74Name');if(!name)return;
    const sub=$('v52Sub')?.textContent||'';
    const c=(state.customers||[]).find(x=>sub.startsWith(String(x.name||'')+' · update profile'));
    if(c)window.__ashaEditingCustomerV76=c.id;
  });
  const bodyObserver=()=>{const b=$('v52Body');if(b)editObserver.observe(b,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bodyObserver,{once:true});else bodyObserver();

  // Native-feeling iOS sheet/detail surfaces and consistent SF-like line icons.
  const css=document.createElement('style');css.id='asha-v76-ios';css.textContent=`
    :root{--ios-green:#087b50;--ios-ink:#17251d;--ios-muted:#748078;--ios-line:rgba(29,69,46,.11);--ios-glass:rgba(248,251,249,.94)}
    #v52Menu{align-items:flex-end!important;backdrop-filter:blur(18px) saturate(1.3)!important;-webkit-backdrop-filter:blur(18px) saturate(1.3)!important;background:rgba(10,24,16,.32)!important}
    #v52Menu .v74-panel{border:1px solid rgba(255,255,255,.78)!important;background:var(--ios-glass)!important;backdrop-filter:blur(26px) saturate(1.45)!important;-webkit-backdrop-filter:blur(26px) saturate(1.45)!important;border-radius:28px 28px 0 0!important;box-shadow:0 -20px 70px rgba(7,31,17,.25)!important;padding:18px 16px max(18px,env(safe-area-inset-bottom))!important}
    #v52Menu .v52-title{align-items:center!important;padding:2px 2px 15px!important;border-bottom:1px solid var(--ios-line)!important;margin-bottom:14px!important}
    #v52Menu #v52Name{font-size:19px!important;letter-spacing:-.035em!important;color:var(--ios-ink)!important}
    #v52Menu #v52Sub{font-size:12px!important;color:var(--ios-muted)!important;margin-top:4px!important;line-height:1.45!important}
    #v52Menu .v52-close{width:36px!important;height:36px!important;border-radius:50%!important;background:#e8eee9!important;color:#425148!important;font-size:23px!important;display:grid!important;place-items:center!important}
    #v52Menu .v74-action-grid button{border-radius:19px!important;min-height:68px!important;border:1px solid rgba(22,69,41,.09)!important;background:rgba(255,255,255,.86)!important;box-shadow:0 5px 16px rgba(20,53,32,.045)!important;color:var(--ios-ink)!important;letter-spacing:-.01em!important}
    #v52Menu .v74-action-grid button.primary{background:linear-gradient(135deg,#087b50,#15a66c)!important;color:white!important}
    #v52Menu .v74-action-grid button.danger{background:#fff3f1!important;color:#b42318!important}
    #v52Menu .ios-action-icon{box-shadow:inset 0 0 0 1px rgba(13,93,53,.05)!important}
    #v52Menu .v74-form input,#v52Menu .v74-form textarea,#v52Menu .v74-form select{border-radius:14px!important;border:1px solid #dce6df!important;background:rgba(255,255,255,.94)!important;min-height:45px!important;font:inherit!important;outline:none!important}
    #v52Menu .v74-form input:focus,#v52Menu .v74-form textarea:focus,#v52Menu .v74-form select:focus{border-color:#159765!important;box-shadow:0 0 0 4px rgba(21,151,101,.12)!important}
    #v52Menu .v74-primary,#v52Menu .v74-secondary{min-height:46px!important;border-radius:15px!important;font-weight:750!important}
    #chatModal.v73-user-detail{background:#f5f8f6!important;backdrop-filter:blur(20px)!important}
    #chatModal.v73-user-detail .chat-head{background:rgba(255,255,255,.9)!important;backdrop-filter:blur(24px) saturate(1.5)!important;-webkit-backdrop-filter:blur(24px) saturate(1.5)!important;border-bottom:1px solid var(--ios-line)!important;min-height:72px!important}
    #chatModal.v73-user-detail .chat-head>button{width:38px!important;height:38px!important;border-radius:50%!important;background:#edf3ef!important;color:#24533a!important;display:grid!important;place-items:center!important;font-size:19px!important}
    #chatModal.v73-user-detail .chat-title b{font-size:15px!important;letter-spacing:-.025em!important}
    #chatModal.v73-user-detail .chat-title span{font-size:11px!important;color:var(--ios-muted)!important}
    #chatModal.v73-user-detail .v73-user-overview,#chatModal.v73-user-detail .v73-user-actions-panel{border:1px solid var(--ios-line)!important;border-radius:24px!important;box-shadow:0 8px 28px rgba(18,50,29,.045)!important;background:rgba(255,255,255,.93)!important}
    #chatModal.v73-user-detail .v73-detail-actions button{border:1px solid var(--ios-line)!important;border-radius:17px!important;background:#f6faf7!important;min-height:68px!important;color:#23432f!important;box-shadow:none!important}
    #chatModal.v73-user-detail .v73-detail-actions button.primary{background:linear-gradient(135deg,#087b50,#15a66c)!important;color:white!important}
    #chatModal.v73-user-detail .v73-detail-actions svg{width:20px!important;height:20px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
    #rate[readonly]{background:#f0f5f1!important;color:#24543a!important;font-weight:750!important;cursor:default!important}
    #setRateKatha[readonly],#setRateDecimal[readonly]{background:#f0f5f1!important;color:#5c6b61!important}
    @media(min-width:760px){#v52Menu{align-items:center!important;padding:20px!important}#v52Menu .v74-panel{border-radius:28px!important;width:min(620px,100%)!important}#chatModal.v73-user-detail{border-radius:28px!important;overflow:hidden!important;box-shadow:0 28px 90px rgba(12,45,25,.24)!important}}
    @media(max-width:600px){#chatModal.v73-user-detail{inset:0!important;border-radius:0!important}#chatModal.v73-user-detail .chat-body{padding-bottom:calc(20px + env(safe-area-inset-bottom))!important}#v52Menu .v74-panel{padding-bottom:max(20px,env(safe-area-inset-bottom))!important}}
    @media(prefers-reduced-motion:reduce){#v52Menu *,#chatModal.v73-user-detail *{animation:none!important;transition:none!important}}
  `;document.head.appendChild(css);

  function ready(){
    setSettingsRates();setBillRate();
    if($('setRateKatha'))$('setRateKatha').readOnly=true;
    if($('setRateDecimal'))$('setRateDecimal').readOnly=true;
    const meta=$('meta[name="app-build"]');if(meta)meta.content='V76 iOS Rate + Customer Actions';
    const chip=document.querySelector('.hero-chips span:last-child');if(chip)chip.textContent='V76 · iOS Edition';
    window.ASHA_BUILD='V76 iOS Rate + Customer Actions';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  [500,1300,2800,5000].forEach(t=>setTimeout(ready,t));
})();

/* ASHA Billing V77 — functional customer action sheets */
(()=>{'use strict';
const $=id=>document.getElementById(id), esc=s=>typeof window.esc==='function'?window.esc(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const customers=()=>window.state?.customers||[], bills=()=>window.state?.bills||[];
const customer=id=>customers().find(c=>String(c.id)===String(id));
const due=id=>Math.max(0,Number(typeof window.customerDue==='function'?window.customerDue(id):0)||0);
const money=n=>typeof window.money==='function'?window.money(n):'₹'+(Number(n)||0).toFixed(2);
const today=()=>typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10);
const uid=()=>typeof window.uid==='function'?window.uid():String(Date.now()+Math.random());
const save=()=>{if(typeof window.saveState==='function')window.saveState();else if(typeof window.renderAll==='function')window.renderAll()};
const icon={bill:'▤',edit:'✎',ledger:'▤',receive:'₹',settle:'✓',reminder:'◷',chat:'▰',call:'⌕',delete:'⌫'};
let activeId=null;
function root(){let r=$('v77ActionRoot');if(!r){document.body.insertAdjacentHTML('beforeend',`<div id="v77ActionRoot" class="v77-backdrop" aria-hidden="true"><section class="v77-sheet" role="dialog" aria-modal="true"><header><div><small id="v77Eyebrow">ASHA BILLING</small><h2 id="v77Title">Customer actions</h2><p id="v77Sub"></p></div><button id="v77X" aria-label="Close">×</button></header><div id="v77Body"></div><footer id="v77Foot"></footer></section></div>`);r=$('v77ActionRoot');r.addEventListener('click',e=>{if(e.target===r)close()});$('v77X').onclick=close;}return r}
function open(id,title,sub=''){activeId=id;const c=customer(id);if(!c){alert('Customer not found.');return false}root();$('v77Title').textContent=title;$('v77Sub').textContent=sub||`${c.name||'Customer'} · ${c.phone||'No phone'} · Due ${money(due(id))}`;$('v77Body').innerHTML='';$('v77Foot').innerHTML='';$('v77ActionRoot').classList.add('open');$('v77ActionRoot').setAttribute('aria-hidden','false');document.body.classList.add('v77-modal-open');return true}
function close(){const r=$('v77ActionRoot');if(r){r.classList.remove('open');r.setAttribute('aria-hidden','true')}document.body.classList.remove('v77-modal-open')}
function btn(label,fn,cls=''){const b=document.createElement('button');b.type='button';b.className='v77-btn '+cls;b.textContent=label;b.onclick=fn;return b}
function field(label,id,value='',type='text'){return `<label class="v77-field">${label}<input id="${id}" type="${type}" value="${esc(value)}"></label>`}
function actions(id){
 if(!open(id,'Customer Centre'))return;
 const c=customer(id),body=$('v77Body');body.className='v77-grid v85-user-grid v86-user-grid';
 const customerBills=bills().filter(b=>String(b.customerId)===String(id)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const balance=due(id),latest=customerBills[0];
 const paid=customerBills.reduce((sum,b)=>sum+(typeof window.billPaid==='function'?Number(window.billPaid(b)):(b.payments||[]).reduce((n,p)=>n+(Number(p.amount)||0),0)),0);
 const total=customerBills.reduce((sum,b)=>sum+(Number(b.allTotal)||0),0);
 body.innerHTML=`<div class="v86-customer-hero"><div class="v86-avatar">${esc((c.name||'U').trim().slice(0,1).toUpperCase())}</div><div class="v86-identity"><h3>${esc(c.name||'Customer')}</h3><p>${esc(c.phone||'No phone number')}<br>${esc(c.village||'Village not set')}</p></div><button type="button" class="v86-edit-shortcut" data-v86-edit aria-label="Edit customer">✎</button><div class="v86-balance ${balance>0?'is-due':'is-clear'}"><span><small>${balance>0?'OUTSTANDING DUE':'ACCOUNT STATUS'}</small><b>${money(balance)}</b></span><em>${balance>0?'Needs collection':'All clear'}</em></div><div class="v86-mini-stats"><span><small>Bills</small><b>${customerBills.length}</b></span><span><small>Lifetime billed</small><b>${money(total)}</b></span><span><small>Collected</small><b>${money(paid)}</b></span></div></div><div class="v86-menu-section"><div class="v86-section-title"><span>01</span><div><b>Billing & payments</b><small>Create bills and manage collections</small></div></div><div class="v86-action-grid" id="v86BillingActions"></div></div><div class="v86-menu-section"><div class="v86-section-title"><span>02</span><div><b>Records & communication</b><small>History, notes and customer contact</small></div></div><div class="v86-action-grid" id="v86RecordActions"></div></div><div class="v86-menu-section v86-danger-section"><div class="v86-section-title"><span>03</span><div><b>Account controls</b><small>Manage customer details</small></div></div><div class="v86-action-grid" id="v86AccountActions"></div></div>`;
 const groups=[['v86BillingActions',[['bill','New Bill','▤','Create a bill','primary'],['billrem','Bill Reminder','↗','Share saved bill'],['receive','Receive Payment','₹','Record collection','primary'],['settle','Settle / Adjust','±','Adjust account'],['latest','Latest Bill','▧',latest?(latest.billNo||'View saved bill'):'No bill yet','']]],['v86RecordActions',[['ledger','Ledger & History','◷','Bills and payments'],['remind','WhatsApp Reminder','↗','Send due reminder'],['chat','Chat / Notes','☷','Private customer notes'],['copy','Copy User Details','▣','Copy contact summary'],['call','Call Customer','⌕','Call saved number']]],['v86AccountActions',[['edit','Edit User','✎','Update profile'],['delete','Delete User','⌫','Remove account and records','danger']]]];
 groups.forEach(([target,items])=>{const host=$(target);items.forEach(([key,label,glyph,desc,cls])=>{const b=document.createElement('button');b.type='button';b.className='v86-action '+(cls||'');b.innerHTML=`<span class="v86-action-glyph">${glyph}</span><span class="v86-action-copy"><b>${label}</b><small>${desc}</small></span><span class="v86-action-arrow">›</span>`;b.addEventListener('click',()=>run(id,key));if(key==='latest'&&!latest){b.disabled=true;b.classList.add('is-disabled')}host.appendChild(b)})});
 $('[data-v86-edit]')?.addEventListener('click',()=>edit(id));$('v77Foot').innerHTML=`<span class="v86-footnote">Customer records · ${customerBills.length} bills · ${customerBills.reduce((n,b)=>n+(b.payments||[]).length,0)} payment entries</span><button type="button" class="v77-btn" id="v86CloseActions">Done</button>`;$('v86CloseActions').onclick=close;
}
function run(id,key){const c=customer(id);if(!c)return;
if(key==='copy'){const summary=`${c.name||'Customer'}\nPhone: ${c.phone||'—'}\nVillage: ${c.village||'—'}\nAddress: ${c.address||'—'}\nOutstanding due: ${money(due(id))}`;const fallback=()=>{const ta=document.createElement('textarea');ta.value=summary;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');alert('Customer details copied.')}catch(e){alert(summary)}ta.remove()};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(summary).then(()=>alert('Customer details copied.')).catch(fallback);else fallback();return}
if(key==='latest'){const latest=bills().filter(x=>String(x.customerId)===String(id)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];if(!latest){alert('Create a bill for this customer first.');return}close();if(typeof window.openBillPreviewV50==='function')return window.openBillPreviewV50(id,latest.id);if(typeof window.viewBill==='function')return window.viewBill(latest.id);alert('Bill preview is unavailable in this build.');return}
if(key==='bill'){close();try{window.closeChat?.()}catch{}try{window.closeUserDetailV51?.()}catch{}window.showPage?.('billPage');setTimeout(()=>{const s=$('billCustomer');if(s){s.value=String(id);s.dispatchEvent(new Event('change',{bubbles:true}));window.toggleManual?.();window.updatePreviousDueV55?.(true);window.previewBill?.()}},180);return}
if(key==='edit')return edit(id);if(key==='ledger')return ledger(id);if(key==='receive'||key==='settle')return payment(id,key==='settle');if(key==='billrem')return billReminder(id);if(key==='chat')return chat(id);if(key==='remind')return reminder(id);if(key==='call'){const p=String(c.phone||'').replace(/\D/g,'');if(!p){alert('Add a phone number first.');return}close();location.href='tel:'+p;return}if(key==='delete')return del(id)}
function edit(id){const c=customer(id);if(!open(id,'Edit user','Update this customer profile'))return;const b=$('v77Body');b.innerHTML=field('Full name','v77Name',c.name)+field('Phone','v77Phone',c.phone||'','tel')+field('Village','v77Village',c.village||'')+field('Address','v77Address',c.address||'')+field('Opening due (₹)','v77Opening',c.openingDue||0,'number')+`<label class="v77-field">Private note<textarea id="v77Note">${esc(c.note||c.landNote||'')}</textarea></label>`;$('v77Foot').append(btn('Cancel',actions.bind(null,id)),btn('Save changes',()=>{const name=$('v77Name').value.trim(),opening=Number($('v77Opening').value);if(!name)return alert('Enter customer name.');if(!Number.isFinite(opening)||opening<0)return alert('Opening due must be zero or more.');Object.assign(c,{name,phone:$('v77Phone').value.trim(),village:$('v77Village').value.trim(),address:$('v77Address').value.trim(),openingDue:opening,note:$('v77Note').value.trim()});save();close();try{window.renderChat?.()}catch{}},'primary'))}
function ledger(id){const c=customer(id);if(!open(id,'Ledger & history',`${c.name} · live account`))return;const list=bills().filter(x=>String(x.customerId)===String(id)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));let html=`<div class="v77-total"><span>Outstanding balance</span><b>${money(due(id))}</b></div>`;if(Number(c.openingDue)>0)html+=`<article class="v77-entry"><b>Opening due</b><strong>${money(c.openingDue)}</strong></article>`;for(const x of list){const paid=typeof window.billPaid==='function'?window.billPaid(x):(x.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0);const total=Number(x.allTotal)||0;const bal=typeof window.billDue==='function'?window.billDue(x):Math.max(0,total-paid);html+=`<article class="v77-entry"><div><b>${esc(x.billNo||'Bill')}</b><small>${esc(x.date||'')}</small></div><strong>${money(total)}</strong><p>Paid ${money(paid)} · Due ${money(bal)}</p>${(x.payments||[]).map(p=>`<small class="v77-payment">${esc(p.date||'')} · ${esc(p.mode||'Payment')} · −${money(p.amount)} ${esc(p.note||'')}</small>`).join('')}</article>`}if(!list.length)html+='<p class="v77-empty">No bills recorded yet.</p>';$('v77Body').innerHTML=html;$('v77Foot').append(btn('Back to actions',()=>actions(id)),btn('Receive payment',()=>payment(id,false),'primary'))}
function payment(id,settle){const c=customer(id),bal=due(id);if(!open(id,settle?'Settle / Adjust':'Receive payment',`${c.name} · due ${money(bal)}`))return;$('v77Body').innerHTML=`<div class="v77-total"><span>${settle?'Balance to adjust':'Amount due'}</span><b>${money(bal)}</b></div>${field(settle?'Adjustment amount (₹)':'Amount received (₹)','v77PayAmount',bal,'number')}${settle?field('Reason','v77PayNote','Settled / adjusted'): `<label class="v77-field">Payment mode<select id="v77Mode"><option>Cash</option><option>UPI</option><option>Online</option><option>Bank</option><option>Other</option></select></label><label class="v77-field">Received in<select id="v77Received"><option>Cash</option><option>Bank</option><option>UPI</option><option>Other</option></select></label>${field('Note','v77PayNote','')}`}`;$('v77Foot').append(btn('Cancel',()=>actions(id)),btn(settle?'Save adjustment':'Save payment',()=>{const amount=Math.round(Number($('v77PayAmount').value)*100)/100,cur=due(id);if(!Number.isFinite(amount)||amount<=0||amount>cur+.009)return alert(`Enter an amount between ₹0.01 and ${money(cur)}.`);let left=amount;const openDue=Math.max(0,Number(c.openingDue)||0);const bs=bills().filter(x=>String(x.customerId)===String(id)).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));for(const bill of bs){const paid=typeof window.billPaid==='function'?window.billPaid(bill):(bill.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0);const remaining=Math.max(0,(Number(bill.allTotal)||0)-paid);if(left<=0||remaining<=0)continue;const applied=Math.min(left,remaining);(bill.payments||(bill.payments=[])).push({id:uid(),date:today(),amount:applied,mode:settle?'Settlement':$('v77Mode').value,receivedIn:settle?'Adjusted':$('v77Received').value,note:$('v77PayNote')?.value.trim()||(settle?'Settled / adjusted':'Payment received')});left=Math.round((left-applied)*100)/100}if(left>0&&openDue>0){const applied=Math.min(left,openDue);c.openingDue=Math.round((openDue-applied)*100)/100;(c.openingDueHistory||(c.openingDueHistory=[])).push({id:uid(),date:today(),amount:applied,mode:settle?'Settlement':$('v77Mode').value,note:$('v77PayNote')?.value.trim()||(settle?'Opening due adjusted':'Opening balance payment'),type:settle?'adjustment':'payment'})}save();close();try{window.renderChat?.();window.renderDash?.();window.renderReports?.()}catch{}},'primary'))}
function billReminder(id){const c=customer(id),latest=bills().filter(x=>String(x.customerId)===String(id)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];if(!latest){alert('Create a bill for this customer first.');return run(id,'bill')}close();if(typeof window.v66BillReminder==='function')return window.v66BillReminder(id);if(typeof window.v65BillReminder==='function')return window.v65BillReminder(id);if(typeof window.v64BillReminder==='function')return window.v64BillReminder(id);if(typeof window.shareCustomerBill==='function')return window.shareCustomerBill(id);const p=String(c.phone||'').replace(/\D/g,'');if(!p)return alert('Add a phone number to share the reminder.');const number=p.length===10?'91'+p:p;const msg=`${window.state?.settings?.company||'ASHA Billing'}\nBill: ${latest.billNo||''} · Date: ${latest.date||''}\nTotal: ${money(latest.allTotal)}\nOutstanding due: ${money(due(id))}\nPlease pay at your convenience. Thank you.`;window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`,'_blank','noopener')}
function reminder(id){const c=customer(id),p=String(c.phone||'').replace(/\D/g,'');if(!p)return alert('Add a phone number first.');const n=p.length===10?'91'+p:p;const msg=`${window.state?.settings?.company||'ASHA Billing'}\nDear ${c.name||'Customer'}, your outstanding balance is ${money(due(id))}. Please contact us if you have any questions. Thank you.`;close();window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`,'_blank','noopener')}
function chat(id){const c=customer(id);if(!open(id,'Chat / private notes',`${c.name} · private notes saved in this app`))return;const notes=Array.isArray(c.privateNotes)?c.privateNotes:[];$('v77Body').innerHTML=`<div class="v77-chatlog">${notes.map(n=>`<article class="v77-note"><small>${esc(n.date||'')}</small><p>${esc(n.text||'')}</p></article>`).join('')||'<p class="v77-empty">No private notes yet.</p>'}</div><label class="v77-field">Add private note<textarea id="v77ChatText" placeholder="Write a note about this customer..."></textarea></label>`;$('v77Foot').append(btn('WhatsApp',()=>reminder(id)),btn('Save note',()=>{const text=$('v77ChatText').value.trim();if(!text)return alert('Write a note first.');(c.privateNotes||(c.privateNotes=[])).push({id:uid(),date:new Date().toLocaleString(),text});save();chat(id)},'primary'))}
function del(id){const c=customer(id);if(!open(id,'Delete user','This action removes this customer and linked records.'))return;$('v77Body').innerHTML=`<p>Delete <b>${esc(c.name)}</b> and associated bills/payment history? This cannot be undone.</p><p class="v77-warning">Make sure you have a backup before deleting.</p>`;$('v77Foot').append(btn('Cancel',()=>actions(id)),btn('Delete permanently',()=>{close();if(typeof window.deleteCustomer==='function'){window.deleteCustomer(id);return}if(!confirm(`Delete ${c.name} and associated bills?`))return;window.state.customers=customers().filter(x=>String(x.id)!==String(id));window.state.bills=bills().filter(x=>String(x.customerId)!==String(id));save()},'danger'))}
document.addEventListener('click',e=>{const b=e.target.closest('[data-v74-action]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();run(activeId||b.closest('[data-customer-id]')?.dataset.customerId,b.dataset.v74Action)},true);
// Resolve the actual customer id from the sheet title's current context via the original menu entry.
const originalMenu=window.openUserMenuV52;window.openUserMenuV52=function(id){activeId=id;actions(id)};window.openUserMenu=window.openUserMenuV52;window.openMoreMenu=window.openUserMenuV52;window.ashaOpenUserSheetV74=(id,view='actions')=>{activeId=id;if(view==='receive')payment(id,false);else if(view==='settle')payment(id,true);else if(view==='ledger')ledger(id);else actions(id)};
// Capture the menu launch event at the moment the original sheet opens, ensuring action IDs are explicit.
const obs=new MutationObserver(()=>{const old=$('v52Menu');if(old){const sub=$('v52Sub')?.textContent||'';if(old.classList.contains('open')||old.getAttribute('aria-hidden')==='false'){const match=customers().find(c=>sub.startsWith(`${c.name||'User'} · ${c.phone||'No phone'} · Due`));if(match)activeId=match.id;}if(!old.dataset.v77Bound){old.dataset.v77Bound='1';old.addEventListener('click',e=>{const b=e.target.closest('[data-v74-action]');if(!b)return;const id=activeId;if(id){e.preventDefault();e.stopImmediatePropagation();run(id,b.dataset.v74Action)}},true)}}});obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-hidden']});
const css=`#v77ActionRoot{display:none;position:fixed;inset:0;z-index:100500;background:rgba(10,24,17,.35);backdrop-filter:blur(12px);align-items:flex-end;justify-content:center;padding:12px}#v77ActionRoot.open{display:flex}.v77-sheet{width:min(100%,560px);max-height:min(90dvh,900px);overflow:auto;background:rgba(250,252,250,.98);border:1px solid rgba(255,255,255,.7);border-radius:30px;padding:22px;box-shadow:0 25px 90px #001b1030;color:#173a28;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif;animation:v77up .22s ease-out}.v77-sheet header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:18px}.v77-sheet h2{font-size:24px;letter-spacing:-.7px;margin:4px 0}.v77-sheet header p{margin:0;color:#718075;font-size:13px}.v77-sheet header small{font-size:10px;letter-spacing:1.5px;color:#18885a;font-weight:800}.v77-sheet #v77X{border:0;border-radius:50%;width:36px;height:36px;font-size:24px;background:#edf3ee;color:#315642}.v77-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v77-btn{border:1px solid #e0eae2;background:#fff;border-radius:17px;min-height:48px;padding:12px 14px;color:#254b35;font-weight:650;font-size:14px;display:flex;align-items:center;gap:9px;justify-content:center;cursor:pointer;box-shadow:0 3px 10px #153b2510}.v77-grid .v77-btn{justify-content:flex-start;min-height:66px}.v77-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:11px;background:#e9f6ed;color:#07804f;font-size:18px;font-weight:800;flex-shrink:0}.v77-chevron{margin-left:auto;color:#9caea2;font-size:22px}.v77-btn.primary{background:linear-gradient(135deg,#087a4e,#17a568);color:white;border-color:transparent}.v77-btn.primary .v77-icon{background:#ffffff27;color:white}.v77-btn.danger{background:#fff1f0;color:#b42318;border-color:#f4d4d1}.v77-btn.danger .v77-icon{background:#ffe0dd;color:#b42318}.v77-sheet footer{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.v77-sheet footer .v77-btn{flex:1}.v77-sheet footer:not(:empty){font-size:12px;color:#7c8b80}.v77-field{display:block;margin:12px 0;color:#52695a;font-size:12px;font-weight:700}.v77-field input,.v77-field textarea,.v77-field select{display:block;width:100%;box-sizing:border-box;margin-top:6px;border:1px solid #dce7df;background:#fff;border-radius:13px;padding:13px;color:#193c29;font:500 15px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;outline:none}.v77-field input:focus,.v77-field textarea:focus,.v77-field select:focus{border-color:#32a878;box-shadow:0 0 0 3px #2aa36d18}.v77-field textarea{min-height:85px;resize:vertical}.v77-total{display:flex;justify-content:space-between;align-items:center;background:#eaf7ee;border-radius:17px;padding:16px;margin-bottom:12px;color:#4c6c57}.v77-total b{font-size:22px;color:#087a4e}.v77-entry{border:1px solid #e4ece5;border-radius:16px;padding:14px;margin:9px 0;background:#fff}.v77-entry>div{display:flex;justify-content:space-between;gap:10px}.v77-entry small,.v77-payment{display:block;color:#78877d;margin-top:5px}.v77-entry p{font-size:12px;color:#58705f;margin:9px 0 0}.v77-empty{padding:20px;text-align:center;color:#819087}.v77-note{background:#edf7f0;border-radius:14px;padding:12px;margin:8px 0}.v77-note p{margin:7px 0 0;white-space:pre-wrap}.v77-warning{color:#b42318;background:#fff1f0;padding:12px;border-radius:12px;font-size:13px}@keyframes v77up{from{opacity:.4;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@media(min-width:700px){#v77ActionRoot{align-items:center}.v77-sheet{max-height:85vh}}@media(prefers-reduced-motion:reduce){.v77-sheet{animation:none}}`;
const style=document.createElement('style');style.textContent=css;document.head.append(style);
window.ashaV77CustomerActions={open:actions,run,close,version:'V77'};
})();


/* ===== V78: Animated home + honest cloud status + iOS refresh/login polish ===== */
(() => {
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    document.documentElement.classList.add('asha-v78');
    const build = document.getElementById('buildChip');
    if (build) build.textContent = 'V80 · Dashboard + Manual Rate';
    // Remove only the old business quote from the HOME header. Settings and invoice data stay untouched.
    const applyHomeBrand = () => {
      const title = document.getElementById('companyTitle');
      if (title && title.textContent !== 'ASHA Billing') title.textContent = 'ASHA Billing';
      const sub = document.getElementById('companySub');
      if (sub && sub.textContent !== 'Smart billing · Customer management') sub.textContent = 'Smart billing · Customer management';
      const chipLabel = document.getElementById('buildChip');
      if (chipLabel && chipLabel.textContent !== 'V80 · Dashboard + Manual Rate') chipLabel.textContent = 'V80 · Dashboard + Manual Rate';
      const meta = document.querySelector('meta[name="app-build"]');
      if (meta) meta.content = 'V80 Dashboard + Manual Rate';
      window.ASHA_BUILD = 'V80 Dashboard + Manual Rate';
    };
    applyHomeBrand();
    const titleNode = document.getElementById('companyTitle');
    const subNode = document.getElementById('companySub');
    [titleNode, subNode].filter(Boolean).forEach(node => new MutationObserver(applyHomeBrand).observe(node, {childList:true,subtree:true,characterData:true}));
    [250, 900, 2200, 5000, 8000].forEach(ms => setTimeout(applyHomeBrand, ms));

    // The dashboard shows a cloud badge only when the app's real sync status supports it.
    const chip = document.getElementById('cloudChip');
    const status = document.getElementById('cloudStatus');
    const syncCloud = () => {
      if (!chip) return;
      const appVisible = document.getElementById('app') && !document.getElementById('app').classList.contains('hidden');
      const loginVisible = document.getElementById('login') && !document.getElementById('login').classList.contains('hidden');
      if (loginVisible || !appVisible) { chip.textContent = 'Cloud: Locked'; chip.dataset.state = 'locked'; return; }
      const t = (status?.textContent || '').trim().toLowerCase();
      if (/cloud loaded/.test(t)) { chip.textContent = 'Cloud: Loaded ✓'; chip.dataset.state = 'ok'; }
      else if (/cloud saved|saved ✅|cloud: saved/.test(t)) { chip.textContent = 'Cloud: Synced ✓'; chip.dataset.state = 'ok'; }
      else if (/pull failed|push failed|failed|login needed|wrong owner/.test(t)) { chip.textContent = 'Cloud: Offline'; chip.dataset.state = 'bad'; }
      else if (/no cloud data/.test(t)) { chip.textContent = 'Cloud: No data'; chip.dataset.state = 'warn'; }
      else { chip.textContent = 'Cloud: Checking…'; chip.dataset.state = 'checking'; }
    };
    syncCloud();
    if (status) new MutationObserver(syncCloud).observe(status, {childList:true,subtree:true,characterData:true});
    if (chip) new MutationObserver(syncCloud).observe(chip, {attributes:true,attributeFilter:['class']});
    setInterval(syncCloud, 1200);

    // Add entrance animations once per element; respect reduced-motion preferences in CSS.
    const home = document.getElementById('homePage');
    if (home) {
      const targets = home.querySelectorAll('.dashboard-head, .metric, .quick-actions button');
      targets.forEach((el, i) => { el.classList.add('v78-enter'); el.style.setProperty('--v78-delay', `${Math.min(i * 45, 420)}ms`); });
      const activeObserver = new MutationObserver(() => {
        if (home.classList.contains('active')) {
          targets.forEach(el => { el.classList.remove('v78-entered'); void el.offsetWidth; el.classList.add('v78-entered'); });
          syncCloud();
        }
      });
      activeObserver.observe(home, {attributes:true,attributeFilter:['class']});
    }

    // iOS login surface is re-applied on every refresh / auth-state toggle.
    const login = document.getElementById('login');
    const loginCard = login?.querySelector('.login-card');
    if (loginCard) {
      loginCard.setAttribute('role','region'); loginCard.setAttribute('aria-label','ASHA Billing secure login');
      const brand = loginCard.querySelector('.brand-row p');
      if (brand) brand.textContent = 'Secure sign in';
      const loginButton = document.getElementById('loginBtn');
      if (loginButton) { loginButton.textContent = 'Sign In'; loginButton.setAttribute('aria-label','Sign in to ASHA Billing'); }
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      if (email) { email.setAttribute('autocomplete','username'); email.setAttribute('autocapitalize','none'); email.setAttribute('spellcheck','false'); }
      if (password) password.setAttribute('autocomplete','current-password');
    }
    if (window.login && !window.ashaV78LoginWrapped) {
      const oldLogin = window.login;
      window.login = async function(...args) {
        const b = document.getElementById('loginBtn');
        if (b) { b.disabled = true; b.dataset.originalText = b.textContent; b.textContent = 'Signing in…'; }
        try { return await oldLogin.apply(this,args); }
        finally { if (b) { b.disabled = false; b.textContent = 'Sign In'; } syncCloud(); }
      };
      window.ashaV78LoginWrapped = true;
      if (document.getElementById('loginBtn')) document.getElementById('loginBtn').onclick = window.login;
    }
  });
})();

/* ASHA Billing V79 — customer-specific WhatsApp-inspired chat surface. */
(() => {
  const modal = () => document.getElementById('chatModal');
  const decorate = () => {
    const m = modal();
    if (!m) return;
    m.classList.add('asha-wa-conversation');
    const input = document.getElementById('manualChatInput');
    if (input) {
      input.placeholder = 'Message or add a private note…';
      input.setAttribute('aria-label', 'Message or private note for this customer');
    }
    const send = document.getElementById('manualChatSend');
    if (send) { send.textContent = '➤'; send.setAttribute('aria-label', 'Send message'); titleSafe(send, 'Save message to this customer chat'); }
    const body = document.getElementById('chatBody');
    if (body) body.setAttribute('aria-label', 'Customer-specific chat and account activity');
  };
  function titleSafe(el, title) { el.title = title; }
  const oldOpen = window.openChat;
  if (typeof oldOpen === 'function' && !window.ashaV79OpenWrapped) {
    window.openChat = function(...args) {
      const result = oldOpen.apply(this, args);
      requestAnimationFrame(decorate);
      setTimeout(decorate, 60);
      return result;
    };
    window.ashaV79OpenWrapped = true;
  }
  const oldRender = window.renderChat;
  if (typeof oldRender === 'function' && !window.ashaV79RenderWrapped) {
    window.renderChat = function(...args) {
      const result = oldRender.apply(this, args);
      requestAnimationFrame(decorate);
      setTimeout(decorate, 30);
      return result;
    };
    window.ashaV79RenderWrapped = true;
  }
  document.addEventListener('DOMContentLoaded', () => {
    decorate();
    const chip = document.querySelector('.hero-chips span:last-child');
    if (chip) chip.textContent = 'V80 · Dashboard + Manual Rate Interface';
    const meta = document.querySelector('meta[name="app-build"]');
    if (meta) meta.content = 'V80 Dashboard + Manual Rate';
    const back = document.getElementById('chatBack');
    if (back) back.setAttribute('aria-label', 'Back to customers');
  });
  if (document.readyState !== 'loading') decorate();
  window.ashaAuditV79 = () => ({build:'V80 Dashboard + Manual Rate',chatClass:!!modal()?.classList.contains('asha-wa-conversation'),customerSpecificComposer:!!document.getElementById('manualChatInput')});
})();

/* ASHA Billing V80 — dashboard persistence + optional manual bill rate */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
  const round=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
  const unit=()=> $('landUnit')?.value||'bigha';
  const rateFromSettings=u=>{const b=Math.max(0,n(state?.settings?.rateBigha??2200));return round(b/(u==='katha'?20:u==='decimal'?40:1));};
  const labelFor=u=>'Rate / '+(u==='katha'?'কাঠা':u==='decimal'?'ডেসিমেল':'বিঘা');
  const FILTER_KEY='asha_dashboard_filters_v80';
  function restoreFilters(){
    try{const f=JSON.parse(localStorage.getItem(FILTER_KEY)||'{}');if($('homeMonth')&&f.month)$('homeMonth').value=f.month;}
    catch(_){}
  }
  function persistFilters(){
    try{localStorage.setItem(FILTER_KEY,JSON.stringify({month:$('homeMonth')?.value||'',village:$('homeVillage')?.value||'all'}));}catch(_){}
  }
  // fillSelects runs on every render. Preserve the dashboard selection instead of resetting it to All villages.
  const oldFill=window.fillSelects;
  if(typeof oldFill==='function'&&!oldFill.__v80){
    const wrapped=function(){
      const priorVillage=$('homeVillage')?.value||'';
      const priorReportVillage=$('reportVillage')?.value||'';
      const out=oldFill.apply(this,arguments);
      const saved=(()=>{try{return JSON.parse(localStorage.getItem(FILTER_KEY)||'{}')}catch(_){return {}}})();
      const hv=$('homeVillage');if(hv){const want=priorVillage||saved.village||'all';if([...hv.options].some(o=>o.value===want))hv.value=want;}
      const rv=$('reportVillage');if(rv&&priorReportVillage&&[...rv.options].some(o=>o.value===priorReportVillage))rv.value=priorReportVillage;
      return out;
    };wrapped.__v80=true;window.fillSelects=wrapped;try{fillSelects=wrapped}catch(_){}
  }
  restoreFilters();
  ['homeVillage','homeMonth'].forEach(id=>$(id)?.addEventListener('change',()=>{persistFilters();if(typeof window.renderAll==='function')window.renderAll(false);}));

  function setRateLabel(){const el=$('rate');if(!el)return;const label=el.closest('div')?.querySelector('label');if(label)label.textContent=labelFor(unit());el.readOnly=false;el.removeAttribute('aria-readonly');el.title='Default comes from Settings; you can change this rate for this bill only.';}
  function setDefaultRate(force){const el=$('rate');if(!el)return;if(force||el.dataset.v80Manual!=='1'||!el.value){el.value=String(rateFromSettings(unit()));el.dataset.v80Manual='0';}setRateLabel();}
  const rate=$('rate');
  if(rate){rate.readOnly=false;rate.removeAttribute('aria-readonly');rate.addEventListener('input',()=>{rate.dataset.v80Manual='1';setRateLabel();if(typeof window.previewBill==='function')window.previewBill();});}
  $('landUnit')?.addEventListener('change',()=>{setDefaultRate(true);if(typeof window.previewBill==='function')window.previewBill();});
  // A one-tap reset makes it easy to return to the rate configured in Settings.
  if(rate&&!$('resetBillRate')){
    const holder=rate.parentElement;
    if(holder){const btn=document.createElement('button');btn.id='resetBillRate';btn.type='button';btn.className='btn';btn.textContent='Use Settings Rate';btn.style.cssText='margin-top:6px;padding:7px 10px;font-size:12px;min-height:34px';btn.addEventListener('click',()=>{setDefaultRate(true);if(typeof window.previewBill==='function')window.previewBill();});holder.appendChild(btn);}
  }
  // Rebuild bill using the actual editable rate. This rate is stored on the bill and does not alter Settings.
  function buildManualRateBill(){
    const sel=$('billCustomer');if(!sel)return null;let c=null;
    if(sel.value==='__new'){
      c={id:typeof window.uid==='function'?window.uid():String(Date.now()),name:$('manualName')?.value.trim()||'New Customer',phone:typeof window.normalPhone==='function'?window.normalPhone($('manualPhone')?.value):($('manualPhone')?.value||''),village:$('manualVillage')?.value.trim()||'',address:$('manualAddress')?.value.trim()||'',openingDue:0};
    }else c=(state.customers||[]).find(x=>String(x.id)===String(sel.value));
    if(!c)return null;
    const u=unit(),qty=Math.max(0,n($('land')?.value)),rateValue=Math.max(0,n($('rate')?.value)),current=round(qty*rateValue);
    const exists=(state.customers||[]).some(x=>String(x.id)===String(c.id));
    const previousDue=exists&&typeof window.customerDue==='function'?n(window.customerDue(c.id)):0;
    const paid=Math.max(0,n($('paidNow')?.value));
    const bigha=round(qty/(u==='katha'?20:u==='decimal'?40:1));
    return {id:typeof window.uid==='function'?window.uid():String(Date.now()),billNo:typeof window.nextBillNo==='function'?window.nextBillNo():'ASHA-'+Date.now(),date:typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10),customerId:c.id,customerName:c.name,phone:c.phone||'',address:c.address||'',village:c.village||'',season:$('season')?.value||'',landAmount:qty,unit:u,rateUnit:u,bigha,rate:rateValue,current,previousDue,allTotal:round(previousDue+current),note:$('billNote')?.value||'',payments:paid>0?[{id:typeof window.uid==='function'?window.uid():String(Date.now()+1),date:typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10),amount:paid,mode:$('billPayMode')?.value||'Cash',receivedIn:$('receivedIn')?.value||'Cash',note:'Initial payment'}]:[]};
  }
  window.makeBillFromForm=buildManualRateBill;try{makeBillFromForm=buildManualRateBill}catch(_){}
  // Keep the dashboard rendered on a normal refresh and after data is loaded.
  window.addEventListener('pageshow',()=>{restoreFilters();setRateLabel();if(typeof window.renderAll==='function')window.renderAll(false);});
  setRateLabel();
  document.addEventListener('DOMContentLoaded',()=>{setRateLabel();setDefaultRate(false);});
  [120,500,1200].forEach(ms=>setTimeout(setRateLabel,ms));
  window.ashaAuditV80=()=>({build:'V80 Dashboard Persistence + Manual Bill Rate',manualRateEnabled:!!$('rate')&&!$('rate').readOnly,settingsRate:rateFromSettings(unit()),billRate:n($('rate')?.value),dashboardFiltersPersisted:!!localStorage.getItem(FILTER_KEY)});
})();

/* ASHA Billing V81 — reliable Home/Dashboard navigation + refined login motion */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  function setBuild(){
    const chip=document.querySelector('.hero-chips span:nth-child(2)');
    if(chip)chip.textContent='V81 · Home & Login Polish';
    const meta=document.querySelector('meta[name="app-build"]');if(meta)meta.content='V81 Home Navigation + Login Motion';
  }
  function normalizePage(id,shouldRender=true){
    const target=$(id);if(!target||!target.classList.contains('page'))return false;
    document.querySelectorAll('main .page, #app > .page').forEach(p=>p.classList.toggle('active',p===target));
    document.querySelectorAll('.tabbar button[data-page]').forEach(b=>{
      const on=b.dataset.page===id;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');
    });
    if(shouldRender){
      try{if(id==='homePage'&&typeof window.renderAll==='function')window.renderAll(false);else if(typeof window.renderAll==='function')window.renderAll(false);}catch(e){console.warn('Page refresh skipped',e)}
      if(id==='homePage'){try{window.renderDash?.()}catch(_){};}
      if(id==='billPage'){try{window.previewBill?.()}catch(_){}}
    }
    return true;
  }
  function go(id){
    if(id==='calcPage'&&!$('calcPage')){try{window.createCalcPageV44?.();window.createCalcPageV43?.()}catch(_){}}
    let ok=false;
    try{if(typeof window.showPage==='function')window.showPage(id);ok=!!$(id)?.classList.contains('page')}catch(e){console.warn(e)}
    if(!ok)ok=normalizePage(id,false);
    if(ok){normalizePage(id,true);if(id==='homePage'){window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}
  }
  // Capture navigation taps so older, stacked click handlers cannot leave the page and tabbar out of sync.
  document.addEventListener('click',function(e){
    const btn=e.target.closest('button[data-page]');if(!btn)return;
    const id=btn.dataset.page;if(!id)return;
    e.preventDefault();e.stopImmediatePropagation();go(id);
  },true);
  window.ashaGoPageV81=go;
  function start(){
    setBuild();
    const login=$('login'),card=login?.querySelector('.login-card');
    if(card){card.classList.add('v81-login-card');card.setAttribute('aria-label','ASHA Billing secure login');}
    const home=$('homePage');if(home){home.classList.add('v81-home');}
    // Restore dashboard after initial load and when the browser restores the page from cache.
    const refreshHome=()=>{setBuild();};
    // Do not rerender the entire dashboard on pageshow/visibilitychange: this caused a double-load flash.
    window.addEventListener('pageshow',refreshHome);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshHome()});
    if(home?.classList.contains('active'))refreshHome();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* ASHA Billing V84 — one-pass Home activation (fixes repeated dashboard animation) */
(function(){
'use strict';const $=id=>document.getElementById(id);let active=false,timer=0;
function activate(){const app=$('app'),home=$('homePage');if(!app||app.classList.contains('hidden')||!home)return;
document.querySelectorAll('main .page, #app > .page').forEach(p=>p.classList.toggle('active',p===home));
document.querySelectorAll('.tabbar button[data-page]').forEach(b=>{const on=b.dataset.page==='homePage';b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false')});
home.classList.add('v85-home-ready');if(!active){active=true;const metrics=$('metrics');if(metrics&&!metrics.children.length){try{window.renderDash?.()}catch(e){}}}
}
function queue(){clearTimeout(timer);timer=setTimeout(activate,100)}
const app=$('app');if(app&&window.MutationObserver)new MutationObserver(()=>{if(!app.classList.contains('hidden')){active=false;queue()}else active=false}).observe(app,{attributes:true,attributeFilter:['class']});
const login=$('login');if(login&&window.MutationObserver)new MutationObserver(()=>{if(login.classList.contains('hidden')&&!$('app')?.classList.contains('hidden'))queue()}).observe(login,{attributes:true,attributeFilter:['class']});
document.addEventListener('DOMContentLoaded',queue,{once:true});window.ashaAuditV84=()=>({build:'V84 Single-pass Home',appVisible:!!$('app')&&!$('app').classList.contains('hidden'),homeActive:!!$('homePage')?.classList.contains('active'),activationCount:active?1:0});
})();

/* V84 — searchable history, clearer payment workflow and premium settings surfaces */
(function(){
'use strict';const $=id=>document.getElementById(id);
const moneyText=v=>typeof window.money==='function'?money(v):'₹'+(Number(v)||0).toLocaleString('en-IN');
const safe=v=>typeof window.esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function controls(){const head=$('historyPage')?.querySelector('.card');if(!head||$('v84HistorySearch'))return;
const box=document.createElement('div');box.className='v84-history-tools';box.innerHTML='<label><span>Search bills / customers</span><input id="v84HistorySearch" type="search" placeholder="Bill no, name, phone, village…"></label><div class="v84-history-filter-row"><label><span>Month</span><input id="v84HistoryMonth" type="month"></label><label><span>Status</span><select id="v84HistoryStatus"><option value="all">All bills</option><option value="due">Due only</option><option value="paid">Fully paid</option></select></label></div><div id="v84HistorySummary" class="v84-history-summary"></div>';
head.appendChild(box);['v84HistorySearch','v84HistoryMonth','v84HistoryStatus'].forEach(id=>$(id)?.addEventListener('input',drawHistory));}
const oldHistory=window.renderHistory;
function drawHistory(){if(!window.state||!Array.isArray(state.bills)){oldHistory?.();return}controls();const q=($('v84HistorySearch')?.value||'').trim().toLowerCase(),month=$('v84HistoryMonth')?.value||'',status=$('v84HistoryStatus')?.value||'all';
const dueOf=b=>typeof window.billDue==='function'?billDue(b):Math.max(0,(+b.allTotal||0)-(b.payments||[]).reduce((s,p)=>s+(+p.amount||0),0));
const bills=state.bills.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).filter(b=>{const c=(state.customers||[]).find(x=>String(x.id)===String(b.customerId));const hay=[b.billNo,b.customerName,b.phone,b.village,c?.phone,c?.village].join(' ').toLowerCase();const d=dueOf(b);return(!q||hay.includes(q))&&(!month||String(b.date||'').startsWith(month))&&(status==='all'||(status==='due'?d>0:d<=0))});
$('historyList').innerHTML=bills.map(b=>{const due=dueOf(b),paid=typeof window.billPaid==='function'?billPaid(b):(b.payments||[]).reduce((s,p)=>s+(+p.amount||0),0);const id=String(b.id||'').replace(/'/g,'\\\'');return `<article class="card v84-history-card"><div class="v84-history-top"><div><small>${safe(b.date||'No date')}</small><h3>${safe(b.billNo||'Bill')}</h3><p>${safe(b.customerName||'Customer')} · ${safe(b.village||'')}</p></div><span class="v84-status ${due>0?'is-due':'is-paid'}">${due>0?'DUE':'PAID'}</span></div><div class="v84-history-amounts"><div><small>Total</small><b>${moneyText(b.allTotal)}</b></div><div><small>Paid</small><b>${moneyText(paid)}</b></div><div><small>Due</small><b>${moneyText(due)}</b></div></div><div class="action-bar"><button class="btn" onclick="viewBill('${id}')">View bill</button><button class="btn primary" onclick="openPayment('${id}')">${due>0?'Receive payment':'Payment details'}</button></div></article>`}).join('')||'<div class="card muted">No bills match these filters.</div>';
const total=bills.reduce((s,b)=>s+(+b.allTotal||0),0),paid=bills.reduce((s,b)=>s+(typeof window.billPaid==='function'?billPaid(b):(b.payments||[]).reduce((a,p)=>a+(+p.amount||0),0)),0),due=bills.reduce((s,b)=>s+dueOf(b),0);if($('v84HistorySummary'))$('v84HistorySummary').innerHTML=`<span>${bills.length} bills</span><span>Total <b>${moneyText(total)}</b></span><span>Collected <b>${moneyText(paid)}</b></span><span>Due <b>${moneyText(due)}</b></span>`;
}
if(typeof oldHistory==='function'){window.renderHistory=drawHistory;try{renderHistory=drawHistory}catch(e){}}
function settingsPolish(){const page=$('settingsPage'),card=page?.querySelector('.card');if(!card||page.dataset.v84Polish)return;page.dataset.v84Polish='1';const h=card.querySelector('h2');if(h)h.insertAdjacentHTML('afterend','<p class="v84-settings-subtitle">Business profile · payment setup · bill appearance · cloud controls</p>');
const map=[['Company Name','Business profile','Business identity and contact details'],['UPI ID','Payments & QR','UPI ID, QR mode and payment collection'],['Default Print Size','Bill design','Choose the default bill layout']];
map.forEach(([key,title,sub])=>{const label=[...card.querySelectorAll('label')].find(l=>l.textContent.trim().toLowerCase().includes(key.toLowerCase()));if(!label)return;const block=document.createElement('div');block.className='v84-settings-section';block.innerHTML=`<div class="v84-settings-section-title"><span>${title==='Business profile'?'▦':title==='Payments & QR'?'↗':'▤'}</span><div><b>${title}</b><small>${sub}</small></div></div>`;label.parentNode.insertBefore(block,label)});
const save=$('saveSettingsBtn');if(save&&!save.dataset.v84Toast){save.dataset.v84Toast='1';save.addEventListener('click',()=>{setTimeout(()=>{save.textContent='✓ Settings saved';save.classList.add('v84-saved');setTimeout(()=>{save.textContent='Save Settings';save.classList.remove('v84-saved')},1600)},100)})}}
function polishPayments(){
 const page=$('payPage'),card=page?.querySelector('.card');if(!card||page.dataset.v84PayPolished)return;page.dataset.v84PayPolished='1';
 const title=card.querySelector('h2');if(title)title.insertAdjacentHTML('afterend','<p class="v84-pay-subtitle">Record real collections separately from settlement or adjustment entries.</p>');
 const amount=$('payAmount');if(amount){amount.min='0.01';amount.step='0.01';amount.inputMode='decimal';amount.addEventListener('input',()=>{const b=(state.bills||[]).find(x=>String(x.id)===String($('payBill')?.value));const due=b&&typeof window.billDue==='function'?billDue(b):0;const hint=$('v84PayHint');if(hint)hint.textContent=Number(amount.value)>due&&due>0?'Amount is higher than this bill’s current due. Confirm it is intentional.':''})}
 const info=$('payInfo');if(info&&!$('v84PaymentHistory')){const extra=document.createElement('div');extra.id='v84PaymentHistory';extra.className='v84-payment-history';info.insertAdjacentElement('afterend',extra)}
 const hint=document.createElement('p');hint.id='v84PayHint';hint.className='v84-pay-hint';$('payInfo')?.insertAdjacentElement('afterend',hint);
 const old=window.updatePayInfo;if(typeof old==='function'&&!old.__v84){const wrapped=function(){old.apply(this,arguments);const b=(state.bills||[]).find(x=>String(x.id)===String($('payBill')?.value));const target=$('v84PaymentHistory');if(!target)return;if(!b){target.innerHTML='';return}const due=typeof window.billDue==='function'?billDue(b):0;const paid=typeof window.billPaid==='function'?billPaid(b):(b.payments||[]).reduce((s,p)=>s+(+p.amount||0),0);const total=+b.allTotal||0;const pct=total>0?Math.min(100,Math.max(0,paid/total*100)):100;target.innerHTML=`<div class="v84-pay-progress"><div><span>Payment progress</span><b>${Math.round(pct)}%</b></div><div class="v84-pay-track"><i style="width:${pct}%"></i></div><div class="v84-pay-numbers"><span>Paid ${moneyText(paid)}</span><span>Remaining ${moneyText(due)}</span></div></div><h3>Recent entries</h3>${(b.payments||[]).slice().reverse().slice(0,5).map(p=>`<div class="v84-pay-entry"><span><b>${safe(p.mode||'Payment')}</b><small>${safe(p.date||'')} · ${safe(p.receivedIn||'')} ${p.note?'· '+safe(p.note):''}</small></span><strong>${moneyText(p.amount)}</strong></div>`).join('')||'<p class="muted">No payment entries yet.</p>'}`};wrapped.__v84=true;window.updatePayInfo=wrapped;try{updatePayInfo=wrapped}catch(e){}}
 }
 function init(){controls();settingsPolish();polishPayments();if(typeof window.renderHistory==='function')window.renderHistory();if(typeof window.updatePayInfo==='function')window.updatePayInfo()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.ashaAuditV84Features=()=>({historySearch:!!$('v84HistorySearch'),historyFilters:!!$('v84HistoryStatus'),settingsPolished:!!$('settingsPage')?.dataset.v84Polish,paymentPage:!!$('payPage'),calculator:!!$('calcPage')});
})();


/* ASHA Billing V85 — preserved dashboard, customer centre redesign and saved-invoice reminder integrity */
(function(){
  const $=id=>document.getElementById(id);
  const safe=v=>typeof window.esc==='function'?esc(v):String(v??'');
  // Keep every existing dashboard metric and quick action; only disable duplicate entry animation.
  const style=document.createElement('style');style.textContent=`
  #homePage.v85-home-ready .dashboard-head,#homePage.v85-home-ready .metrics .metric,#homePage.v85-home-ready .quick-actions button{animation:none!important;transition:box-shadow .16s ease,border-color .16s ease!important;opacity:1!important;transform:none!important;filter:none!important}
  .v85-user-hero{grid-column:1/-1;display:grid;grid-template-columns:48px minmax(0,1fr);gap:12px;align-items:center;padding:15px;margin-bottom:3px;border:1px solid #e2eee5;border-radius:20px;background:linear-gradient(135deg,#f3faf5,#fff);box-shadow:0 6px 18px #173b2508}
  .v85-user-avatar{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(145deg,#0a8555,#36b77b);color:white;font-weight:800;font-size:21px;box-shadow:inset 0 1px 0 #ffffff55}
  .v85-user-ident{min-width:0}.v85-user-ident h3{margin:0 0 4px;font-size:16px;letter-spacing:-.3px;color:#173b28}.v85-user-ident p{margin:0;font-size:11px;line-height:1.45;color:#6c7d71;overflow-wrap:anywhere}
  .v85-user-balance{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;padding:11px 13px;border-radius:13px;background:#fff;border:1px solid #e5eee7}.v85-user-balance small{font-size:11px;color:#75857a}.v85-user-balance b{font-size:20px;letter-spacing:-.4px;color:#b45309}.v85-user-balance.paid b{color:#07804f}
  .v85-user-section-label{grid-column:1/-1;margin:8px 2px 0;color:#7a8a7e;font-size:10px;font-weight:850;letter-spacing:1.25px}
  .v85-user-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v85-user-grid .v77-btn{min-width:0;padding:10px;gap:8px;border-radius:16px;min-height:62px;font-size:12px;line-height:1.25}.v85-user-grid .v77-btn>span:nth-child(2){overflow-wrap:anywhere}.v85-user-grid .v77-icon{width:30px;height:30px;border-radius:10px}
  .v77-sheet{padding:clamp(15px,4vw,22px)!important;border-radius:28px 28px 24px 24px!important}.v77-sheet header{position:sticky;top:-1px;z-index:2;background:rgba(250,252,250,.96);padding:2px 0 10px;margin-bottom:10px;backdrop-filter:blur(16px)}
  @media(max-width:380px){.v85-user-grid{grid-template-columns:1fr}.v85-user-hero{grid-template-columns:42px minmax(0,1fr)}.v85-user-avatar{width:42px;height:42px}}
  `;document.head.appendChild(style);
  // Make reminder generation always use the saved bill's totals. Only derive fields for incomplete legacy records.
  const previous=window.v66BillReminder||window.v65BillReminder||window.v64BillReminder;
  if(typeof previous==='function'&&!window.__v85ReminderWrapped){
    window.__v85ReminderWrapped=true;
    window.v85BillReminder=async function(cid,bid=''){
      const c=(window.state?.customers||[]).find(x=>String(x.id)===String(cid));
      const bill=bid?(window.state?.bills||[]).find(x=>String(x.id)===String(bid)):(window.state?.bills||[]).filter(x=>String(x.customerId)===String(cid)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];
      if(!c){alert('Customer not found.');return}
      if(!bill){alert('এই user-এর কোনো bill নেই। আগে New Bill তৈরি করুন।');return}
      // Do not mutate state or replace historical rates/totals during sharing.
      const snapshot={...bill,payments:Array.isArray(bill.payments)?bill.payments.map(p=>({...p})):[]};
      if(!Number.isFinite(Number(snapshot.current)))snapshot.current=(Number(snapshot.landAmount)||0)*(Number(snapshot.rate)||0);
      if(!Number.isFinite(Number(snapshot.allTotal)))snapshot.allTotal=(Number(snapshot.previousDue)||0)+(Number(snapshot.current)||0);
      const oldBills=window.state.bills;
      try{
        // Reminder renderer resolves the chosen bill by id; use its original stored object values.
        return await previous(cid,bid||snapshot.id);
      }catch(err){console.error('V85 reminder fallback',err);alert('Bill Reminder খোলা যায়নি। Bill preview খুলে আবার চেষ্টা করুন।')}
    };
    window.v66BillReminder=window.v85BillReminder;window.v65BillReminder=window.v85BillReminder;window.v64BillReminder=window.v85BillReminder;window.shareCustomerBill=window.v85BillReminder;
  }
  window.ashaAuditV85=()=>({build:'V85 User Centre + Saved Bill Reminder',homeMetrics:!!$('metrics'),quickActions:!!document.querySelector('#homePage .quick-actions'),userCentre:!!$('v77ActionRoot'),reminderWrapped:!!window.__v85ReminderWrapped});
})();


/* ASHA Billing V86 — redesigned customer three-dot action centre */
(()=>{'use strict';const css=document.createElement('style');css.textContent=`
#v77ActionRoot .v77-sheet{width:min(100%,620px)!important;max-height:min(92dvh,960px)!important;background:linear-gradient(180deg,#fbfdfb,#f5f8f6)!important;padding:clamp(14px,3.5vw,22px)!important}
#v77ActionRoot .v77-sheet header{align-items:center!important;margin-bottom:12px!important}#v77ActionRoot #v77Title{font-size:clamp(21px,5vw,27px)!important;letter-spacing:-.8px!important}#v77ActionRoot #v77Sub{font-size:12px!important;line-height:1.5!important;overflow-wrap:anywhere}#v77Body.v86-user-grid{display:block!important}
.v86-customer-hero{display:grid;grid-template-columns:50px minmax(0,1fr) 38px;gap:11px;align-items:center;padding:14px;border-radius:23px;background:linear-gradient(140deg,#eaf7ef,#fff 75%);border:1px solid #dcece1;margin-bottom:17px;box-shadow:0 8px 24px #163c2508}.v86-avatar{width:50px;height:50px;border-radius:17px;display:grid;place-items:center;background:linear-gradient(145deg,#087b50,#32b77b);color:white;font-size:22px;font-weight:850}.v86-identity{min-width:0}.v86-identity h3{margin:0 0 4px;color:#173b28;font-size:17px;letter-spacing:-.4px;overflow-wrap:anywhere}.v86-identity p{margin:0;color:#6b7e71;font-size:11px;line-height:1.5;overflow-wrap:anywhere}.v86-edit-shortcut{width:36px;height:36px;border:1px solid #dce9df;background:#fff;border-radius:13px;color:#087b50;font-size:18px;display:grid;place-items:center}
.v86-balance{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 13px;border-radius:16px;background:#fff;border:1px solid #e3ece5}.v86-balance span{display:grid;gap:4px}.v86-balance small{font-size:9px;font-weight:850;letter-spacing:1px;color:#748379}.v86-balance b{font-size:25px;line-height:1.1;letter-spacing:-.7px;color:#b45309}.v86-balance.is-clear b{color:#087b50}.v86-balance em{font-style:normal;font-size:10px;font-weight:750;padding:7px 9px;border-radius:99px;background:#fff2df;color:#9a5b05;white-space:nowrap}.v86-balance.is-clear em{background:#e9f8ee;color:#087b50}.v86-mini-stats{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.v86-mini-stats span{min-width:0;padding:9px 10px;border-radius:13px;background:#ffffffc9;border:1px solid #e8eee9;display:grid;gap:4px}.v86-mini-stats small{font-size:10px;color:#75847a}.v86-mini-stats b{font-size:12px;color:#234732;overflow-wrap:anywhere}
.v86-menu-section{margin:15px 0 0}.v86-section-title{display:flex;gap:10px;align-items:center;margin:0 2px 9px}.v86-section-title>span{width:29px;height:29px;flex:0 0 29px;border-radius:10px;background:#e5f4e9;color:#087b50;display:grid;place-items:center;font-size:10px;font-weight:900}.v86-section-title div{display:grid;gap:2px}.v86-section-title b{font-size:13px;color:#264a33}.v86-section-title small{font-size:10px;color:#839087}.v86-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v86-action{display:flex;align-items:center;gap:9px;text-align:left;min-width:0;min-height:64px;padding:10px;border-radius:17px;border:1px solid #e1eae3;background:#fff;color:#254631;box-shadow:0 3px 12px #153b2507;cursor:pointer;transition:transform .12s ease,border-color .12s ease}.v86-action:active{transform:scale(.985)}.v86-action-glyph{width:33px;height:33px;flex:0 0 33px;border-radius:12px;background:#edf7f0;color:#087b50;display:grid;place-items:center;font-size:17px;font-weight:800}.v86-action-copy{display:grid;gap:4px;min-width:0;flex:1}.v86-action-copy b{font-size:11px;line-height:1.25;overflow-wrap:anywhere}.v86-action-copy small{font-size:9px;color:#859188;line-height:1.25;overflow-wrap:anywhere}.v86-action-arrow{color:#a5b2a8;font-size:20px;line-height:1}.v86-action.primary{background:linear-gradient(135deg,#087b50,#149a63);border-color:transparent;color:#fff}.v86-action.primary .v86-action-glyph{background:#ffffff27;color:#fff}.v86-action.primary .v86-action-copy small,.v86-action.primary .v86-action-arrow{color:#e2f8e9}.v86-action.danger{background:#fff8f7;border-color:#f2d8d5;color:#a92e26}.v86-action.danger .v86-action-glyph{background:#ffe9e6;color:#b42318}.v86-action.is-disabled{opacity:.5;cursor:not-allowed}.v86-danger-section .v86-section-title>span{background:#fff0ee;color:#b42318}#v77Foot:has(.v86-footnote){align-items:center;justify-content:space-between;border-top:1px solid #e4ece6;padding-top:12px}.v86-footnote{font-size:10px;color:#849187;flex:1}#v77Foot #v86CloseActions{max-width:100px;min-height:42px;background:#e9f4ec;border:1px solid #dce9df;color:#205338}
@media(max-width:390px){.v86-customer-hero{grid-template-columns:43px minmax(0,1fr) 34px;padding:11px;gap:8px}.v86-avatar{width:43px;height:43px;border-radius:14px}.v86-mini-stats{gap:5px}.v86-mini-stats span{padding:8px 7px}.v86-mini-stats b{font-size:11px}.v86-action-grid{gap:7px}.v86-action{padding:8px;gap:7px;min-height:62px}.v86-action-glyph{width:29px;height:29px;flex-basis:29px;border-radius:10px}.v86-action-copy b{font-size:10px}}@media(prefers-reduced-motion:reduce){.v86-action{transition:none!important}}`;document.head.appendChild(css);const meta=document.querySelector('meta[name="app-build"]');if(meta)meta.content='V86 Customer Action Centre';const chip=document.getElementById('buildChip');if(chip)chip.textContent='V86 · Customer Centre';window.ASHA_BUILD='V86 Customer Action Centre';document.addEventListener('keydown',e=>{if(e.key==='Escape'){const r=document.getElementById('v77ActionRoot');if(r?.classList.contains('open')){r.classList.remove('open');r.setAttribute('aria-hidden','true');document.body.classList.remove('v77-modal-open')}}});window.ashaAuditV86=()=>({build:'V86 Customer Action Centre',customerMenu:!!document.getElementById('v77ActionRoot'),actionGroups:!!document.querySelector('.v86-menu-section'),homeMetrics:!!document.getElementById('metrics'),newBill:!!document.getElementById('billPage'),latestBillPreview:typeof window.openBillPreviewV50==='function',billReminder:typeof window.v85BillReminder==='function'});})();

/* ASHA Billing V87 — Premium Bill Studio: cleaner controls, premium templates, print sizing */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const templates=[
  ['classic','Classic Official'],['premium','Premium Green'],['royal','Royal Gold Premium'],['midnight','Midnight Premium'],['ocean','Ocean Blue Premium'],['minimal','Minimal Luxe'],['modern','Modern Receipt'],['boxed','Boxed Modern'],['bengali','Bengali Classic'],['qrfirst','QR First'],['standard','Clean Standard'],['normal','Black & White'],['thermal','Thermal Compact'],['compact','Compact A6'],['phone','Phone View'],['mini','Mini Compact']
 ];
 const sizes=[['thermal80','Thermal · 80 mm'],['thermal58','Thermal · 58 mm'],['a4full','A4 · Full page'],['a4two','A4 · Half page (A5)'],['a4half','A4 · Half page (A5)'],['a4four','A4 · Quarter page (A6)'],['a4quarter','A4 · Quarter page (A6)'],['a4side','A4 · Side half'],['a4land','A4 · Landscape half'],['phoneview','Mobile · Share image']];
 function refill(id,items){const el=$(id);if(!el)return;const old=el.value;el.innerHTML=items.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');if(items.some(x=>x[0]===old))el.value=old;else if(id==='template')el.value='premium';else if(id==='setTemplate')el.value='premium';else el.value='thermal80';}
 function icon(path){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`}
 function setup(){
  const chip=$('buildChip');if(chip)chip.textContent='V87 · Premium Bill Studio';const meta=document.querySelector('meta[name="app-build"]');if(meta)meta.content='V87 Premium Bill Studio';
  refill('template',templates);refill('setTemplate',templates);refill('printMode',sizes);refill('setPrint',sizes);
  const hint=$('billDesignHint');if(hint)hint.remove();
  const labels={printBtn:['Print','M6 3h12v6H6z M6 14H4v-3h16v3h-2 M7 14h10v7H7z M8 6h8'],shareBtn:['Bill Reminder','M12 16V3 M7 8l5-5 5 5 M4 14v6h16v-6'],pdfBtn:['PDF','M6 3h9l4 4v14H6z M14 3v5h5 M9 13h6 M9 16h6'],waTextBtn:['Reminder','M5 4h14v13H9l-4 3z M8 9h8 M8 12h6']};
  Object.entries(labels).forEach(([id,[label,path]])=>{const b=$(id);if(!b)return;b.classList.add('v87-bill-action');b.type='button';b.innerHTML=`<span class="v87-action-icon">${icon(path)}</span><span>${label}</span>`;});
  if($('printBtn'))$('printBtn').onclick=()=>printCurrent();
  if($('shareBtn'))$('shareBtn').onclick=async()=>{if(!window.currentBill&&!window.v64BillHTML)return alert('Preview a bill first.');try{if(typeof window.shareBill==='function')await window.shareBill();else if(typeof window.v85BillReminder==='function')await window.v85BillReminder(window.currentBill?.customerId,window.currentBill?.id);else alert('Bill Reminder is not available.')}catch(e){console.error(e);alert('Bill Reminder could not be opened. Please preview the bill and try again.')}};
  if($('pdfBtn'))$('pdfBtn').onclick=async()=>{try{if(typeof window.downloadPDF==='function')await window.downloadPDF();else alert('Preview a bill first.')}catch(e){console.error(e);alert('PDF could not be generated. Please try again.')}};
  if($('waTextBtn'))$('waTextBtn').onclick=()=>{try{if(typeof window.waText==='function')window.waText();else alert('Preview a bill first.')}catch(e){console.error(e);alert('Reminder could not be opened.')}};
  const tpl=$('template'),sz=$('printMode');
  const updatePreviewSizing=()=>{const wrap=$('billPreviewWrap');if(!wrap)return;wrap.dataset.printSize=sz?.value||'thermal80';wrap.dataset.billDesign=tpl?.value||'premium';document.body.dataset.v87PrintSize=sz?.value||'thermal80';};
  tpl?.addEventListener('change',()=>{updatePreviewSizing();animatePreview();});sz?.addEventListener('change',()=>{updatePreviewSizing();animatePreview();});
  $('setTemplate')?.addEventListener('change',()=>{if($('template'))$('template').value=$('setTemplate').value;updatePreviewSizing();if(typeof window.previewBill==='function'&&$('billPage')?.classList.contains('active'))window.previewBill();});
  $('setPrint')?.addEventListener('change',()=>{if($('printMode'))$('printMode').value=$('setPrint').value;updatePreviewSizing();});
  updatePreviewSizing();
 }
 function animatePreview(){const p=$('billPreview');if(!p)return;p.classList.remove('v87-preview-change');void p.offsetWidth;p.classList.add('v87-preview-change');}
 function printCurrent(){
  const mode=$('printMode')?.value||'thermal80';
  const preview=$('billPreview');if(!preview||!preview.innerHTML.trim()){if(typeof window.previewBill==='function')window.previewBill();}
  const body=document.body;body.classList.remove('v87-print-thermal80','v87-print-thermal58','v87-print-a4full','v87-print-a5','v87-print-a6','v87-print-side','v87-print-land','v87-print-phone');
  const map={thermal80:'v87-print-thermal80',thermal58:'v87-print-thermal58',a4full:'v87-print-a4full',a4two:'v87-print-a5',a4half:'v87-print-a5',a4four:'v87-print-a6',a4quarter:'v87-print-a6',a4side:'v87-print-side',a4land:'v87-print-land',phoneview:'v87-print-phone'};
  body.classList.add(map[mode]||'v87-print-thermal80');
  const style=$('v87PrintPageStyle')||document.head.appendChild(Object.assign(document.createElement('style'),{id:'v87PrintPageStyle'}));
  style.textContent='@media print{@page{size:'+(mode==='thermal80'?'80mm auto':mode==='thermal58'?'58mm auto':mode==='a4land'?'A4 landscape':'A4 portrait')+';margin:'+(mode.startsWith('thermal')?'3mm':'8mm')+'}#billPreview{width:'+(mode==='thermal80'?'78mm':mode==='thermal58'?'56mm':mode==='a4full'?'194mm':mode==='a4two'||mode==='a4half'?'190mm':mode==='a4four'||mode==='a4quarter'?'95mm':mode==='a4side'?'95mm':mode==='a4land'?'135mm':'100%')+'!important;max-width:100%!important;margin:0 auto!important}#billPreview .v64-bill{width:100%!important;max-width:100%!important;box-shadow:none!important;border-radius:'+(mode.startsWith('thermal')?'0':'14px')+'!important}#billPreview .v64-bill *{break-inside:avoid}';
  setTimeout(()=>{window.print();setTimeout(()=>body.classList.remove(map[mode]||'v87-print-thermal80'),700)},80);
 }
 const style=document.createElement('style');style.id='v87PremiumBillStyles';style.textContent=`
 .v87-bill-action{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-height:46px!important;padding:10px 14px!important;border-radius:16px!important;font-weight:750!important;letter-spacing:-.15px!important;box-shadow:0 5px 14px rgba(14,45,27,.07)!important;transition:transform .18s ease,box-shadow .18s ease,filter .18s ease!important}
 .v87-bill-action:active{transform:scale(.97)!important}.v87-action-icon{width:26px;height:26px;display:grid;place-items:center;flex:0 0 26px;border-radius:9px;background:rgba(8,123,80,.09);color:currentColor}.v87-action-icon svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.v87-bill-action.primary .v87-action-icon{background:#ffffff24}
 #billPage .bill-form label{font-size:12px;font-weight:750;letter-spacing:-.1px}#billPage #template,#billPage #printMode{min-height:46px;border-radius:14px;border:1px solid #dbe7de;background-color:#fff;font-weight:650;color:#214632;padding:10px 34px 10px 12px;box-shadow:0 3px 10px #153b2506}
 #billPage .preview-wrap{border:1px solid #e0e9e2;box-shadow:inset 0 1px 0 #fff;transition:background .2s ease}#billPage #billPreview{transform-origin:top center}#billPage #billPreview.v87-preview-change{animation:v87PreviewIn .24s ease-out both}
 @keyframes v87PreviewIn{from{opacity:.65;transform:translateY(5px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
 .v64-bill.v64-royal{border:1px solid #c8a45d!important;background:linear-gradient(180deg,#fffdf7,#fff 42%)!important;box-shadow:0 12px 30px #8f6a201c!important}.v64-royal .v64-head{background:linear-gradient(135deg,#6e4a10,#d6ad55)!important;color:#fff!important}.v64-royal .v64-title{color:#8a641e!important}.v64-royal .v64-summary{background:#fff8e5!important;border-color:#e8d39c!important}.v64-royal .v64-chip{border-color:#e4d4a8!important}
 .v64-bill.v64-midnight{background:#101b2b!important;color:#eaf0f8!important;border-color:#263c59!important;box-shadow:0 14px 32px #08111f30!important}.v64-midnight .v64-head{background:linear-gradient(135deg,#101b2b,#253d60)!important;color:#fff!important}.v64-midnight .v64-block,.v64-midnight .v64-chip{background:#16263a!important;border-color:#30465e!important;color:#eaf0f8!important}.v64-midnight .v64-title,.v64-midnight .v64-line span{color:#a9c4e7!important}.v64-midnight .v64-summary{background:#1c3348!important;border-color:#38536b!important}.v64-midnight .v64-line{border-color:#30465e!important}.v64-midnight .v64-footer{color:#b6c7d9!important}
 .v64-bill.v64-ocean{border-color:#8cc9e9!important;box-shadow:0 12px 30px #0c6e9a16!important}.v64-ocean .v64-head{background:linear-gradient(135deg,#075985,#0ea5e9)!important;color:white!important}.v64-ocean .v64-title{color:#075985!important}.v64-ocean .v64-summary{background:#effaff!important;border-color:#bae6fd!important}.v64-ocean .v64-chip{border-color:#c7e8f7!important}
 .v64-bill.v64-minimal{border:0!important;border-radius:8px!important;box-shadow:none!important;background:#fff!important}.v64-minimal .v64-head{background:#fff!important;color:#101828!important;border-top:4px solid #101828!important;border-bottom:1px solid #d0d5dd!important}.v64-minimal .v64-block{border:0!important;border-bottom:1px solid #eaecf0!important;border-radius:0!important;background:#fff!important}.v64-minimal .v64-title{color:#667085!important;letter-spacing:1px!important}.v64-minimal .v64-summary{background:#f8fafc!important;border:1px solid #d0d5dd!important}.v64-minimal .v64-chip{border-radius:7px!important}
 .v64-bill.v64-modern{border:1px solid #c7d2fe!important;border-radius:20px!important;box-shadow:0 14px 34px #4338ca14!important}.v64-modern .v64-head{background:linear-gradient(135deg,#312e81,#6366f1)!important;color:#fff!important}.v64-modern .v64-title{color:#4338ca!important}.v64-modern .v64-summary{background:#eef2ff!important;border-color:#c7d2fe!important}.v64-modern .v64-chip{background:#f5f6ff!important;border-color:#dfe2ff!important}
 #billPage .action-bar.sticky-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}#billPage .action-bar.sticky-actions .btn{min-width:0;font-size:12px;padding:8px 6px!important;white-space:nowrap}
 @media(max-width:520px){#billPage .action-bar.sticky-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#billPage .action-bar.sticky-actions .btn{min-height:48px!important;font-size:13px}#billPage .bill-form{padding:15px!important}#billPage .preview-wrap{padding:8px!important;border-radius:18px!important}}
 @media(prefers-reduced-motion:reduce){#billPage #billPreview.v87-preview-change{animation:none!important}.v87-bill-action{transition:none!important}}
 `;document.head.appendChild(style);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
 window.ashaAuditV87=()=>({build:'V87 Premium Bill Studio',designOptions:templates.length,printSizes:sizes.length,printAction:!!$('printBtn')?.onclick,billReminderLabel:$('shareBtn')?.innerText||'',reminderLabel:$('waTextBtn')?.innerText||'',instructionsRemoved:!$('billDesignHint')});
})();

/* V88 premium calculator styles */
(function(){const s=document.createElement('style');s.id='v88CalculatorStyles';s.textContent=`
#calcPage .v88-fx-card,#calcPage .v88-cash-card,#calcPage .v88-land-card{border:1px solid #e2e9e4!important;border-radius:28px!important;padding:clamp(15px,4vw,23px)!important;background:linear-gradient(160deg,#ffffff,#f7faf8)!important;box-shadow:0 12px 34px rgba(19,54,32,.065)!important;margin-bottom:16px!important;overflow:hidden}
#calcPage .v88-old-calc-card,#calcPage .v88-land-old{display:none!important}
.v88-calc-head,.v88-section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.v88-calc-head h2,.v88-section-head h2{margin:3px 0 4px;font-size:23px;letter-spacing:-.8px;color:#183c29}.v88-calc-head p,.v88-section-head p{margin:0;font-size:12px;color:#718177}.v88-calc-kicker{font-size:9px;font-weight:900;letter-spacing:1.7px;color:#168356}.v88-calc-badge{padding:8px 11px;border-radius:12px;background:#e8f6ec;color:#087b50;font-size:10px;font-weight:900;letter-spacing:1px}
.v88-lcd{padding:15px 16px 13px;border-radius:20px;background:linear-gradient(160deg,#d9e7d4,#c6d9c1);border:1px solid #b4c9ae;box-shadow:inset 0 2px 6px #385e2e17;margin-bottom:12px;color:#1c3220;min-height:114px}.v88-lcd-meta{display:flex;gap:14px;font-size:9px;font-weight:900;letter-spacing:.8px;opacity:.7}.v88-lcd-meta #v88Shift.on{color:#9a3412;opacity:1}.v88-lcd-screen{font:500 clamp(27px,7vw,39px)/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right;overflow-x:auto;white-space:nowrap;letter-spacing:-1px;min-height:50px;padding-top:7px}.v88-lcd-expr{text-align:right;min-height:15px;font:10px ui-monospace,monospace;opacity:.65;overflow-wrap:anywhere}
.v88-fx-controls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-bottom:10px}.v88-fx-controls button{border:1px solid #e0e8e2;background:#fff;color:#476052;border-radius:11px;min-height:34px;font-size:10px;font-weight:850}.v88-fx-controls button.active{background:#e3f5e8;border-color:#a9d7b7;color:#087b50}
.v88-fx-keys{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.v88-fx-keys button{min-width:0;min-height:48px;border:1px solid #e2e8e3;border-radius:14px;background:linear-gradient(180deg,#fff,#f5f7f5);color:#203c2a;font-size:14px;font-weight:750;box-shadow:0 3px 7px #153b2509;transition:transform .12s,box-shadow .12s;touch-action:manipulation}.v88-fx-keys button:active{transform:scale(.95);box-shadow:inset 0 2px 5px #153b2515}.v88-fx-keys button.fx-function{background:#e8f2ea;color:#42654d;border-color:#d8e6db;font-size:11px}.v88-fx-keys button.fx-operator{background:#dff2e5;color:#087b50;border-color:#c7e5d0;font-size:18px}.v88-fx-keys button.fx-clear{background:#fff0ed;color:#b42318;border-color:#f6d5d0}.v88-fx-keys button.fx-equals{background:linear-gradient(145deg,#087b50,#17a46a);color:#fff;border-color:transparent;font-size:20px;box-shadow:0 6px 14px #087b502c}.v88-calc-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;color:#859188;font-size:10px}.v88-calc-foot button{border:0;background:transparent;color:#087b50;font-weight:800}.v88-calc-history{display:grid;gap:6px;margin-top:10px}.v88-calc-history button{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #e3eae4;background:#fff;border-radius:12px;text-align:left;color:#31513b}.v88-calc-history button span{overflow-wrap:anywhere}.v88-calc-history small{color:#8a968e}
.v88-soft-btn,.v88-main-btn{border:1px solid #dce8df;background:#edf5ef;color:#28563a;border-radius:13px;padding:10px 13px;min-height:40px;font-size:11px;font-weight:850}.v88-main-btn{background:linear-gradient(135deg,#087b50,#15945f);color:white;border-color:transparent;box-shadow:0 5px 13px #087b501d}.v88-cash-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.v88-cash-item{display:grid;gap:7px;padding:11px 10px;border:1px solid #e2eae4;border-radius:17px;background:#fff;min-width:0}.v88-cash-item>span{font-size:17px;font-weight:900;color:#1e5435}.v88-cash-item input{width:100%;min-width:0;box-sizing:border-box;border:1px solid #dce7df;border-radius:10px;padding:10px 8px;background:#f9fbf9;font-size:16px;font-weight:750;color:#203e2b}.v88-cash-item small{font-size:10px;color:#718177}.v88-cash-total{display:grid;grid-template-columns:1.2fr 1fr;gap:9px;margin-top:13px}.v88-cash-total>div{padding:14px;border-radius:17px;background:#e9f6ed;border:1px solid #d5ecdc;display:grid;gap:6px}.v88-cash-total small{font-size:10px;color:#658270}.v88-cash-total strong{font-size:clamp(17px,4.5vw,24px);color:#087b50;overflow-wrap:anywhere}.v88-cash-actions{display:flex;gap:8px;margin-top:11px}.v88-cash-breakdown{display:grid;gap:7px;margin-top:12px}.v88-cash-breakdown>div{display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #edf1ee;font-size:12px;color:#587061}.v88-cash-breakdown b{color:#264c34}.v88-cash-empty{font-size:11px;color:#87938b;padding:7px 0}
.v88-land-icon{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:#e6f4e9;color:#087b50;font-size:28px}.v88-land-convert{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}.v88-land-convert label{display:grid;gap:7px;font-size:11px;font-weight:800;color:#607567}.v88-land-convert input,.v88-land-convert select{width:100%;box-sizing:border-box;min-height:45px;border:1px solid #dce7df;background:#fff;border-radius:13px;padding:10px 12px;font-size:15px;color:#234631;font-weight:650}.v88-land-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v88-land-results>div{padding:12px;border-radius:14px;background:#fff;border:1px solid #e3ebe5;display:grid;gap:5px;min-width:0}.v88-land-results small{font-size:10px;color:#78877d}.v88-land-results b{font-size:15px;color:#214c31;overflow-wrap:anywhere}.v88-land-divider{height:1px;background:#e7ede8;margin:18px 0}.v88-land-card h3{font-size:14px;color:#244c32;margin:0 0 12px}.v88-land-note{font-size:10px;line-height:1.55;color:#849087;margin:12px 0}.v88-land-card .v88-main-btn{width:100%}
@media(max-width:390px){.v88-fx-keys{gap:5px}.v88-fx-keys button{min-height:44px;border-radius:12px;font-size:12px}.v88-fx-controls{gap:4px}.v88-fx-controls button{font-size:9px}.v88-cash-grid{gap:6px}.v88-cash-item{padding:9px 7px}.v88-cash-item>span{font-size:15px}.v88-cash-item input{padding:9px 6px}.v88-land-results b{font-size:13px}}
@media(prefers-reduced-motion:reduce){.v88-fx-keys button{transition:none}}
`;document.head.appendChild(s)})();

window.ASHA_BUILD='V88 FX-100MS Calculator + Cash Counter + Land Measure';

/* ASHA Billing V89 — working Calculator Studio, clearer Pay workflow, settlement-aware dashboard */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const isSettlement=p=>/settle|adjust|waiv/i.test(String(p?.mode||'')+' '+String(p?.receivedIn||''));
function totals(){const bills=window.state?.bills||[];let total=0,collected=0,settled=0,due=0;for(const b of bills){total+=Number(b.allTotal)||0;for(const p of (b.payments||[])){const a=Number(p.amount)||0;if(isSettlement(p))settled+=a;else collected+=a;}due+=typeof window.billDue==='function'?window.billDue(b):Math.max(0,(Number(b.allTotal)||0)-(b.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0));}for(const c of (window.state?.customers||[])){due+=Number(c.openingDue)||0;}return{total,collected,settled,due};}
function patchDashboard(){const root=$('metrics');if(!root||!window.state)return;const t=totals();const customerCount=(window.state.customers||[]).length;const items=[['▤','Total Bill',fmt(t.total),'billed'],['↙','Cash Collected',fmt(t.collected),'cash'],['✓','Settled / Adjusted',fmt(t.settled),'settled'],['!','Outstanding Due',fmt(t.due),'due'],['♙','Customers',customerCount,'users']];root.innerHTML=items.map(([i,l,v,k])=>`<div class="metric v89-metric v89-${k}"><small><span class="metric-icon">${i}</span><span>${l}</span></small><b>${v}</b>${k==='settled'?'<em>Non-cash adjustment</em>':''}</div>`).join('');}
function setupCalculator(){const page=$('calcPage');if(!page)return;
 let root=$('v89CalculatorStudio');if(!root){root=document.createElement('div');root.id='v89CalculatorStudio';root.innerHTML=`
 <section class="v89-tool-card v89-calculator"><div class="v89-tool-head"><div><span class="v89-eyebrow">ASHA TOOLKIT · 01</span><h2>Scientific Calculator</h2><p>Fast calculations with history and memory.</p></div><span class="v89-chip">FX STYLE</span></div>
 <div class="v89-display"><div class="v89-display-meta"><span id="v89Angle">DEG</span><span id="v89Mem">MEM —</span></div><div id="v89Expr" class="v89-expr">Ready</div><output id="v89Result" aria-live="polite">0</output></div>
 <div class="v89-calc-tools"><button data-calc-action="angle">DEG / RAD</button><button data-calc-action="memory">M+</button><button data-calc-action="recall">MR</button><button data-calc-action="ans">Ans</button><button data-calc-action="clearHistory">Clear history</button></div>
 <div class="v89-keypad">${['AC','DEL','(',')','÷','sin','cos','tan','√','×','7','8','9','x²','−','4','5','6','log','+','1','2','3','ln','=','0','.','π','^','%','1/x','!','e','±',''].map(k=>k?`<button type="button" data-key="${k}" class="${['AC','DEL'].includes(k)?'danger':(['÷','×','−','+','=','^'].includes(k)?'operator':'')} ${['sin','cos','tan','√','x²','log','ln','π','1/x','!','e','±'].includes(k)?'function':''} ${k==='='?'equals':''}">${k}</button>`:'<span></span>').join('')}</div>
 <div class="v89-tool-foot"><span>Calculations stay on this device until refreshed.</span><button type="button" data-calc-action="copy">Copy result</button></div><div id="v89History" class="v89-history"></div></section>
 <section class="v89-tool-card"><div class="v89-tool-head"><div><span class="v89-eyebrow">ASHA TOOLKIT · 02</span><h2>Cash Counter</h2><p>Enter the number of notes and coins.</p></div><span class="v89-chip">CASH</span></div><div class="v89-denominations" id="v89Denoms">${[500,200,100,50,20,10,5,2,1].map(v=>`<label><span>₹${v}</span><input type="number" min="0" step="1" inputmode="numeric" data-denom="${v}" placeholder="0"><small>₹${v} × <b data-subtotal="${v}">0</b></small></label>`).join('')}</div><div class="v89-cash-summary"><div><small>Total cash</small><strong id="v89CashTotal">₹0</strong></div><div><small>Total pieces</small><strong id="v89CashPieces">0</strong></div></div><div class="v89-action-row"><button type="button" data-cash-action="reset">Reset</button><button type="button" data-cash-action="copy" class="primary">Copy summary</button><button type="button" data-cash-action="print">Print</button></div></section>
 <section class="v89-tool-card"><div class="v89-tool-head"><div><span class="v89-eyebrow">ASHA TOOLKIT · 03</span><h2>Land & Rate Calculator</h2><p>Business conversion: 1 bigha = 20 katha = 40 decimal.</p></div><span class="v89-chip">LAND</span></div><div class="v89-land-inputs"><label>Land amount<input id="v89LandAmount" type="number" min="0" step="any" value="1"></label><label>Unit<select id="v89LandUnit"><option value="bigha">Bigha</option><option value="katha">Katha</option><option value="decimal">Decimal</option><option value="acre">Acre</option><option value="sqft">Square feet</option><option value="sqm">Square metre</option></select></label><label>Rate per bigha (₹)<input id="v89LandRate" type="number" min="0" step="any" value="${Number(window.state?.settings?.ratePerBigha)||0}"></label></div><div id="v89LandResults" class="v89-land-output"></div><div class="v89-divider"></div><h3>Length × Width</h3><div class="v89-land-inputs"><label>Length (ft)<input id="v89Length" type="number" min="0" step="any" placeholder="Length"></label><label>Width (ft)<input id="v89Width" type="number" min="0" step="any" placeholder="Width"></label></div><div id="v89AreaResult" class="v89-area-result">Enter length and width to calculate area.</div></section>`;page.appendChild(root);}
 [...page.children].forEach(el=>{if(el!==root&&(el.classList.contains('card')||el.querySelector('#calcKeys')||el.querySelector('#calcScreen')||el.querySelector('#calcLand')))el.classList.add('v89-legacy-calc');});if(root.dataset.bound)return;root.dataset.bound='1';let expr='',ans=0,mem=0,rad=false,hist=[];
 const result=$('v89Result'),exprEl=$('v89Expr');const show=(v)=>{result.textContent=String(v);};
 function safeEval(raw){let x=raw.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/g,'Math.PI').replace(/\be\b/g,'Math.E').replace(/\^/g,'**').replace(/√\(/g,'Math.sqrt(').replace(/√(\d+(?:\.\d+)?)/g,'Math.sqrt($1)').replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');if(/[a-z]/i.test(x.replace(/Math/g,'').replace(/sin|cos|tan|log|ln|sqrt|abs|PI|E/g,'')))throw Error('Check expression');if(!/^[0-9+*/().\-\sA-Za-z_*]+$/.test(x))throw Error('Invalid input');x=x.replace(/(\d+(?:\.\d+)?)!/g,'fact($1)').replace(/\b(sin|cos|tan)\(/g,(_,f)=>`trig_${f}(`).replace(/\blog\(/g,'Math.log10(').replace(/\bln\(/g,'Math.log(');const fact=n=>{n=Number(n);if(n<0||n>170||!Number.isInteger(n))throw Error('Factorial needs integer 0–170');let a=1;for(let i=2;i<=n;i++)a*=i;return a};const trig_sin=x=>Math.sin(rad?x:x*Math.PI/180),trig_cos=x=>Math.cos(rad?x:x*Math.PI/180),trig_tan=x=>Math.tan(rad?x:x*Math.PI/180);return Function('fact','trig_sin','trig_cos','trig_tan',`return (${x})`)(fact,trig_sin,trig_cos,trig_tan);}
 function calculate(){try{const v=safeEval(expr||'0');if(!Number.isFinite(v))throw Error('Invalid result');ans=v;hist.unshift({e:expr||'0',v});hist=hist.slice(0,5);exprEl.textContent=expr||'0';show(Number(v.toPrecision(12)));renderHist();expr='';}catch(e){show('Error');exprEl.textContent=e.message||'Invalid expression';}}
 function renderHist(){$('v89History').innerHTML=hist.length?'<b>Recent calculations</b>'+hist.map((h,i)=>`<button type="button" data-hist="${i}"><span>${esc(h.e)}</span><strong>${esc(h.v)}</strong></button>`).join(''):'';}
 root.addEventListener('click',e=>{const k=e.target.closest('[data-key]');if(k){const v=k.dataset.key;if(v==='AC'){expr='';show('0');exprEl.textContent='Ready'}else if(v==='DEL'){expr=expr.slice(0,-1);show(expr||'0')}else if(v==='=')calculate();else if(v==='±'){expr=expr.startsWith('-')?expr.slice(1):'-('+expr+')';show(expr)}else if(v==='√')expr+='√(';else if(v==='x²')expr+='^2';else if(v==='1/x')expr='1/('+expr+')';else if(v==='π'||v==='e')expr+=v;else if(['sin','cos','tan','log','ln'].includes(v))expr+=v+'(';else expr+=v;exprEl.textContent=expr||'Ready';if(v!=='=')show(expr||'0');return;}const a=e.target.closest('[data-calc-action]');if(a){switch(a.dataset.calcAction){case'angle':rad=!rad;$('v89Angle').textContent=rad?'RAD':'DEG';break;case'memory':mem=Number(result.textContent)||ans;$('v89Mem').textContent='MEM '+mem;break;case'recall':expr+=String(mem);show(expr);break;case'ans':expr+=String(ans);show(expr);break;case'clearHistory':hist=[];renderHist();break;case'copy':navigator.clipboard?.writeText(result.textContent).then(()=>alert('Result copied')).catch(()=>alert('Result: '+result.textContent));break;}return;}const h=e.target.closest('[data-hist]');if(h){const item=hist[+h.dataset.hist];if(item){expr=String(item.v);show(expr);exprEl.textContent=expr;}return;}const ca=e.target.closest('[data-cash-action]');if(ca){if(ca.dataset.cashAction==='reset')root.querySelectorAll('[data-denom]').forEach(i=>i.value='');if(ca.dataset.cashAction==='copy')navigator.clipboard?.writeText(cashSummary()).then(()=>alert('Cash summary copied')).catch(()=>alert(cashSummary()));if(ca.dataset.cashAction==='print'){const w=window.open('','_blank');if(w){w.document.write('<pre>'+esc(cashSummary())+'</pre>');w.document.close();w.print();}}updateCash();return;}});
 root.addEventListener('input',e=>{if(e.target.matches('[data-denom]'))updateCash();if(['v89LandAmount','v89LandUnit','v89LandRate'].includes(e.target.id))updateLand();if(['v89Length','v89Width'].includes(e.target.id))updateArea();});
 function cashSummary(){return 'ASHA Billing — Cash Count\n'+[...root.querySelectorAll('[data-denom]')].map(i=>`₹${i.dataset.denom} × ${Number(i.value)||0} = ₹${(Number(i.dataset.denom)||0)*(Number(i.value)||0)}`).join('\n')+'\nTotal: '+$('v89CashTotal').textContent+'\nPieces: '+$('v89CashPieces').textContent;}
 function updateCash(){let total=0,pieces=0;root.querySelectorAll('[data-denom]').forEach(i=>{const q=Math.max(0,Math.floor(Number(i.value)||0)),sub=q*Number(i.dataset.denom);total+=sub;pieces+=q;const s=root.querySelector(`[data-subtotal="${i.dataset.denom}"]`);if(s)s.textContent=sub.toLocaleString('en-IN');});$('v89CashTotal').textContent=fmt(total);$('v89CashPieces').textContent=pieces.toLocaleString('en-IN');}
 function updateLand(){const n=Math.max(0,Number($('v89LandAmount').value)||0),u=$('v89LandUnit').value,rate=Math.max(0,Number($('v89LandRate').value)||0);let sqft=n*({'bigha':40*435.6,'katha':2*435.6,'decimal':435.6,'acre':43560,'sqft':1,'sqm':10.7639104167}[u]||1);const decimal=sqft/435.6,bigha=decimal/40,katha=decimal/2;$('v89LandResults').innerHTML=[['Bigha',bigha.toFixed(4)],['Katha',katha.toFixed(4)],['Decimal',decimal.toFixed(4)],['Square feet',sqft.toLocaleString('en-IN',{maximumFractionDigits:2})],['Square metre',(sqft/10.7639104167).toFixed(2)],['Estimated amount',fmt(bigha*rate)]].map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('');}
 function updateArea(){const l=Number($('v89Length').value)||0,w=Number($('v89Width').value)||0,s=l*w; $('v89AreaResult').textContent=(l&&w)?`${s.toLocaleString('en-IN',{maximumFractionDigits:2})} sq ft  ·  ${(s/435.6).toFixed(3)} decimal  ·  ₹ area is not priced here.`:'Enter length and width to calculate area.';}
 updateCash();updateLand();updateArea();window.setupCalc=setupCalculator;try{setupCalc=setupCalculator}catch(_){}
}
function polishPay(){const page=$('payPage');if(!page)return;const card=page.querySelector('.card');if(card&&!$('v89PayHero')){const hero=document.createElement('section');hero.id='v89PayHero';hero.className='v89-pay-hero';hero.innerHTML='<div><span>PAYMENT DESK</span><h2>Payment & Settlement</h2><p>Cash received and balance adjustments are tracked separately.</p></div><div class="v89-pay-legend"><span><i class="cash"></i>Cash / online received</span><span><i class="settle"></i>Settled / waived</span></div>';card.insertBefore(hero,card.firstChild);const h=card.querySelector('h2');if(h&&h!==hero.querySelector('h2'))h.style.display='none';}
 const amount=$('payAmount');if(amount){amount.min='0.01';amount.step='0.01';amount.inputMode='decimal';}
 const info=$('payInfo');if(info&&!$('v89PaySummary')){const summary=document.createElement('div');summary.id='v89PaySummary';summary.className='v89-pay-summary';info.insertAdjacentElement('afterend',summary);}
 function refresh(){const bill=(window.state?.bills||[]).find(b=>String(b.id)===String($('payBill')?.value));const target=$('v89PaySummary');if(!target)return;if(!bill){target.innerHTML='<p>Select a bill to view its payment summary.</p>';return;}const total=Number(bill.allTotal)||0;let cash=0,settled=0;(bill.payments||[]).forEach(p=>{if(isSettlement(p))settled+=Number(p.amount)||0;else cash+=Number(p.amount)||0;});const due=Math.max(0,total-cash-settled),pct=total?Math.min(100,(cash+settled)/total*100):100;target.innerHTML=`<div class="v89-pay-bill-head"><div><small>SELECTED BILL</small><b>${esc(bill.billNo||'Bill')}</b><span>${esc(bill.customerName||'Customer')} · ${esc(bill.date||'')}</span></div><strong>${fmt(due)}<small>remaining due</small></strong></div><div class="v89-pay-progress"><i style="width:${pct}%"></i></div><div class="v89-pay-stats"><div><small>Total bill</small><b>${fmt(total)}</b></div><div><small>Cash collected</small><b>${fmt(cash)}</b></div><div><small>Settled / adjusted</small><b>${fmt(settled)}</b></div></div><h3>Recent payment entries</h3>${(bill.payments||[]).slice().reverse().slice(0,6).map(p=>`<div class="v89-pay-entry"><span><b>${esc(p.mode||'Payment')}</b><small>${esc(p.date||'')} · ${esc(p.receivedIn||'')}${p.note?' · '+esc(p.note):''}</small></span><strong class="${isSettlement(p)?'settlement':''}">${fmt(p.amount)}</strong></div>`).join('')||'<p>No payment entries yet.</p>'}`;}
 if($('payBill')&&!$('payBill').dataset.v89Bound){$('payBill').dataset.v89Bound='1';$('payBill').addEventListener('change',refresh);const old=window.updatePayInfo;if(typeof old==='function'){window.updatePayInfo=function(){old.apply(this,arguments);refresh();};try{updatePayInfo=window.updatePayInfo}catch(_){}}}refresh();}
function init(){setupCalculator();polishPay();patchDashboard();const old=window.renderDash;if(typeof old==='function'&&!old.__v89){const wrapped=function(){old.apply(this,arguments);patchDashboard();};wrapped.__v89=true;window.renderDash=wrapped;try{renderDash=wrapped}catch(_){}}const oldShow=window.showPage;if(typeof oldShow==='function'&&!oldShow.__v89){const wrapped=function(id){oldShow.apply(this,arguments);if(id==='calcPage')setupCalculator();if(id==='payPage')polishPay();patchDashboard();};wrapped.__v89=true;window.showPage=wrapped;try{showPage=wrapped}catch(_){}}}
const css=document.createElement('style');css.textContent=`
#calcPage #v89CalculatorStudio{display:grid;gap:15px;margin-top:12px}#calcPage .v89-legacy-calc{display:none!important}.v89-tool-card{border:1px solid #e0e9e2;border-radius:26px;padding:clamp(15px,4vw,23px);background:linear-gradient(155deg,#fff,#f7faf8);box-shadow:0 12px 32px #173c250b;overflow:hidden}.v89-tool-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:15px}.v89-tool-head h2{font-size:22px;letter-spacing:-.7px;color:#193d29;margin:4px 0}.v89-tool-head p{font-size:12px;color:#78877d;margin:0;line-height:1.5}.v89-eyebrow{font-size:9px;font-weight:900;letter-spacing:1.6px;color:#118254}.v89-chip{font-size:9px;font-weight:900;letter-spacing:.8px;color:#087b50;background:#e5f5e9;padding:8px 10px;border-radius:11px;white-space:nowrap}.v89-display{background:linear-gradient(145deg,#dfead8,#c9dbc4);border:1px solid #b8cbb2;border-radius:19px;padding:13px 15px;margin-bottom:10px;min-width:0}.v89-display-meta{display:flex;justify-content:space-between;font-size:9px;font-weight:900;color:#48644a}.v89-expr{text-align:right;min-height:17px;margin-top:7px;color:#60745d;font:11px ui-monospace,monospace;overflow-wrap:anywhere}.v89-display output{display:block;text-align:right;font:500 clamp(28px,8vw,40px)/1.3 ui-monospace,monospace;color:#1b3520;overflow-x:auto;white-space:nowrap;min-height:48px}.v89-calc-tools{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin-bottom:9px}.v89-calc-tools button{min-height:35px;border:1px solid #dce8df;border-radius:10px;background:#f2f7f3;color:#326044;font-size:9px;font-weight:850}.v89-keypad{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.v89-keypad button{min-width:0;min-height:47px;border:1px solid #e1e8e2;border-radius:13px;background:linear-gradient(#fff,#f5f7f5);color:#24422f;font-size:14px;font-weight:750;touch-action:manipulation}.v89-keypad button.function{background:#eaf4ec;color:#43674e;font-size:11px}.v89-keypad button.operator{background:#dff3e5;color:#087b50;font-size:17px}.v89-keypad button.danger{background:#fff0ed;color:#b42318}.v89-keypad button.equals{background:linear-gradient(135deg,#087b50,#19a66c);color:#fff;font-size:19px}.v89-tool-foot,.v89-action-row{display:flex;align-items:center;gap:8px;justify-content:space-between;margin-top:12px;flex-wrap:wrap}.v89-tool-foot span{font-size:10px;color:#849087}.v89-tool-foot button,.v89-action-row button{border:1px solid #dce8df;border-radius:12px;padding:10px 12px;background:#edf5ef;color:#28563a;font-size:11px;font-weight:850}.v89-action-row button.primary{background:#087b50;color:#fff;border-color:#087b50}.v89-history{display:grid;gap:6px;margin-top:12px}.v89-history>b{font-size:12px;color:#35543d}.v89-history button{display:flex;justify-content:space-between;gap:10px;text-align:left;padding:10px;border:1px solid #e3ebe4;background:#fff;border-radius:12px;color:#486451;font-size:11px}.v89-history button span{overflow-wrap:anywhere}.v89-denominations{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v89-denominations label{display:grid;gap:6px;min-width:0;padding:10px;border:1px solid #e2eae4;border-radius:15px;background:#fff}.v89-denominations label>span{font-size:16px;font-weight:900;color:#1f5435}.v89-denominations input,.v89-land-inputs input,.v89-land-inputs select{width:100%;box-sizing:border-box;min-width:0;border:1px solid #dce7df;border-radius:10px;background:#f9fbf9;padding:10px;font-size:15px;color:#254832}.v89-denominations small{font-size:9px;color:#7c8a80}.v89-denominations small b{color:#2b5d3c}.v89-cash-summary{display:grid;grid-template-columns:1.3fr 1fr;gap:8px;margin-top:12px}.v89-cash-summary>div{display:grid;gap:5px;padding:13px;border-radius:15px;background:#eaf7ed;border:1px solid #d8ecdd}.v89-cash-summary small{font-size:10px;color:#678271}.v89-cash-summary strong{font-size:clamp(18px,5vw,25px);color:#087b50;overflow-wrap:anywhere}.v89-land-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:11px}.v89-land-inputs label{display:grid;gap:6px;font-size:11px;font-weight:800;color:#617568;min-width:0}.v89-land-inputs label:last-child:nth-child(odd){grid-column:1/-1}.v89-land-output{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v89-land-output>div{display:grid;gap:5px;padding:12px;border:1px solid #e3ebe5;border-radius:13px;background:#fff;min-width:0}.v89-land-output small{font-size:10px;color:#78877d}.v89-land-output b{font-size:15px;color:#214c31;overflow-wrap:anywhere}.v89-divider{height:1px;background:#e6ede7;margin:18px 0}.v89-tool-card h3{font-size:14px;color:#244c32;margin:0 0 10px}.v89-area-result{padding:12px;border-radius:13px;background:#edf7ef;color:#25583a;font-size:12px;font-weight:800;line-height:1.5}.v89-metric{position:relative}.v89-metric em{font-style:normal;font-size:9px;color:#8a6a27;margin-top:4px}.v89-settled b{color:#94650a!important}.v89-cash b{color:#087b50!important}
.v89-pay-hero{padding:17px;border-radius:20px;background:linear-gradient(135deg,#eaf7ee,#fff);border:1px solid #d8ebde;margin-bottom:15px}.v89-pay-hero>div:first-child>span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#118254}.v89-pay-hero h2{font-size:23px;letter-spacing:-.7px;color:#193d29;margin:5px 0}.v89-pay-hero p{font-size:12px;color:#718177;margin:0;line-height:1.5}.v89-pay-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:13px}.v89-pay-legend span{display:flex;align-items:center;gap:6px;font-size:10px;color:#5d7364}.v89-pay-legend i{width:8px;height:8px;border-radius:50%;background:#15945f}.v89-pay-legend i.settle{background:#d19a2a}.v89-pay-summary{margin-top:13px;padding:14px;border:1px solid #e0e9e2;border-radius:19px;background:#f9fcfa}.v89-pay-bill-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v89-pay-bill-head>div{display:grid;gap:4px;min-width:0}.v89-pay-bill-head small{font-size:9px;color:#839087;font-weight:800}.v89-pay-bill-head b{font-size:15px;color:#234832}.v89-pay-bill-head span{font-size:10px;color:#78877d;overflow-wrap:anywhere}.v89-pay-bill-head>strong{font-size:20px;color:#a45316;text-align:right;white-space:nowrap}.v89-pay-bill-head>strong small{display:block;font-size:9px;font-weight:600}.v89-pay-progress{height:7px;border-radius:20px;background:#e5ece6;overflow:hidden;margin:13px 0}.v89-pay-progress i{display:block;height:100%;background:linear-gradient(90deg,#087b50,#43bd7b);border-radius:20px}.v89-pay-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.v89-pay-stats>div{padding:9px;border:1px solid #e6ece7;border-radius:12px;background:#fff;display:grid;gap:5px;min-width:0}.v89-pay-stats small{font-size:9px;color:#7d8a80}.v89-pay-stats b{font-size:12px;color:#2a4e36;overflow-wrap:anywhere}.v89-pay-summary h3{margin-top:15px}.v89-pay-entry{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #e8eee9}.v89-pay-entry span{display:grid;gap:4px;min-width:0}.v89-pay-entry b{font-size:11px;color:#35523e}.v89-pay-entry small{font-size:9px;color:#849087;line-height:1.5;overflow-wrap:anywhere}.v89-pay-entry strong{font-size:12px;color:#087b50;white-space:nowrap}.v89-pay-entry strong.settlement{color:#a16a09}
@media(max-width:390px){.v89-keypad{gap:5px}.v89-keypad button{min-height:43px;border-radius:11px;font-size:12px}.v89-calc-tools{gap:4px}.v89-calc-tools button{font-size:8px}.v89-denominations{gap:6px}.v89-denominations label{padding:8px}.v89-pay-stats{gap:5px}.v89-pay-stats>div{padding:8px}.v89-pay-stats b{font-size:10px}}`;document.head.appendChild(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.ashaAuditV89=()=>({calculatorStudio:!!$('v89CalculatorStudio'),paySummary:!!$('v89PaySummary'),settlementMetric:!!document.querySelector('.v89-settled'),build:'V89 Payment + Calculator Studio'});
})();
/* ASHA Billing V90 — reliable state access, settlement dashboard, advanced pay desk */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const data=()=>{try{if(typeof state!=='undefined'&&state)return state}catch(_){}return window.state||{bills:[],customers:[],settings:{}}};
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isSettle=p=>/settle|adjust|waiv/i.test(String(p?.mode||'')+' '+String(p?.receivedIn||'')+' '+String(p?.note||''));
function sums(bills){let billed=0,collected=0,settled=0,due=0;for(const b of bills){const total=Number(b.allTotal)||0;billed+=total;let cash=0,adj=0;for(const p of b.payments||[]){const a=Math.max(0,Number(p.amount)||0);if(isSettle(p))adj+=a;else cash+=a;}collected+=cash;settled+=adj;due+=Math.max(0,total-cash-adj);}return{billed,collected,settled,due};}
function dashboard(){const s=data(),month=$('homeMonth')?.value||'',village=$('homeVillage')?.value||'all';const bills=(s.bills||[]).filter(b=>(!month||String(b.date||'').startsWith(month))&&(village==='all'||String(b.village||'')===village));const t=sums(bills);let openingDue=0,openingSettle=0,openingCash=0;for(const c of s.customers||[]){openingDue+=Math.max(0,Number(c.openingDue)||0);for(const h of c.openingDueHistory||[]){const a=Math.max(0,Number(h.amount)||0);if(/settle|adjust|waiv/i.test(String(h.type||'')+' '+String(h.mode||'')))openingSettle+=a;else if(h.type==='payment')openingCash+=a;}}
const dueCustomers=typeof window.customerDue==='function'? (s.customers||[]).reduce((n,c)=>n+Math.max(0,Number(window.customerDue(c.id))||0),0):t.due+openingDue-openingCash-openingSettle;
const root=$('metrics');if(!root)return;const items=[['▤','Total Bill',money(t.billed),'billed'],['↙','Cash Collected',money(t.collected+openingCash),'cash'],['✓','Settled / Adjusted',money(t.settled+openingSettle),'settled'],['!','Outstanding Due',money(dueCustomers),'due'],['♙','Customers',(s.customers||[]).length,'users']];root.innerHTML=items.map(([i,l,v,k])=>`<div class="metric v90-metric v90-${k}"><small><span class="metric-icon">${i}</span><span>${l}</span></small><b>${v}</b>${k==='settled'?'<em>Adjusted / waived · not cash</em>':''}</div>`).join('');}
function payDesk(){const page=$('payPage');if(!page)return;const card=page.querySelector('.card');if(card&&!$('v90PayHero')){const hero=document.createElement('section');hero.id='v90PayHero';hero.className='v90-pay-hero';hero.innerHTML='<div class="v90-pay-title"><span>ASHA FINANCE · PAYMENT DESK</span><h2>Payments & Settlements</h2><p>Record actual collections separately from waived or adjusted balances.</p></div><div class="v90-pay-kpis" id="v90PayKpis"></div><div class="v90-pay-legend"><span><i></i>Received cash / digital payment</span><span><i class="adjust"></i>Settled / adjusted amount</span></div>';card.insertBefore(hero,card.firstChild);const h=card.querySelector(':scope > h2');if(h)h.style.display='none';}
const billSelect=$('payBill'),info=$('payInfo');if(!billSelect)return;
if(info&&!$('v90PaySummary'))info.insertAdjacentHTML('afterend','<section id="v90PaySummary" class="v90-pay-summary"></section>');
const kpis=$('v90PayKpis');if(kpis){const all=sums(data().bills||[]);kpis.innerHTML=[['Collected',all.collected,''],['Settled',all.settled,'adjust'],['Pending',all.due,'due']].map(([l,v,c])=>`<div class="v90-kpi ${c}"><small>${l}</small><b>${money(v)}</b></div>`).join('');}
function refresh(){const s=data(),b=(s.bills||[]).find(x=>String(x.id)===String(billSelect.value)),target=$('v90PaySummary');if(!target)return;if(!b){target.innerHTML='<div class="v90-empty"><b>Select a bill</b></div>';return;}let cash=0,settled=0;for(const p of b.payments||[]){const a=Number(p.amount)||0;if(isSettle(p))settled+=a;else cash+=a;}const total=Number(b.allTotal)||0,due=Math.max(0,total-cash-settled);target.innerHTML=`<div class="v90-selected-head"><div><small>SELECTED ACCOUNT</small><h3>${esc(b.customerName||'Customer')}</h3><span>${esc(b.billNo||'Bill')} · ${esc(b.date||'')}</span></div><div class="v90-due-pill"><small>REMAINING DUE</small><b>${money(due)}</b></div></div><div class="v90-breakdown"><div><small>Total bill</small><b>${money(total)}</b></div><div><small>Cash received</small><b>${money(cash)}</b></div><div class="adjust"><small>Settled / adjusted</small><b>${money(settled)}</b></div><div class="due"><small>Balance due</small><b>${money(due)}</b></div></div><div class="v90-history-head"><h3>Payment timeline</h3><span>${(b.payments||[]).length} entries</span></div>${(b.payments||[]).slice().reverse().map(p=>`<article class="v90-payment-row"><span class="v90-payment-icon ${isSettle(p)?'adjust':''}">${isSettle(p)?'±':'₹'}</span><span class="v90-payment-copy"><b>${esc(p.mode||'Payment')}</b><small>${esc(p.date||'Date not set')} · ${esc(p.receivedIn||'')} ${p.note?'· '+esc(p.note):''}</small></span><strong class="${isSettle(p)?'adjust':''}">${isSettle(p)?'−':'+'}${money(p.amount)}</strong></article>`).join('')||'<p class="v90-emptyline">No payment entries for this bill yet.</p>'}`;}
if(!billSelect.dataset.v90PayBound){billSelect.dataset.v90PayBound='1';billSelect.addEventListener('change',refresh);for(const id of ['receiveBtn','settleBtn','fillDueBtn','cashBtn','onlineBtn'])$(id)?.addEventListener('click',()=>setTimeout(()=>{refresh();const all=sums(data().bills||[]);if(kpis)kpis.innerHTML=[['Collected',all.collected,''],['Settled',all.settled,'adjust'],['Pending',all.due,'due']].map(([l,v,c])=>`<div class="v90-kpi ${c}"><small>${l}</small><b>${money(v)}</b></div>`).join('')},120));const old=window.updatePayInfo;if(typeof old==='function'&&!old.__v90){const wrap=function(){old.apply(this,arguments);refresh()};wrap.__v90=true;window.updatePayInfo=wrap;try{updatePayInfo=wrap}catch(_){}}}
refresh();}
function init(){dashboard();payDesk();const oldDash=window.renderDash;if(typeof oldDash==='function'&&!oldDash.__v90){const wrap=function(){oldDash.apply(this,arguments);dashboard()};wrap.__v90=true;window.renderDash=wrap;try{renderDash=wrap}catch(_){}}const oldShow=window.showPage;if(typeof oldShow==='function'&&!oldShow.__v90){const wrap=function(id){oldShow.apply(this,arguments);if(id==='payPage')payDesk();if(id==='calcPage'){setTimeout(()=>{if(typeof window.setupCalc==='function')window.setupCalc()},0)}dashboard()};wrap.__v90=true;window.showPage=wrap;try{showPage=wrap}catch(_){}}for(const id of ['homeMonth','homeVillage'])$(id)?.addEventListener('change',dashboard);for(const id of ['receiveBtn','settleBtn'])$(id)?.addEventListener('click',()=>setTimeout(dashboard,150));}
const css=document.createElement('style');css.id='v90PremiumPayStyles';css.textContent=`
.v90-metric{border-radius:18px!important;position:relative;overflow:hidden}.v90-metric b{font-variant-numeric:tabular-nums}.v90-settled b{color:#a66b09!important}.v90-settled em{display:block;font-style:normal;font-size:9px;color:#8a6a27;margin-top:5px}.v90-cash b{color:#087b50!important}
.v90-pay-hero{padding:17px;border:1px solid #dcebe0;border-radius:23px;background:radial-gradient(circle at 100% 0,#d9f3df 0,transparent 43%),linear-gradient(145deg,#f4fbf5,#fff);margin-bottom:16px}.v90-pay-title>span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#118254}.v90-pay-title h2{font-size:24px;letter-spacing:-.8px;color:#193d29;margin:6px 0}.v90-pay-title p{font-size:12px;line-height:1.55;color:#718177;margin:0}.v90-pay-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:15px}.v90-kpi{display:grid;gap:5px;padding:11px 9px;border:1px solid #e2ebe4;border-radius:15px;background:#fff;min-width:0}.v90-kpi small{font-size:9px;color:#748479}.v90-kpi b{font-size:clamp(12px,3.4vw,17px);color:#087b50;overflow-wrap:anywhere}.v90-kpi.adjust b{color:#a66b09}.v90-kpi.due b{color:#b45309}.v90-pay-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}.v90-pay-legend span{display:flex;align-items:center;gap:6px;font-size:10px;color:#607468}.v90-pay-legend i{width:8px;height:8px;border-radius:50%;background:#13945e}.v90-pay-legend i.adjust{background:#d49b28}
.v90-pay-summary{padding:15px;margin-top:13px;border:1px solid #e0e9e2;border-radius:21px;background:linear-gradient(155deg,#fff,#f8fbf8);box-shadow:0 9px 26px #193d2907}.v90-selected-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.v90-selected-head>div:first-child{min-width:0;display:grid;gap:4px}.v90-selected-head small{font-size:9px;font-weight:850;letter-spacing:.6px;color:#839087}.v90-selected-head h3{font-size:17px;margin:0;color:#244832;overflow-wrap:anywhere}.v90-selected-head span{font-size:10px;color:#7a887f;overflow-wrap:anywhere}.v90-due-pill{padding:9px 11px;border-radius:14px;background:#fff1e6;border:1px solid #f6d7bc;text-align:right;flex-shrink:0;display:grid;gap:4px}.v90-due-pill b{font-size:17px;color:#ad4b0d;white-space:nowrap}.v90-progress{height:7px;border-radius:20px;background:#e5ece6;overflow:hidden;margin:14px 0}.v90-progress i{display:block;height:100%;background:linear-gradient(90deg,#087b50,#50c482);border-radius:20px;transition:width .25s ease}.v90-breakdown{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v90-breakdown>div{display:grid;gap:5px;padding:12px;border:1px solid #e6ece7;border-radius:14px;background:#fff;min-width:0}.v90-breakdown small{font-size:10px;color:#7b8980}.v90-breakdown b{font-size:15px;color:#284b34;overflow-wrap:anywhere}.v90-breakdown .adjust b{color:#a66b09}.v90-breakdown .due b{color:#b45309}.v90-settle-note{padding:10px 11px;margin-top:10px;border-radius:12px;background:#fff8e7;color:#856018;font-size:10px;line-height:1.5}.v90-history-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:18px}.v90-history-head h3{font-size:14px;margin:0;color:#244832}.v90-history-head span{font-size:10px;color:#879188}.v90-payment-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid #e9efea}.v90-payment-icon{width:31px;height:31px;border-radius:11px;background:#e7f6eb;color:#087b50;display:grid;place-items:center;font-weight:900;flex-shrink:0}.v90-payment-icon.adjust{background:#fff3d7;color:#a66b09}.v90-payment-copy{display:grid;gap:4px;min-width:0;flex:1}.v90-payment-copy b{font-size:11px;color:#35523e}.v90-payment-copy small{font-size:9px;line-height:1.5;color:#849087;overflow-wrap:anywhere}.v90-payment-row>strong{font-size:12px;color:#087b50;white-space:nowrap}.v90-payment-row>strong.adjust{color:#a66b09}.v90-empty{display:grid;gap:5px;padding:14px;text-align:center;color:#7b8980;font-size:11px}.v90-empty b{font-size:14px;color:#35523e}.v90-emptyline{font-size:11px;color:#7b8980}
#payPage input,#payPage select{border-radius:13px!important;min-height:44px}#payPage .pay-buttons,#payPage .action-bar{gap:8px}#payPage .action-bar .btn{min-height:45px;border-radius:14px;font-weight:750}#payPage #settleBtn{border:1px solid #e8d39a;background:#fff7df;color:#8d620d}#payPage #receiveBtn{box-shadow:0 6px 15px #087b501c}
@media(max-width:390px){.v90-pay-hero{padding:14px}.v90-pay-kpis{gap:5px}.v90-kpi{padding:9px 7px}.v90-kpi b{font-size:11px}.v90-selected-head{gap:7px}.v90-due-pill{padding:8px}.v90-due-pill b{font-size:14px}.v90-breakdown>div{padding:10px}.v90-breakdown b{font-size:13px}}
`;document.head.appendChild(css);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();window.ashaAuditV90=()=>({build:'V90 Advanced Pay + Settlement Dashboard + Calculator Keyboard',settledMetric:!!document.querySelector('.v90-settled'),paySummary:!!$('v90PaySummary'),calculatorStudio:!!$('v89CalculatorStudio'),stateAvailable:!!data().bills});
})();
/* V90 calculator usability: hardware keyboard support and live rate defaults */
(()=>{const $=id=>document.getElementById(id);function bind(){const root=$('v89CalculatorStudio');if(!root||root.dataset.v90Keyboard)return;root.dataset.v90Keyboard='1';document.addEventListener('keydown',e=>{if(!$('calcPage')?.classList.contains('active'))return;const tag=document.activeElement?.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;let key=e.key,selector=null;if(/^[0-9.]$/.test(key))selector=`[data-key="${key}"]`;else if(key==='+')selector='[data-key="+"]';else if(key==='-')selector='[data-key="−"]';else if(key==='*')selector='[data-key="×"]';else if(key==='/'){key='÷';selector='[data-key="÷"]'}else if(key==='Enter'||key==='='){selector='[data-key="="]'}else if(key==='Backspace'){selector='[data-key="DEL"]'}else if(key==='Escape'){selector='[data-key="AC"]'}else if(key==='('||key===')')selector=`[data-key="${key}"]`;if(selector){const b=root.querySelector(selector);if(b){e.preventDefault();b.click()}}});const rate=$('v89LandRate');try{if(rate&&(!rate.value||Number(rate.value)===0)){const s=typeof state!=='undefined'?state:window.state;const v=Number(s?.settings?.ratePerBigha??s?.settings?.rate??0);if(v>0)rate.value=v;rate.dispatchEvent(new Event('input',{bubbles:true}))}}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();})();

/* ASHA Billing V91 — iOS dashboard, focused pay desk, tool launcher */
(()=>{'use strict';const $=id=>document.getElementById(id);
function upgradeDashboard(){const metrics=$('metrics');if(metrics){const glyph={billed:'▤',cash:'↙',settled:'✓',due:'!',users:'♙'};metrics.querySelectorAll('.metric').forEach(card=>{const cls=[...card.classList].find(c=>/^v90-|^v89-/.test(c)&&!['v90-metric','v89-metric'].includes(c));const key=cls?.replace(/^v9[0-9]-/,'')||'';const icon=card.querySelector('.metric-icon');if(icon){icon.textContent=glyph[key]||'•';icon.setAttribute('aria-hidden','true')} });}
const panel=$('smartPanel');if(panel){panel.classList.add('v91-smart-panel');panel.querySelectorAll('.card').forEach(c=>c.classList.add('v91-smart-card'));panel.querySelectorAll('.research-card').forEach((c,i)=>{c.classList.add('v91-summary-tile');if(!c.querySelector('.v91-summary-icon')){const icon=document.createElement('span');icon.className='v91-summary-icon';icon.textContent=['↗','♙','⌂','▤'][i]||'•';c.prepend(icon)}});panel.querySelectorAll('.village-pills button').forEach(b=>b.classList.add('v91-village-pill'));panel.querySelectorAll('.smart-row').forEach(b=>b.classList.add('v91-smart-row'));}}
function upgradePay(){const page=$('payPage');if(!page)return;page.querySelectorAll('.v90-progress,.v89-pay-progress,.v90-settle-note,.v90-pay-title p,.v90-pay-legend,.v89-pay-legend').forEach(el=>el.style.display='none');const select=$('payBill');if(select){select.setAttribute('aria-label','Select customer bill');select.style.width='100%';const wrap=select.closest('label')||select.parentElement;if(wrap)wrap.classList.add('v91-select-wrap');}const info=$('payInfo');if(info){const label=info.previousElementSibling;if(label&&label.tagName==='LABEL')label.classList.add('v91-field-label')};}
function upgradeCalc(){const root=$('v89CalculatorStudio');if(!root||root.dataset.v91Tools==='1')return;const cards=[...root.querySelectorAll(':scope > .v89-tool-card')];if(cards.length<3)return;const calc=cards.find(c=>c.classList.contains('v89-calculator'))||cards[0],cash=cards.find(c=>c.querySelector('#v89Denoms')),land=cards.find(c=>c.querySelector('#v89LandAmount'));if(!cash||!land)return;root.dataset.v91Tools='1';const launcher=document.createElement('div');launcher.className='v91-tool-launcher';launcher.innerHTML='<button type="button" class="v91-launch-card cash" data-v91-open="cash"><span class="v91-launch-icon">₹</span><span><b>Cash Counter</b><small>Notes · Coins · Total</small></span><i>›</i></button><button type="button" class="v91-launch-card land" data-v91-open="land"><span class="v91-launch-icon">⌖</span><span><b>Land & Rate</b><small>Area · Units · Estimate</small></span><i>›</i></button>';
root.appendChild(launcher);const modal=document.createElement('div');modal.className='v91-tool-modal';modal.id='v91ToolModal';modal.setAttribute('aria-hidden','true');modal.innerHTML='<div class="v91-modal-backdrop" data-v91-close></div><section class="v91-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="v91ModalTitle"><header><div><small>ASHA TOOLKIT</small><h2 id="v91ModalTitle">Tool</h2></div><button type="button" class="v91-modal-close" aria-label="Close" data-v91-close>×</button></header><div class="v91-modal-content"></div></section>';document.body.appendChild(modal);const content=modal.querySelector('.v91-modal-content');function open(which){const card=which==='cash'?cash:land;content.replaceChildren(card);modal.querySelector('#v91ModalTitle').textContent=which==='cash'?'Cash Counter':'Land & Rate Calculator';modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('v91-modal-open');}function close(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('v91-modal-open');root.insertBefore(cash,launcher);root.insertBefore(land,launcher);}launcher.addEventListener('click',e=>{const b=e.target.closest('[data-v91-open]');if(b)open(b.dataset.v91Open)});modal.addEventListener('click',e=>{if(e.target.closest('[data-v91-close]'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close()});root.insertBefore(launcher,calc.nextSibling);root.insertBefore(cash,launcher);root.insertBefore(land,launcher);}
function run(){upgradeDashboard();upgradePay();upgradeCalc();}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,250),{once:true});else setTimeout(run,250);const oldShow=window.showPage;if(typeof oldShow==='function'&&!oldShow.__v91){const wrapped=function(id){oldShow.apply(this,arguments);setTimeout(run,80)};wrapped.__v91=true;window.showPage=wrapped;try{showPage=wrapped}catch(_){}}const oldRender=window.renderDash;if(typeof oldRender==='function'&&!oldRender.__v91){const wrapped=function(){oldRender.apply(this,arguments);upgradeDashboard()};wrapped.__v91=true;window.renderDash=wrapped;try{renderDash=wrapped}catch(_){}}window.ashaAuditV91=()=>({build:'V91 iOS Dashboard + Pay + Calculator Tools',dashboard:!!$('metrics'),smartSummary:!!$('smartPanel'),pay:!!$('payBill'),toolLauncher:!!document.querySelector('.v91-tool-launcher')});
const style=document.createElement('style');style.id='v91PremiumIOS';style.textContent=`
/* iOS dashboard metric cards */
#metrics .metric{border:1px solid rgba(225,231,227,.9)!important;border-radius:23px!important;padding:15px!important;background:linear-gradient(145deg,#fff,#f7faf8)!important;box-shadow:0 7px 24px rgba(28,55,38,.055)!important;min-width:0;transition:transform .18s ease,box-shadow .18s ease}#metrics .metric:active{transform:scale(.985)}#metrics .metric>small{display:flex;align-items:center;gap:9px;font-size:11px!important;font-weight:700;color:#68766d!important;line-height:1.35}#metrics .metric .metric-icon{display:grid;place-items:center;width:35px;height:35px;flex:0 0 35px;border-radius:12px;background:#e8f5ec;color:#087b50;font-size:19px;font-weight:800}#metrics .v90-cash .metric-icon,#metrics .v89-cash .metric-icon{background:#e3f7eb;color:#07844f}#metrics .v90-settled .metric-icon,#metrics .v89-settled .metric-icon{background:#fff4d8;color:#a36a08}#metrics .v90-due .metric-icon,#metrics .v89-due .metric-icon{background:#fff0e8;color:#bd521d}#metrics .metric>b{display:block;font-size:clamp(18px,4.8vw,25px)!important;letter-spacing:-.65px;color:#1c3828!important;margin-top:13px;font-weight:800;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}#metrics .v90-settled>b,#metrics .v89-settled>b{color:#a36a08!important}#metrics .v90-due>b,#metrics .v89-due>b{color:#bd521d!important}#metrics .metric em{font-size:9px;line-height:1.4;color:#8c742f;display:block;margin-top:5px}
/* Business summary / village due */
.v91-smart-panel{display:grid;gap:14px;margin-top:16px}.v91-smart-card{border:1px solid #e3eae5!important;border-radius:26px!important;padding:17px!important;background:linear-gradient(150deg,#fff,#f7faf8)!important;box-shadow:0 10px 30px rgba(25,53,35,.055)!important;overflow:hidden}.v91-smart-card h2,.v91-smart-card h3{letter-spacing:-.45px;color:#1d3b29!important}.v91-smart-card h2{font-size:20px!important;margin:0 0 14px!important}.v91-smart-card h3{font-size:15px!important;margin:17px 0 11px!important}.v91-smart-card .research-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.v91-summary-tile{position:relative;display:flex!important;flex-direction:column;align-items:flex-start;gap:9px;min-width:0;padding:14px!important;border:1px solid #e5ece7!important;border-radius:19px!important;background:linear-gradient(145deg,#fff,#f5faf6)!important;box-shadow:none!important}.v91-summary-icon{width:31px;height:31px;display:grid;place-items:center;border-radius:11px;background:#e4f5e9;color:#087b50;font-weight:900;font-size:16px}.v91-summary-tile>b{font-size:clamp(18px,4.5vw,23px)!important;color:#1d3b29!important;font-variant-numeric:tabular-nums}.v91-summary-tile>small{font-size:10px!important;color:#728077!important;line-height:1.4}.v91-smart-card .village-pills{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v91-village-pill{min-width:0!important;display:flex!important;align-items:center;justify-content:space-between;gap:8px;padding:12px!important;border:1px solid #e2ebe4!important;border-radius:15px!important;background:#f7fbf8!important;color:#315640!important;font-size:11px!important;font-weight:750!important;text-align:left;overflow-wrap:anywhere}.v91-smart-row{display:flex!important;align-items:center;gap:10px;padding:12px 2px!important;border-bottom:1px solid #edf1ee}.v91-smart-row:last-child{border-bottom:0}.v91-smart-row .left{min-width:0;flex:1}.v91-smart-row .left b{font-size:12px;color:#294b35}.v91-smart-row .left small{font-size:10px;line-height:1.5;color:#839087}.v91-smart-row .small-danger{padding:7px 9px;border-radius:11px;background:#fff0e8;color:#b94e1c;font-size:11px;white-space:nowrap}
/* Pay select and concise layout */
#payPage .card{border:1px solid #e1e9e3!important;border-radius:26px!important;background:linear-gradient(155deg,#fff,#f8fbf8)!important;box-shadow:0 10px 28px rgba(20,50,30,.055)!important;padding:16px!important}#payPage #payBill{appearance:none;-webkit-appearance:none;width:100%;min-height:52px!important;border:1px solid #dce8df!important;border-radius:16px!important;padding:0 44px 0 14px!important;background:#f6faf7!important;color:#203f2b!important;font-size:14px!important;font-weight:700!important;box-shadow:inset 0 1px 2px #102b1905;outline:none}#payPage #payBill:focus{border-color:#68b88b!important;box-shadow:0 0 0 4px #16834d15!important}#payPage label{font-size:11px!important;font-weight:750!important;color:#64756a!important}#payPage .v90-pay-title>span{font-size:9px;letter-spacing:1.3px;font-weight:900;color:#108052}#payPage .v90-pay-title h2{font-size:22px!important;letter-spacing:-.65px;margin:4px 0 0!important}#payPage .v90-pay-kpis{margin-top:12px!important}#payPage .v90-kpi{border-radius:16px!important;background:#f8fbf9!important;padding:12px 9px!important}#payPage .v90-pay-summary{margin-top:12px!important;border-radius:22px!important}#payPage .v90-breakdown>div{border-radius:16px!important;background:#f9fbf9!important}#payPage .v90-selected-head{align-items:center}#payPage .v90-due-pill{border-radius:16px!important}
/* Calculator: tool launch buttons + modal sheets */
#calcPage #v89CalculatorStudio{gap:13px!important}#calcPage #v89CalculatorStudio>.v89-tool-card:not(.v89-calculator){display:none!important}.v91-tool-launcher{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 4px}.v91-launch-card{display:flex;align-items:center;gap:10px;min-width:0;text-align:left;padding:13px 11px;border:1px solid #e0e9e3;border-radius:21px;background:linear-gradient(145deg,#fff,#f5faf6);box-shadow:0 8px 22px rgba(20,50,30,.06);color:#23442f;touch-action:manipulation}.v91-launch-card:active{transform:scale(.98)}.v91-launch-icon{display:grid;place-items:center;width:43px;height:43px;flex:0 0 43px;border-radius:15px;background:linear-gradient(145deg,#dcf6e5,#c9ecd5);color:#087b50;font-size:22px;font-weight:900}.v91-launch-card.land .v91-launch-icon{background:linear-gradient(145deg,#fff1d6,#f8dfaa);color:#98630b}.v91-launch-card>span:nth-child(2){display:grid;gap:5px;min-width:0;flex:1}.v91-launch-card b{font-size:11px;line-height:1.3}.v91-launch-card small{font-size:9px;line-height:1.3;color:#7b897f}.v91-launch-card>i{font-size:23px;color:#92a198;font-style:normal}.v91-tool-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:flex-end;justify-content:center}.v91-tool-modal.open{display:flex}.v91-modal-backdrop{position:absolute;inset:0;background:rgba(13,28,18,.45);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}.v91-modal-sheet{position:relative;width:min(100%,620px);max-height:88dvh;overflow:auto;padding:18px 15px calc(20px + env(safe-area-inset-bottom));border-radius:28px 28px 0 0;background:#f6f9f7;box-shadow:0 -12px 50px #102d1b25;animation:v91SheetIn .22s ease-out}.v91-modal-sheet>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 2px 14px}.v91-modal-sheet header small{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#108052}.v91-modal-sheet header h2{font-size:21px;letter-spacing:-.5px;color:#1e3e2a;margin:4px 0 0}.v91-modal-close{width:39px;height:39px;border:0;border-radius:50%;background:#e8eee9;color:#385442;font-size:25px;line-height:1}.v91-modal-content .v89-tool-card{margin:0!important;box-shadow:none!important;border-radius:23px!important;padding:14px!important}.v91-modal-content .v89-tool-head p{display:none!important}.v91-modal-open{overflow:hidden!important}@keyframes v91SheetIn{from{transform:translateY(28px);opacity:.6}to{transform:translateY(0);opacity:1}}@media(max-width:370px){.v91-launch-card{padding:10px 8px;gap:7px}.v91-launch-icon{width:36px;height:36px;flex-basis:36px;border-radius:12px}.v91-launch-card b{font-size:10px}.v91-smart-card .village-pills{grid-template-columns:1fr}}
`;document.head.appendChild(style);
})();

/* ASHA Billing V92 — compact iOS payment actions + functional due receipt */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const paths={receive:'<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 16v4h14v-4"/>',settle:'<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'};
const labels={receive:['Receive Payment','Record payment'],settle:['Settle Amount','Adjust balance'],receipt:['Due Receipt','Print / share due']};
function icon(key){return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[key]}</svg>`}
function setup(){const page=$('payPage');if(!page)return;const actions=[['receiveBtn','receive'],['settleBtn','settle'],['dueReceiptBtn','receipt']];actions.forEach(([id,key])=>{const b=$(id);if(!b)return;b.type='button';b.classList.add('v92-pay-action',`v92-${key}`);b.innerHTML=`<span class="v92-pay-action-icon">${icon(key)}</span><span class="v92-pay-action-copy"><b>${labels[key][0]}</b><small>${labels[key][1]}</small></span>`;});
// Bind a dedicated receipt action; it never modifies or saves the original bill.
const receipt=$('dueReceiptBtn');if(receipt&&!receipt.dataset.v92Bound){receipt.dataset.v92Bound='1';receipt.onclick=()=>{const s=(window.state||(typeof state!=='undefined'?state:null));const select=$('payBill');const bill=(s?.bills||[]).find(x=>String(x.id)===String(select?.value));if(!bill){alert('Select a bill first.');return;}const paid=typeof window.billPaid==='function'?Number(window.billPaid(bill)):(bill.payments||[]).reduce((n,p)=>n+(Number(p.amount)||0),0);const total=Number(bill.allTotal)||0;const due=Math.max(0,Math.round((total-paid)*100)/100);if(due<=0){alert('This bill has no outstanding due.');return;}const receiptBill={...bill,id:`due-receipt-${bill.id}-${Date.now()}`,billNo:`${bill.billNo||'BILL'}-DUE`,date:typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10),payments:[],current:0,previousDue:due,allTotal:due,note:`DUE RECEIPT · Original bill ${bill.billNo||''} · Outstanding amount only`};window.currentBill=receiptBill;try{currentBill=receiptBill}catch(_){}if(typeof window.showPage==='function')window.showPage('billPage');if(typeof window.renderInvoice==='function')window.renderInvoice(receiptBill);else if(typeof renderInvoice==='function')renderInvoice(receiptBill);else alert('Receipt view is unavailable. Please refresh the app and try again.');};}
const info=$('payInfo');if(info){const oldText=info.textContent||'';if(/select bill/i.test(oldText))info.textContent='Select a bill';}
}
const css=document.createElement('style');css.id='v92PremiumPayActions';css.textContent=`
#payPage .v92-pay-action{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;min-height:66px!important;padding:10px 12px!important;flex:1 1 0!important;min-width:0!important;border:1px solid #e0e9e3!important;border-radius:19px!important;background:linear-gradient(150deg,#fff,#f6faf7)!important;color:#244632!important;box-shadow:0 5px 16px rgba(20,50,30,.055)!important;text-align:left!important;white-space:normal!important;}
#payPage .v92-pay-action:active{transform:scale(.98)}#payPage .v92-pay-action-icon{width:39px;height:39px;flex:0 0 39px;display:grid;place-items:center;border-radius:14px;background:#e4f5e9;color:#087b50}#payPage .v92-pay-action-icon svg{width:21px;height:21px}#payPage .v92-pay-action-copy{display:grid;gap:4px;min-width:0}#payPage .v92-pay-action-copy b{font-size:11px;line-height:1.25;font-weight:800}#payPage .v92-pay-action-copy small{font-size:9px;line-height:1.2;color:#849087;font-weight:600}#payPage .v92-settle .v92-pay-action-icon{background:#fff2d4;color:#a36b08}#payPage .v92-receipt .v92-pay-action-icon{background:#e8efff;color:#315fb3}#payPage .v92-receipt{border-color:#dce5fb!important}#payPage .v90-progress,#payPage .v89-pay-progress,#payPage .v90-settle-note{display:none!important}#payPage .v90-empty span{display:none!important}#payPage .action-bar:has(.v92-pay-action){display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important}#payPage .v90-pay-summary{padding:13px!important}#payPage .v90-history-head{margin-top:14px!important}
@media(max-width:390px){#payPage .v92-pay-action{flex-direction:column!important;align-items:flex-start!important;gap:7px!important;padding:10px!important;min-height:82px!important;border-radius:17px!important}#payPage .v92-pay-action-icon{width:34px;height:34px;flex-basis:34px;border-radius:12px}#payPage .v92-pay-action-copy b{font-size:10px}#payPage .v92-pay-action-copy small{font-size:8px}}@media(prefers-reduced-motion:reduce){#payPage .v92-pay-action{transition:none!important}}
`;document.head.appendChild(css);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,120),{once:true});else setTimeout(setup,120);const old=window.showPage;if(typeof old==='function'&&!old.__v92){const wrap=function(id){old.apply(this,arguments);if(id==='payPage')setTimeout(setup,100)};wrap.__v92=true;window.showPage=wrap;try{showPage=wrap}catch(_){}}window.ashaAuditV92=()=>({build:'V92 Premium Pay Actions + Due Receipt',receiveButton:!!$('receiveBtn'),settleButton:!!$('settleBtn'),dueReceipt:!!$('dueReceiptBtn'),receiptActionBound:!!$('dueReceiptBtn')?.dataset.v92Bound,progressHidden:!!document.querySelector('#payPage .v90-progress[style*="display: none"]')});})();
/* ASHA Billing V93 — premium finance dashboard + functional history centre */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const st=()=>window.state||(typeof state!=='undefined'?state:null);
const payments=b=>Array.isArray(b?.payments)?b.payments:[];
const isSettle=p=>/settle|adjust|write.?off/i.test(`${p?.mode||''} ${p?.receivedIn||''} ${p?.type||''}`);
const paid=b=>payments(b).reduce((s,p)=>s+(Number(p.amount)||0),0);
const settled=b=>payments(b).reduce((s,p)=>s+(isSettle(p)?Number(p.amount)||0:0),0);
const collected=b=>payments(b).reduce((s,p)=>s+(!isSettle(p)?Number(p.amount)||0:0),0);
const due=b=>typeof window.billDue==='function'?Math.max(0,Number(window.billDue(b))||0):Math.max(0,(Number(b?.allTotal)||0)-paid(b));
const svg=(name)=>({bill:'<path d="M6 3.5h8l4 4V21H6zM14 3.5v4h4M9 12h6M9 15.5h6"/>',cash:'<path d="M4 7h16v12H4zM4 10H2V5h16v2M8 13h.01M12 13h4"/><circle cx="15" cy="13" r="2"/>',settle:'<circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/>',due:'<path d="M12 3 22 20H2zM12 9v5M12 17h.01"/>'})[name]||'';
function dashboard(){const s=st();if(!s||!Array.isArray(s.bills))return;const metrics=$('metrics');if(!metrics)return;const month=$('homeMonth')?.value||'',village=$('homeVillage')?.value||'all';const bills=s.bills.filter(b=>(!month||String(b.date||'').startsWith(month))&&(village==='all'||String(b.village||'')===village));const total=bills.reduce((n,b)=>n+(Number(b.allTotal)||0),0),cash=bills.reduce((n,b)=>n+collected(b),0),settle=bills.reduce((n,b)=>n+settled(b),0);let outstanding=bills.reduce((n,b)=>n+due(b),0);if(!month){outstanding+=(s.customers||[]).filter(c=>village==='all'||String(c.village||'')===village).reduce((n,c)=>n+(Number(c.openingDue)||0),0)}
const cards=[['bill','Total Bill',total,'v93-total'],['cash','Cash Collected',cash,'v93-cash'],['settle','Settled / Adjusted',settle,'v93-settled'],['due','Outstanding Due',outstanding,'v93-due']];metrics.innerHTML=cards.map(([ico,label,value,cls])=>`<article class="metric ${cls}"><small><span class="metric-icon">${svg(ico)}</span><span>${label}</span></small><b>${money(value)}</b></article>`).join('');
const panel=$('smartPanel');if(panel){panel.classList.add('v93-smart-panel');panel.querySelectorAll('.card').forEach(c=>c.classList.add('v93-smart-card'));panel.querySelectorAll('.research-card').forEach((c,i)=>{c.classList.add('v93-summary-tile');let icon=c.querySelector('.v93-summary-icon');if(!icon){icon=document.createElement('span');icon.className='v93-summary-icon';icon.textContent=['↗','♙','⌂','▤'][i]||'•';c.prepend(icon)}});panel.querySelectorAll('.village-pills button').forEach(b=>b.classList.add('v93-village-pill'));panel.querySelectorAll('.smart-row').forEach(b=>b.classList.add('v93-smart-row'));}
}
function ensureHistoryUI(){const page=$('historyPage');if(!page)return;let box=$('v93HistoryTools');if(box)return;const head=page.querySelector('.card');if(!head)return;head.querySelector('h2')&&(head.querySelector('h2').textContent='History Centre');const sub=head.querySelector('p');if(sub)sub.textContent='Bills, collections and settlement activity';box=document.createElement('div');box.id='v93HistoryTools';box.className='v93-history-tools';box.innerHTML=`<label class="v93-history-search"><span>⌕</span><input id="v93HistorySearch" type="search" placeholder="Search bill, customer, phone, village…" autocomplete="off"></label><div class="v93-history-filter-row"><label><small>Month</small><input id="v93HistoryMonth" type="month"></label><label><small>Activity</small><select id="v93HistoryType"><option value="all">All activity</option><option value="bills">Bills only</option><option value="payments">Payments</option><option value="settlements">Settlements</option><option value="due">Bills with due</option><option value="paid">Fully settled</option></select></label></div><div id="v93HistorySummary" class="v93-history-summary"></div>`;head.appendChild(box);['v93HistorySearch','v93HistoryMonth','v93HistoryType'].forEach(id=>$(id)?.addEventListener('input',()=>history(true)));}
function history(preserve=true){const s=st(),list=$('historyList');if(!s||!Array.isArray(s.bills)||!list)return;ensureHistoryUI();const q=($('v93HistorySearch')?.value||'').trim().toLowerCase(),month=$('v93HistoryMonth')?.value||'',type=$('v93HistoryType')?.value||'all';const custById=id=>(s.customers||[]).find(c=>String(c.id)===String(id));let bills=s.bills.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
bills=bills.filter(b=>{const c=custById(b.customerId),ps=payments(b),st=settled(b),d=due(b);const hay=[b.billNo,b.customerName,b.phone,b.village,c?.name,c?.phone,c?.village,...ps.flatMap(p=>[p.mode,p.receivedIn,p.note,p.date])].join(' ').toLowerCase();if(q&&!hay.includes(q))return false;if(month&&!String(b.date||'').startsWith(month)&&!ps.some(p=>String(p.date||'').startsWith(month)))return false;if(type==='due'&&d<=0)return false;if(type==='paid'&&d>0)return false;if(type==='settlements'&&!ps.some(isSettle))return false;if(type==='payments'&&!ps.some(p=>!isSettle(p)))return false;return true;});
const shown=bills.map(b=>{const c=custById(b.customerId),ps=payments(b).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))),total=Number(b.allTotal)||0,received=collected(b),settle=settled(b),balance=due(b),id=String(b.id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");let entries='';if(type==='payments'||type==='settlements'){const filtered=ps.filter(p=>type==='payments'?!isSettle(p):type==='settlements'?isSettle(p):true);entries=filtered.map(p=>`<div class="v93-history-entry ${isSettle(p)?'is-settlement':'is-payment'}"><span class="v93-entry-icon">${isSettle(p)?'✓':'↙'}</span><span class="v93-entry-main"><b>${esc(isSettle(p)?'Settled / Adjusted':(p.mode||'Payment'))}</b><small>${esc(p.date||'No date')} · ${esc(p.receivedIn||p.mode||'')}</small>${p.note?`<small>${esc(p.note)}</small>`:''}</span><strong>${money(p.amount)}</strong></div>`).join('')||'<p class="v93-no-entries">No matching entries.</p>'}else{entries=ps.slice(0,3).map(p=>`<div class="v93-history-entry ${isSettle(p)?'is-settlement':'is-payment'}"><span class="v93-entry-icon">${isSettle(p)?'✓':'↙'}</span><span class="v93-entry-main"><b>${esc(isSettle(p)?'Settled / Adjusted':(p.mode||'Payment'))}</b><small>${esc(p.date||'No date')} · ${esc(p.receivedIn||p.mode||'')}${p.note?' · '+esc(p.note):''}</small></span><strong>${money(p.amount)}</strong></div>`).join('');if(ps.length>3)entries+=`<small class="v93-more-entries">+ ${ps.length-3} earlier entries</small>`;if(!entries)entries='<p class="v93-no-entries">No payment entries yet.</p>'}
return `<article class="v93-history-card"><div class="v93-history-top"><div><small>${esc(b.date||'No date')} · ${esc(b.village||c?.village||'No village')}</small><h3>${esc(b.billNo||'Bill')}</h3><p>${esc(b.customerName||c?.name||'Customer')} ${c?.phone?`· ${esc(c.phone)}`:''}</p></div><span class="v93-status ${balance>0?'is-due':'is-paid'}">${balance>0?'DUE':'PAID'}</span></div><div class="v93-history-amounts"><div><small>Total Bill</small><b>${money(total)}</b></div><div><small>Cash</small><b>${money(received)}</b></div><div><small>Settled</small><b>${money(settle)}</b></div><div><small>Balance</small><b>${money(balance)}</b></div></div><details class="v93-entry-details"><summary>Activity & payment history <span>${ps.length} entries</span></summary><div class="v93-entry-list">${entries}</div></details><div class="v93-history-actions"><button type="button" class="v93-btn secondary" onclick="viewBill('${id}')">View bill</button><button type="button" class="v93-btn primary" onclick="openPayment('${id}')">${balance>0?'Receive payment':'Payment details'}</button><button type="button" class="v93-btn danger" onclick="deleteBill('${id}')">Delete</button></div></article>`}).join('');
list.innerHTML=shown||'<div class="v93-empty"><span>⌕</span><b>No matching history</b><small>Try another search or change the filters.</small></div>';
const total=bills.reduce((n,b)=>n+(Number(b.allTotal)||0),0),cash=bills.reduce((n,b)=>n+collected(b),0),settle=bills.reduce((n,b)=>n+settled(b),0),outstanding=bills.reduce((n,b)=>n+due(b),0),count=bills.reduce((n,b)=>n+payments(b).length,0);const sum=$('v93HistorySummary');if(sum)sum.innerHTML=`<span><small>Bills</small><b>${bills.length}</b></span><span><small>Total</small><b>${money(total)}</b></span><span><small>Collected</small><b>${money(cash)}</b></span><span><small>Settled</small><b>${money(settle)}</b></span><span><small>Due</small><b>${money(outstanding)}</b></span><span><small>Entries</small><b>${count}</b></span>`;
}
const originalHistory=window.renderHistory;window.renderHistory=function(){try{history(false)}catch(e){console.error('History render error',e);if(typeof originalHistory==='function')originalHistory()}};try{renderHistory=window.renderHistory}catch(_){}
const originalDash=window.renderDash;window.renderDash=function(){if(typeof originalDash==='function')originalDash.apply(this,arguments);try{dashboard()}catch(e){console.error('Dashboard render error',e)}};try{renderDash=window.renderDash}catch(_){}
function boot(){ensureHistoryUI();history(false);dashboard()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,180),{once:true});else setTimeout(boot,180);
window.ashaAuditV93=()=>({build:'V93 Premium Dashboard + History Centre',settlementMetric:!!document.querySelector('#metrics .v93-settled'),historySearch:!!$('v93HistorySearch'),historyTypeFilter:!!$('v93HistoryType'),historySummary:!!$('v93HistorySummary')});
const css=document.createElement('style');css.id='v93PremiumDashboardHistory';css.textContent=`
#homePage #metrics{gap:11px!important}#homePage #metrics .metric{position:relative;display:flex;flex-direction:column;align-items:stretch;min-width:0;padding:15px!important;border:1px solid rgba(222,233,225,.96)!important;border-radius:24px!important;background:linear-gradient(145deg,#fff 0%,#f5faf7 100%)!important;box-shadow:0 8px 24px rgba(18,55,39,.065),inset 0 1px 0 #fff!important;overflow:hidden}#homePage #metrics .metric:after{content:"";position:absolute;right:-20px;top:-25px;width:80px;height:80px;border-radius:50%;background:rgba(28,145,91,.045);pointer-events:none}#homePage #metrics .metric small{display:flex;align-items:center;gap:9px;font-size:11px!important;font-weight:750;color:#68786e!important;line-height:1.35}#homePage #metrics .metric .metric-icon{display:grid;place-items:center;width:37px;height:37px;flex:0 0 37px;border-radius:13px;background:#e5f5eb;color:#118052;box-shadow:inset 0 1px 0 #fff;font-size:18px}#homePage #metrics .metric .metric-icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}#homePage #metrics .v93-cash .metric-icon{background:#e4f7eb;color:#07804d}#homePage #metrics .v93-settled .metric-icon{background:#fff2d5;color:#a36b08}#homePage #metrics .v93-due .metric-icon{background:#ffede6;color:#bf5427}#homePage #metrics .metric>b{display:block;margin-top:14px;font-size:clamp(19px,4.8vw,26px)!important;font-weight:850;letter-spacing:-.7px;color:#1b3d2b!important;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}#homePage #metrics .v93-settled>b{color:#98630b!important}#homePage #metrics .v93-due>b{color:#b64e22!important}
#homePage .v93-smart-card{border:1px solid #e3ebe5!important;border-radius:26px!important;padding:17px!important;background:linear-gradient(150deg,#fff,#f7faf8)!important;box-shadow:0 9px 28px rgba(22,53,34,.055)!important;overflow:hidden}#homePage .v93-smart-card h2,#homePage .v93-smart-card h3{color:#1d3d2b!important;letter-spacing:-.4px}#homePage .v93-smart-card .research-grid{gap:9px!important}#homePage .v93-summary-tile{padding:13px!important;border:1px solid #e6eee8!important;border-radius:19px!important;background:linear-gradient(145deg,#fff,#f5faf6)!important;box-shadow:none!important}#homePage .v93-summary-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:11px;background:#e5f5eb;color:#138252;font-size:16px;font-weight:850}#homePage .v93-summary-tile>b{font-size:clamp(18px,4.3vw,23px)!important;color:#1b3d2b!important;font-variant-numeric:tabular-nums}#homePage .v93-village-pill{border:1px solid #e0eae3!important;border-radius:15px!important;background:#f8fbf9!important;padding:11px 12px!important;color:#2d4d38!important;font-size:11px!important;font-weight:750!important;box-shadow:0 3px 10px #173b2506!important}#homePage .v93-smart-row{padding:12px!important;border:1px solid #e7eee9!important;border-radius:16px!important;background:#fff!important;margin:7px 0!important}
#historyPage .v93-history-tools{display:grid;gap:11px;margin:14px 0;padding:14px;border:1px solid #e1eae4;border-radius:23px;background:linear-gradient(150deg,#fff,#f7faf8);box-shadow:0 6px 20px #163b2508}#historyPage .v93-history-tools label{display:grid;gap:6px;min-width:0}#historyPage .v93-history-tools label>small{font-size:10px;font-weight:800;color:#718076}#historyPage .v93-history-search{display:flex!important;align-items:center;gap:9px;padding:0 12px;border:1px solid #e0e9e3;border-radius:15px;background:#f7faf8;color:#138052;font-size:21px}#historyPage .v93-history-search input{width:100%;min-width:0;min-height:47px;border:0!important;outline:none!important;background:transparent!important;box-shadow:none!important;color:#1c3e2a;font-size:13px!important}#historyPage .v93-history-filter-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}#historyPage .v93-history-filter-row input,#historyPage .v93-history-filter-row select{width:100%;min-width:0;min-height:44px;padding:9px 10px;border:1px solid #dfe9e2;border-radius:14px;background:#f7faf8;color:#23442f;font:inherit;font-size:12px;box-sizing:border-box}#historyPage .v93-history-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}#historyPage .v93-history-summary span{display:grid;gap:4px;min-width:0;padding:10px 9px;border:1px solid #e5eee7;border-radius:14px;background:#fff}#historyPage .v93-history-summary small{font-size:9px;color:#7b897f;font-weight:750}#historyPage .v93-history-summary b{font-size:12px;color:#234632;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}#historyPage .v93-history-card{margin:11px 0!important;padding:15px!important;border:1px solid #e0eae3!important;border-radius:24px!important;background:linear-gradient(150deg,#fff,#fbfdfb)!important;box-shadow:0 7px 22px #163b2508!important}#historyPage .v93-history-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}#historyPage .v93-history-top>div{min-width:0}#historyPage .v93-history-top small{font-size:10px;color:#7a887e}#historyPage .v93-history-top h3{margin:5px 0;font-size:17px;letter-spacing:-.3px;color:#1c3d2a;overflow-wrap:anywhere}#historyPage .v93-history-top p{margin:0;color:#738176;font-size:11px;overflow-wrap:anywhere}#historyPage .v93-status{flex-shrink:0;padding:6px 9px;border-radius:99px;font-size:9px;font-weight:900;letter-spacing:.5px}#historyPage .v93-status.is-due{background:#fff0df;color:#a25d0c}#historyPage .v93-status.is-paid{background:#e4f6eb;color:#0d8050}#historyPage .v93-history-amounts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:14px 0}#historyPage .v93-history-amounts>div{display:grid;gap:5px;min-width:0;padding:10px 8px;border-radius:13px;background:#f5f9f6}#historyPage .v93-history-amounts small{font-size:9px;color:#77867b;font-weight:700}#historyPage .v93-history-amounts b{font-size:clamp(11px,3.1vw,14px);color:#244a35;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}#historyPage .v93-history-amounts>div:nth-child(3) b{color:#9d6b0c}#historyPage .v93-history-amounts>div:nth-child(4) b{color:#b34f26}#historyPage .v93-entry-details{border-top:1px solid #e8efea;padding-top:10px}#historyPage .v93-entry-details summary{display:flex;justify-content:space-between;gap:8px;align-items:center;cursor:pointer;list-style:none;font-size:11px;font-weight:800;color:#31543d}#historyPage .v93-entry-details summary::-webkit-details-marker{display:none}#historyPage .v93-entry-details summary span{font-size:10px;font-weight:650;color:#7b897f}#historyPage .v93-entry-list{padding-top:7px}#historyPage .v93-history-entry{display:flex;align-items:center;gap:9px;padding:10px 0;border-bottom:1px solid #edf2ee}#historyPage .v93-entry-icon{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border-radius:10px;background:#e5f5eb;color:#118052;font-weight:900}#historyPage .v93-history-entry.is-settlement .v93-entry-icon{background:#fff2d5;color:#a36b08}#historyPage .v93-entry-main{display:grid;gap:3px;min-width:0;flex:1}#historyPage .v93-entry-main b{font-size:11px;color:#294b36}#historyPage .v93-entry-main small{font-size:9px;color:#7a887e;overflow-wrap:anywhere}#historyPage .v93-history-entry>strong{font-size:12px;color:#254a35;white-space:nowrap}#historyPage .v93-history-entry.is-settlement>strong{color:#9d6b0c}#historyPage .v93-more-entries,#historyPage .v93-no-entries{display:block;padding:9px 0;font-size:10px;color:#78877c}#historyPage .v93-history-actions{display:grid;grid-template-columns:1fr 1.25fr .7fr;gap:7px;margin-top:13px}#historyPage .v93-btn{min-width:0;min-height:40px;padding:8px 6px;border:1px solid #dfe9e2;border-radius:13px;font-size:10px;font-weight:800;background:#f5f9f6;color:#31533d}#historyPage .v93-btn.primary{background:linear-gradient(145deg,#118452,#20a76c);color:#fff;border-color:transparent}#historyPage .v93-btn.danger{background:#fff2ee;color:#b94e29;border-color:#f5ded6}#historyPage .v93-empty{display:grid;justify-items:center;gap:7px;margin:16px 0;padding:28px 15px;border:1px dashed #d7e4db;border-radius:22px;background:#f8fbf9;text-align:center;color:#31523d}#historyPage .v93-empty>span{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#e5f5eb;font-size:24px;color:#118052}#historyPage .v93-empty small{font-size:11px;color:#78867c}
@media(max-width:380px){#homePage #metrics .metric{padding:12px!important;border-radius:19px!important}#homePage #metrics .metric small{font-size:10px!important;gap:6px}#homePage #metrics .metric .metric-icon{width:32px;height:32px;flex-basis:32px}#historyPage .v93-history-amounts{gap:5px}#historyPage .v93-history-amounts>div{padding:8px 5px}#historyPage .v93-history-actions{grid-template-columns:1fr 1.2fr .65fr}#historyPage .v93-history-actions .v93-btn{font-size:9px}}@media(prefers-reduced-motion:reduce){#homePage #metrics .metric,#historyPage .v93-history-card{animation:none!important;transition:none!important}}
`;document.head.appendChild(css);
})();


/* ASHA Billing V93.1 — requested mobile cleanup, preserving existing business logic */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 function cleanupPay(){
   const page=$('payPage'); if(!page)return;
   // Remove the whole promotional/info and computed summary block shown in the uploaded screenshot.
   ['v89PayHero','v89PaySummary','v90PaySummary','v84PaymentHistory','v90PayHero','v91PayHero'].forEach(id=>$(id)?.remove());
   page.querySelectorAll('.v89-pay-hero,.v90-pay-hero,.v89-pay-summary,.v90-pay-summary,.v84-pay-progress,.v84-pay-entry,.v84-pay-subtitle,.v89-pay-progress,.v90-progress,.v90-settle-note,.v89-pay-legend,.v90-pay-legend').forEach(el=>el.remove());
   // Hide the original compact bill-info block, but keep its element in place for existing payment JS.
   const info=$('payInfo'); if(info){info.setAttribute('aria-hidden','true');info.style.cssText+=';display:none!important';}
   // Strip leftover helper text only; the bill selector, inputs and all payment actions remain intact.
   page.querySelectorAll('.muted,.pay-helper,.payment-helper,.v89-pay-title p,.v90-pay-title p').forEach(el=>{if(!el.closest('button'))el.remove()});
   const card=page.querySelector('.card'); if(card)card.classList.add('v93-pay-compact');
 }
 function keepNormalCalculator(){
   const page=$('calcPage'); if(!page)return;
   // Restore the app's original standard calculator (#calcScreen/#calcKeys), without altering its handlers.
   const normal=page.querySelector(':scope > .card:has(#calcScreen), :scope > .card:has(#calcKeys), .v89-legacy-calc:has(#calcKeys)');
   if(normal){normal.classList.remove('v89-legacy-calc','v88-old-calc-card');normal.style.setProperty('display','block','important');normal.style.setProperty('visibility','visible','important');}
   // The land tool remains available from the existing iOS popup launcher, not as a second inline layout.
   page.querySelectorAll(':scope > .card:has(#calcLand), .v89-legacy-calc:has(#calcLand), .v88-land-old').forEach(el=>{el.style.setProperty('display','none','important')});
   // Keep the existing scientific calculator as an additional option, and retain the popup launchers.
   const root=$('v89CalculatorStudio'); if(root){root.querySelectorAll(':scope > .v89-tool-card:not(.v89-calculator)').forEach(el=>el.style.setProperty('display','none','important'));}
 }
 function apply(){cleanupPay();keepNormalCalculator();document.documentElement.classList.add('asha-v93-mobile-clean');}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,220),{once:true});else setTimeout(apply,220);
 const oldShow=window.showPage;if(typeof oldShow==='function'&&!oldShow.__v93MobileCleanup){const wrap=function(id){oldShow.apply(this,arguments);setTimeout(apply,100)};wrap.__v93MobileCleanup=true;window.showPage=wrap;try{showPage=wrap}catch(_){}}
 window.ashaAuditV93Mobile=()=>({build:'V93 Mobile Pay Cleanup + Standard Calculator',payIntroRemoved:!$('v89PayHero'),paySummaryRemoved:!$('v89PaySummary'),standardCalculatorVisible:!!$('calcKeys')&&getComputedStyle($('calcKeys').closest('.card')||$('calcKeys')).display!=='none',receiveAction:!!$('receiveBtn'),settleAction:!!$('settleBtn'),dueReceiptAction:!!$('dueReceiptBtn'),cashCounterLauncher:!!document.querySelector('[data-v91-open="cash"]'),landCalculatorLauncher:!!document.querySelector('[data-v91-open="land"]')});
 const css=document.createElement('style');css.id='v93MobileCleanupStyles';css.textContent=`
 #payPage .v93-pay-compact{padding:clamp(12px,3.5vw,20px)!important;border-radius:22px!important}
 #payPage .v93-pay-compact h2{margin-top:0!important}
 #payPage #payBill{width:100%;min-width:0;box-sizing:border-box}
 #payPage .two{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 #payPage .action-bar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
 #payPage .action-bar .btn{min-width:0;min-height:48px;padding:10px 6px;font-size:clamp(10px,2.8vw,13px);line-height:1.25;white-space:normal;overflow-wrap:anywhere;border-radius:15px}
 #payPage .pay-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
 #payPage .pay-buttons .btn{min-width:0;min-height:43px;padding:9px 5px;font-size:12px}
 /* Preserve the existing ordinary calculator keypad on small screens. */
 #calcPage .v89-legacy-calc:has(#calcKeys),#calcPage>.card:has(#calcKeys),#calcPage>.card:has(#calcScreen){display:block!important;visibility:visible!important}
 #calcPage .v88-old-calc-card:has(#calcKeys){display:block!important}
 #calcPage .v89-legacy-calc:has(#calcLand),#calcPage>.card:has(#calcLand),#calcPage .v88-land-old{display:none!important}
 #calcPage #calcScreen{max-width:100%;overflow-x:auto;overflow-wrap:anywhere}
 #calcPage #calcKeys{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
 #calcPage #calcKeys button{min-width:0;min-height:46px;touch-action:manipulation}
 @media(max-width:380px){#payPage .action-bar{gap:6px}#payPage .action-bar .btn{font-size:10px;padding:9px 4px}#payPage .two{gap:8px}#calcPage #calcKeys{gap:6px}#calcPage #calcKeys button{min-height:43px}}
 @media(prefers-reduced-motion:reduce){.v91-modal-sheet{animation:none!important}}
 `;document.head.appendChild(css);
})();


/* ASHA Billing V94 — single FX-100MS-style calculator + dashboard refresh guard */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 function enforceCalculator(){
   const page=$('calcPage'),root=$('v89CalculatorStudio'); if(!page||!root)return;
   // One primary calculator only: the newer FX-style scientific keypad.
   page.querySelectorAll(':scope > .card:has(#calcScreen), :scope > .card:has(#calcKeys), .v89-legacy-calc:has(#calcScreen), .v89-legacy-calc:has(#calcKeys), .v88-old-calc-card:has(#calcKeys)').forEach(el=>{
     if(!root.contains(el))el.style.setProperty('display','none','important');
   });
   page.querySelectorAll(':scope > .card:has(#calcLand), .v89-legacy-calc:has(#calcLand), .v88-land-old').forEach(el=>el.style.setProperty('display','none','important'));
   root.querySelectorAll(':scope > .v89-tool-card').forEach(card=>{
     if(card.classList.contains('v89-calculator'))card.style.setProperty('display','block','important');
     else card.style.removeProperty('display'); // cash/land cards are moved into the existing popups by V91
   });
   const title=root.querySelector('.v89-calculator .v89-tool-head h2');if(title)title.textContent='FX-100MS Scientific Calculator';
   const subtitle=root.querySelector('.v89-calculator .v89-tool-head p');if(subtitle)subtitle.textContent='Standard and scientific calculations · DEG/RAD · memory · history';
   const chip=root.querySelector('.v89-calculator .v89-chip');if(chip)chip.textContent='FX-100MS STYLE';
 }
 function refreshDashboard(){
   try{
     if(typeof window.renderDash==='function')window.renderDash();
     // The latest dashboard renderer is defined by V93 and updates totals from current state.
     const s=window.state||(typeof state!=='undefined'?state:null);
     if(s && $('metrics')){
       const ev=new Event('asha:dashboard-refresh');document.dispatchEvent(ev);
     }
   }catch(e){console.warn('Dashboard refresh skipped',e)}
 }
 function apply(){enforceCalculator();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,450),{once:true});else setTimeout(apply,450);
 const oldShow=window.showPage;if(typeof oldShow==='function'&&!oldShow.__v94){const wrap=function(id){oldShow.apply(this,arguments);setTimeout(apply,180);if(id==='homePage')setTimeout(refreshDashboard,120)};wrap.__v94=true;window.showPage=wrap;try{showPage=wrap}catch(_){} }
 const oldRender=window.renderDash;if(typeof oldRender==='function'&&!oldRender.__v94){const wrap=function(){oldRender.apply(this,arguments);setTimeout(apply,0)};wrap.__v94=true;window.renderDash=wrap;try{renderDash=wrap}catch(_){} }
 document.addEventListener('click',e=>{if(e.target.closest('#receiveBtn,#settleBtn,#dueReceiptBtn,[data-page="homePage"],[data-page="payPage"]'))setTimeout(()=>{apply();refreshDashboard()},220)});
 const mo=new MutationObserver(()=>{if($('calcPage')&&$('v89CalculatorStudio'))enforceCalculator()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mo.observe($('calcPage')||document.body,{childList:true,subtree:true}),{once:true});else mo.observe($('calcPage')||document.body,{childList:true,subtree:true});
 window.ashaAuditV94=()=>({build:'V94 Single FX-100MS Calculator',fxCalculatorVisible:!!$('v89CalculatorStudio')&&getComputedStyle($('v89CalculatorStudio').querySelector('.v89-calculator')).display!=='none',legacyCalculatorHidden:!$('calcKeys')||getComputedStyle($('calcKeys').closest('.card')||$('calcKeys')).display==='none',cashCounterLauncher:!!document.querySelector('[data-v91-open="cash"]'),landCalculatorLauncher:!!document.querySelector('[data-v91-open="land"]'),dashboardMetrics:!!$('metrics')});
 const css=document.createElement('style');css.id='v94SingleCalculatorMobileStyles';css.textContent=`
 #calcPage>.card:has(#calcScreen),#calcPage>.card:has(#calcKeys),#calcPage .v89-legacy-calc:has(#calcScreen),#calcPage .v89-legacy-calc:has(#calcKeys),#calcPage .v88-old-calc-card:has(#calcKeys){display:none!important}
 #calcPage #v89CalculatorStudio{display:grid!important;gap:13px!important;width:100%;max-width:100%;box-sizing:border-box}
 #calcPage #v89CalculatorStudio>.v89-calculator{display:block!important;width:100%;box-sizing:border-box}
 #calcPage .v89-calculator .v89-keypad{grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(4px,1.6vw,8px)}
 #calcPage .v89-calculator .v89-keypad button{min-width:0;min-height:clamp(43px,11vw,54px);padding:5px 2px;font-size:clamp(11px,3.4vw,15px);border-radius:13px;touch-action:manipulation}
 #calcPage .v89-calculator .v89-tool-head h2{font-size:clamp(20px,5.4vw,25px)}
 #calcPage .v89-calculator .v89-display output{font-size:clamp(28px,8vw,42px)}
 @media(max-width:360px){#calcPage .v89-calculator .v89-keypad{gap:4px}#calcPage .v89-calculator .v89-keypad button{min-height:42px;border-radius:10px;font-size:11px}#calcPage .v89-calculator .v89-calc-tools{grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}#calcPage .v89-calculator .v89-calc-tools button{font-size:8px;padding:5px 1px}}
 `;document.head.appendChild(css);
})();
