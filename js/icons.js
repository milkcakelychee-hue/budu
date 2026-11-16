// ไอคอนเส้น (ถอดจากดีไซน์ Claude Design) · ชุดกิจกรรม 30 แบบ + ไอคอน UI
export const ACTIVITY_ICONS = {
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  water: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z M19 19v2H6',
  broom: 'M15 3l-3.5 8 M6 11h10l2 10H4l2-10z M9 15v6 M13 15v6',
  snack: 'M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z M8.5 11h.01 M12 15.5h.01 M15.5 14h.01',
  phone: 'M7 2h10v20H7z M11 18h2',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
  dumbbell: 'M6 7v10 M18 7v10 M3 10v4 M21 10v4 M6 12h12',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  gift: 'M3 9h18v4H3z M5 13v8h14v-8 M12 9v12 M12 9S10 4 7.5 5.5 9 9 12 9z M12 9s2-5 4.5-3.5S15 9 12 9z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  coffee: 'M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z M17 10h2a2 2 0 0 1 0 4h-2 M8 3v2 M12 3v2',
  fork: 'M7 3v8 M5 3v5a2 2 0 0 0 4 0V3 M7 11v10 M17 3c-2 2-2 6 0 8v10',
  car: 'M3 14l2-6h14l2 6v4H3z M7 18v2 M17 18v2 M7 14h.01 M17 14h.01',
  shoe: 'M3 16l4-8 4 2 3-3 4 2v7H3z M3 19h18',
  bed: 'M3 18V7 M3 13h18v5 M21 13a3 3 0 0 0-3-3h-8v3 M6.5 10.5h.01',
  music: 'M9 18V5l11-2v13 M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3z M20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  shirt: 'M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z',
  pill: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z M7 7l7 7',
  plant: 'M12 21v-9 M12 12c0-4 3-7 7-7 0 4-3 7-7 7z M12 14c0-3-2-5-5-5 0 3 2 5 5 5z M7 21h10',
  bath: 'M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z M6 12V5a2 2 0 0 1 4 0',
  tooth: 'M7 3c-3 0-4 3-3 6 1 4 1 12 4 12 2 0 1-5 4-5s2 5 4 5c3 0 3-8 4-12 1-3 0-6-3-6-2 0-3 1-5 1S9 3 7 3z',
  alarm: 'M12 6a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M12 10v3l2 2 M4 4l3 2 M20 4l-3 2',
  cart: 'M3 4h2l2 11h11l2-8H6 M9 20h.01 M17 20h.01',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3z M3 7l12-4v4 M16 13h.01',
  gamepad: 'M6 9h12a4 4 0 0 1 0 8l-2-2H8l-2 2a4 4 0 0 1 0-8z M8 11v3 M6.5 12.5h3 M15 12h.01 M17 14h.01',
  tv: 'M3 6h18v12H3z M8 21h8 M9 2l3 4 3-4',
  glass: 'M7 3h10l-1 18H8z M7.5 9h9',
  chat: 'M4 5h16v11H9l-5 4z M9 10h.01 M15 10h.01',
};

export const UI_ICONS = {
  deduct: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12h8',
  rewards: ACTIVITY_ICONS.gift,
  today: ACTIVITY_ICONS.sun,
  stats: 'M5 20V11 M12 20V5 M19 20v-7 M3 20h18',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 21h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 6l6 6-6 6',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  hidden: 'M3 3l18 18 M10.6 6.1A9.5 9.5 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-2.6 3.2 M6.6 6.6C4.3 8.2 3 12 3 12s4 6 9 6a8.6 8.6 0 0 0 4.4-1.2',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01',
};

export function svgIcon(d, { size = 24, stroke = 'currentColor', width = 1.6 } = {}) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}
