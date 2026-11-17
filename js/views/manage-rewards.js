// จัดการรางวัล (เฉพาะผู้ดูแล): ตั๋วรางวัลเรียงแต้มมากไปน้อย · แผ่นล่างเพิ่ม/แก้/ซ่อน/ลบ
import { S, t } from '../strings.js';
import { esc, subHead, hiddenBadge, chevron, emptyCard, openSheet, confirmSheet, noticeSheet, field, switchRow, ownerSwitch, ownerPicker } from '../ui.js';
import { svgIcon, UI_ICONS } from '../icons.js';
import * as api from '../api.js';
import * as store from '../store.js';

const ICON_TRASH = 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3';

let root = null;
let unsub = null;

export function render(el) {
  root = el;
  if (!store.can.manage) { location.replace('#/settings'); return; }
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
  if (location.hash.split('/')[2] === 'new') {
    history.replaceState(null, '', '#/manage-rewards');
    openForm(null);
  }
}

function ticket(r) {
  return `<button type="button" class="ticket${r.is_active ? '' : ' dim'}" data-id="${r.id}">
    <div class="ticket-main">
      <span class="ticket-name">${esc(r.name)}</span>
      ${r.is_active ? '' : hiddenBadge()}
      ${chevron()}
    </div>
    <div class="ticket-stub"><span class="stub-pts">${r.cost}</span><span class="stub-unit">${esc(S.points)}</span></div>
  </button>`;
}

function draw() {
  const rewards = [...store.state.data.rewards].sort((a, b) => b.cost - a.cost);
  root.innerHTML = `<section class="screen no-nav has-fab">
    ${subHead(S.manageRewards, '#/settings')}
    ${ownerSwitch()}
    ${rewards.length
      ? `<div class="ticket-list">${rewards.map(ticket).join('')}</div>`
      : emptyCard(UI_ICONS.rewards, S.rewardsEmpty)}
  </section>
  <div class="fab"><button type="button" class="btn btn-primary" data-add ${store.canWrite() ? '' : 'disabled'}>${svgIcon(UI_ICONS.plus, { size: 18, width: 2 })}${esc(S.rewardAdd)}</button></div>`;
  root.querySelector('[data-add]').onclick = () => openForm(null);
  root.querySelectorAll('.ticket').forEach(b => {
    b.onclick = () => openForm(store.state.data.rewards.find(r => r.id === b.dataset.id));
  });
}

function openForm(rw) {
  const isNew = !rw;
  const picker = ownerPicker(rw?.owner);
  const { el, close } = openSheet(`<form style="display:contents" novalidate>
    <div class="sheet-top"><button type="button" class="round-btn" data-close aria-label="${S.a11yBack}">${svgIcon(UI_ICONS.back, { size: 20 })}</button></div>
    <h2 class="sheet-title">${esc(isNew ? S.rewardAdd : S.rewardEdit)}</h2>
    ${field(S.rewardName, `<input class="text-input" name="name" maxlength="60" autocomplete="off" value="${esc(rw?.name ?? '')}">`)}
    ${picker.html}
    ${field(S.rewardCost, `<input class="text-input" name="cost" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" value="${rw?.cost ?? ''}">`)}
    ${switchRow(S.hideReward, 'hidden', rw ? !rw.is_active : false)}
    <div class="form-err"></div>
    <button type="submit" class="btn btn-primary" ${store.canWrite() ? '' : 'disabled'}>${esc(S.save)}</button>
    ${isNew ? '' : `<button type="button" class="btn btn-outline-danger" data-delete ${store.canWrite() ? '' : 'disabled'}>${svgIcon(ICON_TRASH, { size: 18, width: 1.8 })}${esc(S.deleteReward)}</button>`}
  </form>`);

  const form = el.querySelector('form');
  el.querySelector('[data-close]').onclick = close;
  const errBox = el.querySelector('.form-err');
  const showErr = msg => { errBox.innerHTML = `<div class="err-line">${esc(msg)}</div>`; };
  picker.bind(el);
  form.elements.cost.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });

  form.onsubmit = async e => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const cost = parseInt(form.elements.cost.value, 10);
    if (!name) { form.elements.name.focus(); return; }
    if (!(cost >= 1 && cost <= 99999)) { form.elements.cost.focus(); return; }
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true; errBox.innerHTML = '';
    try {
      const base = { name, cost, is_active: !form.elements.hidden.checked };
      if (!isNew) await api.upsertReward({ ...base, id: rw.id, owner: rw.owner });
      for (const o of picker.owners) if (o !== rw?.owner) await api.upsertReward({ ...base, id: null, owner: o });
      close();
      store.refresh('rewards');
    } catch (err) {
      showErr(err.message || S.genericError);
      btn.disabled = !store.canWrite();
    }
  };

  el.querySelector('[data-delete]')?.addEventListener('click', async () => {
    close();
    const ok = await confirmSheet({
      title: S.deleteRewardTitle,
      body: t('deleteRewardBody', { reward: rw.name }),
      ok: S.deleteRewardButton,
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteReward(rw.id);
      store.refresh('rewards');
    } catch (err) {
      noticeSheet(err.message || S.genericError);
    }
  });
}
