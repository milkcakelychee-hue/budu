import { S } from '../strings.js';
import { placeholder } from '../ui.js';

// จัดการรางวัล · หน้าเปล่า (ขั้น 1) เติมเนื้อหาในขั้นถัดไป
export function render(el) {
  placeholder(el, S.manageRewards, 'จัดการรางวัล', '#/settings');
}
