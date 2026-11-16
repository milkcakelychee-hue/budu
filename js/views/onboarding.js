import { S } from '../strings.js';
import { logo, esc } from '../ui.js';

// เริ่มต้นใช้ · ขั้น 1 แสดงเฉพาะหน้าต้อนรับ (โลโก้ Gaegu) ขั้นตอนจับคู่ทำในขั้น 3
export function render(el) {
  el.innerHTML = `<section class="screen no-nav" style="text-align:center;padding-top:calc(var(--safe-top) + 120px)">
    ${logo(72)}
    <h1 class="page-title" style="margin-top:24px">${esc(S.welcomeTitle)}</h1>
    <p style="padding:0 32px;color:var(--text-3)">${esc(S.welcomeBody)}</p>
  </section>`;
}
