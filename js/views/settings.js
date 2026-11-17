// ตั้งค่า: โปรไฟล์ · รหัสจับคู่ (คัดลอก) · จัดการกิจกรรม/รางวัล/ส่งออกข้อมูล (เฉพาะปรายฟ้า) · ออกจากเครื่องนี้ · เกี่ยวกับแอป
import { S, t } from '../strings.js';
import { esc, pageHead, chevron, confirmSheet, noticeSheet, openSheet } from '../ui.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from '../icons.js';
import { APP_NAME, APP_VERSION } from '../config.js';
import * as api from '../api.js';
import * as store from '../store.js';

const ICON_USER = 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0';
const ICON_COPY = 'M9 9h11v11H9z M5 15H4V4h11v1';
const ICON_EXPORT = 'M12 15V3 M7 8l5-5 5 5 M4 15v5h16v-5';
const ICON_OUT = 'M14 4h5v16h-5 M9 8l-4 4 4 4 M5 12h11';
const ICON_INFO = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v6 M12 7.5h.01';

let pairCode = '';
let pairFor = null; // coupleId ของรหัสที่โหลดไว้

export function render(el) {
  const me = store.me();
  if (pairFor !== me.coupleId) { pairCode = ''; pairFor = me.coupleId; }
  const admin = store.isAdmin();
  const row = (icon, label, attrs, extra = chevron(), cls = '') =>
    `<${attrs.startsWith('href') ? 'a' : 'button type="button"'} class="set-row${cls}" ${attrs}>
      <span class="icon-tile" style="width:40px;height:40px">${svgIcon(icon, { size: 20 })}</span>
      <span class="set-label">${esc(label)}</span>${extra}</${attrs.startsWith('href') ? 'a' : 'button'}>`;

  const draw = () => {
    el.innerHTML = `<section class="screen">
      ${pageHead(S.settingsTitle)}
      <div class="profile-card"><div class="cp-glow"></div>
        <span class="avatar">${svgIcon(ICON_USER, { size: 26 })}</span>
        <div class="pc-text"><div class="cp-k">${esc(S.profile)}</div>
          <div class="pc-name">${esc(me.nickname)}</div>
          <span class="role-badge">${esc(admin ? S.roleAdminBadge : store.me()?.role === 'kid' ? S.roleKidBadge : S.rolePartnerBadge)}</span></div>
      </div>
      <div class="code-row">
        <div><div class="cp-k">${esc(S.pairCode)}</div><div class="cr-code">${esc(pairCode || '····-····')}</div></div>
        <button type="button" class="copy-btn" data-copy aria-label="${esc(S.pairCopy)}">${svgIcon(ICON_COPY, { size: 18, stroke: '#fff', width: 1.7 })}</button>
      </div>
      ${admin ? `<div class="set-card">
        ${row(UI_ICONS.list, S.manageActivities, 'href="#/manage-activities"')}
        <div class="list-sep"></div>
        ${row(ACTIVITY_ICONS.gift, S.manageRewards, 'href="#/manage-rewards"')}
        <div class="list-sep"></div>
        ${row(ICON_EXPORT, S.exportData, `data-export ${store.canWrite() ? '' : 'disabled'}`)}
      </div>` : ''}
      <div class="set-card">${row(ICON_OUT, S.signOut, 'data-signout', '', ' danger')}</div>
      <div class="set-card">${row(ICON_INFO, S.about, 'data-about', `<span class="list-meta">${esc(APP_NAME)} · ${esc(APP_VERSION)}</span>${chevron()}`)}</div>
    </section>`;

    el.querySelector('[data-copy]').onclick = () => { if (pairCode) navigator.clipboard?.writeText(pairCode).catch(() => {}); };
    el.querySelector('[data-export]')?.addEventListener('click', e => exportData(e.currentTarget));
    el.querySelector('[data-about]').onclick = openWhatsNew;
    el.querySelector('[data-signout]').onclick = async () => {
      if (document.querySelector('.sheet-wrap')) return;
      const [title, body] = S.signOutConfirm.split('? ');
      const ok = await confirmSheet({ title: `${title}?`, body, ok: S.signOut, danger: true });
      if (ok) await store.signOut(); // app.js พากลับหน้าเริ่มต้นใช้
    };
  };

  draw();
  // รหัสจับคู่: โหลดจากเซิร์ฟเวอร์ (เก็บไว้ในหน่วยความจำ ไม่ใส่ใน URL/ที่เก็บในเครื่อง)
  if (!pairCode) api.getPairCode().then(c => { pairCode = c; if (el.isConnected) draw(); }).catch(() => {});
}

// มีอะไรใหม่: รายการฟีเจอร์หลักของแต่ละเวอร์ชัน (S.changelog) ใหม่สุดอยู่บน
function openWhatsNew() {
  if (document.querySelector('.sheet-wrap')) return;
  const { el, close } = openSheet(`<h2 class="sheet-title">${esc(S.whatsNew)}</h2>
    ${S.changelog.map(c => `<div class="wn-block">
      <div class="wn-ver">${esc(t('versionLabel', { v: c.version }))}</div>
      <ul class="wn-list">${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>`).join('')}
    <button type="button" class="btn btn-secondary" data-close>${esc(S.close)}</button>`);
  el.querySelector('[data-close]').onclick = close;
}

// ส่งออก JSON: ใช้หน้าจอแชร์ของ iPhone ถ้ามี ไม่งั้นดาวน์โหลดไฟล์
async function exportData(btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    const data = await api.exportAll();
    const name = `budu-export-${store.todayStr()}.json`;
    const file = new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {}); // ผู้ใช้กดยกเลิกได้
    } else {
      const url = URL.createObjectURL(file);
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (e) {
    noticeSheet(e?.message || S.genericError);
  } finally {
    btn.disabled = false;
  }
}
