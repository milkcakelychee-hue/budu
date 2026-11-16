// คำนวณ streak ฝั่งแสดงผล (ฐานข้อมูลคำนวณโบนัสจริงด้วยอัลกอริทึมเดียวกันใน budu_sync_streak)
import { RULES } from './config.js';

// ---------- วันที่แบบ 'YYYY-MM-DD' ----------
const toUTC = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const fromUTC = ms => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d, n) => fromUTC(toUTC(d) + n * 86400000);
export const diffDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / 86400000);
// วันจันทร์ของสัปดาห์ที่มีวันนั้น
export const weekStart = d => addDays(d, -((new Date(toUTC(d)).getUTCDay() + 7 - RULES.WEEK_STARTS_ON) % 7));

// dates = วันที่ไม่ซ้ำ เรียงขึ้น ของ entry earn ที่ confirmed ของกิจกรรมเดียว
export function runsOf(dates) {
  const runs = [];
  for (const d of dates) {
    const last = runs.at(-1);
    if (last && diffDays(d, last.at(-1)) === 1) last.push(d);
    else runs.push([d]);
  }
  return runs;
}

// วันที่ที่ควรได้โบนัส: ตำแหน่งที่ 7, 14, 21 ... ในแต่ละช่วงติดกัน
export function bonusDates(dates) {
  return runsOf(dates).flatMap(run => run.filter((_, i) => (i + 1) % RULES.STREAK_LENGTH === 0));
}

// streak ปัจจุบัน: ช่วงล่าสุดที่จบที่วันนี้ หรือเมื่อวาน (วันนี้ยังไม่ทำไม่ถือว่าขาด) ไม่งั้นเป็น 0
export function currentStreak(dates, today) {
  const last = runsOf(dates).at(-1);
  if (!last) return 0;
  const gap = diffDays(today, last.at(-1));
  return gap === 0 || gap === 1 ? last.length : 0;
}

// จุดบนการ์ด (0–7): 0 ถ้า streak = 0 · 7 ถ้า streak % 7 === 0 · ไม่งั้น streak % 7
export const dotsFilled = s => (s === 0 ? 0 : s % RULES.STREAK_LENGTH === 0 ? RULES.STREAK_LENGTH : s % RULES.STREAK_LENGTH);

// "อีก {n} วันรับโบนัส": n = 7 − (streak % 7)
export const daysToBonus = s => RULES.STREAK_LENGTH - (s % RULES.STREAK_LENGTH);

// วันที่ confirmed ของกิจกรรมหนึ่ง (ไม่ซ้ำ เรียงขึ้น)
export function confirmedDates(entries, activityId) {
  return [...new Set(entries
    .filter(e => e.activity_id === activityId && e.kind === 'earn' && e.status === 'confirmed')
    .map(e => e.entry_date))].sort();
}
