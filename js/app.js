// เริ่มแอป · router แบบ hash · แถบเมนูล่าง
import { S } from './strings.js';
import { svgIcon, UI_ICONS } from './icons.js';

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
  coupon: { view: coupon, tab: 'rewards', nav: true },
  stats: { view: stats, tab: 'stats', nav: true },
  history: { view: history, tab: 'stats', nav: true },
  settings: { view: settings, tab: 'settings', nav: true },
  'manage-activities': { view: manageActivities, tab: 'settings', nav: true },
  'manage-rewards': { view: manageRewards, tab: 'settings', nav: true },
};

const TABS = [
  { id: 'deduct', label: S.navDeduct, icon: UI_ICONS.deduct },
  { id: 'rewards', label: S.navRewards, icon: UI_ICONS.rewards },
  { id: 'today', label: S.navToday, icon: UI_ICONS.today, center: true },
  { id: 'stats', label: S.navStats, icon: UI_ICONS.stats },
  { id: 'settings', label: S.navSettings, icon: UI_ICONS.settings },
];

const appEl = document.getElementById('app');
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
  const { name, params } = parseHash();
  const r = ROUTES[name];
  navEl.hidden = !r.nav;
  if (r.nav) renderNav(r.tab);
  appEl.innerHTML = '';
  r.view.render(appEl, params);
  window.scrollTo(0, 0);
}

function updateOnline() {
  offlineEl.textContent = S.offline;
  offlineEl.hidden = navigator.onLine;
  document.body.classList.toggle('is-offline', !navigator.onLine);
}

window.addEventListener('hashchange', route);
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();
route();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
