// ส่วนประกอบหน้าจอที่ใช้ซ้ำ
import { S, thaiDate } from './strings.js';
import { svgIcon, UI_ICONS, ACTIVITY_ICONS } from './icons.js';

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
