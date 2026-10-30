/* ASHA Billing V98 — clean customer cards and focused customer action centre.
   Uses the existing app data model and established billing/payment functions. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>typeof money==='function'?money(n):'₹'+Number(n||0).toLocaleString('en-IN');
 const getCustomer=id=>(state.customers||[]).find(c=>String(c.id)===String(id));
 const due=id=>Math.max(0,Number(customerDue(id))||0);
 const billsFor=id=>(state.bills||[]).filter(b=>String(b.customerId)===String(id));
 const paidFor=id=>billsFor(id).reduce((s,b)=>s+(b.payments||[]).reduce((n,p)=>n+(Number(p.amount)||0),0),0);
 const billedFor=id=>billsFor(id).reduce((s,b)=>s+(Number(b.allTotal)||0),0);
 let selectedId=null;
 function initials(name){return String(name||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()}
 function renderCards(){
  const host=$('customerList');if(!host)return;
  const q=($('customerSearch')?.value||'').trim().toLowerCase();
  const rows=(state.customers||[]).filter(c=>[c.name,c.phone,c.village,c.address].join(' ').toLowerCase().includes(q));
  host.classList.add('u98-list');
  host.innerHTML=rows.length?rows.map(c=>{const d=due(c.id),count=billsFor(c.id).length;return `<article class="u98-card" data-user-card="${esc(c.id)}" tabindex="0" role="button" aria-label="Open ${esc(c.name)} customer actions">
   <div class="u98-card-top"><div class="u98-avatar">${esc(initials(c.name))}</div><div class="u98-person"><h3>${esc(c.name||'Unnamed customer')}</h3><p>${esc(c.phone||'No phone number')}</p></div><span class="u98-status ${d>0?'due':'clear'}">${d>0?'DUE':'SETTLED'}<b>${fmt(d)}</b></span></div>
   <div class="u98-meta"><span>⌕ ${esc(c.phone||'Phone not added')}</span><span>⌂ ${esc(c.village||'Village not added')}</span><span>▤ ${count} bill${count===1?'':'s'}</span></div>
   <div class="u98-card-bottom"><span><small>Total billed</small><b>${fmt(billedFor(c.id))}</b></span><span><small>Collected</small><b>${fmt(paidFor(c.id))}</b></span><button type="button" class="u98-open">Open account <span>›</span></button></div>
  </article>`}).join(''):'<div class="u98-empty"><b>No customers found</b><span>Try another name, phone number or village.</span></div>';
 }
 function ensureSheet(){if($('u98Root'))return;document.body.insertAdjacentHTML('beforeend',`<div id="u98Root" class="u98-overlay" aria-hidden="true"><section class="u98-sheet" role="dialog" aria-modal="true" aria-labelledby="u98Title"><header class="u98-sheet-head"><div><small>ASHA CUSTOMER ACCOUNT</small><h2 id="u98Title">Customer</h2><p id="u98Sub"></p></div><button type="button" id="u98Close" aria-label="Close">×</button></header><div id="u98Content"></div></section></div>`);$('u98Close').onclick=closeSheet;$('u98Root').addEventListener('click',e=>{if(e.target===$('u98Root'))closeSheet()})}
 function closeSheet(){const root=$('u98Root');if(root){root.classList.remove('open');root.setAttribute('aria-hidden','true')}document.body.classList.remove('u98-lock')}
 function action(key,label,icon,desc,cls=''){return `<button type="button" class="u98-action ${cls}" data-u98-action="${key}"><span class="u98-action-icon">${icon}</span><span><b>${label}</b><small>${desc}</small></span><i>›</i></button>`}
 function openAccount(id){const c=getCustomer(id);if(!c)return;selectedId=id;ensureSheet();const d=due(id),list=billsFor(id).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));$('u98Title').textContent=c.name||'Customer';$('u98Sub').textContent=[c.phone||'No phone number',c.village||'Village not added'].join(' · ');
 $('u98Content').innerHTML=`<section class="u98-summary"><div class="u98-summary-main"><div class="u98-avatar big">${esc(initials(c.name))}</div><div><small>OUTSTANDING BALANCE</small><strong class="${d>0?'text-due':'text-clear'}">${fmt(d)}</strong><em>${d>0?'Payment pending':'Account settled'}</em></div></div><div class="u98-stats"><span><small>Bill entries</small><b>${list.length}</b></span><span><small>Total billed</small><b>${fmt(billedFor(id))}</b></span><span><small>Collected</small><b>${fmt(paidFor(id))}</b></span></div></section>
 <div class="u98-section-label">BILLING & COLLECTION</div><div class="u98-actions">${action('bill','New Bill','▤','Create a new bill','primary')}${action('edit','Edit User','✎','Update customer profile')}${action('ledger','Ledger','▥','Full account history')}${action('receive','Payment Receive','₹','Record cash or online payment','primary')}${action('settle','Settle','✓','Adjust or settle balance')}${action('billrem','Bill Reminder','▧','Share latest bill details')}</div>
 <div class="u98-section-label">REMINDERS & CONTACT</div><div class="u98-actions">${action('reminder','Reminder','↗','Send outstanding due reminder')}${action('call','Call','☎','Call customer')}</div>
 <div class="u98-section-label danger-label">ACCOUNT MANAGEMENT</div><div class="u98-actions single">${action('delete','Delete User','⌫','Remove customer and linked bills','danger')}</div>
 <div class="u98-recent"><div class="u98-section-label">RECENT BILLS</div>${list.slice(0,3).map(b=>`<div class="u98-bill-row"><span><b>${esc(b.billNo||'Bill')}</b><small>${esc(b.date||'')}</small></span><b>${fmt(b.allTotal)}</b><em>${esc(typeof billStatus==='function'?billStatus(b):'Bill')}</em></div>`).join('')||'<p class="u98-muted">No bills created yet.</p>'}</div>`;
 $('u98Root').classList.add('open');$('u98Root').setAttribute('aria-hidden','false');document.body.classList.add('u98-lock');
 }

 function paymentForm(id,isSettle){
  const c=getCustomer(id),balance=due(id);if(!c)return;
  $('u98Title').textContent=isSettle?'Settle account':'Receive payment';$('u98Sub').textContent=(c.name||'Customer')+' · Outstanding '+fmt(balance);
  $('u98Content').innerHTML=`<section class="u98-summary"><div class="u98-summary-main"><div class="u98-avatar big">${esc(initials(c.name))}</div><div><small>${isSettle?'BALANCE TO ADJUST':'BALANCE DUE'}</small><strong class="${balance>0?'text-due':'text-clear'}">${fmt(balance)}</strong><em>${isSettle?'Settlement is recorded separately from cash received.':'Payment will be allocated to the oldest outstanding bill first.'}</em></div></div></section>
   <div class="u98-pay-form"><label>Amount (₹)<input id="u98Amount" type="number" min="0.01" max="${balance}" step="0.01" inputmode="decimal" value="${balance>0?balance.toFixed(2):''}" placeholder="Enter amount"></label>
   ${isSettle?'':`<div class="u98-form-grid"><label>Payment mode<select id="u98Mode"><option>Cash</option><option>UPI</option><option>Online</option><option>Bank</option><option>Other</option></select></label><label>Received in<select id="u98Received"><option>Cash</option><option>Bank</option><option>UPI</option><option>Other</option></select></label></div>`}
   <label>${isSettle?'Adjustment reason':'Payment note'}<textarea id="u98PayNote" placeholder="Optional note">${isSettle?'Settled / adjusted':''}</textarea></label></div>
   <div class="u98-form-actions"><button type="button" class="u98-cancel" id="u98PayCancel">Cancel</button><button type="button" class="u98-confirm" id="u98PaySave">${isSettle?'Save settlement':'Save payment'}</button></div>`;
  $('u98PayCancel').onclick=()=>openAccount(id);$('u98PaySave').onclick=()=>{const amount=Math.round(Number($('u98Amount').value)*100)/100;if(!Number.isFinite(amount)||amount<=0||amount>balance+.009){alert(`Enter an amount between ₹0.01 and ${fmt(balance)}.`);return}let remaining=amount;const ordered=billsFor(id).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));for(const bill of ordered){const paid=(bill.payments||[]).reduce((n,p)=>n+(Number(p.amount)||0),0),left=Math.max(0,(Number(bill.allTotal)||0)-paid);if(left<=0||remaining<=0)continue;const applied=Math.min(left,remaining);(bill.payments||(bill.payments=[])).push({id:typeof uid==='function'?uid():String(Date.now()),date:typeof today==='function'?today():new Date().toISOString().slice(0,10),amount:applied,mode:isSettle?'Settlement':$('u98Mode').value,receivedIn:isSettle?'Adjusted':$('u98Received').value,note:$('u98PayNote').value.trim()||(isSettle?'Settled / adjusted':'Payment received'),type:isSettle?'adjustment':'payment'});remaining=Math.round((remaining-applied)*100)/100}if(remaining>0){const opening=Math.max(0,Number(c.openingDue)||0),applied=Math.min(opening,remaining);c.openingDue=Math.round((opening-applied)*100)/100;(c.openingDueHistory||(c.openingDueHistory=[])).push({id:typeof uid==='function'?uid():String(Date.now()),date:today(),amount:applied,mode:isSettle?'Settlement':$('u98Mode').value,note:$('u98PayNote').value.trim()||(isSettle?'Opening due adjusted':'Opening balance payment'),type:isSettle?'adjustment':'payment'});}if(typeof saveState==='function')saveState();closeSheet();renderCards();};
 }
 function runAction(key){const id=selectedId,c=getCustomer(id);if(!c)return;
  switch(key){
   case 'bill': closeSheet();showPage('billPage');setTimeout(()=>{const s=$('billCustomer');if(s){s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));if(typeof toggleManual==='function')toggleManual();if(typeof previewBill==='function')previewBill()}},100);break;
   case 'edit': closeSheet();if(typeof openCustomer==='function')openCustomer(id);break;
   case 'ledger': closeSheet();if(typeof renderChatLedger==='function'){activeCustomer=id;$('chatModal')?.classList.remove('hidden');renderChatLedger(id)}else if(typeof openChat==='function')openChat(id);break;
   case 'receive': paymentForm(id,false);break;
   case 'settle': paymentForm(id,true);break;
   case 'billrem': closeSheet();if(typeof waCustomerText==='function')waCustomerText(id);else if(typeof smsReminder==='function')smsReminder(id);else alert('Bill reminder is not available in this build.');break;
   case 'reminder': closeSheet();if(typeof waCustomerText==='function')waCustomerText(id);else if(typeof smsReminder==='function')smsReminder(id);else alert('Reminder is not available in this build.');break;
   case 'call':{const p=String(c.phone||'').replace(/\D/g,'');if(!p){alert('Add a phone number to this customer first.');break}closeSheet();location.href='tel:'+p;break}
   case 'delete':if(!confirm(`Delete ${c.name||'this customer'} and all linked bills and payment history? This cannot be undone.`))break;closeSheet();if(typeof deleteCustomer==='function')deleteCustomer(id);break;
  }
 }
 document.addEventListener('click',e=>{const card=e.target.closest('[data-user-card]');if(card){e.preventDefault();openAccount(card.dataset.userCard);return}const a=e.target.closest('[data-u98-action]');if(a){e.preventDefault();runAction(a.dataset.u98Action)}},true);
 document.addEventListener('keydown',e=>{const card=e.target.closest?.('[data-user-card]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openAccount(card.dataset.userCard)}if(e.key==='Escape')closeSheet()});
 const oldRender=window.renderCustomers||renderCustomers;
 window.renderCustomers=function(){oldRender.apply(this,arguments);renderCards()};
 try{renderCustomers=window.renderCustomers}catch(_){}
 document.addEventListener('DOMContentLoaded',renderCards);
 const search=$('customerSearch');search?.addEventListener('input',renderCards);
 window.ashaUserUI={version:'V98',open:openAccount,close:closeSheet,refresh:renderCards};
})();
