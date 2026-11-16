# BuDu · Build Brief

> สำหรับ Claude Code · วางไฟล์นี้ (หรือเปลี่ยนชื่อเป็น CLAUDE.md) ไว้ที่รากโปรเจกต์ คู่กับ APP_SPEC.md
> มีภาพหน้าจอจาก Claude Design (แคนวาส BuDu) ให้ยึดภาพนั้นเรื่องหน้าตา และยึด APP_SPEC.md เรื่องพฤติกรรม · ชื่อเฟรมในภาพตรงกับชื่อหน้าใน APP_SPEC

## สรุป
แอปสะสมแต้มความดีสำหรับ 2 คน ซิงก์ 2 เครื่องแบบเรียลไทม์ผ่านรหัสจับคู่ · PWA สำหรับ iPhone · ผู้ใช้: **ปรายฟ้า** ผู้ดูแล (`admin`) กับ **เตย** แฟน (`partner`) คนละเครื่อง (ชื่อผูกกับบทบาท ไม่มีขั้นตั้งชื่อเล่น)

## กติกาการทำงาน
- ทำตามลำดับงานด้านล่างทีละขั้น จบแต่ละขั้นให้สรุปสิ่งที่ทำและวิธีทดสอบ
- ห้ามเพิ่มฟีเจอร์นอก APP_SPEC.md ถ้าคิดว่าควรมี ให้ถามก่อน (หัวข้อ "สิ่งที่ไม่มี" ใช้บังคับจริง)
- คำบนหน้าจอใช้ตาม APP_SPEC.md หัวข้อ 6 ทุกตัวอักษร (เป็นร่างคำที่ผู้ใช้ยังไม่ยืนยัน เก็บข้อความทั้งหมดไว้ที่ `js/strings.js` ไฟล์เดียว เพื่อแก้ภายหลังง่าย)
- ชื่อหน้า ชื่อ field ใช้ให้ตรงกับ APP_SPEC.md และ DESIGN_BRIEF.md
- **การขึ้นเว็บ**: แก้ให้ครบแล้วแสดงให้ผู้ใช้ดูก่อน ขึ้น GitHub Pages เมื่อผู้ใช้สั่งเท่านั้น
- **ความปลอดภัย**: ห้ามใส่ `service_role` key ของ Supabase ในโค้ดหรือ repo ทุกกรณี (ใช้ได้เฉพาะ anon key ซึ่งเปิดเผยได้โดยออกแบบ ความปลอดภัยอยู่ที่ RLS และฟังก์ชันฝั่งฐานข้อมูล) ห้ามเดา/สร้าง key เอง ถ้ายังไม่มี URL และ anon key ให้หยุดถามผู้ใช้
- ห้ามใส่การแจ้งเตือน เสียง หรือแอนิเมชันฉลอง ไม่ว่าในขั้นใด **ยกเว้น** เอฟเฟกต์พิมพ์ตั๋วตอนแลกรางวัล (CSS animation อย่างเดียว ~2.4 วินาที เคารพ `prefers-reduced-motion` โดยข้ามไปหน้าพิมพ์เสร็จทันที)

## เครื่องมือ
- HTML + CSS + JavaScript ล้วน (ES modules) ไม่มีขั้นตอน build
- ไลบรารีภายนอกมีเพียง **supabase-js** ฝังไฟล์ไว้ที่ `js/vendor/` เป็นเวอร์ชันเจาะจงที่เก่ากว่า 2 สัปดาห์ (ไม่โหลดจาก CDN เพื่อให้แอปเปิดออฟไลน์ได้) กราฟเขียนเองด้วย SVG/CSS ไม่ใช้ไลบรารีกราฟ
- ฟอนต์: **ฟอนต์ระบบ iPhone** ไม่ต้องฝังไฟล์ · หัวข้อ/ตัวเลขใหญ่ `ui-serif, 'New York', Georgia, Thonburi, serif` · เนื้อความ `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Thonburi, system-ui, sans-serif` · ป้ายเล็ก/วันที่ `ui-monospace, 'SF Mono', Menlo, Thonburi, monospace` · line-height ประมาณ 1.6 · **ข้อยกเว้นเดียว**: โลโก้คำว่า "BuDu" ใช้ **Gaegu Bold 700** (Google Fonts, OFL) ฝัง `.woff2` ใน `fonts/` ตัดเหลือตัว B u D (subset)
- QR code บนคูปองเป็นข้อความคงที่ "I love you" ให้ทำเป็นไฟล์ SVG สำเร็จรูป `icons/qr-iloveyou.svg` (สร้างครั้งเดียวด้วยเครื่องมือภายนอก error correction M ไม่ฝังไลบรารี QR ในแอป) แล้วทดสอบสแกนด้วยกล้อง iPhone
- โฮสต์: GitHub Pages ที่ `https://<user>.github.io/<repo>/` (ถามผู้ใช้ชื่อ user/repo ตอนขั้น 11)
- ที่เก็บข้อมูล: Supabase (Postgres + Realtime + Anonymous Auth)

## โครงไฟล์
```
/
├── index.html
├── manifest.webmanifest
├── sw.js
├── icons/                 # 180 (apple-touch-icon), 192, 512 px + qr-iloveyou.svg + ชุดไอคอนกิจกรรม 30 แบบ (SVG เส้น)
├── fonts/                 # gaegu-700-subset.woff2 (โลโก้เท่านั้น)
├── css/
│   ├── tokens.css         # สี ฟอนต์ ระยะ มุมมน (โหมดสว่าง + โหมดมืดตามเครื่อง)
│   └── app.css
├── js/
│   ├── app.js             # เริ่มแอป, router แบบ hash, แถบล่าง
│   ├── config.js          # APP_NAME, SUPABASE_URL, SUPABASE_ANON_KEY, RULES
│   ├── strings.js         # ข้อความบนหน้าจอทั้งหมด (APP_SPEC หัวข้อ 6)
│   ├── api.js             # ทุกการเรียก Supabase อยู่ที่นี่ที่เดียว (auth, select, rpc, realtime)
│   ├── local.js           # localStorage ทั้งหมดอยู่ที่นี่ที่เดียว (คีย์ขึ้นต้น budu:)
│   ├── store.js           # สถานะในหน่วยความจำ + โหลดข้อมูล + สมัคร realtime + คำนวณแต้มรวม
│   ├── streak.js          # ฟังก์ชันคำนวณ streak ฝั่งแสดงผล (ดูหัวข้อ กติกาเป็นโค้ด)
│   ├── views/             # onboarding.js today.js deduct.js rewards.js coupon.js
│   │                      # stats.js history.js settings.js manage-activities.js manage-rewards.js
│   └── vendor/
│       └── supabase.js
├── supabase/
│   └── schema.sql         # ตาราง + RLS + ฟังก์ชัน + realtime (ผู้ใช้รันใน SQL editor ของ Supabase)
├── APP_SPEC.md
└── BUILD_BRIEF.md
```

## โครงข้อมูล

### ในเครื่อง (`js/local.js`) คีย์ขึ้นต้น `budu:`
```js
// budu:session  — ข้อมูลผูกเครื่อง (ไม่มีรหัสผ่านใด ๆ)
{ coupleId: 'uuid', memberId: 'uuid', role: 'admin' | 'partner', nickname: 'ปรายฟ้า' | 'เตย' }

// budu:cache — สำเนาข้อมูลล่าสุดไว้ดูตอนออฟไลน์ (อ่านอย่างเดียว)
{ savedAt: 'ISO date', activities: [], entries: [], rewards: [], coupons: [], members: [] }
```
Supabase เก็บ session ของ anonymous user ใน localStorage เอง ให้ตั้งค่า client ให้ใช้คีย์ `budu:sb-auth`

### บน Supabase (`supabase/schema.sql`)
เก็บเป็นหน่วยเดียว: แต้มเป็นจำนวนเต็ม เวลาเป็น `timestamptz` วันที่เป็น `date` (เวลาไทย)

```sql
create table couples (
  id uuid primary key default gen_random_uuid(),
  pair_code text unique not null,            -- เช่น 'K7MQ-2XPD' เก็บแบบไม่มีขีดก็ได้ แต่ต้อง normalize ตอนเทียบ
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  auth_uid uuid not null unique,             -- auth.uid() ของเครื่องปัจจุบัน (เปลี่ยนได้เมื่อ rejoin)
  role text not null check (role in ('admin','partner')),
  nickname text not null check (char_length(nickname) between 1 and 30),
  created_at timestamptz not null default now(),
  unique (couple_id, role)
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('earn','deduct')),   -- แก้ไม่ได้หลังสร้าง
  points int not null check (points between 1 and 999),   -- เป็นบวกเสมอ
  streak_bonus int not null default 10 check (streak_bonus between 0 and 999), -- โบนัสครบ 7 วัน (ใช้เฉพาะ earn)
  icon text not null default 'star',                      -- ชื่อจากชุด 30 แบบ
  streak_enabled boolean not null default true,           -- ใช้เฉพาะ earn
  is_active boolean not null default true,                -- ซ่อน = false (ไม่ลบจริง)
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  activity_id uuid references activities(id) on delete set null,
  activity_name text not null,                            -- สำเนา ณ ตอนทำรายการ
  kind text not null check (kind in ('earn','deduct','streak_bonus','redeem')),
  points int not null,                                    -- มีเครื่องหมาย: earn/+ , deduct/− , redeem/−
  status text not null check (status in ('pending','confirmed','rejected','cancelled')),
  entry_date date not null,                               -- วันที่เวลาไทย กำหนดโดยฐานข้อมูล
  created_by uuid references members(id),                 -- streak_bonus = null
  decided_by uuid references members(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index on entries (couple_id, entry_date desc);
-- กันโควตาวันละครั้ง: 1 รายการ earn ที่ pending/confirmed ต่อกิจกรรมต่อวัน
create unique index entries_one_earn_per_day on entries (activity_id, entry_date)
  where kind = 'earn' and status in ('pending','confirmed');
-- กันโบนัส streak ซ้ำ
create unique index entries_one_bonus_per_day on entries (activity_id, entry_date)
  where kind = 'streak_bonus' and status = 'confirmed';

create table rewards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  cost int not null check (cost between 1 and 99999),
  is_active boolean not null default true,                -- แสดงเรียง cost มากไปน้อยเสมอ (ไม่มี sort_order)
  created_at timestamptz not null default now()
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  reward_id uuid references rewards(id) on delete set null,
  reward_name text not null,                              -- สำเนา ณ ตอนแลก
  cost int not null,                                      -- สำเนา ณ ตอนแลก
  status text not null check (status in ('active','requested','used')) default 'active',
  redeem_entry_id uuid references entries(id),
  redeemed_by uuid references members(id),
  redeemed_at timestamptz not null default now(),
  requested_at timestamptz,                               -- แฟนกด "ใช้คูปองนี้"
  used_by uuid references members(id),
  used_at timestamptz
);
```

### ความปลอดภัย (RLS และสิทธิ์)
- เปิด RLS ทุกตาราง · มีเฉพาะนโยบาย `select` ที่ให้เห็นแถวของคู่ตัวเอง (`couple_id = my_couple_id()`; ตาราง `couples` ใช้ `id = my_couple_id()`) โดย `my_couple_id()` และ `my_role()` เป็นฟังก์ชัน `security definer` ที่หาจาก `members.auth_uid = auth.uid()`
- **ไม่มีนโยบาย insert/update/delete** ให้ client โดยตรง การเขียนทั้งหมดผ่านฟังก์ชันด้านล่าง (`security definer`, `set search_path = public`) ที่ตรวจบทบาทเองทุกครั้ง และ `grant execute` เฉพาะ role `authenticated` (ผู้ใช้ anonymous อยู่ใน role นี้) ถอน `execute` จาก `public`/`anon`
- เปิด Realtime (`alter publication supabase_realtime add table entries, coupons, activities, rewards, members;`) Realtime ใช้นโยบาย select ด้านบนกรองให้อัตโนมัติ
- วันที่ของรายการ: `entry_date = (now() at time zone 'Asia/Bangkok')::date` คำนวณในฐานข้อมูลเท่านั้น ไม่รับจาก client

### ฟังก์ชันฝั่งฐานข้อมูล (เขียนใน `schema.sql`)
| ฟังก์ชัน | ใครเรียกได้ | ทำอะไร / ตรวจอะไร |
|---|---|---|
| `create_couple()` | ผู้ใช้ที่ยังไม่มี member | สร้าง couple พร้อม `pair_code` (8 ตัวจากชุด `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` สุ่มด้วย `gen_random_bytes` ไม่ใช้ `random()`) และ member `admin` (nickname = 'ปรายฟ้า') · คืน `{couple_id, member_id, pair_code}` |
| `join_couple(p_code)` | ผู้ใช้ที่ยังไม่มี member | normalize รหัส (ตัดขีด ตัวพิมพ์ใหญ่) หา couple · ถ้ามี partner แล้วคืน error `role_taken` · ไม่พบรหัสคืน `code_not_found` · สร้าง member `partner` (nickname = 'เตย') |
| `rejoin(p_code, p_role)` | ผู้ใช้ที่ยังไม่มี member | ผูก `auth.uid()` ปัจจุบันกับ member ของ role นั้นใน couple ที่รหัสตรง (อัปเดต `auth_uid`) · ไม่พบคืน `code_not_found` |
| `log_earn(p_activity_id)` | ทั้งคู่ | ตรวจว่ากิจกรรมเป็นของคู่ `is_active` และ `kind='earn'` · สร้าง entry `earn` points = +points · **admin → `confirmed`, partner → `pending`** · ชนดัชนี `entries_one_earn_per_day` ให้คืน `already_logged` · ถ้า `confirmed` เรียก `sync_streak` |
| `log_deduct(p_activity_id)` | admin | `kind='deduct'` → entry `deduct` points = −points `confirmed` · ไม่จำกัดจำนวนต่อวัน |
| `decide_entry(p_entry_id, p_confirm)` | admin | เฉพาะ entry `earn` ที่ `pending` · ยืนยัน → `confirmed` + `sync_streak` · ไม่ผ่าน → `rejected` · บันทึก `decided_by/at` |
| `cancel_entry(p_entry_id)` | admin | เฉพาะ `earn`/`deduct` ที่ `confirmed` → `cancelled` · ถ้าเป็น `earn` เรียก `sync_streak` · ห้ามยกเลิก `streak_bonus` และ `redeem` โดยตรง |
| `redeem_reward(p_reward_id)` | partner | **ใน transaction เดียว**: `select ... for update` แถว couple เพื่อกันกดพร้อมกัน → คำนวณแต้มรวม (ผลรวม `confirmed`) → ถ้าน้อยกว่า `cost` คืน `insufficient_points` → สร้าง entry `redeem` points = −cost `confirmed` และ coupon `active` (เก็บ `reward_name`, `cost`) → คืน coupon |
| `request_coupon_use(p_coupon_id)` | partner | เฉพาะ `active` → `requested` บันทึก `requested_at` |
| `mark_coupon_used(p_coupon_id)` | admin | `active` หรือ `requested` → `used` บันทึก `used_by/at` ย้อนกลับไม่ได้ (ใช้ทั้งปุ่ม "ให้รางวัลแล้ว" ในวันนี้ และ "ใช้แล้ว" ในหน้าคูปอง) |
| `decline_coupon_request(p_coupon_id)` | admin | `requested` → `active` (ปุ่ม "ยังไม่ใช้") |
| `upsert_activity(p_id, p_name, p_kind, p_points, p_streak_bonus, p_icon, p_streak_enabled, p_is_active)` | admin | เพิ่ม/แก้ · `kind` ตั้งตอนสร้างเท่านั้น ถ้าส่งค่าอื่นตอนแก้ให้เมิน |
| `upsert_reward(p_id, p_name, p_cost, p_is_active)` | admin | เพิ่ม/แก้ · แก้ `cost` ไม่กระทบ coupon เดิม |
| `delete_reward(p_id)` | admin | ลบแถว reward จริง · coupon เดิมคงอยู่ (`reward_id` → null ผ่าน `on delete set null`) |
| `sync_streak(p_activity_id)` | ภายใน | ปรับโบนัสให้ตรงกติกา (อัลกอริทึมด้านล่าง) ทำซ้ำกี่ครั้งก็ผลเท่าเดิม (idempotent) |
| `export_all()` | admin | คืน JSON ของข้อมูลทั้งคู่ (couple ไม่รวม `auth_uid`) |

error ทุกตัวคืนเป็นรหัสสั้น ๆ (เช่น `already_logged`) ให้ `api.js` แปลงเป็นข้อความตามหัวข้อ 6 (รหัสที่ไม่รู้จักใช้ "ทำไม่สำเร็จ ลองใหม่อีกครั้ง")

## กติกาเป็นโค้ด
```js
// js/config.js
export const RULES = {
  TZ: 'Asia/Bangkok',
  STREAK_LENGTH: 7,       // ครบกี่วันติดได้โบนัส
  STREAK_BONUS_DEFAULT: 10, // ค่าเริ่มของโบนัส (ตั้งแยกรายกิจกรรมใน activities.streak_bonus)
  PRINT_MS: 2400,           // ความยาวเอฟเฟกต์พิมพ์ตั๋ว
  QR_TEXT: 'I love you',
  WEEK_STARTS_ON: 1,      // จันทร์
  CHART_WEEKS: 8,
};

// js/store.js — แต้มรวม (นับเฉพาะ confirmed ทุกชนิด รวมโบนัสและ redeem ที่ติดลบ ติดลบได้)
const balance = entries.filter(e => e.status === 'confirmed').reduce((s, e) => s + e.points, 0);

// สิทธิ์ฝั่ง UI (ฐานข้อมูลตรวจซ้ำเสมอ)
const can = {
  logEarn: true,                  // ทั้งคู่ (admin = confirmed, partner = pending)
  deduct: role === 'admin',
  decide: role === 'admin',
  cancelEntry: role === 'admin',
  manage: role === 'admin',       // กิจกรรม รางวัล ส่งออก
  redeem: role === 'partner',
  markCouponUsed: role === 'admin',
  requestCouponUse: role === 'partner',
  deleteReward: role === 'admin',
};

// โควตาวันละครั้งต่อกิจกรรม earn: ปุ่ม + ปิดถ้ามี entry วันนี้ที่ status เป็น pending หรือ confirmed
// วันนี้ (ฝั่ง UI) = วันที่ตามเวลาไทย: new Intl.DateTimeFormat('en-CA',{timeZone:RULES.TZ}).format(new Date())
```

```js
// js/streak.js — dates = วันที่ 'YYYY-MM-DD' ที่ไม่ซ้ำและเรียงขึ้น ของ entry earn ที่ confirmed ของกิจกรรมเดียว
export function runsOf(dates) { /* แยกเป็นช่วงวันติดกัน เช่น [[d1,d2,d3],[d7,d8]] */ }

// วันที่ที่ "ควรได้โบนัส": ตำแหน่งที่ 7, 14, 21 ... ในแต่ละช่วงติดกัน (นับรอบใหม่ทุก 7 วัน)
export function bonusDates(dates) {
  return runsOf(dates).flatMap(run => run.filter((_, i) => (i + 1) % RULES.STREAK_LENGTH === 0));
}

// streak ปัจจุบัน: ช่วงล่าสุดที่จบที่วันนี้ หรือเมื่อวาน (วันนี้ยังไม่ทำ ไม่ถือว่าขาด) ไม่งั้นเป็น 0
export function currentStreak(dates, today) { /* ... */ }

// จุดบนการ์ด (0–7): 0 ถ้า streak = 0 · 7 ถ้า streak % 7 === 0 · ไม่งั้น streak % 7
export const dotsFilled = s => (s === 0 ? 0 : s % 7 === 0 ? 7 : s % 7);

// ข้อความ "อีก {n} วันรับโบนัส +{bonus}": n = 7 - (streak % 7)

// การ์ดแต้ม: รางวัลเป้าหมาย = reward ที่ is_active และ cost > balance ที่ cost น้อยที่สุด · ข้อความ "อีก {cost-balance} แต้ม แลก {name} ได้" · แถบ = balance/cost (0 ถ้าติดลบ)
// รางวัลทุกที่เรียง: rewards.sort((a,b) => b.cost - a.cost)
```

**`sync_streak(activity)` ในฐานข้อมูล** ใช้อัลกอริทึมเดียวกับ `bonusDates` (หา "ช่วงวันติดกัน" ด้วยเทคนิค `entry_date - row_number() over (order by entry_date)` แล้วนับลำดับในช่วง):
1. หาชุดวันที่ที่ควรได้โบนัส (`owed`) จาก entry `earn` `confirmed` ของกิจกรรมนั้น ทำเฉพาะเมื่อ `streak_enabled = true`
2. หา `existing` = โบนัส `confirmed` ของกิจกรรมนั้น
3. เพิ่ม entry `streak_bonus` (points = +`activities.streak_bonus`, `confirmed`, `entry_date` = วันที่ควรได้, `created_by` = null, `activity_name` = ชื่อกิจกรรม) ให้ทุกวันที่อยู่ใน `owed` แต่ไม่อยู่ใน `existing`
4. เปลี่ยนโบนัสที่อยู่ใน `existing` แต่ไม่อยู่ใน `owed` แล้วเป็น `cancelled`
5. ถ้ากิจกรรมปิด `streak_enabled` ทีหลัง ไม่ต้องยกเลิกโบนัสที่ได้ไปแล้ว

**สถิติ** (ฝั่ง client จาก entries ที่โหลดมา): แท่งต่อสัปดาห์ (เริ่มจันทร์ ย้อน 8 สัปดาห์ รวมสัปดาห์นี้) · "ได้" = ผลรวม points > 0 ของ `confirmed` ชนิด `earn` และ `streak_bonus` · "ถูกหัก" = ผลรวมค่าสัมบูรณ์ของ `deduct` `confirmed` · ไม่นับ `redeem`

## การซิงก์และออฟไลน์
- เริ่มแอป: `signInAnonymously()` (ถ้ายังไม่มี session) → ถ้ามี `budu:session` ให้โหลดข้อมูลคู่ทั้งหมด (กิจกรรม รางวัล คูปอง สมาชิก รายการ) → ไม่มี session ให้ไปหน้าเริ่มต้นใช้
- Realtime: สมัคร channel `postgres_changes` ของทั้ง 5 ตารางกรองด้วย `couple_id` เมื่อมีเหตุการณ์ให้โหลดตารางนั้นซ้ำ (ง่ายและทนกว่าการ merge ทีละแถว) ข้อมูลที่ขึ้นหน้าจอต้องอัปเดตภายในไม่กี่วินาทีโดยไม่ต้องรีเฟรช
- iPhone ตัด websocket เมื่อแอปอยู่เบื้องหลัง: ฟัง `visibilitychange` (เมื่อกลับมา visible) และ `online` → โหลดข้อมูลซ้ำทั้งหมดและสมัคร realtime ใหม่ถ้า channel ปิดไปแล้ว
- ทุกปุ่มที่เขียนข้อมูล: ปิดปุ่มทันทีเมื่อกด (กันกดรัว) รอผลจากเซิร์ฟเวอร์ก่อนอัปเดตหน้าจอ ไม่ใช้ optimistic update เว้นแต่ทำได้ปลอดภัย
- ออฟไลน์ (`navigator.onLine === false` หรือเรียก Supabase ไม่ได้): แสดงแถบ "ไม่มีอินเทอร์เน็ต ดูได้อย่างเดียว บันทึกไม่ได้" ใช้ `budu:cache` แสดงข้อมูลล่าสุด ปิดปุ่มบันทึกทั้งหมด **ไม่มีคิวบันทึกค้างและไม่มีการซิงก์ย้อนหลัง** บันทึกสำเนา cache ทุกครั้งที่โหลดข้อมูลสำเร็จ
- "ออกจากเครื่องนี้": ล้าง `budu:*` และ sign out ของ Supabase (ข้อมูลคู่บนเซิร์ฟเวอร์ไม่ถูกลบ)

## ลำดับงาน
| ขั้น | งาน | เสร็จเมื่อ |
|---|---|---|
| 0 | **ผู้ใช้ทำเอง** (Claude Code ทำแทนไม่ได้): สร้างบัญชีและโปรเจกต์ Supabase ฟรี → Authentication → Providers เปิด **Anonymous sign-ins** → คัดลอก Project URL และ anon public key ส่งให้ Claude Code ใส่ใน `js/config.js` | มี URL และ anon key ที่ผู้ใช้ส่งมาให้ |
| 1 | โครงโปรเจกต์ + manifest + service worker + ไอคอน + ฟอนต์ฝังไฟล์ + tokens.css + router + แถบเมนูล่าง + หน้าเปล่าทุกหน้า (ชื่อหน้าตาม APP_SPEC) | ติดตั้งจาก Safari ได้ เปิดเต็มจอ ปิดเน็ตแล้วเปิดแอปได้ ฟอนต์ไทยถูกต้อง |
| 2 | `supabase/schema.sql` (ตาราง ดัชนี RLS ฟังก์ชัน realtime) + `js/api.js` + ชุดทดสอบฟังก์ชันด้วย SQL หรือสคริปต์ โดยสมมติ 2 บทบาท | รัน schema ใน SQL editor ได้ไม่ error · ทดสอบผ่านทุกกรณีในตาราง "เช็กลิสต์ทดสอบ · ฐานข้อมูล" ด้านล่าง |
| 3 | เริ่มต้นใช้: ต้อนรับ (โลโก้ Gaegu) เลือกบทบาท ปรายฟ้า/เตย สร้างคู่/จับคู่/เข้าอีกครั้ง การ์ดเตือนติดตั้งเมื่อไม่ได้เปิดแบบ standalone · `local.js` + `store.js` (โหลดข้อมูล) | 2 เครื่อง (หรือ 2 โปรไฟล์เบราว์เซอร์) จับคู่กันได้ · ปิดเปิดแอปแล้วยังอยู่ · ล้างข้อมูลเครื่องแล้วเข้าอีกครั้งด้วยรหัสได้ |
| 4 | จัดการกิจกรรม และ จัดการรางวัล (ผู้ดูแล) รวมแผ่นล่างเพิ่ม/แก้/ซ่อน | เพิ่มที่เครื่องผู้ดูแล แล้วเครื่องแฟนเห็นทันทีโดยไม่รีเฟรช |
| 5 | วันนี้: การ์ดแต้มรวม + รางวัลเป้าหมาย การ์ดกิจวัตร ให้แต้ม สถานะ ทำแล้ว/รอยืนยัน ส่วนรอยืนยัน ยืนยัน/ไม่ผ่าน · แท็บหักแต้ม (สรุปสัปดาห์ ตาราง 2 คอลัมน์ แผ่นยืนยัน ประวัติการโดนหัก แฟนดูอย่างเดียว) | ทำตามตาราง "กติกาอัตโนมัติ" ใน APP_SPEC ได้ครบทั้ง 2 มุมมอง · กดรัวไม่เกิดรายการซ้ำ · แต้มรวมติดลบได้ |
| 6 | streak + โบนัส: `streak.js` + `sync_streak` + แถวจุดบนการ์ดกิจกรรม | ทดสอบ streak 7, 14 วัน (ใช้ข้อมูลทดสอบใน SQL ที่ตั้ง `entry_date` ย้อนหลัง) ได้โบนัส +10 ครั้งเดียวต่อวันที่ครบ · ยกเลิกรายการกลางทางแล้วโบนัสปรับตาม |
| 7 | รางวัล: รายการเรียง cost มากไปน้อย แลก (`redeem_reward`) + เอฟเฟกต์พิมพ์ตั๋ว · คูปองทรงตั๋วพร้อม QR · ขอใช้คูปอง → คำขอขึ้นในวันนี้ของผู้ดูแล → ให้รางวัลแล้ว/ยังไม่ใช้ · ลบรางวัล | แต้มไม่พอแลกไม่ได้ · กดแลกพร้อมกัน 2 เครื่องไม่ตัดแต้มซ้ำ · คำขอใช้คูปองขึ้นเครื่องผู้ดูแลโดยไม่รีเฟรช · คูปองที่ใช้แล้วหมดสถานะ · QR สแกนด้วยกล้อง iPhone ได้ "I love you" |
| 8 | ประวัติ (รวมยกเลิกรายการ) และ สถิติ (กราฟแท่ง SVG + streak รายกิจกรรม) | ตัวเลขกราฟตรงกับผลรวมจากประวัติ · สถานะว่างไม่แสดงกราฟเปล่า |
| 9 | ตั้งค่า: โปรไฟล์ (ชื่อ + บทบาท ไม่มีแก้ชื่อ) รหัสจับคู่ ส่งออก JSON (`export_all` แล้วดาวน์โหลดไฟล์) ออกจากเครื่องนี้ เกี่ยวกับแอป | ส่งออกได้ไฟล์ที่เปิดอ่านได้ครบข้อมูล · ออกแล้วเข้าอีกครั้งได้ |
| 10 | ขัดเกลา: ปรับตามภาพออกแบบจาก Claude Design (แถบล่าง 5 ช่องปุ่มกลางชมพู รอยบุ๋มตั๋วด้วย CSS mask) · สถานะว่างทุกหน้า · ออฟไลน์ · โหมดมืด (โทนพลัม) · safe area · ข้อความทั้งหมดผ่าน `strings.js` | ผ่านเช็กลิสต์ทดสอบบน iPhone ทั้งหมด |
| 11 | ขึ้น GitHub Pages **เมื่อผู้ใช้สั่งเท่านั้น** (ถามชื่อ user/repo ก่อน ตั้ง path สัมพัทธ์ให้ตรง `/<repo>/`) | ติดตั้งจาก URL จริงบน iPhone 2 เครื่องแล้วผ่านเช็กลิสต์ซ้ำ |

## ข้อจำกัดของแพลตฟอร์ม
- **ติดตั้งก่อนจับคู่**: ข้อมูลใน Safari กับแอปที่ติดตั้งบนหน้าโฮมแยกกัน (รวมถึง session ของ Supabase) ตรวจด้วย `window.navigator.standalone` หรือ `matchMedia('(display-mode: standalone)')` ถ้าไม่ใช่ standalone ให้แสดงการ์ดเตือนบนหน้าเริ่มต้นใช้ แต่ไม่ต้องบล็อกการใช้งาน
- **session หายได้**: ถ้าผู้ใช้ลบแอปหรือ iOS ล้างข้อมูลเว็บ anonymous session จะหาย จึงต้องมีทาง "เข้าอีกครั้ง" ด้วยรหัสจับคู่ (ฟังก์ชัน `rejoin`) รหัสจับคู่คือกุญแจของทั้งคู่ ห้ามแสดงในที่สาธารณะ ห้ามใส่ใน URL
- **realtime ตอนอยู่เบื้องหลังไม่ทำงาน**: ไม่มีการซิงก์เบื้องหลัง ทุกอย่างเกิดตอนเปิดแอป ให้โหลดข้อมูลซ้ำเมื่อกลับมาหน้าแอป (ดูหัวข้อ การซิงก์)
- **ไม่มีแจ้งเตือนเด้ง** (ผู้ใช้ไม่ต้องการ) · **ไม่มีเสียงและไม่มีการสั่น** (`navigator.vibrate` ใช้ไม่ได้ใน Safari)
- **Supabase แพ็กเกจฟรีจะพักโปรเจกต์เมื่อไม่มีการใช้งานเกิน 1 สัปดาห์** ถ้าแอปเปิดไม่ติดหลังหยุดใช้นาน ให้ผู้ใช้เข้าเว็บ Supabase กด Restore project ใส่ข้อความนี้ใน README สั้น ๆ
- **service worker**: เก็บเฉพาะไฟล์แอป (HTML CSS JS ฟอนต์ ไอคอน supabase-js) **ห้ามแคชคำขอไปยัง Supabase** ใส่เลขเวอร์ชันในชื่อแคช (`budu-v1`) และเปลี่ยนทุกครั้งที่อัปเดต ไม่อย่างนั้นผู้ใช้จะเห็นเวอร์ชันเก่าค้าง
- **ใช้ path สัมพัทธ์ทั้งหมด** (GitHub Pages อยู่ใต้ `/<repo>/`) · `manifest.webmanifest`: `name`, `short_name`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `theme_color`, `background_color`, ไอคอน 192 และ 512 · `apple-touch-icon` 180 × 180 ใน `<head>`
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` และเว้นระยะด้วย `env(safe-area-inset-*)` กันเนื้อหาโดนรอยบากและแถบล่าง (แถบเมนูล่างแบบลอยต้องเผื่อ inset ด้านล่าง)
- ช่องกรอกตัวเลข (แต้ม) ใช้ `inputmode="numeric"` · ตัวอักษรในช่องกรอก ≥ 16px กัน Safari ซูมเอง · ปุ่มและพื้นที่แตะ ≥ 44 × 44 px
- ดาวน์โหลดไฟล์ส่งออก: ทดสอบบนเครื่องจริงว่าเปิดหน้าจอแชร์/Files ได้ตามคาด

## เช็กลิสต์ทดสอบ · ฐานข้อมูล (ขั้น 2)
| กรณี | ผลที่ถูก |
|---|---|
| partner เรียก `log_deduct`, `decide_entry`, `cancel_entry`, `mark_coupon_used`, `upsert_*`, `export_all` | ถูกปฏิเสธ |
| admin เรียก `redeem_reward` | ถูกปฏิเสธ |
| ผู้ใช้ต่างคู่อ่านหรือเรียกฟังก์ชันกับข้อมูลของคู่อื่น | อ่านไม่เห็น / ถูกปฏิเสธ |
| client พยายาม insert/update/delete ตรง ๆ | ถูกปฏิเสธ |
| `log_earn` กิจกรรมเดิมซ้ำในวันเดียวกัน (ทั้ง pending และ confirmed) | `already_logged` · หลัง `rejected`/`cancelled` กดใหม่ได้ |
| `log_deduct` ซ้ำหลายครั้งในวัน | ผ่านทุกครั้ง |
| แต้มรวม 30 แล้วหัก 50 | แต้มรวม −20 |
| `redeem_reward` เมื่อแต้มรวมน้อยกว่า `cost` | `insufficient_points` ไม่เกิด entry/coupon |
| `redeem_reward` พร้อมกัน 2 ครั้ง แต้มพอแค่ครั้งเดียว | สำเร็จครั้งเดียว |
| `join_couple` เมื่อมี partner แล้ว | `role_taken` · `rejoin` ด้วยรหัสและ role เดิมสำเร็จ |
| streak 7 วันติด / 14 วันติด / ขาด 1 วันที่ 5 แล้วทำต่อ | โบนัสที่วันที่ 7 และ 14 / ไม่มีโบนัสจนกว่านับครบ 7 วันติดใหม่ |
| ยกเลิกวันที่ 3 ของ streak 7 วันที่ครบแล้ว | โบนัสวันที่ 7 ถูกยกเลิกตาม |
| `sync_streak` เรียกซ้ำหลายครั้ง | ผลเท่าเดิม ไม่มีโบนัสซ้ำ |
| แก้ `cost` ของรางวัลหลังแลกแล้ว | คูปองเดิมยังแสดงแต้ม/ชื่อเดิม |
| `delete_reward` รางวัลที่มีคูปองแล้ว | ลบได้ คูปองยังอยู่ครบ |
| partner `request_coupon_use` → admin `mark_coupon_used` / `decline_coupon_request` | `requested` → `used` / กลับเป็น `active` · admin เรียก request / partner เรียก mark ถูกปฏิเสธ |
| streak ครบ 7 วันของกิจกรรมที่ตั้ง `streak_bonus = 20` | โบนัส +20 |

## เช็กลิสต์ทดสอบบน iPhone
- [ ] ติดตั้งจาก Safari ได้ ไอคอนและชื่อ "BuDu" ถูกต้อง
- [ ] เปิดแบบเต็มจอ ไม่มีเนื้อหาโดนรอยบาก/แถบล่าง แถบเมนูล่างไม่ทับ home indicator
- [ ] ปิดเน็ตแล้วยังเปิดแอปได้ เห็นข้อมูลล่าสุด ปุ่มบันทึกปิด มีแถบแจ้งออฟไลน์
- [ ] ช่องกรอกไม่ทำให้จอซูม แป้นตัวเลขขึ้นตอนกรอกแต้ม
- [ ] 2 เครื่องจับคู่กันได้ · ผู้ดูแลให้แต้ม → เครื่องแฟนเห็นโดยไม่รีเฟรช
- [ ] แฟนกด + → เครื่องผู้ดูแลเห็นในการ์ดรอยืนยัน → ยืนยัน → แต้มและ streak ขึ้นทั้ง 2 เครื่อง
- [ ] พักแอปไปเบื้องหลัง 1 นาทีแล้วกลับมา ข้อมูลล่าสุดขึ้นเอง
- [ ] ลบแอปแล้วติดตั้งใหม่ → "เข้าอีกครั้ง" ด้วยรหัสเดิมได้
- [ ] แลกรางวัลแล้วแต้มลดทันที คูปองขึ้นทั้ง 2 เครื่อง ผู้ดูแลกด "ใช้แล้ว" แล้วคูปองจางลง
- [ ] ส่งออกข้อมูลแล้วได้ไฟล์ JSON ที่เปิดอ่านได้
- [ ] อัปเดตเวอร์ชันแล้วเห็นของใหม่ (เปลี่ยนเลขแคช)
- [ ] ฟอนต์ไทยแสดงถูกต้อง วรรณยุกต์ไม่ชน แม้เปิดแบบออฟไลน์
- [ ] ไม่มีเสียง ไม่มีแอนิเมชันฉลอง (มีแค่เอฟเฟกต์พิมพ์ตั๋ว) ไม่มีขอสิทธิ์แจ้งเตือน
- [ ] สแกน QR บนคูปองด้วยกล้อง iPhone แล้วขึ้น "I love you"
- [ ] รอยบุ๋มตั๋วโปร่งเห็นพื้นหลังทั้งโหมดสว่างและโหมดมืด

## สิ่งที่ไม่มี
- การแจ้งเตือนเด้งเข้าเครื่องทุกชนิด · เสียงทุกชนิด · แอนิเมชันฉลอง (ยกเว้นเอฟเฟกต์พิมพ์ตั๋ว)
- ระบบสมัครบัญชี อีเมล รหัสผ่าน
- การกรอกชื่อหรือแต้มเองนอกรายการกิจกรรมสำเร็จรูป
- AI ทุกชนิด โฆษณา ซื้อในแอป โซเชียล/แชร์สาธารณะ
- คิวบันทึกตอนออฟไลน์ และการซิงก์ย้อนหลัง
- นำเข้าข้อมูลจาก JSON (v1 ส่งออกอย่างเดียว)
- UI สำหรับผู้ใช้คนที่ 3 หรือหลายคู่
- ไลบรารีนอกเหนือจาก supabase-js (ไม่มีไลบรารีกราฟ ไม่มีไลบรารี QR ไม่มีเฟรมเวิร์ก)
- หน้าตั้งชื่อเล่น และการแก้ชื่อเล่น
