// จัดการกิจกรรม (เฉพาะผู้ดูแล): รายการแยก ให้แต้ม / หักแต้ม · แผ่นล่างเพิ่ม/แก้/ซ่อน
import { S, t } from '../strings.js';
import { RULES } from '../config.js';
import { esc, subHead, iconTile, hiddenBadge, chevron, emptyCard, openSheet, field, stepper, bindSteppers, switchRow } from '../ui.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from '../icons.js';
import * as api from '../api.js';
import * as store from '../store.js';

let root = null;
let unsub = null;

export function render(el) {
  root = el;
  if (!store.can.manage) { location.replace('#/settings'); return; }
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
  // เปิดแผ่นเพิ่มทันทีเมื่อมาจากปุ่ม "เพิ่มกิจกรรม" (#/manage-activities/new หรือ /new-deduct)
  const sub = location.hash.split('/')[2];
  if (sub === 'new' || sub === 'new-deduct') {
    history.replaceState(null, '', '#/manage-activities');
    openForm(null, sub === 'new-deduct' ? 'deduct' : 'earn');
  }
}

function row(a) {
  const earn = a.kind === 'earn';
  return `<button type="button" class="list-row${a.is_active ? '' : ' dim'}" data-id="${a.id}">
    ${iconTile(a.icon)}
    <div class="list-main">
      <div class="list-name">${esc(a.name)}</div>
      ${earn && a.streak_enabled ? `<div class="list-meta">${esc(t('bonusListLabel', { b: a.streak_bonus }))}</div>` : ''}
    </div>
    ${a.is_active ? '' : hiddenBadge()}
    <span class="list-pts${earn ? ' earn' : ''}">${earn ? '+' : '−'}${a.points}</span>
    ${chevron()}
  </button>`;
}

function group(label, list) {
  if (!list.length) return '';
  return `<div class="group-label">${esc(label)}</div>
    <div class="list-card">${list.map(row).join('<div class="list-sep"></div>')}</div>`;
}

function draw() {
  const acts = [...store.state.data.activities].sort((a, b) => a.sort_order - b.sort_order);
  const earn = acts.filter(a => a.kind === 'earn');
  const deduct = acts.filter(a => a.kind === 'deduct');
  root.innerHTML = `<section class="screen no-nav has-fab">
    ${subHead(S.manageActivities, '#/settings')}
    ${acts.length
      ? group(S.kindEarnOpt, earn) + group(S.kindDeductOpt, deduct)
      : emptyCard(UI_ICONS.list, S.activitiesEmpty)}
  </section>
  <div class="fab"><button type="button" class="btn btn-primary" data-add ${store.canWrite() ? '' : 'disabled'}>${svgIcon(UI_ICONS.plus, { size: 18, stroke: 'currentColor', width: 2 })}${esc(S.activityAdd)}</button></div>`;
  root.querySelector('[data-add]').onclick = () => openForm(null, 'earn');
  root.querySelectorAll('.list-row').forEach(b => {
    b.onclick = () => openForm(store.state.data.activities.find(a => a.id === b.dataset.id));
  });
}

function openForm(act, kindForNew = 'earn') {
  const isNew = !act;
  const v = act ?? { name: '', kind: kindForNew, points: 5, streak_bonus: RULES.STREAK_BONUS_DEFAULT, icon: 'moon', streak_enabled: true, is_active: true };
  let kind = v.kind;
  let icon = v.icon;

  const { el, close } = openSheet(`<form class="sheet-form" style="display:contents" novalidate>
    <h2 class="sheet-title">${esc(isNew ? S.activityAdd : S.activityEdit)}</h2>
    ${field(S.activityName, `<input class="text-input" name="name" maxlength="60" autocomplete="off" placeholder="${esc(S.activityNamePh)}" value="${esc(v.name)}">`)}
    ${field(S.kindLabel, isNew
      ? `<div class="seg"><button type="button" data-kind="earn">${esc(S.kindEarnOpt)}</button><button type="button" data-kind="deduct">${esc(S.kindDeductOpt)}</button></div>`
      : `<span class="kind-badge">${esc(kind === 'earn' ? S.kindEarnOpt : S.kindDeductOpt)}</span>`)}
    <div class="kind-fields"></div>
    ${field(S.icon, `<div class="icon-grid">${Object.entries(ACTIVITY_ICONS).map(([k, d]) =>
      `<button type="button" data-icon="${k}" aria-label="${k}">${svgIcon(d, { size: 22 })}</button>`).join('')}</div>`)}
    <div class="streak-row"></div>
    ${switchRow(S.hideActivity, 'hidden', !v.is_active)}
    <div class="form-err"></div>
    <button type="submit" class="btn btn-primary" ${store.canWrite() ? '' : 'disabled'}>${esc(S.save)}</button>
  </form>`);

  const form = el.querySelector('form');
  const drawKind = () => {
    // ค่าที่กรอกไว้แล้วคงไว้เมื่อสลับชนิด
    const pts = form.elements.points?.value ?? v.points;
    const bonus = form.elements.bonus?.value ?? v.streak_bonus;
    const streakOn = form.elements.streak ? form.elements.streak.checked : v.streak_enabled;
    el.querySelectorAll('[data-kind]').forEach(b => b.classList.toggle('on', b.dataset.kind === kind));
    el.querySelector('.kind-fields').innerHTML = kind === 'earn'
      ? `<div class="row2">${field(S.pointsPerTime, stepper('points', pts))}${field(S.bonus7, stepper('bonus', bonus, { min: 0 }))}</div>`
      : field(S.deductPerTime, stepper('points', pts, { sign: '−' }));
    el.querySelector('.streak-row').innerHTML = kind === 'earn' ? switchRow(S.streakToggle, 'streak', streakOn) : '';
    bindSteppers(el.querySelector('.kind-fields'));
  };
  const drawIcon = () => el.querySelectorAll('[data-icon]').forEach(b => b.classList.toggle('on', b.dataset.icon === icon));

  el.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { kind = b.dataset.kind; drawKind(); });
  el.querySelectorAll('[data-icon]').forEach(b => b.onclick = () => { icon = b.dataset.icon; drawIcon(); });
  drawKind(); drawIcon();

  form.onsubmit = async e => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const errBox = el.querySelector('.form-err');
    if (!name) { form.elements.name.focus(); return; }
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true; errBox.innerHTML = '';
    try {
      await api.upsertActivity({
        id: act?.id ?? null,
        name,
        kind,
        points: +form.elements.points.value,
        streak_bonus: kind === 'earn' ? +form.elements.bonus.value : v.streak_bonus,
        icon,
        streak_enabled: kind === 'earn' ? form.elements.streak.checked : false,
        is_active: !form.elements.hidden.checked,
      });
      close();
      store.refresh('activities');
    } catch (err) {
      errBox.innerHTML = `<div class="err-line">${esc(err.message || S.genericError)}</div>`;
      btn.disabled = !store.canWrite();
    }
  };
}
