-- =====================================================================
-- BuDu · schema.sql
-- รันใน Supabase → SQL Editor (รันซ้ำได้)
-- โปรเจกต์นี้ใช้ร่วมกับแอปอื่น ทุกตาราง/ฟังก์ชันจึงขึ้นต้นด้วย budu_
-- ไม่แตะตารางหรือนโยบายอื่นของโปรเจกต์
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- ตาราง
-- ---------------------------------------------------------------------
create table if not exists public.budu_couples (
  id uuid primary key default gen_random_uuid(),
  pair_code text unique not null,              -- เก็บแบบไม่มีขีด 8 ตัว เช่น K7MQ2XPD
  created_at timestamptz not null default now()
);

create table if not exists public.budu_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.budu_couples(id) on delete cascade,
  auth_uid uuid not null unique,
  role text not null check (role in ('admin','partner')),
  nickname text not null check (char_length(nickname) between 1 and 30),
  created_at timestamptz not null default now(),
  unique (couple_id, role)
);

create table if not exists public.budu_activities (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.budu_couples(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('earn','deduct')),
  points int not null check (points between 1 and 999),
  streak_bonus int not null default 10 check (streak_bonus between 0 and 999),
  icon text not null default 'star' check (char_length(icon) between 1 and 30),
  streak_enabled boolean not null default true,
  once_per_day boolean not null default true,    -- true = ให้แต้มได้วันละครั้ง · false = หลายครั้งต่อวัน (ใช้เฉพาะ earn)
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
-- เพิ่มคอลัมน์ให้ตารางที่สร้างไว้ก่อนแล้ว (กิจกรรมเดิมเป็นวันละครั้ง)
alter table public.budu_activities add column if not exists once_per_day boolean not null default true;
create index if not exists budu_activities_couple on public.budu_activities (couple_id);

create table if not exists public.budu_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.budu_couples(id) on delete cascade,
  activity_id uuid references public.budu_activities(id) on delete set null,
  activity_name text not null,
  kind text not null check (kind in ('earn','deduct','streak_bonus','redeem')),
  points int not null,
  status text not null check (status in ('pending','confirmed','rejected','cancelled')),
  entry_date date not null default ((now() at time zone 'Asia/Bangkok')::date),
  created_by uuid references public.budu_members(id),
  decided_by uuid references public.budu_members(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists budu_entries_couple_date on public.budu_entries (couple_id, entry_date desc);
-- โควตาวันละครั้งตรวจใน budu_log_earn แทนดัชนี (กิจกรรมแบบหลายครั้งต่อวันกดซ้ำได้)
drop index if exists public.budu_entries_one_earn_per_day;
create unique index if not exists budu_entries_one_bonus_per_day on public.budu_entries (activity_id, entry_date)
  where kind = 'streak_bonus' and status = 'confirmed';

create table if not exists public.budu_rewards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.budu_couples(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  cost int not null check (cost between 1 and 99999),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists budu_rewards_couple on public.budu_rewards (couple_id);

create table if not exists public.budu_coupons (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.budu_couples(id) on delete cascade,
  reward_id uuid references public.budu_rewards(id) on delete set null,
  reward_name text not null,
  cost int not null,
  status text not null default 'active' check (status in ('active','requested','used')),
  redeem_entry_id uuid references public.budu_entries(id),
  redeemed_by uuid references public.budu_members(id),
  redeemed_at timestamptz not null default now(),
  requested_at timestamptz,
  used_by uuid references public.budu_members(id),
  used_at timestamptz
);
create index if not exists budu_coupons_couple on public.budu_coupons (couple_id);

-- ---------------------------------------------------------------------
-- ฟังก์ชันช่วย (security definer → อ่าน members ได้โดยไม่ติด RLS)
-- ---------------------------------------------------------------------
create or replace function public.budu_my_couple_id() returns uuid
language sql stable security definer set search_path = public as $$
  select couple_id from public.budu_members where auth_uid = auth.uid()
$$;

create or replace function public.budu_my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.budu_members where auth_uid = auth.uid()
$$;

-- คืนแถวสมาชิกของผู้เรียก ถ้าไม่มีหรือบทบาทไม่ตรงให้ error
create or replace function public.budu_require(p_role text default null) returns public.budu_members
language plpgsql stable security definer set search_path = public as $$
declare m public.budu_members;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into m from public.budu_members where auth_uid = auth.uid();
  if not found then raise exception 'not_member'; end if;
  if p_role is not null and m.role <> p_role then raise exception 'forbidden'; end if;
  return m;
end $$;

create or replace function public.budu_require_no_member() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.budu_members where auth_uid = auth.uid()) then
    raise exception 'already_member';
  end if;
end $$;

create or replace function public.budu_normalize_code(p_code text) returns text
language sql immutable as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

create or replace function public.budu_new_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 ตัว ไม่มี 0 O 1 I
  b bytea; code text;
begin
  loop
    b := extensions.gen_random_bytes(8);
    code := '';
    for i in 0..7 loop
      code := code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.budu_couples where pair_code = code);
  end loop;
  return code;
end $$;

-- แสดงรหัสเป็น XXXX-XXXX
create or replace function public.budu_format_code(p_code text) returns text
language sql immutable as $$ select substr(p_code, 1, 4) || '-' || substr(p_code, 5, 4) $$;

-- ---------------------------------------------------------------------
-- streak: ปรับโบนัสให้ตรงกติกา (idempotent)
-- ---------------------------------------------------------------------
create or replace function public.budu_sync_streak(p_activity_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.budu_activities; owed date[];
begin
  select * into a from public.budu_activities where id = p_activity_id;
  if not found or a.kind <> 'earn' or not a.streak_enabled then return; end if;

  -- วันที่ที่ควรได้โบนัส: ตำแหน่งที่ 7, 14, 21 ... ของแต่ละช่วงวันติดกัน
  select coalesce(array_agg(entry_date), '{}') into owed from (
    select entry_date,
           row_number() over (partition by grp order by entry_date) as pos
    from (
      select entry_date, entry_date - (row_number() over (order by entry_date))::int as grp
      from (select distinct entry_date from public.budu_entries
            where activity_id = a.id and kind = 'earn' and status = 'confirmed') d
    ) g
  ) r
  where pos % 7 = 0;

  -- เพิ่มโบนัสที่ขาด
  insert into public.budu_entries (couple_id, activity_id, activity_name, kind, points, status, entry_date, created_by, decided_at)
  select a.couple_id, a.id, a.name, 'streak_bonus', a.streak_bonus, 'confirmed', o.d, null, now()
  from unnest(owed) as o(d)
  where not exists (select 1 from public.budu_entries e
                    where e.activity_id = a.id and e.kind = 'streak_bonus' and e.status = 'confirmed' and e.entry_date = o.d);

  -- ยกเลิกโบนัสที่ไม่ถึงเกณฑ์แล้ว
  update public.budu_entries e set status = 'cancelled', decided_at = now()
  where e.activity_id = a.id and e.kind = 'streak_bonus' and e.status = 'confirmed'
    and not (e.entry_date = any(owed));
end $$;

-- ---------------------------------------------------------------------
-- จับคู่
-- ---------------------------------------------------------------------
create or replace function public.budu_create_couple() returns json
language plpgsql security definer set search_path = public as $$
declare c public.budu_couples; m public.budu_members;
begin
  perform public.budu_require_no_member();
  insert into public.budu_couples (pair_code) values (public.budu_new_code()) returning * into c;
  insert into public.budu_members (couple_id, auth_uid, role, nickname)
    values (c.id, auth.uid(), 'admin', 'ปรายฟ้า') returning * into m;
  return json_build_object('couple_id', c.id, 'member_id', m.id, 'role', m.role,
                           'nickname', m.nickname, 'pair_code', public.budu_format_code(c.pair_code));
end $$;

create or replace function public.budu_join_couple(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare c public.budu_couples; m public.budu_members;
begin
  perform public.budu_require_no_member();
  select * into c from public.budu_couples where pair_code = public.budu_normalize_code(p_code) for update;
  if not found then raise exception 'code_not_found'; end if;
  if exists (select 1 from public.budu_members where couple_id = c.id and role = 'partner') then
    raise exception 'role_taken';
  end if;
  insert into public.budu_members (couple_id, auth_uid, role, nickname)
    values (c.id, auth.uid(), 'partner', 'เตย') returning * into m;
  return json_build_object('couple_id', c.id, 'member_id', m.id, 'role', m.role,
                           'nickname', m.nickname, 'pair_code', public.budu_format_code(c.pair_code));
end $$;

create or replace function public.budu_rejoin(p_code text, p_role text) returns json
language plpgsql security definer set search_path = public as $$
declare c public.budu_couples; m public.budu_members;
begin
  perform public.budu_require_no_member();
  select * into c from public.budu_couples where pair_code = public.budu_normalize_code(p_code);
  if not found then raise exception 'code_not_found'; end if;
  update public.budu_members set auth_uid = auth.uid()
    where couple_id = c.id and role = p_role returning * into m;
  if not found then raise exception 'code_not_found'; end if;
  return json_build_object('couple_id', c.id, 'member_id', m.id, 'role', m.role,
                           'nickname', m.nickname, 'pair_code', public.budu_format_code(c.pair_code));
end $$;

create or replace function public.budu_get_pair_code() returns text
language plpgsql stable security definer set search_path = public as $$
declare m public.budu_members;
begin
  m := public.budu_require();
  return (select public.budu_format_code(pair_code) from public.budu_couples where id = m.couple_id);
end $$;

-- ---------------------------------------------------------------------
-- รายการแต้ม
-- ---------------------------------------------------------------------
create or replace function public.budu_log_earn(p_activity_id uuid) returns public.budu_entries
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; a public.budu_activities; e public.budu_entries;
begin
  m := public.budu_require();
  -- ล็อกแถวกิจกรรม กันกดพร้อมกัน 2 เครื่องแล้วเกินโควตาวันละครั้ง
  select * into a from public.budu_activities
    where id = p_activity_id and couple_id = m.couple_id and is_active and kind = 'earn'
    for update;
  if not found then raise exception 'activity_not_found'; end if;
  if a.once_per_day and exists (
    select 1 from public.budu_entries
     where activity_id = a.id and kind = 'earn' and status in ('pending','confirmed')
       and entry_date = (now() at time zone 'Asia/Bangkok')::date) then
    raise exception 'already_logged';
  end if;
  insert into public.budu_entries (couple_id, activity_id, activity_name, kind, points, status, created_by, decided_by, decided_at)
  values (m.couple_id, a.id, a.name, 'earn', a.points,
          case when m.role = 'admin' then 'confirmed' else 'pending' end,
          m.id,
          case when m.role = 'admin' then m.id end,
          case when m.role = 'admin' then now() end)
  returning * into e;
  if e.status = 'confirmed' then perform public.budu_sync_streak(a.id); end if;
  return e;
end $$;

create or replace function public.budu_log_deduct(p_activity_id uuid) returns public.budu_entries
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; a public.budu_activities; e public.budu_entries;
begin
  m := public.budu_require('admin');
  select * into a from public.budu_activities
    where id = p_activity_id and couple_id = m.couple_id and is_active and kind = 'deduct';
  if not found then raise exception 'activity_not_found'; end if;
  insert into public.budu_entries (couple_id, activity_id, activity_name, kind, points, status, created_by, decided_by, decided_at)
  values (m.couple_id, a.id, a.name, 'deduct', -a.points, 'confirmed', m.id, m.id, now())
  returning * into e;
  return e;
end $$;

create or replace function public.budu_decide_entry(p_entry_id uuid, p_confirm boolean) returns public.budu_entries
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; e public.budu_entries;
begin
  m := public.budu_require('admin');
  update public.budu_entries
     set status = case when p_confirm then 'confirmed' else 'rejected' end,
         decided_by = m.id, decided_at = now()
   where id = p_entry_id and couple_id = m.couple_id and kind = 'earn' and status = 'pending'
  returning * into e;
  if not found then raise exception 'entry_not_found'; end if;
  if p_confirm and e.activity_id is not null then perform public.budu_sync_streak(e.activity_id); end if;
  return e;
end $$;

create or replace function public.budu_cancel_entry(p_entry_id uuid) returns public.budu_entries
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; e public.budu_entries;
begin
  m := public.budu_require('admin');
  update public.budu_entries
     set status = 'cancelled', decided_by = m.id, decided_at = now()
   where id = p_entry_id and couple_id = m.couple_id and kind in ('earn','deduct') and status = 'confirmed'
  returning * into e;
  if not found then raise exception 'entry_not_found'; end if;
  if e.kind = 'earn' and e.activity_id is not null then perform public.budu_sync_streak(e.activity_id); end if;
  return e;
end $$;

-- ---------------------------------------------------------------------
-- รางวัลและคูปอง
-- ---------------------------------------------------------------------
create or replace function public.budu_redeem_reward(p_reward_id uuid) returns public.budu_coupons
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; r public.budu_rewards; bal int; e public.budu_entries; c public.budu_coupons;
begin
  m := public.budu_require('partner');
  perform 1 from public.budu_couples where id = m.couple_id for update; -- กันกดพร้อมกัน
  select * into r from public.budu_rewards where id = p_reward_id and couple_id = m.couple_id and is_active;
  if not found then raise exception 'reward_not_found'; end if;
  select coalesce(sum(points), 0) into bal from public.budu_entries
    where couple_id = m.couple_id and status = 'confirmed';
  if bal < r.cost then raise exception 'insufficient_points'; end if;
  insert into public.budu_entries (couple_id, activity_id, activity_name, kind, points, status, created_by, decided_by, decided_at)
  values (m.couple_id, null, r.name, 'redeem', -r.cost, 'confirmed', m.id, m.id, now())
  returning * into e;
  insert into public.budu_coupons (couple_id, reward_id, reward_name, cost, status, redeem_entry_id, redeemed_by)
  values (m.couple_id, r.id, r.name, r.cost, 'active', e.id, m.id)
  returning * into c;
  return c;
end $$;

create or replace function public.budu_request_coupon_use(p_coupon_id uuid) returns public.budu_coupons
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; c public.budu_coupons;
begin
  m := public.budu_require('partner');
  update public.budu_coupons set status = 'requested', requested_at = now()
   where id = p_coupon_id and couple_id = m.couple_id and status = 'active'
  returning * into c;
  if not found then raise exception 'coupon_not_found'; end if;
  return c;
end $$;

create or replace function public.budu_mark_coupon_used(p_coupon_id uuid) returns public.budu_coupons
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; c public.budu_coupons;
begin
  m := public.budu_require('admin');
  update public.budu_coupons set status = 'used', used_by = m.id, used_at = now()
   where id = p_coupon_id and couple_id = m.couple_id and status in ('active','requested')
  returning * into c;
  if not found then raise exception 'coupon_not_found'; end if;
  return c;
end $$;

create or replace function public.budu_decline_coupon_request(p_coupon_id uuid) returns public.budu_coupons
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; c public.budu_coupons;
begin
  m := public.budu_require('admin');
  update public.budu_coupons set status = 'active', requested_at = null
   where id = p_coupon_id and couple_id = m.couple_id and status = 'requested'
  returning * into c;
  if not found then raise exception 'coupon_not_found'; end if;
  return c;
end $$;

-- ---------------------------------------------------------------------
-- จัดการกิจกรรม / รางวัล (ผู้ดูแล)
-- ---------------------------------------------------------------------
-- รุ่นเดิม 8 พารามิเตอร์ถูกแทนด้วยรุ่นที่มี p_once_per_day
drop function if exists public.budu_upsert_activity(uuid, text, text, int, int, text, boolean, boolean);
create or replace function public.budu_upsert_activity(
  p_id uuid, p_name text, p_kind text, p_points int, p_streak_bonus int,
  p_icon text, p_streak_enabled boolean, p_is_active boolean, p_once_per_day boolean
) returns public.budu_activities
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; a public.budu_activities; nxt int;
begin
  m := public.budu_require('admin');
  if p_id is null then
    select coalesce(max(sort_order), 0) + 1 into nxt from public.budu_activities where couple_id = m.couple_id;
    insert into public.budu_activities (couple_id, name, kind, points, streak_bonus, icon, streak_enabled, is_active, once_per_day, sort_order)
    values (m.couple_id, btrim(p_name), p_kind, p_points, coalesce(p_streak_bonus, 10),
            coalesce(p_icon, 'star'), coalesce(p_streak_enabled, true), coalesce(p_is_active, true),
            coalesce(p_once_per_day, true), nxt)
    returning * into a;
  else
    -- kind แก้ไม่ได้หลังสร้าง (เมินค่าที่ส่งมา)
    update public.budu_activities
       set name = btrim(p_name), points = p_points, streak_bonus = coalesce(p_streak_bonus, streak_bonus),
           icon = coalesce(p_icon, icon), streak_enabled = coalesce(p_streak_enabled, streak_enabled),
           is_active = coalesce(p_is_active, is_active), once_per_day = coalesce(p_once_per_day, once_per_day)
     where id = p_id and couple_id = m.couple_id
    returning * into a;
    if not found then raise exception 'activity_not_found'; end if;
  end if;
  return a;
end $$;

create or replace function public.budu_upsert_reward(p_id uuid, p_name text, p_cost int, p_is_active boolean)
returns public.budu_rewards
language plpgsql security definer set search_path = public as $$
declare m public.budu_members; r public.budu_rewards;
begin
  m := public.budu_require('admin');
  if p_id is null then
    insert into public.budu_rewards (couple_id, name, cost, is_active)
    values (m.couple_id, btrim(p_name), p_cost, coalesce(p_is_active, true))
    returning * into r;
  else
    update public.budu_rewards set name = btrim(p_name), cost = p_cost, is_active = coalesce(p_is_active, is_active)
     where id = p_id and couple_id = m.couple_id
    returning * into r;
    if not found then raise exception 'reward_not_found'; end if;
  end if;
  return r;
end $$;

create or replace function public.budu_delete_reward(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m public.budu_members;
begin
  m := public.budu_require('admin');
  delete from public.budu_rewards where id = p_id and couple_id = m.couple_id;
  if not found then raise exception 'reward_not_found'; end if;
end $$;

create or replace function public.budu_export_all() returns json
language plpgsql stable security definer set search_path = public as $$
declare m public.budu_members;
begin
  m := public.budu_require('admin');
  return json_build_object(
    'app', 'BuDu',
    'exported_at', now(),
    'couple', (select json_build_object('id', id, 'pair_code', public.budu_format_code(pair_code), 'created_at', created_at)
               from public.budu_couples where id = m.couple_id),
    'members', (select coalesce(json_agg(json_build_object('id', id, 'role', role, 'nickname', nickname, 'created_at', created_at)), '[]')
                from public.budu_members where couple_id = m.couple_id),
    'activities', (select coalesce(json_agg(a order by a.sort_order), '[]') from public.budu_activities a where a.couple_id = m.couple_id),
    'entries', (select coalesce(json_agg(e order by e.created_at), '[]') from public.budu_entries e where e.couple_id = m.couple_id),
    'rewards', (select coalesce(json_agg(r order by r.cost desc), '[]') from public.budu_rewards r where r.couple_id = m.couple_id),
    'coupons', (select coalesce(json_agg(c order by c.redeemed_at), '[]') from public.budu_coupons c where c.couple_id = m.couple_id)
  );
end $$;

-- ---------------------------------------------------------------------
-- RLS: อ่านได้เฉพาะข้อมูลคู่ตัวเอง · ไม่มีนโยบายเขียน (เขียนผ่านฟังก์ชันเท่านั้น)
-- ---------------------------------------------------------------------
alter table public.budu_couples    enable row level security;
alter table public.budu_members    enable row level security;
alter table public.budu_activities enable row level security;
alter table public.budu_entries    enable row level security;
alter table public.budu_rewards    enable row level security;
alter table public.budu_coupons    enable row level security;

drop policy if exists budu_couples_select    on public.budu_couples;
drop policy if exists budu_members_select    on public.budu_members;
drop policy if exists budu_activities_select on public.budu_activities;
drop policy if exists budu_entries_select    on public.budu_entries;
drop policy if exists budu_rewards_select    on public.budu_rewards;
drop policy if exists budu_coupons_select    on public.budu_coupons;

create policy budu_couples_select    on public.budu_couples    for select to authenticated using (id = public.budu_my_couple_id());
create policy budu_members_select    on public.budu_members    for select to authenticated using (couple_id = public.budu_my_couple_id());
create policy budu_activities_select on public.budu_activities for select to authenticated using (couple_id = public.budu_my_couple_id());
create policy budu_entries_select    on public.budu_entries    for select to authenticated using (couple_id = public.budu_my_couple_id());
create policy budu_rewards_select    on public.budu_rewards    for select to authenticated using (couple_id = public.budu_my_couple_id());
create policy budu_coupons_select    on public.budu_coupons    for select to authenticated using (couple_id = public.budu_my_couple_id());

-- สิทธิ์ตาราง: authenticated อ่านได้อย่างเดียว · anon ไม่ได้อะไรเลย
revoke all on public.budu_couples, public.budu_members, public.budu_activities,
              public.budu_entries, public.budu_rewards, public.budu_coupons from anon, authenticated, public;
grant select on public.budu_couples, public.budu_members, public.budu_activities,
                public.budu_entries, public.budu_rewards, public.budu_coupons to authenticated;

-- สิทธิ์ฟังก์ชัน: ถอนจากทุกคน แล้วให้ authenticated เฉพาะตัวที่ client เรียก
revoke execute on function
  public.budu_my_couple_id(), public.budu_my_role(), public.budu_require(text), public.budu_require_no_member(),
  public.budu_new_code(), public.budu_sync_streak(uuid),
  public.budu_create_couple(), public.budu_join_couple(text), public.budu_rejoin(text, text), public.budu_get_pair_code(),
  public.budu_log_earn(uuid), public.budu_log_deduct(uuid), public.budu_decide_entry(uuid, boolean), public.budu_cancel_entry(uuid),
  public.budu_redeem_reward(uuid), public.budu_request_coupon_use(uuid), public.budu_mark_coupon_used(uuid),
  public.budu_decline_coupon_request(uuid),
  public.budu_upsert_activity(uuid, text, text, int, int, text, boolean, boolean, boolean),
  public.budu_upsert_reward(uuid, text, int, boolean), public.budu_delete_reward(uuid), public.budu_export_all()
from public, anon, authenticated;

-- ใช้ใน RLS จึงต้องให้ authenticated เรียกได้
grant execute on function public.budu_my_couple_id(), public.budu_my_role() to authenticated;

grant execute on function
  public.budu_create_couple(), public.budu_join_couple(text), public.budu_rejoin(text, text), public.budu_get_pair_code(),
  public.budu_log_earn(uuid), public.budu_log_deduct(uuid), public.budu_decide_entry(uuid, boolean), public.budu_cancel_entry(uuid),
  public.budu_redeem_reward(uuid), public.budu_request_coupon_use(uuid), public.budu_mark_coupon_used(uuid),
  public.budu_decline_coupon_request(uuid),
  public.budu_upsert_activity(uuid, text, text, int, int, text, boolean, boolean, boolean),
  public.budu_upsert_reward(uuid, text, int, boolean), public.budu_delete_reward(uuid), public.budu_export_all()
to authenticated;

-- ---------------------------------------------------------------------
-- Realtime (เพิ่มเฉพาะตารางที่ยังไม่อยู่ใน publication)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['budu_entries','budu_coupons','budu_activities','budu_rewards','budu_members'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
