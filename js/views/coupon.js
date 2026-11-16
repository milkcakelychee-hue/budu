import { S } from '../strings.js';
import { placeholder } from '../ui.js';

// คูปอง · หน้าเปล่า (ขั้น 1) เติมเนื้อหาในขั้นถัดไป
export function render(el) {
  placeholder(el, S.couponsTab, 'คูปอง', '#/rewards');
}
