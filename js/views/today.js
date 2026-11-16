// วันนี้: แต้มสะสม + รางวัลเป้าหมาย · กิจวัตรวันนี้ · รอยืนยัน (+ คำขอใช้คูปอง)
import { S, t, thaiDate } from '../strings.js';
import { esc, iconTile, act } from '../ui.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from '../icons.js';
import { RULES } from '../config.js';
import * as api from '../api.js';
import * as store from '../store.js';
import { confirmedDates, currentStreak, dotsFilled, daysToBonus } from '../streak.js';

let root = null;
let unsub = null;

export function render(el) {
  root = el;
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
}

const nickname = id => store.state.data.members.find(m => m.id === id)?.nickname ?? '';

// ---------- การ์ดแต้มสะสม ----------
function balanceCard() {
  const bal = store.balance();
  const rewards = store.state.data.rewards.filter(r => r.is_active);
  const target = rewards.filter(r => r.cost > bal).sort((a, b) => a.cost - b.cost)[0];
  let line = '';
  let pct = 0;
  if (bal === 0) line = esc(S.balanceZero);
  if (target) {
    pct = bal > 0 ? Math.min(100, (bal / target.cost) * 100) : 0;
    if (bal !== 0) {
      // "อีก {n} แต้ม แลก {reward} ได้" · ตัวเลขแต้มเป็นชมพูตัวหนา ชื่อรางวัลตัวหนา
      line = esc(S.balanceTarget)
        .replace(`{n} ${S.points}`, `<b class="pink">${target.cost - bal} ${esc(S.points)}</b>`)
        .replace('{reward}', `<b>${esc(target.name)}</b>`);
    }
  } else if (rewards.length) {
    pct = 100;
    if (bal !== 0) line = esc(S.balanceAllAffordable);
  }
  return `<div class="balance-card">
    <div class="glow-mid"></div>
    <div class="bc-label">${esc(S.balanceLabel)}</div>
    <div class="bc-num${bal < 0 ? ' neg' : ''}">${bal < 0 ? '−' + Math.abs(bal) : bal}</div>
    ${rewards.length ? `<div class="bc-bar"><div style="width:${pct}%"></div></div>` : ''}
    ${line ? `<div class="bc-line">${line}</div>` : ''}
    <a class="pill-pink" href="#/rewards">${esc(S.viewRewards)}<span class="pill-ico">${svgIcon(ACTIVITY_ICONS.gift, { size: 17, stroke: 'var(--pink)', width: 1.8 })}</span></a>
  </div>`;
}

// ---------- การ์ดกิจวัตร ----------
function routineCard(a, today) {
  const entries = store.state.data.entries;
  const todayEntry = entries.find(e => e.activity_id === a.id && e.kind === 'earn' && e.entry_date === today && (e.status === 'pending' || e.status === 'confirmed'));
  const streak = currentStreak(confirmedDates(entries, a.id), today);
  const doneToday = todayEntry?.status === 'confirmed';
  // รอบที่ครบ 7 แล้วเมื่อวาน → วันนี้เริ่มรอบใหม่
  const filled = !doneToday && streak > 0 && streak % RULES.STREAK_LENGTH === 0 ? 0 : dotsFilled(streak);
  const dots = Array.from({ length: RULES.STREAK_LENGTH }, (_, i) => {
    if (i < filled) return `<span class="dot on">${svgIcon(UI_ICONS.check, { size: 14, stroke: 'var(--dot-check)', width: 2.4 })}</span>`;
    if (i === filled && !todayEntry) return '<span class="dot today"></span>';
    return '<span class="dot"></span>';
  }).join('');

  let foot;
  if (todayEntry?.status === 'confirmed') {
    foot = `<div class="rc-foot done"><span>${esc(S.doneToday)}</span>${svgIcon(UI_ICONS.check, { size: 18, stroke: 'var(--pink-deep)', width: 2.2 })}</div>`;
  } else if (todayEntry) {
    foot = `<div class="rc-foot wait"><span>${esc(S.pending)}</span></div>`;
  } else {
    const label = store.isAdmin() ? t('giveToday', { n: a.points }) : t('sendForConfirm', { n: a.points });
    foot = `<div class="rc-foot"><button type="button" class="rc-btn" data-earn="${a.id}" ${store.canWrite() ? '' : 'disabled'}>
      <span>${esc(label)}</span><span class="plus-circle">${svgIcon(UI_ICONS.plus, { size: 18, stroke: 'var(--plus-fg)', width: 2 })}</span></button></div>`;
  }

  const streakOn = a.streak_enabled;
  return `<article class="routine-card">
    <div class="corner-glow"></div>
    <div class="rc-icon">${svgIcon(ACTIVITY_ICONS[a.icon] || ACTIVITY_ICONS.star, { size: 22 })}</div>
    <div class="rc-body">
      <div class="rc-name">${esc(a.name)}</div>
      ${streakOn ? `<div class="rc-sub">${esc(t('streakDays', { n: streak }))}</div>` : ''}
      <div class="rc-boxes">
        <div class="rc-box"><div class="rc-k">${esc(S.perTime)}</div><div class="rc-v pink">${esc(t('perTimeValue', { n: a.points }))}</div></div>
        ${streakOn ? `<div class="rc-box"><div class="rc-k">${esc(S.bonusLabel)}</div><div class="rc-v">${esc(t('bonusValue', { b: a.streak_bonus }))}</div></div>` : ''}
      </div>
      ${streakOn ? `<div class="rc-dots"><div class="dots">${dots}</div><div class="rc-count">${esc(t('dotsCount', { n: filled }))}</div></div>
      <div class="rc-hint">${esc(t('daysToBonus', { n: daysToBonus(filled === 0 ? 0 : streak), b: a.streak_bonus }))}</div>` : ''}
    </div>
    ${foot}
  </article>`;
}

// ---------- รอยืนยัน ----------
function pendingSection() {
  const { entries, coupons } = store.state.data;
  const admin = store.isAdmin();
  const pend = entries
    .filter(e => e.kind === 'earn' && e.status === 'pending' && (admin || e.created_by === store.me().memberId))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const requests = admin ? coupons.filter(c => c.status === 'requested') : [];
  if (!pend.length && !requests.length) return '';

  const rows = pend.map(e => `<div class="pend-row">
    <div class="pend-main">
      <div class="pend-name">${esc(e.activity_name)}</div>
      <div class="pend-meta">${admin ? `${esc(nickname(e.created_by))} · ` : ''}${esc(t('pendingPoints', { n: e.points }))}</div>
    </div>
    ${admin
      ? `<button type="button" class="chip-btn dark" data-confirm="${e.id}" ${store.canWrite() ? '' : 'disabled'}>${esc(S.confirm)}</button>
         <button type="button" class="chip-btn" data-reject="${e.id}" ${store.canWrite() ? '' : 'disabled'}>${esc(S.reject)}</button>`
      : `<span class="status-pill">${esc(S.pending)}</span>`}
  </div>`).join('');

  const partner = store.state.data.members.find(m => m.role === 'partner');
  const tickets = requests.map(c => `<div class="req-ticket">
    <div class="ticket-main req-main">
      <div class="req-who">${esc(t('couponRequest', { name: partner?.nickname ?? S.rolePartnerName }))}</div>
      <div class="req-name">${esc(c.reward_name)}</div>
      <div class="req-actions">
        <button type="button" class="chip-btn dark" data-used="${c.id}" ${store.canWrite() ? '' : 'disabled'}>${esc(S.couponGiven)}</button>
        <button type="button" class="chip-btn" data-decline="${c.id}" ${store.canWrite() ? '' : 'disabled'}>${esc(S.couponNotUsed)}</button>
      </div>
    </div>
    <div class="ticket-stub req-stub"><span class="stub-pts">${c.cost}</span><span class="stub-unit">${esc(S.points)}</span></div>
  </div>`).join('');

  return `<h2 class="sec-title">${esc(S.pendingTitle)}</h2><div class="pend-list">${rows}${tickets}</div>`;
}

function draw() {
  const today = store.todayStr();
  const me = store.me();
  const admin = store.isAdmin();
  const acts = store.state.data.activities
    .filter(a => a.kind === 'earn' && a.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const routines = acts.length
    ? `<div class="routine-list">${acts.map(a => routineCard(a, today)).join('')}</div>`
    : `<div class="today-empty"><div class="corner-glow"></div>
        <span class="empty-ico tile">${svgIcon(admin ? UI_ICONS.plus : UI_ICONS.list, { size: 26 })}</span>
        <div class="empty-text">${esc(admin ? S.todayEmptyAdmin : S.todayEmptyPartner)}</div>
        ${admin ? `<a class="btn-pill" href="#/manage-activities/new">${svgIcon(UI_ICONS.plus, { size: 18, stroke: '#fff', width: 2 })}${esc(S.todayEmptyAdminButton)}</a>` : ''}
      </div>`;

  root.innerHTML = `<section class="screen">
    <header class="page-head">
      <div class="page-date">${esc(thaiDate())}</div>
      <div class="greet">${esc(t('greeting', { name: me?.nickname ?? '' }))}</div>
    </header>
    ${balanceCard()}
    <div class="sec-head"><h2 class="sec-title inline">${esc(S.routinesTitle)}</h2>
      ${admin ? `<a class="sec-link" href="#/manage-activities/new">${esc(S.addActivityLink)}</a>` : ''}</div>
    ${routines}
    ${pendingSection()}
  </section>`;

  root.querySelectorAll('[data-earn]').forEach(b => b.onclick = () => {
    const a = acts.find(x => x.id === b.dataset.earn);
    act(b, async () => { await api.logEarn(a.id); await store.refresh('entries'); },
      admin ? t('toastGiven', { n: a.points }) : S.toastSent);
  });
  root.querySelectorAll('[data-confirm]').forEach(b => b.onclick = () =>
    act(b, async () => { await api.decideEntry(b.dataset.confirm, true); await store.refresh('entries'); }));
  root.querySelectorAll('[data-reject]').forEach(b => b.onclick = () =>
    act(b, async () => { await api.decideEntry(b.dataset.reject, false); await store.refresh('entries'); }));
  root.querySelectorAll('[data-used]').forEach(b => b.onclick = () =>
    act(b, async () => { await api.markCouponUsed(b.dataset.used); await store.refresh('coupons'); }));
  root.querySelectorAll('[data-decline]').forEach(b => b.onclick = () =>
    act(b, async () => { await api.declineCouponRequest(b.dataset.decline); await store.refresh('coupons'); }));
}
