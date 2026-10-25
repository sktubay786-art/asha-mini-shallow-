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
