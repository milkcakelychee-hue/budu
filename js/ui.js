// ส่วนประกอบหน้าจอที่ใช้ซ้ำ
import { S, thaiDate } from './strings.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from './icons.js';
import * as store from './store.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function pageHead(title, { back } = {}) {
  return `<header class="page-head">
    ${back ? `<a class="back-link" href="${back}">${svgIcon(UI_ICONS.back, { size: 20, width: 1.8 })}</a>` : ''}
    <div class="page-date">${esc(thaiDate())}</div>
    <h1 class="page-title">${esc(title)}</h1>
  </header>`;
}

export function logo(size = 64) {
  return `<span class="logo" style="font-size:${size}px">${esc(S.logo)}<span class="heart">${svgIcon(ACTIVITY_ICONS.heart, { size: '100%', stroke: 'var(--pink)', width: 2.4 })}</span></span>`;
}

// หน้าเปล่าชั่วคราว (ขั้น 1)
export function placeholder(el, title, label, back) {
  el.innerHTML = `<section class="screen">${pageHead(title, { back })}<div class="placeholder">${esc(label)}</div></section>`;
}

// ---------- แผ่นล่าง ----------
// openSheet(html) → { el, close, onClose } · แตะพื้นหลังเพื่อปิด
export function openSheet(html) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-scrim"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div>${html}</div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('sheet-open');
  // ให้แผ่นล่างพอดีกับพื้นที่ที่มองเห็นจริง (ตอนคีย์บอร์ด iPhone เปิด)
  const vv = window.visualViewport;
  const fit = () => { if (vv) { wrap.style.top = vv.offsetTop + 'px'; wrap.style.height = vv.height + 'px'; wrap.style.bottom = 'auto'; } };
  fit();
  vv?.addEventListener('resize', fit); vv?.addEventListener('scroll', fit);
  const closers = [() => { vv?.removeEventListener('resize', fit); vv?.removeEventListener('scroll', fit); }];
  const close = () => {
    if (!wrap.isConnected) return;
    wrap.remove();
    if (!document.querySelector('.sheet-wrap')) document.body.classList.remove('sheet-open');
    closers.forEach(fn => fn());
  };
  wrap.querySelector('.sheet-scrim').addEventListener('click', close);
  return { el: wrap.querySelector('.sheet'), close, onClose: fn => closers.push(fn) };
}

// แผ่นยืนยัน · resolve(true) เมื่อกดยืนยัน
export function confirmSheet({ title, body = '', preview = '', ok, cancel = S.cancel, danger = false }) {
  return new Promise(resolve => {
    const { el, close, onClose } = openSheet(`
      <h2 class="sheet-title">${esc(title)}</h2>
      ${body ? `<p class="sheet-body">${esc(body)}</p>` : ''}
      ${preview}
      <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(ok)}</button>
      <button type="button" class="btn btn-secondary" data-cancel>${esc(cancel)}</button>`);
    let result = false;
    onClose(() => resolve(result));
    el.querySelector('[data-ok]').onclick = () => { result = true; close(); };
    el.querySelector('[data-cancel]').onclick = close;
  });
}

// แผ่นแจ้งข้อความ (ใช้ตอนทำไม่สำเร็จ) มีปุ่มปิดปุ่มเดียว
export function noticeSheet(text) {
  const { el, close } = openSheet(`<div class="err-line">${esc(text)}</div>
    <button type="button" class="btn btn-secondary" data-close>${esc(S.close)}</button>`);
  el.querySelector('[data-close]').onclick = close;
}

// ---------- ส่วนฟอร์ม ----------
export const field = (label, inner) => `<div class="field"><div class="field-label">${esc(label)}</div>${inner}</div>`;

export const switchRow = (label, name, on) =>
  `<label class="switch-row">${esc(label)}<input type="checkbox" class="switch" name="${name}" ${on ? 'checked' : ''}></label>`;

export const stepper = (name, value, { sign = '+', min = 1, max = 999 } = {}) =>
  `<div class="stepper" data-min="${min}" data-max="${max}">
    <button type="button" class="step-btn" data-step="-1" aria-label="${S.a11yDecrease}">${svgIcon(UI_ICONS.minus, { size: 18, width: 1.8 })}</button>
    <label class="step-val"><span class="step-sign">${sign}</span><input class="step-input" type="text" inputmode="numeric" pattern="[0-9]*" name="${name}" value="${value}" autocomplete="off"></label>
    <button type="button" class="step-btn" data-step="1" aria-label="${S.a11yIncrease}">${svgIcon(UI_ICONS.plus, { size: 18, width: 1.8 })}</button>
  </div>`;

// กด -/+ หรือพิมพ์ตัวเลขเองได้ · ค่าถูกบีบให้อยู่ในช่วง min–max ตอนออกจากช่อง
export function bindSteppers(root) {
  root.querySelectorAll('.stepper').forEach(st => {
    const input = st.querySelector('input');
    const min = +st.dataset.min, max = +st.dataset.max;
    const clamp = () => {
      const n = parseInt(input.value.replace(/\D/g, ''), 10);
      input.value = Math.min(max, Math.max(min, Number.isNaN(n) ? min : n));
    };
    input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, String(max).length); });
    input.addEventListener('blur', clamp);
    input.addEventListener('focus', () => input.select());
    st.querySelectorAll('.step-btn').forEach(b => b.addEventListener('click', () => {
      clamp();
      input.value = Math.min(max, Math.max(min, +input.value + +b.dataset.step));
    }));
  });
}

export const hiddenBadge = () =>
  `<span class="badge-hidden">${svgIcon(UI_ICONS.hidden, { size: 12, width: 2 })}${esc(S.hiddenBadge)}</span>`;

export const iconTile = (name, size = 42) =>
  `<span class="icon-tile" style="width:${size}px;height:${size}px">${svgIcon(ACTIVITY_ICONS[name] || ACTIVITY_ICONS.star, { size: 22 })}</span>`;

export const emptyCard = (icon, text, extra = '') =>
  `<div class="empty-card"><div class="glow-mid"></div><span class="empty-ico">${svgIcon(icon, { size: 26 })}</span><div class="empty-text">${esc(text)}</div>${extra}</div>`;

// เวลาแบบ "ศ. 13 พ.ย. 00:30" (เวลาไทย)
const TIME_FMT = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtTime = iso => TIME_FMT.format(new Date(iso));
// วันที่แบบ "15 พ.ย. 2569"
const DATE_FMT = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDate = iso => DATE_FMT.format(new Date(iso));

// ปุ่มที่เขียนข้อมูล: ปิดทันที (กันกดรัว) → รอผล → toast หรือแจ้งผิดพลาด
export async function act(btn, fn, okText) {
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    await fn();
    if (okText) toast(okText);
    return true;
  } catch (e) {
    noticeSheet(e?.message || S.genericError);
    btn.disabled = false;
    return false;
  }
}

// ---------- toast ----------
let toastTimer;
export function toast(text) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.innerHTML = `<span class="toast-check">${svgIcon(UI_ICONS.check, { size: 14, stroke: '#111', width: 2.4 })}</span>${esc(text)}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

// หัวหน้าจอแบบมีปุ่มย้อนกลับวงกลม (หน้าจัดการ)
export const subHead = (title, back) =>
  `<div class="sub-top"><a class="round-btn" href="${back}" aria-label="${S.a11yBack}">${svgIcon(UI_ICONS.back, { size: 20 })}</a></div><h1 class="sub-title">${esc(title)}</h1>`;

export const chevron = () => `<span class="chev">${svgIcon(UI_ICONS.chevron, { size: 18, width: 1.8 })}</span>`;

// ปุ่มสลับ "เตย | น้องตาล" (เฉพาะปรายฟ้า) · กดแล้ว app.js เรียก store.setViewOwner
export const ownerName = role => store.memberOf(role)?.nickname ?? (role === 'kid' ? S.roleKidName : S.rolePartnerName);
export function ownerSwitch() {
  if (!store.isAdmin()) return '';
  const o = store.owner();
  // การ์ดคน 2 ใบ (วงกลมอักษรแรก + ชื่อ) ต่างจากปุ่มแบ่งส่วนทั่วไป · คนที่เลือกขอบชมพู
  return `<div class="owner-pick" role="group" aria-label="${esc(S.ownerSwitchLabel)}">
    ${['partner', 'kid'].map(r => {
      const name = ownerName(r);
      return `<button type="button" data-owner="${r}" class="op-btn${o === r ? ' on' : ''}" aria-pressed="${o === r}">
        <span class="op-av">${esc([...name.replace(/^[เแโใไ]/, '')][0] ?? '')}</span><span class="op-name">${esc(name)}</span></button>`;
    }).join('')}
  </div>`;
}

// ช่อง "ใช้กับ" ในฟอร์มกิจกรรม/รางวัล (17 พ.ย. 2569)
// ใหม่: เลือกได้ทั้งคู่ (อย่างน้อย 1) · ค่าเริ่มต้น = คนที่กำลังดู
// แก้ของเดิม: เจ้าของเดิมล็อกไว้ เลือกอีกคนเพิ่ม = สร้างสำเนาให้อีกคน
export function ownerPicker(locked) {
  const owners = new Set([locked ?? store.owner()]);
  const html = field(S.ownersLabel, `<div class="owner-checks">${['partner', 'kid'].map(r =>
    `<button type="button" data-for="${r}" ${r === locked ? 'disabled' : ''}>${esc(ownerName(r))}</button>`).join('')}</div>`);
  const bind = el => {
    const draw = () => el.querySelectorAll('[data-for]').forEach(b => {
      const on = owners.has(b.dataset.for);
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
    el.querySelectorAll('[data-for]').forEach(b => b.onclick = () => {
      const r = b.dataset.for;
      if (r === locked) return;
      if (owners.has(r)) { if (owners.size > 1) owners.delete(r); } else owners.add(r);
      draw();
    });
    draw();
  };
  return { html, bind, owners };
}
