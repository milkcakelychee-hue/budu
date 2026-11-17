-- =====================================================================
-- BuDu · tests.sql — ชุดทดสอบฟังก์ชันฐานข้อมูล (เช็กลิสต์ขั้น 2)
-- รันใน Supabase SQL Editor หลังรัน schema.sql แล้ว
-- จำลองผู้ใช้ด้วย uuid ปลอม · ลบข้อมูลทดสอบเองทั้งตอนเริ่มและตอนจบ
-- ผลลัพธ์: ตาราง name / ok / detail · ทุกแถวต้อง ok = true
-- สร้าง schema ชั่วคราว budu_test (ลบได้ด้วย: drop schema budu_test cascade;)
-- =====================================================================

reset role;

drop schema if exists budu_test cascade;
create schema budu_test;
grant usage on schema budu_test to authenticated;

-- uuid ปลอม: A = ผู้ดูแล, B = แฟน, C = คนนอก, D = ผู้ดูแลคู่อื่น, E = เครื่องใหม่ของแฟน (rejoin), F = น้องตาล, 9 = น้องตาลคนที่ 2 (uuid ใช้ได้แค่ 0-9 a-f)
create or replace function budu_test.uid(k text) returns uuid language sql immutable as $$
  select ('00000000-0000-4000-8000-0000000000' || k || k)::uuid
$$;

-- ลบข้อมูลทดสอบที่ค้างจากรอบก่อน
delete from public.budu_couples where id in (
  select couple_id from public.budu_members
  where auth_uid in (budu_test.uid('a'), budu_test.uid('b'), budu_test.uid('c'), budu_test.uid('d'), budu_test.uid('e'), budu_test.uid('f'), budu_test.uid('9')));

create table budu_test.results (n serial, name text, ok boolean, detail text);
grant all on budu_test.results to authenticated;
grant usage on all sequences in schema budu_test to authenticated;

-- สลับผู้ใช้
create or replace function budu_test.act(k text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', budu_test.uid(k), 'role', 'authenticated')::text, false);
end $$;

create or replace function budu_test.check(p_name text, p_ok boolean, p_detail text default null) returns void
language sql as $$ insert into budu_test.results (name, ok, detail) values (p_name, coalesce(p_ok, false), p_detail) $$;

-- รัน sql แล้วคาดว่าจะ error ที่มีข้อความ p_expect (null = error อะไรก็ได้)
create or replace function budu_test.expect_error(p_name text, p_sql text, p_expect text default null) returns void
language plpgsql as $$
begin
  execute p_sql;
  perform budu_test.check(p_name, false, 'ไม่ error');
exception when others then
  perform budu_test.check(p_name, p_expect is null or sqlerrm = p_expect, sqlerrm);
end $$;

create or replace function budu_test.expect_ok(p_name text, p_sql text) returns void
language plpgsql as $$
begin
  execute p_sql;
  perform budu_test.check(p_name, true);
exception when others then
  perform budu_test.check(p_name, false, sqlerrm);
end $$;

create or replace function budu_test.balance(p_couple uuid) returns int language sql as $$
  select coalesce(sum(points), 0)::int from public.budu_entries where couple_id = p_couple and status = 'confirmed'
$$;

-- ---------------------------------------------------------------------
-- จับคู่
-- ---------------------------------------------------------------------
set role authenticated;

select budu_test.act('a');
select set_config('t.couple', (public.budu_create_couple() ->> 'couple_id'), false);
select budu_test.check('create_couple สร้างคู่ + admin', public.budu_my_role() = 'admin');
select budu_test.check('pair_code รูปแบบ XXXX-XXXX ไม่มี 0 O 1 I',
  public.budu_get_pair_code() ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{4}$', public.budu_get_pair_code());
select set_config('t.code', public.budu_get_pair_code(), false);
select budu_test.expect_error('create_couple ซ้ำเมื่อเป็นสมาชิกแล้ว', 'select public.budu_create_couple()', 'already_member');

select budu_test.act('b');
select budu_test.expect_error('join_couple รหัสผิด', $$select public.budu_join_couple('ZZZZ-ZZZZ')$$, 'code_not_found');
select budu_test.expect_ok('join_couple ด้วยรหัสตัวเล็ก/ไม่มีขีด',
  format('select public.budu_join_couple(%L)', lower(replace(current_setting('t.code'), '-', ''))));
select budu_test.check('แฟนได้ role partner ชื่อ เตย',
  (select role = 'partner' and nickname = 'เตย' from public.budu_members where auth_uid = budu_test.uid('b')));

select budu_test.act('c');
select budu_test.expect_error('join_couple เมื่อมี partner แล้ว', format('select public.budu_join_couple(%L)', current_setting('t.code')), 'role_taken');

-- คู่ที่สอง (D) ไว้ทดสอบข้ามคู่
select budu_test.act('d');
select set_config('t.couple2', (public.budu_create_couple() ->> 'couple_id'), false);

-- ---------------------------------------------------------------------
-- จัดการกิจกรรม/รางวัล
-- ---------------------------------------------------------------------
select budu_test.act('a');
select set_config('t.earn',   (public.budu_upsert_activity(null, 'นอนก่อน 23.30', 'earn', 30, 10, 'moon', true, true, true)).id::text, false);
select set_config('t.deduct', (public.budu_upsert_activity(null, 'กินขนมดึก', 'deduct', 50, null, 'snack', false, true, true)).id::text, false);
select set_config('t.earn20', (public.budu_upsert_activity(null, 'ดื่มน้ำ', 'earn', 1, 20, 'water', true, true, true)).id::text, false);
select set_config('t.reward', (public.budu_upsert_reward(null, 'Sushiro', 40, true)).id::text, false);
select budu_test.expect_ok('upsert_activity แก้แล้ว kind ไม่เปลี่ยน',
  format($$select public.budu_upsert_activity(%L, 'นอนก่อน 23.30', 'deduct', 30, 10, 'moon', true, true, true)$$, current_setting('t.earn')));
select budu_test.check('kind ยังเป็น earn', (select kind = 'earn' from public.budu_activities where id = current_setting('t.earn')::uuid));

-- ---------------------------------------------------------------------
-- สิทธิ์: partner เรียกฟังก์ชันของ admin
-- ---------------------------------------------------------------------
select budu_test.act('b');
select budu_test.expect_error('partner log_deduct',      format('select public.budu_log_deduct(%L)', current_setting('t.deduct')), 'forbidden');
select budu_test.expect_error('partner cancel_entry',    format('select public.budu_cancel_entry(%L)', gen_random_uuid()), 'forbidden');
select budu_test.expect_error('partner decide_entry',    format('select public.budu_decide_entry(%L, true)', gen_random_uuid()), 'forbidden');
select budu_test.expect_error('partner mark_coupon_used', format('select public.budu_mark_coupon_used(%L)', gen_random_uuid()), 'forbidden');
select budu_test.expect_error('partner upsert_activity', $$select public.budu_upsert_activity(null, 'x', 'earn', 1, 10, 'star', true, true, true)$$, 'forbidden');
select budu_test.expect_error('partner upsert_reward',   $$select public.budu_upsert_reward(null, 'x', 1, true)$$, 'forbidden');
select budu_test.expect_error('partner delete_reward',   format('select public.budu_delete_reward(%L)', current_setting('t.reward')), 'forbidden');
select budu_test.expect_error('partner export_all',      'select public.budu_export_all()', 'forbidden');

-- client เขียนตารางตรง ๆ
select budu_test.expect_error('insert ตรงถูกปฏิเสธ',
  format($$insert into public.budu_entries (couple_id, activity_name, kind, points, status) values (%L, 'hack', 'earn', 999, 'confirmed')$$, current_setting('t.couple')));
select budu_test.expect_error('update ตรงถูกปฏิเสธ', $$update public.budu_rewards set cost = 1$$);
select budu_test.expect_error('delete ตรงถูกปฏิเสธ', $$delete from public.budu_activities$$);

-- ---------------------------------------------------------------------
-- ให้แต้ม / โควตาวันละครั้ง
-- ---------------------------------------------------------------------
select set_config('t.p1', (public.budu_log_earn(current_setting('t.earn')::uuid)).id::text, false);
select budu_test.check('partner log_earn → pending', (select status = 'pending' from public.budu_entries where id = current_setting('t.p1')::uuid));
select budu_test.expect_error('log_earn ซ้ำวันเดียวกัน (pending)', format('select public.budu_log_earn(%L)', current_setting('t.earn')), 'already_logged');

select budu_test.act('a');
select budu_test.expect_error('admin log_earn ซ้ำ (มี pending ของแฟนแล้ว)', format('select public.budu_log_earn(%L)', current_setting('t.earn')), 'already_logged');
select budu_test.expect_ok('admin decide_entry ไม่ผ่าน', format('select public.budu_decide_entry(%L, false)', current_setting('t.p1')));
select set_config('t.e1', (public.budu_log_earn(current_setting('t.earn')::uuid)).id::text, false);
select budu_test.check('หลัง rejected กดใหม่ได้ · admin → confirmed',
  (select status = 'confirmed' from public.budu_entries where id = current_setting('t.e1')::uuid));
select budu_test.expect_error('log_earn ซ้ำวันเดียวกัน (confirmed)', format('select public.budu_log_earn(%L)', current_setting('t.earn')), 'already_logged');
select budu_test.check('แต้มรวม 30', budu_test.balance(current_setting('t.couple')::uuid) = 30, budu_test.balance(current_setting('t.couple')::uuid)::text);

-- ---------------------------------------------------------------------
-- หักแต้ม
-- ---------------------------------------------------------------------
select budu_test.expect_ok('log_deduct ครั้งที่ 1', format('select public.budu_log_deduct(%L)', current_setting('t.deduct')));
select budu_test.check('แต้มรวม 30 แล้วหัก 50 = −20', budu_test.balance(current_setting('t.couple')::uuid) = -20, budu_test.balance(current_setting('t.couple')::uuid)::text);
select budu_test.expect_ok('log_deduct ครั้งที่ 2 วันเดียวกัน', format('select public.budu_log_deduct(%L)', current_setting('t.deduct')));
select budu_test.expect_ok('log_deduct ครั้งที่ 3 วันเดียวกัน', format('select public.budu_log_deduct(%L)', current_setting('t.deduct')));
select budu_test.expect_error('log_deduct กับกิจกรรม earn', format('select public.budu_log_deduct(%L)', current_setting('t.earn')), 'activity_not_found');

-- ยกเลิกรายการหักแต้ม 2 รายการ → กลับเป็น −20
do $$ declare r record; begin
  for r in select id from public.budu_entries where activity_id = current_setting('t.deduct')::uuid and status = 'confirmed' limit 2 loop
    perform public.budu_cancel_entry(r.id);
  end loop; end $$;
select budu_test.check('cancel_entry ปรับแต้มกลับ', budu_test.balance(current_setting('t.couple')::uuid) = -20, budu_test.balance(current_setting('t.couple')::uuid)::text);
select budu_test.check('รายการที่ยกเลิกยังอยู่ (cancelled)',
  (select count(*) = 2 from public.budu_entries where activity_id = current_setting('t.deduct')::uuid and status = 'cancelled'));
-- ยกเลิก earn วันนี้ แล้วกดใหม่ได้
select budu_test.expect_ok('cancel_entry earn', format('select public.budu_cancel_entry(%L)', current_setting('t.e1')));
select budu_test.expect_ok('หลัง cancelled กดใหม่ได้', format('select public.budu_log_earn(%L)', current_setting('t.earn')));
-- แต้มตอนนี้ = 30 − 50 = −20

-- ---------------------------------------------------------------------
-- ข้ามคู่
-- ---------------------------------------------------------------------
select budu_test.act('d');
select budu_test.check('คู่อื่นอ่านรายการไม่เห็น', (select count(*) = 0 from public.budu_entries where couple_id = current_setting('t.couple')::uuid));
select budu_test.check('คู่อื่นอ่านกิจกรรมไม่เห็น', (select count(*) = 0 from public.budu_activities where couple_id = current_setting('t.couple')::uuid));
select budu_test.expect_error('คู่อื่น log_deduct กิจกรรมของคู่นี้', format('select public.budu_log_deduct(%L)', current_setting('t.deduct')), 'activity_not_found');
select budu_test.expect_error('คู่อื่น delete_reward ของคู่นี้', format('select public.budu_delete_reward(%L)', current_setting('t.reward')), 'reward_not_found');
select budu_test.act('c');
select budu_test.check('คนที่ไม่มีคู่อ่านอะไรไม่เห็น', (select count(*) = 0 from public.budu_couples));

-- ---------------------------------------------------------------------
-- รางวัล / คูปอง
-- ---------------------------------------------------------------------
select budu_test.act('b');
select budu_test.expect_error('redeem แต้มไม่พอ', format('select public.budu_redeem_reward(%L)', current_setting('t.reward')), 'insufficient_points');
select budu_test.check('แต้มไม่พอไม่เกิด coupon', (select count(*) = 0 from public.budu_coupons where couple_id = current_setting('t.couple')::uuid));
select budu_test.check('แต้มไม่พอไม่เกิด entry redeem', (select count(*) = 0 from public.budu_entries where couple_id = current_setting('t.couple')::uuid and kind = 'redeem'));

select budu_test.act('a');
select budu_test.expect_error('admin redeem_reward', format('select public.budu_redeem_reward(%L)', current_setting('t.reward')), 'forbidden');
-- เติมแต้มให้พอ (ใส่ตรงในฐานะ postgres) : −20 + 80 = 60
reset role;
insert into public.budu_entries (couple_id, activity_name, kind, points, status, entry_date)
values (current_setting('t.couple')::uuid, 'เติมแต้มทดสอบ', 'earn', 80, 'confirmed', current_date - 100);
set role authenticated;

select budu_test.act('b');
select set_config('t.coupon', (public.budu_redeem_reward(current_setting('t.reward')::uuid)).id::text, false);
select budu_test.check('redeem ตัดแต้ม 40 → 20', budu_test.balance(current_setting('t.couple')::uuid) = 20, budu_test.balance(current_setting('t.couple')::uuid)::text);
select budu_test.expect_error('redeem ครั้งที่ 2 แต้มไม่พอ', format('select public.budu_redeem_reward(%L)', current_setting('t.reward')), 'insufficient_points');

select budu_test.act('a');
select budu_test.expect_ok('แก้ cost และชื่อรางวัลหลังแลก', format($$select public.budu_upsert_reward(%L, 'Sushiro ใหม่', 999, true)$$, current_setting('t.reward')));
select budu_test.check('คูปองเดิมยังเป็นชื่อ/แต้มเดิม',
  (select reward_name = 'Sushiro' and cost = 40 from public.budu_coupons where id = current_setting('t.coupon')::uuid));
select budu_test.expect_error('admin request_coupon_use', format('select public.budu_request_coupon_use(%L)', current_setting('t.coupon')), 'forbidden');

select budu_test.act('b');
select budu_test.expect_ok('partner request_coupon_use', format('select public.budu_request_coupon_use(%L)', current_setting('t.coupon')));
select budu_test.check('คูปอง → requested', (select status = 'requested' and requested_at is not null from public.budu_coupons where id = current_setting('t.coupon')::uuid));

select budu_test.act('a');
select budu_test.expect_ok('admin decline_coupon_request', format('select public.budu_decline_coupon_request(%L)', current_setting('t.coupon')));
select budu_test.check('คูปอง → active', (select status = 'active' from public.budu_coupons where id = current_setting('t.coupon')::uuid));
select budu_test.act('b');
select budu_test.expect_ok('partner ขอใช้อีกครั้ง', format('select public.budu_request_coupon_use(%L)', current_setting('t.coupon')));
select budu_test.act('a');
select budu_test.expect_ok('admin mark_coupon_used', format('select public.budu_mark_coupon_used(%L)', current_setting('t.coupon')));
select budu_test.check('คูปอง → used', (select status = 'used' and used_at is not null from public.budu_coupons where id = current_setting('t.coupon')::uuid));
select budu_test.expect_error('used ย้อนกลับไม่ได้', format('select public.budu_decline_coupon_request(%L)', current_setting('t.coupon')), 'coupon_not_found');

select budu_test.expect_ok('delete_reward ที่มีคูปองแล้ว', format('select public.budu_delete_reward(%L)', current_setting('t.reward')));
select budu_test.check('คูปองยังอยู่ reward_id = null',
  (select reward_id is null and reward_name = 'Sushiro' from public.budu_coupons where id = current_setting('t.coupon')::uuid));
select budu_test.expect_error('cancel_entry ของ redeem ไม่ได้',
  format('select public.budu_cancel_entry(%L)', (select redeem_entry_id from public.budu_coupons where id = current_setting('t.coupon')::uuid)), 'entry_not_found');

select budu_test.expect_ok('export_all', 'select public.budu_export_all()');
select budu_test.check('export_all ไม่มี auth_uid', position('auth_uid' in public.budu_export_all()::text) = 0);

-- ---------------------------------------------------------------------
-- streak (ใส่ entry ย้อนหลังตรง ๆ ในฐานะ postgres แล้วเรียก sync_streak)
-- ---------------------------------------------------------------------
reset role;
create or replace function budu_test.seed(p_act uuid, p_days int[]) returns void language sql as $$
  insert into public.budu_entries (couple_id, activity_id, activity_name, kind, points, status, entry_date)
  select a.couple_id, a.id, a.name, 'earn', a.points, 'confirmed', date '2026-01-01' + d
  from public.budu_activities a, unnest(p_days) d where a.id = p_act
$$;
create or replace function budu_test.bonus_days(p_act uuid) returns text language sql as $$
  select coalesce(string_agg((entry_date - date '2026-01-01')::text, ',' order by entry_date), '')
  from public.budu_entries where activity_id = p_act and kind = 'streak_bonus' and status = 'confirmed'
$$;

-- 14 วันติด (วันที่ 1..14) → โบนัสวันที่ 7, 14
select budu_test.seed(current_setting('t.earn')::uuid, array(select generate_series(1, 14)));
select public.budu_sync_streak(current_setting('t.earn')::uuid);
select budu_test.check('streak 14 วัน โบนัสวันที่ 7 และ 14', budu_test.bonus_days(current_setting('t.earn')::uuid) = '7,14', budu_test.bonus_days(current_setting('t.earn')::uuid));
select budu_test.check('โบนัส = streak_bonus ของกิจกรรม (+10)',
  (select bool_and(points = 10) from public.budu_entries where activity_id = current_setting('t.earn')::uuid and kind = 'streak_bonus'));
select public.budu_sync_streak(current_setting('t.earn')::uuid);
select public.budu_sync_streak(current_setting('t.earn')::uuid);
select budu_test.check('sync_streak ซ้ำไม่เกิดโบนัสซ้ำ',
  (select count(*) = 2 from public.budu_entries where activity_id = current_setting('t.earn')::uuid and kind = 'streak_bonus' and status = 'confirmed'));

-- ยกเลิกวันที่ 3 → เหลือสะสม 13 วัน วันที่ทำครบ 7 คือวันที่ 8 (นับสะสม ไม่ต้องติดกัน)
set role authenticated;
select budu_test.act('a');
select budu_test.expect_ok('cancel วันที่ 3 ของ streak',
  format('select public.budu_cancel_entry(%L)', (select id from public.budu_entries where activity_id = current_setting('t.earn')::uuid
    and kind = 'earn' and entry_date = date '2026-01-04' and status = 'confirmed')));
reset role;
select budu_test.check('ยกเลิกกลางทาง โบนัสปรับเป็นวันที่ 8 และวันนี้ (วันนี้มี earn อีก 1 = สะสมครบ 14)',
  budu_test.bonus_days(current_setting('t.earn')::uuid) = '8,' || ((now() at time zone 'Asia/Bangkok')::date - date '2026-01-01'), budu_test.bonus_days(current_setting('t.earn')::uuid));

-- ข้ามวันที่ 5: ทำวันที่ 1-4, 6-11 → สะสมครบ 7 ที่วันที่ 8 · กิจกรรม streak_bonus = 20
select budu_test.seed(current_setting('t.earn20')::uuid, array[1,2,3,4,6,7,8,9,10,11]);
select public.budu_sync_streak(current_setting('t.earn20')::uuid);
select budu_test.check('ข้ามวันได้ สะสมครบ 7 โบนัสวันที่ 8', budu_test.bonus_days(current_setting('t.earn20')::uuid) = '8', budu_test.bonus_days(current_setting('t.earn20')::uuid));
select budu_test.seed(current_setting('t.earn20')::uuid, array[12]);
select public.budu_sync_streak(current_setting('t.earn20')::uuid);
select budu_test.check('วันที่ 12 (สะสม 11) ไม่มีโบนัสเพิ่ม', budu_test.bonus_days(current_setting('t.earn20')::uuid) = '8', budu_test.bonus_days(current_setting('t.earn20')::uuid));
select budu_test.check('streak_bonus = 20 ได้ +20',
  (select bool_and(points = 20) from public.budu_entries where activity_id = current_setting('t.earn20')::uuid and kind = 'streak_bonus' and status = 'confirmed'));

-- ---------------------------------------------------------------------
-- กิจกรรมแบบหลายครั้งต่อวัน (once_per_day = false)
-- ---------------------------------------------------------------------
set role authenticated;
select budu_test.act('a');
select set_config('t.multi', (public.budu_upsert_activity(null, 'ล้างจาน', 'earn', 5, 10, 'broom', true, true, false)).id::text, false);
select budu_test.expect_ok('หลายครั้งต่อวัน · admin ครั้งที่ 1', format('select public.budu_log_earn(%L)', current_setting('t.multi')));
select budu_test.expect_ok('หลายครั้งต่อวัน · admin ครั้งที่ 2 วันเดียวกัน', format('select public.budu_log_earn(%L)', current_setting('t.multi')));
select budu_test.act('b');
select budu_test.expect_ok('หลายครั้งต่อวัน · partner ส่งซ้ำได้ (pending)', format('select public.budu_log_earn(%L)', current_setting('t.multi')));
select budu_test.check('หลายครั้งต่อวัน · มี 3 รายการวันนี้',
  (select count(*) = 3 from public.budu_entries where activity_id = current_setting('t.multi')::uuid and kind = 'earn'));
select budu_test.act('a');
select budu_test.expect_ok('แก้เป็นวันละครั้ง', format($$select public.budu_upsert_activity(%L, 'ล้างจาน', 'earn', 5, 10, 'broom', true, true, true)$$, current_setting('t.multi')));
select budu_test.expect_error('วันละครั้ง · มีรายการวันนี้แล้วกดไม่ได้', format('select public.budu_log_earn(%L)', current_setting('t.multi')), 'already_logged');

-- ---------------------------------------------------------------------
-- น้องตาล (role kid): ข้อมูลแยกจากเตย
-- ---------------------------------------------------------------------
set role authenticated;
select budu_test.act('f');
select budu_test.expect_ok('น้องตาล join ด้วยรหัสเดิม', format($$select public.budu_join_couple(%L, 'kid')$$, current_setting('t.code')));
select budu_test.check('ได้ role kid ชื่อ น้องตาล',
  (select role = 'kid' and nickname = 'น้องตาล' from public.budu_members where auth_uid = budu_test.uid('f')));
select budu_test.act('9');
select budu_test.expect_error('บทบาทน้องตาลซ้ำ', format($$select public.budu_join_couple(%L, 'kid')$$, current_setting('t.code')), 'role_taken');
select budu_test.expect_error('join บทบาท admin ไม่ได้', format($$select public.budu_join_couple(%L, 'admin')$$, current_setting('t.code')), 'forbidden');

select budu_test.act('a');
select set_config('t.kact', (public.budu_upsert_activity(null, 'เก็บของเล่น', 'earn', 7, 10, 'star', false, true, true, 'kid')).id::text, false);
select set_config('t.pact', (public.budu_upsert_activity(null, 'งานของเตย', 'earn', 3, 10, 'star', false, true, true, 'partner')).id::text, false);
select set_config('t.krew', (public.budu_upsert_reward(null, 'ไอศกรีม', 5, true, 'kid')).id::text, false);
select set_config('t.prew', (public.budu_upsert_reward(null, 'รางวัลเตย', 1, true, 'partner')).id::text, false);
select budu_test.expect_error('owner ไม่ถูกต้อง', $$select public.budu_upsert_activity(null, 'x', 'earn', 1, 10, 'star', false, true, true, 'admin')$$, 'forbidden');
select budu_test.check('ผู้ดูแลเห็นกิจกรรมทั้งของเตยและน้องตาล',
  (select count(*) = 2 from public.budu_activities where id in (current_setting('t.kact')::uuid, current_setting('t.pact')::uuid)));

select budu_test.act('f');
select budu_test.check('น้องตาลไม่เห็นกิจกรรม/รางวัล/รายการของเตย',
  not exists (select 1 from public.budu_activities where owner = 'partner')
  and not exists (select 1 from public.budu_rewards where owner = 'partner')
  and not exists (select 1 from public.budu_entries where owner = 'partner'));
select budu_test.check('น้องตาลเห็นกิจกรรมของตัวเอง', exists (select 1 from public.budu_activities where id = current_setting('t.kact')::uuid));
select budu_test.expect_error('น้องตาลกดกิจกรรมของเตยไม่ได้', format('select public.budu_log_earn(%L)', current_setting('t.pact')), 'activity_not_found');
select budu_test.expect_ok('น้องตาลส่งกิจกรรมของตัวเอง', format('select public.budu_log_earn(%L)', current_setting('t.kact')));
select budu_test.check('รายการของน้องตาล pending owner kid',
  (select status = 'pending' and owner = 'kid' from public.budu_entries where activity_id = current_setting('t.kact')::uuid));
select budu_test.expect_error('น้องตาลแลกรางวัลของเตยไม่ได้', format('select public.budu_redeem_reward(%L)', current_setting('t.prew')), 'reward_not_found');
select budu_test.expect_error('น้องตาลแต้มไม่พอ (ไม่ใช้แต้มของเตย)', format('select public.budu_redeem_reward(%L)', current_setting('t.krew')), 'insufficient_points');
select budu_test.expect_error('น้องตาลจัดการกิจกรรมไม่ได้', $$select public.budu_upsert_activity(null, 'x', 'earn', 1, 10, 'star', false, true, true, 'kid')$$, 'forbidden');

select budu_test.act('b');
select budu_test.check('เตยไม่เห็นข้อมูลของน้องตาล',
  not exists (select 1 from public.budu_activities where owner = 'kid')
  and not exists (select 1 from public.budu_entries where owner = 'kid'));
select budu_test.expect_error('เตยกดกิจกรรมของน้องตาลไม่ได้', format('select public.budu_log_earn(%L)', current_setting('t.kact')), 'activity_not_found');

select budu_test.act('a');
select budu_test.expect_ok('ยืนยันรายการของน้องตาล', format('select public.budu_decide_entry(%L, true)',
  (select id from public.budu_entries where activity_id = current_setting('t.kact')::uuid)));
select budu_test.act('b');
select budu_test.check('แต้มรวมแยกคน: น้องตาล = 7', (public.budu_points_summary() ->> 'kid')::int = 7, public.budu_points_summary()::text);
select budu_test.act('f');
select budu_test.expect_ok('น้องตาลแลกรางวัลด้วยแต้มตัวเอง', format('select public.budu_redeem_reward(%L)', current_setting('t.krew')));
select budu_test.check('คูปองเป็นของน้องตาล', exists (select 1 from public.budu_coupons where reward_id = current_setting('t.krew')::uuid and owner = 'kid'));
select budu_test.check('แต้มน้องตาลเหลือ 2', (public.budu_points_summary() ->> 'kid')::int = 2, public.budu_points_summary()::text);

-- ลบกิจกรรม: แต้มเดิมคงอยู่
set role authenticated;
select budu_test.act('f');
select budu_test.expect_error('น้องตาลลบกิจกรรมไม่ได้', format('select public.budu_delete_activity(%L)', current_setting('t.kact')), 'forbidden');
select budu_test.act('a');
select budu_test.expect_ok('ปรายฟ้าลบกิจกรรม', format('select public.budu_delete_activity(%L)', current_setting('t.kact')));
select budu_test.check('กิจกรรมหายไป', not exists (select 1 from public.budu_activities where id = current_setting('t.kact')::uuid));
select budu_test.check('แต้มน้องตาลยังเท่าเดิม (2)', (public.budu_points_summary() ->> 'kid')::int = 2, public.budu_points_summary()::text);
select budu_test.check('รายการเดิมยังอยู่พร้อมชื่อ', exists (select 1 from public.budu_entries where activity_id is null and activity_name = 'เก็บของเล่น'));

-- ---------------------------------------------------------------------
-- rejoin (เครื่องใหม่ของแฟน)
-- ---------------------------------------------------------------------
set role authenticated;
select budu_test.act('e');
select budu_test.expect_error('rejoin รหัสผิด', $$select public.budu_rejoin('ZZZZ-ZZZZ', 'partner')$$, 'code_not_found');
select budu_test.expect_ok('rejoin ด้วยรหัสและ role เดิม', format($$select public.budu_rejoin(%L, 'partner')$$, current_setting('t.code')));
select budu_test.check('เครื่องใหม่เป็น partner ของคู่เดิม', public.budu_my_couple_id() = current_setting('t.couple')::uuid and public.budu_my_role() = 'partner');
select budu_test.act('b');
select budu_test.check('เครื่องเก่าหลุดจากคู่', public.budu_my_couple_id() is null);

-- ---------------------------------------------------------------------
-- เก็บกวาด + แสดงผล
-- ---------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '', false);
delete from public.budu_couples where id in (current_setting('t.couple')::uuid, current_setting('t.couple2')::uuid);

select n, ok, name, detail from budu_test.results order by ok, n;
