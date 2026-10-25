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
      actionButton('settle','Settle / Adjust','settle'), actionButton('reminder','Bill + Reminder','reminder','primary'),
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
function actions(id){if(!open(id,'Customer actions'))return;const body=$('v77Body');body.className='v77-grid';const items=[['bill','New Bill','bill'],['edit','Edit User','edit'],['ledger','Ledger','ledger'],['receive','Receive','receive'],['settle','Settle','settle'],['billrem','Bill with Reminder','reminder'],['chat','Chat / Notes','chat'],['remind','Reminder','reminder'],['call','Call','call'],['delete','Delete User','delete']];items.forEach(([key,label,ico])=>{const b=btn('',()=>run(id,key),key==='delete'?'danger':key==='bill'||key==='receive'?'primary':'');b.innerHTML=`<span class="v77-icon">${icon[ico]}</span><span>${label}</span><span class="v77-chevron">›</span>`;body.append(b)});$('v77Foot').textContent=`${bills().filter(b=>String(b.customerId)===String(id)).length} bills · Outstanding ${money(due(id))}`}
function run(id,key){const c=customer(id);if(!c)return;if(key==='bill'){close();try{window.closeChat?.()}catch{}try{window.closeUserDetailV51?.()}catch{}window.showPage?.('billPage');setTimeout(()=>{const s=$('billCustomer');if(s){s.value=String(id);s.dispatchEvent(new Event('change',{bubbles:true}));window.toggleManual?.();window.updatePreviousDueV55?.(true);window.previewBill?.()}},180);return}
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
    if (build) build.textContent = 'V79 · Customer Chat';
    // Remove only the old business quote from the HOME header. Settings and invoice data stay untouched.
    const applyHomeBrand = () => {
      const title = document.getElementById('companyTitle');
      if (title && title.textContent !== 'ASHA Billing') title.textContent = 'ASHA Billing';
      const sub = document.getElementById('companySub');
      if (sub && sub.textContent !== 'Smart billing · Customer management') sub.textContent = 'Smart billing · Customer management';
      const chipLabel = document.getElementById('buildChip');
      if (chipLabel && chipLabel.textContent !== 'V79 · Customer Chat') chipLabel.textContent = 'V79 · Customer Chat';
      const meta = document.querySelector('meta[name="app-build"]');
      if (meta) meta.content = 'V79 Customer Chat Interface';
      window.ASHA_BUILD = 'V79 Customer Chat Interface';
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
    if (chip) chip.textContent = 'V79 · Customer Chat Interface';
    const meta = document.querySelector('meta[name="app-build"]');
    if (meta) meta.content = 'V79 Customer Chat Interface';
    const back = document.getElementById('chatBack');
    if (back) back.setAttribute('aria-label', 'Back to customers');
  });
  if (document.readyState !== 'loading') decorate();
  window.ashaAuditV79 = () => ({build:'V79 Customer Chat Interface',chatClass:!!modal()?.classList.contains('asha-wa-conversation'),customerSpecificComposer:!!document.getElementById('manualChatInput')});
})();
