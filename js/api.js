// ทุกการเรียก Supabase อยู่ที่นี่ที่เดียว (auth, select, rpc, realtime)
// ตาราง/ฟังก์ชันขึ้นต้นด้วย budu_ (โปรเจกต์ใช้ร่วมกับแอปอื่น)
import { SUPABASE_URL, SUPABASE_ANON_KEY, DB_PREFIX } from './config.js';
import { S } from './strings.js';

const T = name => DB_PREFIX + name;

// supabase-js (UMD) โหลดจาก js/vendor/supabase.js ใน index.html
const sb = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storageKey: 'budu:sb-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

// รหัส error จากฐานข้อมูล → ข้อความบนหน้าจอ (ไม่รู้จัก = ผิดพลาดทั่วไป)
const ERROR_TEXT = {
  code_not_found: S.joinWrong,
  role_taken: S.joinRoleTaken,
};

export class ApiError extends Error {
  constructor(code) {
    super(ERROR_TEXT[code] ?? S.genericError);
    this.code = code;
  }
}

function fail(error) {
  // network ล้ม (fetch failed) ถือเป็น offline
  const code = error?.message && /^[a-z_]+$/.test(error.message) ? error.message : (error?.code || 'unknown');
  throw new ApiError(code);
}

async function rpc(fn, args = {}) {
  const { data, error } = await sb.rpc(T(fn), args);
  if (error) fail(error);
  return data;
}

// ---------- auth ----------
export async function ensureSignedIn() {
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session;
  const { data: d, error } = await sb.auth.signInAnonymously();
  if (error) fail(error);
  return d.session;
}

export async function signOut() {
  await sb.auth.signOut().catch(() => {});
}

// ---------- จับคู่ ----------
export const createCouple = () => rpc('create_couple');
export const joinCouple = (code, role) => rpc('join_couple', { p_code: code, p_role: role });
export const rejoin = (code, role) => rpc('rejoin', { p_code: code, p_role: role });
export const getPairCode = () => rpc('get_pair_code');

// ---------- อ่านข้อมูลคู่ ----------
async function select(table, build = q => q) {
  const { data, error } = await build(sb.from(T(table)).select('*'));
  if (error) fail(error);
  return data;
}

export const loaders = {
  members: () => select('members', q => q.order('created_at')),
  activities: () => select('activities', q => q.order('sort_order')),
  entries: () => select('entries', q => q.order('created_at', { ascending: false })),
  rewards: () => select('rewards', q => q.order('cost', { ascending: false })),
  coupons: () => select('coupons', q => q.order('redeemed_at', { ascending: false })),
};

export async function loadAll() {
  const keys = Object.keys(loaders);
  const vals = await Promise.all(keys.map(k => loaders[k]()));
  return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
}

// ---------- เขียนข้อมูล (ผ่านฟังก์ชันฐานข้อมูลเท่านั้น) ----------
export const logEarn = activityId => rpc('log_earn', { p_activity_id: activityId });
export const logDeduct = activityId => rpc('log_deduct', { p_activity_id: activityId });
export const decideEntry = (entryId, confirm) => rpc('decide_entry', { p_entry_id: entryId, p_confirm: confirm });
export const cancelEntry = entryId => rpc('cancel_entry', { p_entry_id: entryId });
export const redeemReward = rewardId => rpc('redeem_reward', { p_reward_id: rewardId });
export const requestCouponUse = couponId => rpc('request_coupon_use', { p_coupon_id: couponId });
export const markCouponUsed = couponId => rpc('mark_coupon_used', { p_coupon_id: couponId });
export const declineCouponRequest = couponId => rpc('decline_coupon_request', { p_coupon_id: couponId });
export const upsertActivity = a => rpc('upsert_activity', {
  p_id: a.id ?? null, p_name: a.name, p_kind: a.kind, p_points: a.points, p_streak_bonus: a.streak_bonus,
  p_icon: a.icon, p_streak_enabled: a.streak_enabled, p_is_active: a.is_active,
  p_once_per_day: a.once_per_day, p_owner: a.owner,
});
export const upsertReward = r => rpc('upsert_reward', { p_id: r.id ?? null, p_name: r.name, p_cost: r.cost, p_is_active: r.is_active, p_owner: r.owner });
export const deleteReward = id => rpc('delete_reward', { p_id: id });
export const exportAll = () => rpc('export_all');
export const pointsSummary = () => rpc('points_summary');

// ---------- realtime ----------
// เมื่อมีการเปลี่ยนแปลง เรียก onChange(ชื่อตารางแบบไม่มี prefix) ให้ store โหลดตารางนั้นซ้ำ
let channel = null;
export function subscribe(coupleId, onChange) {
  unsubscribe();
  channel = sb.channel(`budu:${coupleId}`);
  for (const name of Object.keys(loaders)) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: T(name), filter: `couple_id=eq.${coupleId}` },
      () => onChange(name));
  }
  // Realtime กรอง DELETE ด้วยคอลัมน์ไม่ได้ (แถวที่ลบไม่มีข้อมูลให้เทียบ) → ฟังการลบรางวัลแบบไม่กรอง แล้วโหลดใหม่
  // payload มีแค่ id ของแถวที่ลบ ไม่มีข้อมูลอื่นของคู่ใด
  channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: T('rewards') }, () => onChange('rewards'));
  channel.subscribe();
  return channel;
}
export function unsubscribe() {
  if (channel) { sb.removeChannel(channel); channel = null; }
}
export const isSubscribed = () => channel?.state === 'joined';
