// ทดสอบ js/streak.js · รัน: node tests/streak.test.mjs
import { runsOf, bonusDates, currentStreak, dotsFilled, daysToBonus, weekStart, addDays } from '../js/streak.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` → ได้ ${JSON.stringify(got)} ต้องการ ${JSON.stringify(want)}`}`);
};
const days = (start, n, skip = []) =>
  Array.from({ length: n }, (_, i) => addDays(start, i)).filter((_, i) => !skip.includes(i + 1));

const D = '2026-01-01';
eq('runsOf แยกช่วงติดกัน', runsOf(['2026-01-01', '2026-01-02', '2026-01-05']), [['2026-01-01', '2026-01-02'], ['2026-01-05']]);
eq('ข้ามเดือน/ปีนับติดกัน', runsOf(['2025-12-31', '2026-01-01']).length, 1);
eq('7 วันติด → โบนัสวันที่ 7', bonusDates(days(D, 7)), [addDays(D, 6)]);
eq('14 วันติด → โบนัสวันที่ 7 และ 14', bonusDates(days(D, 14)), [addDays(D, 6), addDays(D, 13)]);
eq('6 วันติด → ไม่มีโบนัส', bonusDates(days(D, 6)), []);
// ขาดวันที่ 5: 1-4, 6-12 → ช่วงใหม่ 6..12 ครบ 7 ที่วันที่ 12
eq('ขาดวันที่ 5 → โบนัสวันที่ 12', bonusDates(days(D, 12, [5])), [addDays(D, 11)]);
// ยกเลิกวันที่ 3 จาก 14 วัน → ช่วง 4..14 = 11 วัน ครบ 7 ที่วันที่ 10
eq('ยกเลิกวันที่ 3 → โบนัสย้ายไปวันที่ 10', bonusDates(days(D, 14, [3])), [addDays(D, 9)]);

const T = '2026-11-16';
eq('streak วันนี้ทำแล้ว', currentStreak(days(addDays(T, -4), 5), T), 5);
eq('streak วันนี้ยังไม่ทำ แต่เมื่อวานทำ = ไม่ขาด', currentStreak(days(addDays(T, -4), 4), T), 4);
eq('streak ขาดเมื่อวาน = 0', currentStreak(days(addDays(T, -5), 4), T), 0);
eq('ไม่มีรายการ = 0', currentStreak([], T), 0);

eq('dotsFilled 0', dotsFilled(0), 0);
eq('dotsFilled 4', dotsFilled(4), 4);
eq('dotsFilled 7 = เต็ม', dotsFilled(7), 7);
eq('dotsFilled 9 = 2', dotsFilled(9), 2);
eq('dotsFilled 14 = เต็ม', dotsFilled(14), 7);
eq('daysToBonus 4 → 3', daysToBonus(4), 3);
eq('daysToBonus 6 → 1', daysToBonus(6), 1);

eq('weekStart จันทร์ = ตัวเอง', weekStart('2026-11-16'), '2026-11-16');
eq('weekStart อาทิตย์ → จันทร์ก่อนหน้า', weekStart('2026-11-22'), '2026-11-16');
eq('weekStart อังคาร', weekStart('2026-11-17'), '2026-11-16');

console.log(`\n${pass}/${pass + fail} ผ่าน`);
process.exit(fail ? 1 : 0);
