// หักแต้ม: สรุปสัปดาห์ · ป้ายเรื่องที่หักแต้ม (ผู้ดูแลกด −) · ประวัติการโดนหักแต้ม · แฟนดูอย่างเดียว
import { S, t } from '../strings.js';
import { esc, pageHead, iconTile, confirmSheet, act, fmtTime } from '../ui.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from '../icons.js';
import * as api from '../api.js';
import * as store from '../store.js';
import { weekStart, addDays } from '../streak.js';

let root = null;
let unsub = null;

export function render(el) {
  root = el;
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
}

function draw() {
  const { activities, entries, members } = store.state.data;
  const admin = store.isAdmin();
  const acts = activities.filter(a => a.kind === 'deduct' && a.is_active).sort((a, b) => b.points - a.points || a.sort_order - b.sort_order);
  const deducts = entries.filter(e => e.kind === 'deduct' && e.status === 'confirmed');

  const thisWeek = weekStart(store.todayStr());
  const lastWeek = addDays(thisWeek, -7);
  const inWeek = (e, w) => e.entry_date >= w && e.entry_date < addDays(w, 7);
  const sum = list => list.reduce((s, e) => s + Math.abs(e.points), 0);
  const weekList = deducts.filter(e => inWeek(e, thisWeek));
  const lastList = deducts.filter(e => inWeek(e, lastWeek));

  if (!acts.length && !deducts.length) {
    root.innerHTML = `<section class="screen">${pageHead(S.deductTitle)}
      <div class="plain-empty">
        <span class="empty-ico tile">${svgIcon(UI_ICONS.deduct, { size: 26 })}</span>
        <div class="empty-text">${esc(admin ? S.deductEmpty : S.deductEmptyPartner)}</div>
        ${admin ? `<a class="btn-pill" href="#/manage-activities/new-deduct">${esc(S.deductEmptyButton)}</a>` : ''}
      </div></section>`;
    return;
  }

  // ป้ายละกิจกรรม เรียงแบบหน้าวันนี้ (แต้มมากไปน้อย)
  const tiles = acts.map(a => `<div class="routine-row">
    <div class="rr-main">
      ${iconTile(a.icon, 40)}
      <div class="rr-text">
        <div class="rr-name">${esc(a.name)}</div>
        <div class="rr-sub">${esc(t('deductWeekCount', { n: weekList.filter(e => e.activity_id === a.id).length }))}</div>
      </div>
      <span class="rr-pts">−${a.points}</span>
      ${admin ? `<button type="button" class="minus-btn" data-deduct="${a.id}" aria-label="${esc(S.deductTitle)} ${esc(a.name)}" ${store.canWrite() ? '' : 'disabled'}>${svgIcon(UI_ICONS.minus, { size: 18, stroke: 'var(--plus-fg)', width: 2 })}</button>` : ''}
    </div>
  </div>`).join('');

  const iconOf = id => activities.find(a => a.id === id)?.icon;
  const nick = id => members.find(m => m.id === id)?.nickname ?? '';
  const hist = [...deducts].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(e => `<div class="hist-row">
      ${iconTile(iconOf(e.activity_id), 40)}
      <div class="list-main"><div class="hist-name">${esc(e.activity_name)}</div>
        <div class="list-meta">${esc(fmtTime(e.created_at))} · ${esc(nick(e.created_by))}</div></div>
      <span class="hist-pts">−${Math.abs(e.points)}</span>
    </div>`).join('<div class="hist-sep"></div>');

  root.innerHTML = `<section class="screen">
    ${pageHead(S.deductTitle)}
    <div class="summary-card">
      <div class="glow-mid"></div>
      <div class="bc-label">${esc(S.deductWeekTotal)}</div>
      <div class="sum-num">−${sum(weekList)}</div>
      <div class="sum-meta">${esc(t('deductWeekMeta', { n: weekList.length, m: sum(lastList) }))}</div>
    </div>
    ${acts.length || admin ? `<div class="sec-head sm"><h2 class="sec-title inline sm">${esc(S.deductItems)}</h2>
      ${admin ? `<a class="btn-pill sm" href="#/manage-activities/new-deduct">${svgIcon(UI_ICONS.plus, { size: 16, stroke: 'currentColor', width: 2 })}${esc(S.activityAdd)}</a>` : ''}</div>` : ''}
    ${acts.length ? `<div class="routine-rows">${tiles}</div>` : ''}
    ${deducts.length ? `<h2 class="sec-title sm">${esc(S.deductHistory)}</h2><div class="hist-card">${hist}</div>` : ''}
  </section>`;

  root.querySelectorAll('[data-deduct]').forEach(b => b.onclick = async () => {
    if (document.querySelector('.sheet-wrap')) return; // กันเปิดแผ่นยืนยันซ้อนเมื่อกดรัว
    const a = acts.find(x => x.id === b.dataset.deduct);
    const ok = await confirmSheet({
      title: S.deductConfirmTitle,
      preview: `<div class="confirm-preview">${iconTile(a.icon, 44)}<span class="cp-name">${esc(a.name)}</span><span class="cp-pts">−${a.points}</span></div>`,
      ok: t('deductConfirmButton', { n: a.points }),
    });
    if (!ok) return;
    act(b, async () => { await api.logDeduct(a.id); await store.refresh('entries'); }, t('toastDeducted', { n: a.points }));
  });
}
