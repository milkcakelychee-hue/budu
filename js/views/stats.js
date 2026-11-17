// สถิติ: ตัวกรองช่วงเวลา (7 วัน/เดือนนี้/ปีนี้ ผู้ใช้กำหนด 17 พ.ย. 2569) · แต้มได้/ถูกหักในช่วง · กราฟแท่งในช่วง · streak ของแต่ละกิจกรรม · ลิงก์ประวัติ
// นับเฉพาะ confirmed · "ได้" = earn + streak_bonus · "ถูกหัก" = deduct · ไม่นับ redeem
import { S, t } from '../strings.js';
import { esc, pageHead, iconTile, ownerSwitch } from '../ui.js';
import { svgIcon, UI_ICONS } from '../icons.js';
import { RULES } from '../config.js';
import * as store from '../store.js';
import { weekStart, addDays, confirmedDates, currentStreak, dotsFilled, daysToBonus } from '../streak.js';

let root = null;
let unsub = null;
let period = 'week'; // 'week' = 7 วันย้อนหลัง · 'month' = เดือนนี้ (รายวัน) · 'year' = ปีนี้ (รายเดือน)

export function render(el) {
  root = el;
  unsub?.();
  unsub = store.onChange(() => { if (root?.isConnected) draw(); else { unsub?.(); unsub = null; } });
  draw();
}

// ผลรวมรายสัปดาห์ (ใช้ทดสอบเทียบกับประวัติได้)
export function weeklyTotals(entries, today, weeks = RULES.CHART_WEEKS) {
  const thisWeek = weekStart(today);
  const starts = Array.from({ length: weeks }, (_, i) => addDays(thisWeek, -7 * (weeks - 1 - i)));
  return starts.map(ws => {
    const we = addDays(ws, 7);
    const inWeek = entries.filter(e => e.status === 'confirmed' && e.entry_date >= ws && e.entry_date < we);
    return {
      start: ws,
      earned: inWeek.filter(e => e.kind === 'earn' || e.kind === 'streak_bonus').reduce((s, e) => s + e.points, 0),
      deducted: inWeek.filter(e => e.kind === 'deduct').reduce((s, e) => s + Math.abs(e.points), 0),
    };
  });
}

const dm = d => `${+d.slice(8, 10)}/${+d.slice(5, 7)}`;

// ช่องของกราฟตามช่วงเวลา: [{ from, to (ไม่รวม), label, now }]
function buckets(today) {
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i - 6);
      return { from: d, to: addDays(d, 1), label: dm(d), now: i === 6 };
    });
  }
  const y = today.slice(0, 4);
  if (period === 'month') {
    const m = today.slice(0, 7);
    const first = `${m}-01`;
    const days = new Date(Date.UTC(+y, +today.slice(5, 7), 0)).getUTCDate();
    return Array.from({ length: days }, (_, i) => {
      const d = addDays(first, i);
      const n = i + 1;
      return { from: d, to: addDays(d, 1), label: n === 1 || n % 5 === 0 ? String(n) : '', now: d === today };
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0');
    const next = i === 11 ? `${+y + 1}-01-01` : `${y}-${String(i + 2).padStart(2, '0')}-01`;
    return { from: `${y}-${mm}-01`, to: next, label: S.monthsShort[i], now: today.slice(5, 7) === mm };
  });
}

function totals(entries, from, to) {
  const list = entries.filter(e => e.status === 'confirmed' && e.entry_date >= from && e.entry_date < to);
  return {
    earned: list.filter(e => e.kind === 'earn' || e.kind === 'streak_bonus').reduce((s, e) => s + e.points, 0),
    deducted: list.filter(e => e.kind === 'deduct').reduce((s, e) => s + Math.abs(e.points), 0),
  };
}

function periodSeg() {
  return `<div class="seg big-seg period-seg">${['week', 'month', 'year'].map(p =>
    `<button type="button" data-period="${p}" class="${period === p ? 'on' : ''}">${esc(S['period_' + p])}</button>`).join('')}</div>`;
}

function streakCard(a, entries, today) {
  const streak = currentStreak(confirmedDates(entries, a.id), today);
  const doneToday = entries.some(e => e.activity_id === a.id && e.kind === 'earn' && e.status === 'confirmed' && e.entry_date === today);
  const filled = !doneToday && streak > 0 && streak % RULES.STREAK_LENGTH === 0 ? 0 : dotsFilled(streak);
  const complete = filled === RULES.STREAK_LENGTH;
  const badge = complete
    ? `<span class="sk-badge done">${esc(t('statsBadgeDone', { b: a.streak_bonus }))}</span>`
    : `<span class="sk-badge">${esc(t('statsBadge', { n: daysToBonus(filled === 0 ? 0 : streak), b: a.streak_bonus }))}</span>`;
  const dots = Array.from({ length: RULES.STREAK_LENGTH }, (_, i) => i < filled
    ? `<span class="dot on${complete ? ' pink' : ''}">${svgIcon(UI_ICONS.check, { size: 14, stroke: '#fff', width: 2.4 })}</span>`
    : '<span class="dot"></span>').join('');
  return `<div class="streak-card${complete ? ' complete' : ''}">
    <div class="corner-glow soft"></div>
    <div class="sk-row">${iconTile(a.icon, 44)}
      <div class="list-main"><div class="sk-name">${esc(a.name)}</div><div class="rc-sub">${esc(t('streakDays', { n: streak }))}</div></div>
      ${badge}</div>
    <div class="sk-dots">${dots}</div>
  </div>`;
}

function draw() {
  const { entries, activities } = store.state.data;
  const today = store.todayStr();
  const counted = entries.filter(e => e.status === 'confirmed' && e.kind !== 'redeem');

  if (!counted.length) {
    root.innerHTML = `<section class="screen">${pageHead(S.statsTitle)}${periodSeg()}${ownerSwitch()}
      <div class="plain-empty"><span class="empty-ico tile">${svgIcon(UI_ICONS.stats, { size: 26 })}</span>
      <div class="empty-text">${esc(S.statsEmpty)}</div></div>
      <div class="center-link"><a href="#/history">${esc(S.statsAllHistory)}${svgIcon(UI_ICONS.chevron, { size: 16, width: 1.8 })}</a></div></section>`;
    bindPeriod();
    return;
  }

  const bs = buckets(today).map(b => ({ ...b, ...totals(entries, b.from, b.to) }));
  const now = totals(entries, bs[0].from, bs.at(-1).to);
  const max = Math.max(1, ...bs.flatMap(w => [w.earned, w.deducted]));
  const h = v => (v ? Math.max(3, Math.round((v / max) * 80)) : 0);
  // แท่งเหลี่ยม มีแต้มบนหัวแท่ง (ไม่มีแต้ม = ไม่แสดงตัวเลข)
  const col = (v, cls) => `<span class="bar-col"><span class="bar-v">${v || ''}</span><span class="${cls}" style="height:${h(v)}px"></span></span>`;
  const bars = bs.map(w => `<div class="wk${w.now ? ' now' : ''}" title="${esc(S.statsEarned)} +${w.earned} · ${esc(S.statsDeducted)} −${w.deducted}">
      <div class="wk-bars">${col(w.earned, 'bar-e')}${col(w.deducted, 'bar-d')}</div>
      <div class="wk-label">${esc(w.label)}</div></div>`).join('');
  const periodText = S['period_' + period];

  const streakActs = activities.filter(a => a.kind === 'earn' && a.is_active && a.streak_enabled).sort((a, b) => a.sort_order - b.sort_order);
  // streak ยาวสุดอยู่บน (ผู้ใช้กำหนด 16 พ.ย. 2569)
  const sk = a => currentStreak(confirmedDates(entries, a.id), today);
  streakActs.sort((a, b) => sk(b) - sk(a));

  root.innerHTML = `<section class="screen">
    ${pageHead(S.statsTitle)}${periodSeg()}${ownerSwitch()}
    <div class="stat-pair">
      <div class="stat-box"><div class="corner-glow soft"></div>
        <div class="sb-k"><span class="key e"></span>${esc(S.statsEarned)}</div>
        <div class="sb-v e">+${now.earned}</div><div class="list-meta">${esc(periodText)}</div></div>
      <div class="stat-box">
        <div class="sb-k"><span class="key d"></span>${esc(S.statsDeducted)}</div>
        <div class="sb-v">−${now.deducted}</div><div class="list-meta">${esc(periodText)}</div></div>
    </div>
    <div class="chart-card">
      <div class="chart-head"><h2 class="chart-title">${esc(S.statsChart)}</h2>
        <div class="legend"><span><span class="key e"></span>${esc(S.statsEarned)}</span><span><span class="key d"></span>${esc(S.statsDeducted)}</span></div></div>
      <div class="chart${period === 'month' ? ' dense' : ''}">${bars}</div>
    </div>
    ${streakActs.length ? `<h2 class="sec-title sm">${esc(S.statsStreaks)}</h2>
      <div class="streak-list">${streakActs.map(a => streakCard(a, entries, today)).join('')}</div>` : ''}
    <div class="center-link"><a href="#/history">${esc(S.statsAllHistory)}${svgIcon(UI_ICONS.chevron, { size: 16, width: 1.8 })}</a></div>
  </section>`;
  bindPeriod();
}

function bindPeriod() {
  root.querySelectorAll('[data-period]').forEach(b => b.onclick = () => { period = b.dataset.period; draw(); });
}
