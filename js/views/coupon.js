// คูปอง 1 ใบ: แฟนกด "ใช้คูปองนี้" · ผู้ดูแลกด "ใช้แล้ว" (ยืนยัน · ย้อนกลับไม่ได้) · QR "I love you"
import { S } from '../strings.js';
import { esc, act, confirmSheet, fmtDate } from '../ui.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from '../icons.js';
import * as api from '../api.js';
import * as store from '../store.js';

let root = null;
let unsub = null;
let couponId = null;

export function render(el, params = []) {
  root = el;
  couponId = params[0];
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
}

// รหัสคูปองสั้นจาก id เช่น CP-3F2A-91BC
const shortCode = id => `CP-${id.slice(0, 4)}-${id.slice(4, 8)}`.toUpperCase();

function draw() {
  const c = store.state.data.coupons.find(x => x.id === couponId);
  const back = `<div class="sub-top"><a class="round-btn" href="#/rewards/coupons" aria-label="${S.a11yBack}">${svgIcon(UI_ICONS.back, { size: 20 })}</a><span class="coupon-crumb">${esc(S.couponsTab)}</span></div>`;
  if (!c) { root.innerHTML = `<section class="screen no-nav">${back}</section>`; return; }

  const used = c.status === 'used';
  const status = used ? S.couponUsed : c.status === 'requested' ? S.couponRequested : S.couponActive;

  let actions = '';
  if (store.can.requestCouponUse) {
    if (c.status === 'active') {
      actions = `<p class="coupon-hint">${esc(S.couponShowHint)}</p>
        <div class="ob-actions tight"><button type="button" class="btn btn-pink" data-use ${store.canWrite() ? '' : 'disabled'}>${svgIcon(ACTIVITY_ICONS.gift, { size: 18, stroke: '#fff', width: 1.8 })}${esc(S.couponUse)}</button></div>`;
    } else if (c.status === 'requested') {
      actions = `<div class="status-card"><span class="spinner"></span><span>${esc(S.couponSent)}</span></div>`;
    }
  } else if (store.can.markCouponUsed && !used) {
    actions = `<div class="ob-actions"><button type="button" class="btn btn-primary" data-mark ${store.canWrite() ? '' : 'disabled'}>${svgIcon(UI_ICONS.check, { size: 18, stroke: 'currentColor', width: 2 })}${esc(S.couponMarkUsed)}</button></div>`;
  }

  root.innerHTML = `<section class="screen no-nav">
    ${back}
    <div class="coupon${used ? ' used' : ''}">
      <div class="cp-top">
        ${used ? '' : '<div class="cp-glow"></div>'}
        <div class="cp-row"><span class="cp-brand">${esc(S.couponHeader)}</span><span class="status-pill big${used ? ' grey' : ''}">${esc(status)}</span></div>
        <div class="cp-title-wrap">
          <div class="cp-title">${esc(c.reward_name)}</div>
          <div class="cp-cost"><b>${c.cost}</b> ${esc(S.points)}</div>
        </div>
      </div>
      <div class="cp-bottom">
        <div class="cp-dates">
          <div><div class="cp-k">${esc(S.redeemedAt)}</div><div class="cp-v">${esc(fmtDate(c.redeemed_at))}</div></div>
          ${used && c.used_at ? `<div class="right"><div class="cp-k">${esc(S.usedAt)}</div><div class="cp-v">${esc(fmtDate(c.used_at))}</div></div>` : ''}
        </div>
        <div class="cp-qr"><img src="icons/qr-iloveyou.svg" width="132" height="132" alt="QR code"></div>
        <div class="cp-code">${esc(shortCode(c.id))}</div>
      </div>
    </div>
    ${actions}
  </section>`;

  root.querySelector('[data-use]')?.addEventListener('click', e =>
    act(e.currentTarget, async () => { await api.requestCouponUse(c.id); await store.refresh('coupons'); }));

  root.querySelector('[data-mark]')?.addEventListener('click', async e => {
    if (document.querySelector('.sheet-wrap')) return;
    const btn = e.currentTarget;
    const ok = await confirmSheet({ title: S.couponMarkUsedConfirm, ok: S.couponMarkUsed });
    if (ok) act(btn, async () => { await api.markCouponUsed(c.id); await store.refresh('coupons'); });
  });
}
