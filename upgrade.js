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
  const ready=()=>{const chip=document.querySelector('.hero-chips span:last-child');if(chip)chip.textContent='V74 · Customer Functions Audit';const meta=document.querySelector('meta[name="app-build"]');if(meta)meta.content='V74 Customer Functions Audit';window.ASHA_BUILD='V74 Customer Functions Audit';};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  // Older builds contain delayed version-label updates; re-assert V74 after those timers run.
  [800,4700,6200].forEach(ms=>setTimeout(ready,ms));
})();
