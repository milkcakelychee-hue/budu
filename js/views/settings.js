import { S } from '../strings.js';
import { pageHead, esc, chevron } from '../ui.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from '../icons.js';
import * as store from '../store.js';

// ตั้งค่า · ขั้น 4 มีเฉพาะทางไปหน้าจัดการ (ผู้ดูแล) ส่วนอื่นทำในขั้น 9
export function render(el) {
  const links = store.can.manage ? `<div class="list-card" style="margin-top:20px">
      <a class="list-row" href="#/manage-activities" style="text-decoration:none">
        <span class="icon-tile" style="width:42px;height:42px">${svgIcon(UI_ICONS.list, { size: 22 })}</span>
        <div class="list-main"><div class="list-name">${esc(S.manageActivities)}</div></div>${chevron()}</a>
      <div class="list-sep"></div>
      <a class="list-row" href="#/manage-rewards" style="text-decoration:none">
        <span class="icon-tile" style="width:42px;height:42px">${svgIcon(ACTIVITY_ICONS.gift, { size: 22 })}</span>
        <div class="list-main"><div class="list-name">${esc(S.manageRewards)}</div></div>${chevron()}</a>
    </div>` : '';
  el.innerHTML = `<section class="screen">${pageHead(S.settingsTitle)}${links}</section>`;
}
