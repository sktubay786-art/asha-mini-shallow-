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
