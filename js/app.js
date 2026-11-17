// เริ่มแอป · router แบบ hash · แถบเมนูล่าง
import { S } from './strings.js';
import { svgIcon, UI_ICONS } from './icons.js';
import * as store from './store.js';

import * as onboarding from './views/onboarding.js';
import * as today from './views/today.js';
import * as deduct from './views/deduct.js';
import * as rewards from './views/rewards.js';
import * as coupon from './views/coupon.js';
import * as stats from './views/stats.js';
import * as history from './views/history.js';
import * as settings from './views/settings.js';
import * as manageActivities from './views/manage-activities.js';
import * as manageRewards from './views/manage-rewards.js';

// route → view, tab (ช่องที่ไฮไลต์บนแถบล่าง), nav (แสดงแถบล่างไหม)
const ROUTES = {
  onboarding: { view: onboarding, nav: false },
  today: { view: today, tab: 'today', nav: true },
  deduct: { view: deduct, tab: 'deduct', nav: true },
  rewards: { view: rewards, tab: 'rewards', nav: true },
  coupon: { view: coupon, tab: 'rewards', nav: false },
  stats: { view: stats, tab: 'stats', nav: true },
  history: { view: history, tab: 'stats', nav: true },
  settings: { view: settings, tab: 'settings', nav: true },
  'manage-activities': { view: manageActivities, tab: 'settings', nav: false },
  'manage-rewards': { view: manageRewards, tab: 'settings', nav: false },
};

const TABS = [
  { id: 'deduct', label: S.navDeduct, icon: UI_ICONS.deduct },
  { id: 'rewards', label: S.navRewards, icon: UI_ICONS.rewards },
  { id: 'today', label: S.navToday, icon: UI_ICONS.today, center: true },
  { id: 'stats', label: S.navStats, icon: UI_ICONS.stats },
  { id: 'settings', label: S.navSettings, icon: UI_ICONS.settings },
];

const appEl = document.getElementById('app');
// ปุ่มสลับคน (ปรายฟ้า) ใช้ได้ทุกหน้า
appEl.addEventListener('click', e => {
  const b = e.target.closest('[data-owner]');
  if (b) store.setViewOwner(b.dataset.owner);
});
const navEl = document.getElementById('tabbar');
const offlineEl = document.getElementById('offline');

function parseHash() {
  const [name, ...params] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: ROUTES[name] ? name : 'today', params };
}

function renderNav(active) {
  navEl.innerHTML = TABS.map(t => {
    const on = t.id === active;
    const cur = on ? ' aria-current="page"' : '';
    if (t.center) {
      return `<a href="#/today" class="tab-today${on ? ' active' : ''}" aria-label="${t.label}"${cur}>${svgIcon(t.icon, { size: 30, stroke: '#fff', width: 1.8 })}</a>`;
    }
    return `<a href="#/${t.id}" class="tab${on ? ' active' : ''}"${cur}><span class="tab-ico">${svgIcon(t.icon, { size: on ? 18 : 24, width: on ? 1.8 : 1.5 })}</span>${t.label}</a>`;
  }).join('');
}

function route() {
  let { name, params } = parseHash();
  // ยังไม่ได้จับคู่ → หน้าเริ่มต้นใช้เสมอ
  if (!store.state.session && name !== 'onboarding') {
    if (location.hash !== '#/onboarding') { location.replace('#/onboarding'); return; }
    name = 'onboarding';
  }
  const r = ROUTES[name];
  navEl.hidden = !r.nav;
  if (r.nav) renderNav(r.tab);
  document.querySelectorAll('.sheet-wrap, .print-overlay').forEach(w => w.remove());
  document.body.classList.remove('sheet-open');
  appEl.innerHTML = '';
  r.view.render(appEl, params);
  window.scrollTo(0, 0);
}

function updateOnline() {
  const online = store.state.online;
  offlineEl.innerHTML = `${svgIcon('M2 2l20 20 M8.5 16.5a5 5 0 0 1 7 0 M5 12.5a10 10 0 0 1 5-2.7 M19 12.5a10 10 0 0 0-2.3-1.6 M2 8.8a15 15 0 0 1 4.5-2.7 M22 8.8A15 15 0 0 0 10.7 5 M12 20h.01', { size: 18, stroke: '#fff', width: 1.8 })}<span>${S.offline}</span>`;
  offlineEl.hidden = online;
  document.body.classList.toggle('is-offline', !online);
}

let hadSession = !!store.state.session;
store.onChange(() => {
  updateOnline();
  // ออกจากเครื่องนี้ / ถูกแทนที่ด้วยเครื่องอื่น → กลับหน้าเริ่มต้นใช้
  const has = !!store.state.session;
  if (hadSession && !has) route();
  hadSession = has;
});

window.addEventListener('hashchange', route);

// ไม่ให้ซูม: iOS ไม่เชื่อ user-scalable=no จึงกันการถ่างนิ้วตรงนี้ (แตะสองครั้งกันด้วย touch-action ใน CSS)
for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
updateOnline();
route();
store.start();

if ('serviceWorker' in navigator) {
  // updateViaCache: 'none' = ตรวจ sw.js ใหม่ทุกครั้งที่เปิดแอป
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then(reg => {
      reg.update();
      // กลับเข้าแอป (ไม่ต้องปัดทิ้ง) → ตรวจเวอร์ชันใหม่ทุกครั้ง
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => {});
  // มีเวอร์ชันใหม่เข้ามาคุมหน้า → โหลดหน้าใหม่ครั้งเดียว
  // ถ้ากำลังเปิดแผ่นล่าง (กรอกฟอร์มอยู่) รอจนออกจากแอปครั้งถัดไปค่อยโหลด
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  const reload = () => { if (!reloaded) { reloaded = true; location.reload(); } };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (!document.querySelector('.sheet-wrap')) return reload();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') reload(); }, { once: true });
  });
}
