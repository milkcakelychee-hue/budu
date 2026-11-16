// สถานะในหน่วยความจำ + โหลดข้อมูล + สมัคร realtime + คำนวณแต้มรวม
import * as api from './api.js';
import { local } from './local.js';
import { RULES } from './config.js';

const EMPTY = { members: [], activities: [], entries: [], rewards: [], coupons: [] };

export const state = {
  session: local.getSession(),   // { coupleId, memberId, role, nickname }
  data: { ...EMPTY, ...(pick(local.getCache())) },
  online: navigator.onLine,
  loaded: false,
};

function pick(c) {
  if (!c) return {};
  const { members, activities, entries, rewards, coupons } = c;
  return { members, activities, entries, rewards, coupons };
}

// ---------- ผู้ฟังการเปลี่ยนแปลง ----------
const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } }); }

function setOnline(v) {
  if (state.online !== v) { state.online = v; emit(); }
}
export const canWrite = () => state.online;

// ---------- session ----------
export function setSession(r) {
  // r = ผลจาก create_couple / join_couple / rejoin
  state.session = { coupleId: r.couple_id, memberId: r.member_id, role: r.role, nickname: r.nickname };
  local.setSession(state.session);
  emit();
}

export async function signOut() {
  api.unsubscribe();
  await api.signOut();
  local.clearAll();
  state.session = null;
  state.data = { ...EMPTY };
  state.loaded = false;
  emit();
}

// ---------- โหลดข้อมูล ----------
function saveCache() { local.setCache(state.data); }

export async function refresh(table) {
  if (!state.session) return;
  try {
    await api.ensureSignedIn();
    if (table) {
      state.data[table] = await api.loaders[table]();
    } else {
      state.data = await api.loadAll();
    }
    // เครื่องนี้ไม่ได้เป็นสมาชิกแล้ว (เช่น มีเครื่องอื่น "เข้าอีกครั้ง" แทน) → กลับไปหน้าเริ่มต้นใช้
    if (!state.data.members.some(m => m.id === state.session.memberId)) {
      await signOut();
      return;
    }
    state.loaded = true;
    saveCache();
    setOnline(navigator.onLine);
    emit();
  } catch (e) {
    console.warn('refresh failed', e);
    setOnline(false);
  }
}

function subscribe() {
  if (!state.session) return;
  api.subscribe(state.session.coupleId, table => refresh(table));
}

export async function start() {
  if (!state.session) return;
  await refresh();
  if (state.session) subscribe();
}

// iPhone ตัด websocket เมื่อแอปอยู่เบื้องหลัง → กลับมาแล้วโหลดใหม่ทั้งหมดและสมัครใหม่
async function resume() {
  setOnline(navigator.onLine);
  if (!state.session || !navigator.onLine) return;
  await refresh();
  if (state.session && !api.isSubscribed()) subscribe();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resume(); });
window.addEventListener('online', resume);
window.addEventListener('offline', () => setOnline(false));

// ---------- ค่าที่คำนวณ ----------
export const me = () => state.session;
export const isAdmin = () => state.session?.role === 'admin';
export const partnerJoined = () => state.data.members.some(m => m.role === 'partner');

export const balance = () =>
  state.data.entries.filter(e => e.status === 'confirmed').reduce((s, e) => s + e.points, 0);

export const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: RULES.TZ }).format(new Date());

export const can = {
  get deduct() { return isAdmin(); },
  get decide() { return isAdmin(); },
  get cancelEntry() { return isAdmin(); },
  get manage() { return isAdmin(); },
  get redeem() { return state.session?.role === 'partner'; },
  get markCouponUsed() { return isAdmin(); },
  get requestCouponUse() { return state.session?.role === 'partner'; },
  get deleteReward() { return isAdmin(); },
};
