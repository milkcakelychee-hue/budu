// เริ่มต้นใช้: ต้อนรับ → เลือกบทบาท → (ผู้ดูแล) รหัสจับคู่ / (แฟน) กรอกรหัส · เข้าอีกครั้ง
import { S } from '../strings.js';
import { esc, logo } from '../ui.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from '../icons.js';
import * as api from '../api.js';
import * as store from '../store.js';

const ICON_SHARE = 'M12 15V3 M7 8l5-5 5 5 M5 12v8h14v-8';
const ICON_COPY = 'M9 9h11v11H9z M5 15H4V4h11v1';
const ICON_ALERT = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v6 M12 7.5h.01';

const isStandalone = () =>
  window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

// สถานะของหน้านี้ (คงอยู่ระหว่าง render ซ้ำจาก store)
const ui = { step: 'welcome', mode: 'new', role: 'admin', code: '', error: '', busy: false, pairCode: '' };

let unsub = null;
let root = null;

export function render(el) {
  root = el;
  // มี session อยู่แล้ว (ผู้ดูแลสร้างคู่แล้วรอแฟน) → อยู่หน้ารหัสจับคู่
  if (store.state.session && store.isAdmin() && ui.step !== 'pair') {
    ui.step = 'pair';
    api.getPairCode().then(c => { ui.pairCode = c; draw(); }).catch(() => {});
  }
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
}

function backBtn() {
  return `<div class="ob-top"><button type="button" class="round-btn" data-act="back" aria-label="ย้อนกลับ">${svgIcon(UI_ICONS.back, { size: 20 })}</button></div>`;
}

function title(text) { return `<h1 class="ob-title">${esc(text)}</h1>`; }

function viewWelcome() {
  return `
    <div class="ob-hero">
      <div class="glow-big"></div><div class="bubble b1"></div><div class="bubble b2"></div>
      ${logo(76)}
    </div>
    ${title(S.welcomeTitle)}
    <p class="ob-body">${esc(S.welcomeBody)}</p>
    ${isStandalone() ? '' : `
    <div class="note-card">
      <span class="note-ico">${svgIcon(ICON_SHARE, { size: 20, stroke: 'var(--pink-deep)', width: 1.7 })}</span>
      <div>${esc(S.welcomeInstall)}</div>
    </div>`}
    <div class="ob-actions"><button type="button" class="btn btn-primary" data-act="start">${esc(S.welcomeStart)}</button></div>
    <div class="ob-link"><button type="button" class="link-btn" data-act="rejoin">${esc(S.welcomeRejoin)}</button></div>`;
}

function roleCard(role, name, desc, icon) {
  const on = ui.role === role;
  return `<button type="button" class="role-card${on ? ' on' : ''}" data-act="role" data-role="${role}" aria-pressed="${on}">
    ${on ? '<div class="role-glow"></div>' : ''}
    <div class="role-row">
      <span class="role-ico">${svgIcon(icon, { size: 24 })}</span>
      <span class="radio">${on ? svgIcon(UI_ICONS.check, { size: 16, stroke: '#fff', width: 2.4 }) : ''}</span>
    </div>
    <div class="role-name">${esc(name)}</div>
    <div class="role-desc">${esc(desc)}</div>
  </button>`;
}

function viewRole() {
  return `${backBtn()}${title(S.roleTitle)}
    <div class="role-list">
      ${roleCard('admin', S.roleAdminName, S.roleAdminDesc, ACTIVITY_ICONS.star)}
      ${roleCard('partner', S.rolePartnerName, S.rolePartnerDesc, ACTIVITY_ICONS.heart)}
    </div>
    ${errorLine()}
    <div class="ob-actions"><button type="button" class="btn btn-primary" data-act="next" ${ui.busy || !store.state.online ? 'disabled' : ''}>${esc(S.next)}</button></div>`;
}

function viewPair() {
  const joined = store.partnerJoined();
  return `${title(S.pairTitle)}
    <p class="ob-body">${esc(S.pairDesc)}</p>
    <div class="code-card">
      <div class="glow-mid"></div>
      <div class="code-text">${esc(ui.pairCode || '····-····')}</div>
      <button type="button" class="btn btn-pink" data-act="copy">${svgIcon(ICON_COPY, { size: 18, stroke: '#fff', width: 1.7 })}${esc(S.pairCopy)}</button>
    </div>
    ${joined
      ? `<div class="status-card done"><span class="status-check">${svgIcon(UI_ICONS.check, { size: 16, stroke: '#fff', width: 2.4 })}</span><span>${esc(S.pairDone)}</span></div>`
      : `<div class="status-card"><span class="spinner"></span><span>${esc(S.pairWaiting)}</span></div>`}
    <div class="ob-actions${joined ? '' : ' dim'}"><button type="button" class="btn btn-primary" data-act="enter" ${joined ? '' : 'disabled'}>${esc(S.enterApp)}</button></div>`;
}

function viewCode() {
  const rejoin = ui.mode === 'rejoin';
  return `${backBtn()}${title(rejoin ? S.rejoinTitle : S.joinTitle)}
    <div class="ob-input"><input id="code" class="code-input${ui.error ? ' bad' : ''}" type="text" inputmode="text"
      autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="9"
      placeholder="XXXX-XXXX" aria-label="${esc(S.pairCode)}" value="${esc(ui.code)}"></div>
    ${errorLine()}
    <div class="ob-actions"><button type="button" class="btn btn-primary" data-act="submit" ${ui.busy || !store.state.online ? 'disabled' : ''}>${esc(rejoin ? S.rejoinButton : S.joinButton)}</button></div>`;
}

function errorLine() {
  return ui.error ? `<div class="err-line">${svgIcon(ICON_ALERT, { size: 18, stroke: 'var(--pink-deep)', width: 1.8 })}${esc(ui.error)}</div>` : '';
}

function draw() {
  const views = { welcome: viewWelcome, role: viewRole, pair: viewPair, code: viewCode };
  const focused = document.activeElement?.id === 'code';
  root.innerHTML = `<section class="screen no-nav onboarding">${views[ui.step]()}</section>`;
  root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', onAct));
  const input = root.querySelector('#code');
  if (input) {
    input.addEventListener('input', () => {
      const raw = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      input.value = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
      ui.code = input.value;
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submitCode(); });
    if (focused) input.focus();
  }
}

function go(step) { ui.step = step; ui.error = ''; draw(); window.scrollTo(0, 0); }

// เรียกฟังก์ชันจับคู่ · ถ้าเครื่องยังผูก anonymous user เก่าที่เป็นสมาชิกอยู่ ให้เริ่ม session ใหม่แล้วลองอีกครั้ง
async function withFreshAuth(fn) {
  await api.ensureSignedIn();
  try {
    return await fn();
  } catch (e) {
    if (e.code !== 'already_member') throw e;
    await api.signOut();
    await api.ensureSignedIn();
    return fn();
  }
}

async function run(fn) {
  if (ui.busy) return;
  ui.busy = true; ui.error = ''; draw();
  try {
    await fn();
  } catch (e) {
    ui.error = e instanceof api.ApiError ? e.message : S.genericError;
  } finally {
    ui.busy = false;
    draw();
  }
}

async function submitCode() {
  const code = ui.code.replace(/-/g, '');
  if (code.length !== 8) { ui.error = S.joinWrong; draw(); return; }
  await run(async () => {
    const r = await withFreshAuth(() =>
      ui.mode === 'rejoin' ? api.rejoin(code, ui.role) : api.joinCouple(code));
    store.setSession(r);
    await store.start();
    location.hash = '#/today';
  });
}

function onAct(e) {
  const btn = e.currentTarget;
  switch (btn.dataset.act) {
    case 'start': ui.mode = 'new'; go('role'); break;
    case 'rejoin': ui.mode = 'rejoin'; go('role'); break;
    case 'back': go(ui.step === 'code' ? 'role' : 'welcome'); break;
    case 'role': ui.role = btn.dataset.role; ui.error = ''; draw(); break;
    case 'next':
      if (ui.mode === 'new' && ui.role === 'admin') {
        run(async () => {
          const r = await withFreshAuth(() => api.createCouple());
          ui.pairCode = r.pair_code;
          store.setSession(r);
          ui.step = 'pair';
          await store.start();
        });
      } else {
        ui.code = ''; go('code');
      }
      break;
    case 'copy':
      navigator.clipboard?.writeText(ui.pairCode).catch(() => {});
      break;
    case 'enter':
      ui.step = 'welcome';
      location.hash = '#/today';
      break;
    case 'submit': submitCode(); break;
  }
}
