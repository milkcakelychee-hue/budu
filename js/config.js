// BuDu config — ชื่อแอปตั้งไว้ที่นี่ที่เดียว
// ใช้เฉพาะ publishable/anon key (เปิดเผยได้ ความปลอดภัยอยู่ที่ RLS + ฟังก์ชันฐานข้อมูล)
// ห้ามใส่ service_role / secret key ในไฟล์นี้หรือที่ใดใน repo
export const APP_NAME = 'BuDu';
export const APP_VERSION = '1.2.0';

export const SUPABASE_URL = 'https://riudqjmefgsdyyumbepd.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_RDdo7sP9ZHmAQVHyRXRjWw_dk-mCZlg';

// โปรเจกต์ Supabase ใช้ร่วมกับแอปอื่น → ทุกตาราง/ฟังก์ชันขึ้นต้นด้วย budu_
export const DB_PREFIX = 'budu_';

export const RULES = {
  TZ: 'Asia/Bangkok',
  STREAK_LENGTH: 7,
  STREAK_BONUS_DEFAULT: 10,
  PRINT_MS: 2400,
  QR_TEXT: 'I love you',
  WEEK_STARTS_ON: 1,
  CHART_WEEKS: 8,
};
