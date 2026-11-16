-- =====================================================================
-- BuDu · seed-streak-test.sql — ใส่ข้อมูลย้อนหลังให้ "คู่ทดสอบ" เพื่อดู streak/โบนัสบนหน้าจอ (ขั้น 6)
-- ใช้กับคู่ทดสอบรหัส 2M35-3XXL เท่านั้น · ห้ามรันกับคู่จริง
-- รันใน Supabase SQL Editor แล้วเปิดแอป (เครื่องทดสอบ) จะเห็นผลทันที
-- =====================================================================

-- กิจกรรม "นอนก่อน 23.30" ของคู่ทดสอบ: ใส่รายการ confirmed ย้อนหลัง 13 วัน (เมื่อวานถึง 13 วันก่อน)
-- รวมกับรายการวันนี้ที่มีอยู่แล้ว = ติดต่อกัน 14 วัน → ต้องได้โบนัส 2 ครั้ง (วันที่ 7 และ 14)
with a as (
  select act.* from public.budu_activities act
  join public.budu_couples c on c.id = act.couple_id
  where c.pair_code = '2M353XXL' and act.name = 'นอนก่อน 23.30'
),
admin as (
  select m.id from public.budu_members m join a on m.couple_id = a.couple_id where m.role = 'admin'
)
insert into public.budu_entries (couple_id, activity_id, activity_name, kind, points, status, entry_date, created_by, decided_by, decided_at)
select a.couple_id, a.id, a.name, 'earn', a.points, 'confirmed',
       (now() at time zone 'Asia/Bangkok')::date - d, (select id from admin), (select id from admin), now()
from a, generate_series(1, 13) d
on conflict do nothing;

-- ให้ฐานข้อมูลคำนวณโบนัสตามกติกา
select public.budu_sync_streak(act.id)
from public.budu_activities act join public.budu_couples c on c.id = act.couple_id
where c.pair_code = '2M353XXL' and act.name = 'นอนก่อน 23.30';

-- ดูผล: ต้องเห็นโบนัส +10 สองแถว (13 วันก่อน + 6 = วันที่ 7 และวันนี้)
select e.entry_date, e.kind, e.points, e.status
from public.budu_entries e join public.budu_couples c on c.id = e.couple_id
where c.pair_code = '2M353XXL' and e.kind = 'streak_bonus'
order by e.entry_date;
