/* ASHA Billing V104 — stable navigation + deterministic calculator */
(()=>{
 'use strict';
 const PAGE_IDS=['homePage','customersPage','billPage','payPage','historyPage','reportsPage','calcPage','settingsPage'];
 function navigate(id){
   if(!PAGE_IDS.includes(id)) return;
   document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));
   document.querySelectorAll('.tabbar [data-page]').forEach(b=>{
     const active=b.dataset.page===id;
     b.classList.toggle('active',active);
     if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
   });
   if(id==='billPage'&&typeof window.previewBill==='function'){try{window.previewBill()}catch(e){console.warn('Bill preview:',e)}}
   if(typeof window.renderAll==='function'){try{window.renderAll(false)}catch(e){console.warn('Render:',e)}}
   window.scrollTo({top:0,behavior:'instant'});
 }
 window.showPage=navigate;
 // Capture phase prevents older patch handlers from fighting over navigation.
 document.addEventListener('click',e=>{
   const btn=e.target.closest('[data-page]');
   if(!btn||!document.contains(btn))return;
   const id=btn.dataset.page;
   if(PAGE_IDS.includes(id)){e.preventDefault();e.stopImmediatePropagation();navigate(id)}
 },true);
 const screen=()=>document.getElementById('calcScreen');
 const keys=()=>document.getElementById('calcKeys');
 let expr='', justSolved=false;
 const paint=()=>{const s=screen();if(s)s.textContent=expr||'0'};
 function tokenize(s){
   s=s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\s+/g,'');
   const out=[];let i=0;
   while(i<s.length){const c=s[i];
     if(/[0-9.]/.test(c)){let n='';let dots=0;while(i<s.length&&/[0-9.]/.test(s[i])){if(s[i]==='.')dots++;n+=s[i++]}if(dots>1||n==='.')throw Error('Invalid number');out.push(Number(n));continue}
     if('+-*/()%'.includes(c)){out.push(c);i++;continue}throw Error('Invalid input');
   }return out;
 }
 function evaluate(s){
   const t=tokenize(s);if(!t.length)return 0;const output=[],ops=[],prec={'+':1,'-':1,'*':2,'/':2,'%':3,'u-':4,'u+':4};let prev='start';
   for(let i=0;i<t.length;i++){const x=t[i];
     if(typeof x==='number'){if(prev==='number'||prev===')')throw Error('Missing operator');output.push(x);prev='number';continue}
     if(x==='('){if(prev==='number'||prev===')')throw Error('Missing operator');ops.push(x);prev='(';continue}
     if(x===')'){while(ops.length&&ops.at(-1)!=='(')output.push(ops.pop());if(ops.pop()!=='(')throw Error('Bracket mismatch');prev=')';continue}
     if(x==='%'){if(prev!=='number'&&prev!==')'&&prev!=='%')throw Error('Invalid percent');output.push(x);prev='%';continue}
     let op=x;if((op==='+'||op==='-')&&(prev==='start'||prev==='('||'+-*/'.includes(prev)))op=op==='-'?'u-':'u+';
     else if(prev==='start'||prev==='('||'+-*/'.includes(prev))throw Error('Incomplete expression');
     while(ops.length&&ops.at(-1)!=='('&&(prec[ops.at(-1)]>prec[op]||(prec[ops.at(-1)]===prec[op]&&!['u-','u+'].includes(op))))output.push(ops.pop());ops.push(op);prev=op;
   }
   if(['start','(','+','-','*','/'].includes(prev))throw Error('Incomplete expression');while(ops.length){const op=ops.pop();if(op==='(')throw Error('Bracket mismatch');output.push(op)}
   const st=[];for(const x of output){if(typeof x==='number'){st.push(x);continue}if(x==='%'){if(!st.length)throw Error('Invalid percent');st.push(st.pop()/100);continue}if(x==='u-'||x==='u+'){if(!st.length)throw Error('Invalid expression');st.push(x==='u-'?-st.pop():st.pop());continue}if(st.length<2)throw Error('Invalid expression');const b=st.pop(),a=st.pop();let v=x==='+'?a+b:x==='-'?a-b:x==='*'?a*b:a/b;if(x==='/'&&b===0)throw Error('Cannot divide by zero');st.push(v)}
   if(st.length!==1||!Number.isFinite(st[0]))throw Error('Invalid result');return Number(st[0].toPrecision(12));
 }
 function setup(){const box=keys();if(!box)return;const layout=['AC','DEL','(',')','7','8','9','÷','4','5','6','×','1','2','3','-','0','.','%','+','='];box.innerHTML=layout.map(k=>`<button type="button" data-v104-key="${k}" class="${['÷','×','-','+','%'].includes(k)?'op':k==='='?'eq':''}">${k}</button>`).join('');box.addEventListener('click',e=>{const b=e.target.closest('[data-v104-key]');if(!b)return;const k=b.dataset.v104Key;
   if(k==='AC'){expr='';justSolved=false}
   else if(k==='DEL'){expr=expr.slice(0,-1);justSolved=false}
   else if(k==='='){try{const result=evaluate(expr);expr=String(result);justSolved=true}catch(err){const s=screen();if(s)s.textContent=err.message;return}}
   else{if(justSolved&&!['+','-','×','÷','%'].includes(k))expr='';justSolved=false;if(expr.length<80)expr+=k}
   paint();
 },true);paint();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
 // Ensure bottom navigation respects device safe areas and page visibility.
 document.documentElement.classList.add('asha-v104');
})();
