// รางวัล: สลับ รางวัล / คูปอง · แฟนแลกรางวัล (ยืนยัน → ตัดแต้ม → เอฟเฟกต์พิมพ์ตั๋ว) · ผู้ดูแลดูอย่างเดียว
import { S, t, thaiDate } from '../strings.js';
import { esc, openSheet, noticeSheet, toast, fmtDate } from '../ui.js';
import { svgIcon, ACTIVITY_ICONS } from '../icons.js';
import { RULES } from '../config.js';
import * as api from '../api.js';
import * as store from '../store.js';

let root = null;
let unsub = null;
let tab = 'rewards'; // 'rewards' | 'coupons'

export function render(el, params = []) {
  root = el;
  if (params[0] === 'coupons') tab = 'coupons'; // กลับจากหน้าคูปอง → เปิดส่วนคูปอง
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
}

const GIFT = ACTIVITY_ICONS.gift;

function rewardTicket(r, bal) {
  const partner = store.can.redeem;
  const enough = bal >= r.cost;
  let body;
  if (!partner) {
    body = `<div class="rt-label">${esc(S.rewardCost)}</div>`;
  } else if (enough) {
    body = `<button type="button" class="redeem-btn" data-redeem="${r.id}" ${store.canWrite() ? '' : 'disabled'}>${svgIcon(GIFT, { size: 17, stroke: '#fff', width: 1.8 })}${esc(S.redeem)}</button>`;
  } else {
    const pct = bal > 0 ? Math.min(100, (bal / r.cost) * 100) : 0;
    body = `<div class="rt-progress"><div class="bar"><div style="width:${pct}%"></div></div>
      <div class="rt-need">${esc(t('needMore', { n: r.cost - bal }))}</div></div>`;
  }
  const glow = !partner || enough;
  return `<div class="big-ticket${partner && !enough ? ' dim' : ''}">
    <div class="ticket-main bt-main${glow ? '' : ' no-glow'}">
      <div class="bt-name">${esc(r.name)}</div>
      ${body}
    </div>
    <div class="ticket-stub bt-stub"><span class="bt-pts">${r.cost}</span><span class="stub-unit">${esc(S.points)}</span></div>
  </div>`;
}

const statusText = c => (c.status === 'used' ? S.couponUsed : c.status === 'requested' ? S.couponRequested : S.couponActive);

export function couponTicket(c, { link = true } = {}) {
  const inner = `<div class="big-ticket${c.status === 'used' ? ' dim' : ''}">
    <div class="ticket-main bt-main">
      <div class="bt-name">${esc(c.reward_name)}</div>
      <div class="ct-meta">
        <span class="status-pill${c.status === 'used' ? ' grey' : ''}">${esc(statusText(c))}</span>
        <div class="list-meta">${esc(S.redeemedAt)} ${esc(fmtDate(c.redeemed_at))}</div>
      </div>
    </div>
    <div class="ticket-stub bt-stub"><span class="bt-pts">${c.cost}</span><span class="stub-unit">${esc(S.points)}</span></div>
  </div>`;
  return link ? `<a class="ticket-link" href="#/coupon/${c.id}">${inner}</a>` : inner;
}

function emptyBox(text, extra = '') {
  return `<div class="plain-empty slim"><span class="empty-ico tile">${svgIcon(GIFT, { size: 26 })}</span><div class="empty-text">${esc(text)}</div>${extra}</div>`;
}

function draw() {
  const bal = store.balance();
  const rewards = store.state.data.rewards.filter(r => r.is_active).sort((a, b) => b.cost - a.cost);
  const order = { active: 0, requested: 0, used: 1 };
  const coupons = [...store.state.data.coupons]
    .sort((a, b) => order[a.status] - order[b.status] || b.redeemed_at.localeCompare(a.redeemed_at));

  let list;
  if (tab === 'rewards') {
    list = rewards.length
      ? `<div class="big-list">${rewards.map(r => rewardTicket(r, bal)).join('')}</div>`
      : emptyBox(`${S.rewardsEmpty} · ${S.rewardsEmptyHint}`,
        store.can.manage ? `<a class="btn-pill" href="#/manage-rewards">${esc(S.rewardsEmptyButton)}</a>` : '');
  } else {
    list = coupons.length
      ? `<div class="big-list">${coupons.map(c => couponTicket(c)).join('')}</div>`
      : emptyBox(S.couponsEmpty);
  }

  root.innerHTML = `<section class="screen">
    <header class="page-head">
      <div class="page-date">${esc(thaiDate())}</div>
      <div class="title-row"><h1 class="page-title">${esc(S.rewardsTitle)}</h1>
        <span class="bal-pill${bal < 0 ? ' neg' : ''}">${svgIcon(ACTIVITY_ICONS.star, { size: 16, width: 1.8 })}${bal < 0 ? '−' + Math.abs(bal) : bal}</span></div>
    </header>
    <div class="seg big-seg">
      <button type="button" data-tab="rewards" class="${tab === 'rewards' ? 'on' : ''}">${esc(S.rewardsTitle)}</button>
      <button type="button" data-tab="coupons" class="${tab === 'coupons' ? 'on' : ''}">${esc(S.couponsTab)}</button>
    </div>
    ${list}
  </section>`;

  root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; draw(); });
  root.querySelectorAll('[data-redeem]').forEach(b => b.onclick = () => askRedeem(rewards.find(r => r.id === b.dataset.redeem)));
}

// ---------- แลกรางวัล ----------
function askRedeem(r) {
  if (document.querySelector('.sheet-wrap')) return;
  const { el, close } = openSheet(`
    <div class="redeem-q"><div class="glow-mid"></div><div class="rq-text">${esc(t('redeemConfirm', { reward: r.name, n: r.cost }))}</div></div>
    <button type="button" class="btn btn-pink" data-ok>${svgIcon(GIFT, { size: 18, stroke: '#fff', width: 1.8 })}${esc(S.redeemNow)}</button>
    <button type="button" class="btn btn-secondary" data-cancel>${esc(S.cancel)}</button>`);
  el.querySelector('[data-cancel]').onclick = close;
  const ok = el.querySelector('[data-ok]');
  ok.onclick = async () => {
    if (ok.disabled) return;
    ok.disabled = true;
    try {
      const coupon = await api.redeemReward(r.id);   // ตัดแต้มทันทีในฐานข้อมูล
      close();
      printCoupon(coupon);
      store.refresh('entries'); store.refresh('coupons');
    } catch (e) {
      close();
      noticeSheet(e?.message || S.genericError);
    }
  };
}

// เอฟเฟกต์พิมพ์ตั๋ว (แอนิเมชันเดียวที่อนุญาต) · prefers-reduced-motion → ข้ามไปหน้าพิมพ์เสร็จทันที
function printCoupon(c) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ov = document.createElement('div');
  ov.className = 'print-overlay';
  ov.innerHTML = `
    <div class="printer-wrap">
      <div class="printer"><span class="slot"></span><span class="led"></span></div>
      <div class="paper-window"><div class="paper">${couponTicket(c, { link: false })}</div></div>
    </div>
    <div class="print-caption">${esc(S.printing)}</div>`;
  document.body.appendChild(ov);
  document.body.classList.add('sheet-open');

  const finish = () => {
    if (!ov.isConnected) return;
    ov.classList.add('done');
    ov.innerHTML = `
      <div class="printed">${couponTicket(c, { link: false })}</div>
      <div class="print-actions">
        <a class="btn btn-pink" href="#/coupon/${c.id}" data-view>${esc(S.viewCoupon)}</a>
        <button type="button" class="btn btn-ghost-light" data-close>${esc(S.close)}</button>
      </div>`;
    const remove = () => { ov.remove(); document.body.classList.remove('sheet-open'); };
    ov.querySelector('[data-view]').onclick = remove;
    ov.querySelector('[data-close]').onclick = () => { remove(); toast(S.toastRedeemed); };
  };
  if (reduce) finish();
  else setTimeout(finish, RULES.PRINT_MS);
}
