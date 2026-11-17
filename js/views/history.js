// ประวัติ: รายการทั้งหมดใหม่ → เก่า จัดกลุ่มตามวัน · ผู้ดูแลแตะรายการให้แต้ม/หักแต้มที่ยืนยันแล้ว → ยกเลิกรายการ
import { S, thaiDate } from '../strings.js';
import { esc, subHead, iconTile, openSheet, confirmSheet, act, ownerSwitch } from '../ui.js';
import { svgIcon, UI_ICONS } from '../icons.js';
import * as api from '../api.js';
import * as store from '../store.js';

const ICON_X = 'M6 6l12 12 M18 6L6 18';
const KIND = { earn: 'kindEarn', deduct: 'kindDeduct', streak_bonus: 'kindBonus', redeem: 'kindRedeem' };
const STATUS = { pending: 'statusPending', rejected: 'statusRejected', cancelled: 'statusCancelled' };
const TIME = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false });

let root = null;
let unsub = null;

export function render(el) {
  root = el;
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
}

const cancellable = e => store.can.cancelEntry && (e.kind === 'earn' || e.kind === 'deduct') && e.status === 'confirmed';

function rowHtml(e, { asButton = true } = {}) {
  const { activities, members } = store.state.data;
  const icon = e.kind === 'redeem' ? 'gift' : e.kind === 'streak_bonus' ? 'star' : activities.find(a => a.id === e.activity_id)?.icon;
  const who = members.find(m => m.id === e.created_by)?.nickname;
  const off = e.status === 'rejected' || e.status === 'cancelled';
  const pts = e.points > 0 ? `+${e.points}` : `−${Math.abs(e.points)}`;
  const tag = asButton && cancellable(e) ? 'button type="button"' : 'div';
  return `<${tag} class="hrow${off ? ' off' : ''}" data-id="${e.id}">
    ${iconTile(icon, 42)}
    <div class="list-main">
      <div class="hrow-name">${esc(e.activity_name)}</div>
      <div class="list-meta">${esc(S[KIND[e.kind]])} · ${esc(TIME.format(new Date(e.created_at)))}${who ? ` · ${esc(who)}` : ''}</div>
    </div>
    <div class="hrow-right">
      <span class="hrow-pts${e.points > 0 ? ' plus' : ''}">${pts}</span>
      ${STATUS[e.status] ? `<span class="status-pill sm${e.status === 'pending' ? '' : ' grey'}">${esc(S[STATUS[e.status]])}</span>` : ''}
    </div>
  </${tag.split(' ')[0]}>`;
}

function draw() {
  const entries = [...store.state.data.entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at));
  let body;
  if (!entries.length) {
    body = `<div class="plain-empty"><span class="empty-ico tile">${svgIcon(UI_ICONS.list, { size: 26 })}</span><div class="empty-text">${esc(S.historyEmpty)}</div></div>`;
  } else {
    const groups = new Map();
    for (const e of entries) { if (!groups.has(e.entry_date)) groups.set(e.entry_date, []); groups.get(e.entry_date).push(e); }
    body = [...groups].map(([d, list]) => `<div class="group-label">${esc(thaiDate(new Date(`${d}T12:00:00+07:00`)))}</div>
      <div class="list-card">${list.map(e => rowHtml(e)).join('<div class="hist-sep"></div>')}</div>`).join('');
  }
  root.innerHTML = `<section class="screen">${subHead(S.historyTitle, '#/stats')}${ownerSwitch()}${body}</section>`;
  root.querySelectorAll('button.hrow').forEach(b => b.onclick = () => openOptions(entries.find(e => e.id === b.dataset.id)));
}

function openOptions(e) {
  if (document.querySelector('.sheet-wrap')) return;
  const { el, close } = openSheet(`
    <div class="option-preview">${rowHtml(e, { asButton: false })}</div>
    <button type="button" class="btn btn-outline-danger" data-cancel-entry ${store.canWrite() ? '' : 'disabled'}>${svgIcon(ICON_X, { size: 18, width: 1.8 })}${esc(S.cancelEntry)}</button>
    <button type="button" class="btn btn-secondary" data-close>${esc(S.close)}</button>`);
  el.querySelector('[data-close]').onclick = close;
  el.querySelector('[data-cancel-entry]').onclick = async ev => {
    const btn = ev.currentTarget;
    close();
    const ok = await confirmSheet({ title: S.cancelEntryConfirm, ok: S.cancelEntry, danger: true });
    if (!ok) return;
    await act(btn, async () => { await api.cancelEntry(e.id); await store.refresh('entries'); });
  };
}
