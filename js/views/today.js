// วันนี้: แต้มสะสม + รางวัลเป้าหมาย · กิจวัตรวันนี้ · รอยืนยัน (+ คำขอใช้คูปอง)
import { S, t, thaiDate } from '../strings.js';
import { esc, iconTile, act, ownerSwitch, ownerName, openSheet } from '../ui.js';
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

// ---------- กิจวัตร: ป้ายละ 1 กิจกรรม แสดงวงติ๊ก 7 ดวงและโบนัสเสมอ ----------

function routineRow(a, today) {
  const entries = store.state.data.entries;
  const once = a.once_per_day !== false;
  const todayEntries = entries.filter(e => e.activity_id === a.id && e.kind === 'earn' && e.entry_date === today && (e.status === 'pending' || e.status === 'confirmed'));
  // วันละครั้ง: รายการวันนี้ (ยืนยันแล้วก่อน) ล็อกแถว · หลายครั้งต่อวัน: กดได้ตลอด ไม่ล็อก
  const todayEntry = once ? (todayEntries.find(e => e.status === 'confirmed') ?? todayEntries[0]) : null;
  const doneToday = todayEntries.some(e => e.status === 'confirmed');
  const streak = currentStreak(confirmedDates(entries, a.id), today);
  // รอบที่ครบ 7 แล้วเมื่อวาน → วันนี้เริ่มรอบใหม่
  const filled = !doneToday && streak > 0 && streak % RULES.STREAK_LENGTH === 0 ? 0 : dotsFilled(streak);
  const streakOn = a.streak_enabled;

  let right;
  if (todayEntry?.status === 'confirmed') {
    right = `<span class="rr-state done">${esc(S.doneToday)}${svgIcon(UI_ICONS.check, { size: 16, stroke: 'var(--pink-deep)', width: 2.2 })}</span>`;
  } else if (todayEntry) {
    right = `<span class="rr-state">${esc(S.pending)}</span>`;
  } else {
    const label = store.isAdmin() ? t('giveToday', { n: a.points }) : t('sendForConfirm', { n: a.points });
    right = `<span class="rr-pts">${esc(t('perTimeValue', { n: a.points }))}</span>
      <button type="button" class="plus-circle rr-plus" data-earn="${a.id}" aria-label="${esc(label)}" ${store.canWrite() ? '' : 'disabled'}>${svgIcon(UI_ICONS.plus, { size: 18, stroke: 'var(--plus-fg)', width: 2 })}</button>`;
  }

  const dots = Array.from({ length: RULES.STREAK_LENGTH }, (_, i) => {
    if (i < filled) return `<span class="dot on">${svgIcon(UI_ICONS.check, { size: 14, stroke: 'var(--dot-check)', width: 2.4 })}</span>`;
    if (i === filled && !todayEntries.length) return '<span class="dot today"></span>';
    return '<span class="dot"></span>';
  }).join('');

  return `<div class="routine-row${todayEntry ? ' used' : ''}">
    <div class="rr-main">
      ${iconTile(a.icon, 40)}
      <div class="rr-text">
        <div class="rr-name">${esc(a.name)}</div>
        ${streakOn ? `<div class="rr-sub">${esc(t('streakDays', { n: streak }))} · ${esc(t('dotsCount', { n: filled }))}</div>`
          : !once ? `<div class="rr-sub">${esc(S.manyADayHint)}</div>` : ''}
      </div>
      ${right}
    </div>
    ${streakOn ? `<div class="rr-more">
      <div class="rc-dots"><div class="dots">${dots}</div><div class="rc-count">${esc(t('dotsCount', { n: filled }))}</div></div>
      ${filled === RULES.STREAK_LENGTH
        // วันที่ครบรอบ: ขึ้น "ครบรอบ +{b}" สีชมพู แทน "อีก 7 วันรับโบนัส" (ผู้ใช้กำหนด 16 พ.ย. 2569)
        ? `<div class="rc-hint done">${esc(t('statsBadgeDone', { b: a.streak_bonus }))}</div>`
        : `<div class="rc-hint">${esc(t('daysToBonus', { n: daysToBonus(filled === 0 ? 0 : streak), b: a.streak_bonus }))}</div>`}
    </div>` : ''}
  </div>`;
}

// ---------- ป้ายแต้มที่ปรายฟ้าให้วันนี้ (เตย/น้องตาล) ----------
// ปรายฟ้าไม่มีป้ายนี้ · มีปุ่มไปหน้าประวัติแทน (ผู้ใช้กำหนด 19 พ.ย. 2569)
function givenNotes(today) {
  if (store.isAdmin()) return historyButton();
  const admin = store.memberOf('admin');
  const given = store.state.data.entries
    .filter(e => e.kind === 'earn' && e.status === 'confirmed' && e.created_by === admin?.id && e.entry_date === today)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (!given.length) return '';
  return `<div class="given-list">${given.map(e => `<div class="given-note">
    <span class="given-ico">${svgIcon(ACTIVITY_ICONS.gift, { size: 16, stroke: 'var(--pink-deep)', width: 1.8 })}</span>
    <span class="given-text">${esc(t('givenNote', { n: e.points, name: admin.nickname }))} <b>${esc(e.activity_name)}</b></span>
  </div>`).join('')}</div>`;
}

const historyButton = () => `<a class="history-link" href="#/history">${svgIcon(UI_ICONS.list, { size: 18, stroke: 'currentColor', width: 1.8 })}${esc(S.viewHistory)}${svgIcon(UI_ICONS.chevron, { size: 16, stroke: 'currentColor', width: 2 })}</a>`;

// ---------- การ์ดเล็กแต้มของอีกคน (เตย ↔ น้องตาล) ----------
function otherCard() {
  const r = store.me()?.role;
  if (r !== 'partner' && r !== 'kid') return '';
  const other = r === 'partner' ? 'kid' : 'partner';
  if (!store.memberOf(other)) return '';
  const n = store.state.summary?.[other] ?? 0;
  const d = store.state.summary?.[`${other}_deducted`] ?? 0;
  return `<button type="button" class="other-card" data-other="${other}">
    <span class="oc-text">${esc(S.otherNow)} <b>${esc(ownerName(other))}</b> ${esc(t('otherEarned', { n: n < 0 ? '−' + Math.abs(n) : n }))} ${esc(t('otherDeducted', { n: d }))}</span>
    <span class="oc-tap">${esc(S.otherTap)}</span>
  </button>`;
}

// แผ่นล่าง: เรื่องล่าสุดของอีกคน (ได้แต้ม โดนหัก แลกรางวัล)
async function openRecent(owner) {
  const { el, close } = openSheet(`<h2 class="sheet-title">${esc(t('otherRecentTitle', { name: ownerName(owner) }))}</h2>
    <div class="recent-list"><div class="recent-empty">…</div></div>
    <button type="button" class="btn btn-secondary" data-close>${esc(S.close)}</button>`);
  el.querySelector('[data-close]').onclick = close;
  const box = el.querySelector('.recent-list');
  try {
    const list = await api.ownerRecent(owner);
    box.innerHTML = list.length ? list.map(r => `<div class="recent-row">
      <div class="recent-main">
        <div class="recent-name">${esc(r.activity_name)}</div>
        <div class="recent-meta">${esc(S[`recentKind_${r.kind}`] ?? '')} · ${esc(thaiDate(new Date(`${r.entry_date}T12:00:00+07:00`)))}</div>
      </div>
      <span class="recent-pts${r.points > 0 ? ' up' : ''}">${r.points > 0 ? '+' + r.points : '−' + Math.abs(r.points)}</span>
    </div>`).join('') : `<div class="recent-empty">${esc(S.otherRecentEmpty)}</div>`;
  } catch (err) {
    box.innerHTML = `<div class="err-line">${esc(err.message || S.genericError)}</div>`;
  }
}

// ---------- รอยืนยัน ----------
function pendingSection() {
  const admin = store.isAdmin();
  // ปรายฟ้าเห็นรายการรอยืนยันของทุกคนเสมอ ไม่ขึ้นกับปุ่มสลับ
  const { entries, coupons } = admin ? store.state.all : store.state.data;
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

  const tickets = requests.map(c => `<div class="req-ticket">
    <div class="ticket-main req-main">
      <div class="req-who">${esc(t('couponRequest', { name: ownerName(c.owner ?? 'partner') }))}</div>
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
    .sort((a, b) => b.points - a.points || a.sort_order - b.sort_order); // แต้มต่อครั้งมาก→น้อย (เท่ากันเรียงตามที่เพิ่ม)
  // วันละครั้งที่กดแล้ววันนี้ (ทำแล้ว/รอยืนยัน) ย้ายไปล่างสุด
  const usedToday = a => a.once_per_day !== false && store.state.data.entries.some(e => e.activity_id === a.id && e.kind === 'earn'
    && e.entry_date === today && (e.status === 'pending' || e.status === 'confirmed'));
  acts.sort((a, b) => usedToday(a) - usedToday(b));

  const routines = acts.length
    ? `<div class="routine-rows">${acts.map(a => routineRow(a, today)).join('')}</div>`
    : `<div class="today-empty"><div class="corner-glow"></div>
        <span class="empty-ico tile">${svgIcon(admin ? UI_ICONS.plus : UI_ICONS.list, { size: 26 })}</span>
        <div class="empty-text">${esc(admin ? S.todayEmptyAdmin : S.todayEmptyPartner)}</div>
      </div>`;

  root.innerHTML = `<section class="screen">
    <div class="dark-orbs" aria-hidden="true"><span class="o1"></span><span class="o2"></span></div>
    <header class="page-head">
      <div class="page-date">${esc(thaiDate())}</div>
      <div class="greet">${esc(t('greeting', { name: me?.nickname ?? '' }))}</div>
    </header>
    ${pendingSection()}
    ${ownerSwitch()}
    ${balanceCard()}
    ${givenNotes(today)}
    ${otherCard()}
    <div class="sec-head"><h2 class="sec-title inline">${esc(S.routinesTitle)}</h2>
      ${admin ? `<a class="btn-pill sm" href="#/manage-activities/new">${svgIcon(UI_ICONS.plus, { size: 16, stroke: 'currentColor', width: 2 })}${esc(S.todayEmptyAdminButton)}</a>` : ''}</div>
    ${routines}
  </section>`;

  root.querySelector('[data-other]')?.addEventListener('click', e => openRecent(e.currentTarget.dataset.other));
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
