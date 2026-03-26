-- ============================================================
-- LOST & FOUND SYSTEM — FIXED MIGRATION
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- DROP EXISTING (clean slate)
-- ─────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop table if exists notifications  cascade;
drop table if exists claim_requests cascade;
drop table if exists found_items    cascade;
drop table if exists lost_items     cascade;
drop table if exists profiles       cascade;

-- ─────────────────────────────────────────────
-- D1: PROFILES
-- ─────────────────────────────────────────────
create table profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null,
  full_name    text default '',
  phone        text default '',
  role         text not null default 'user' check (role in ('user', 'security', 'admin')),
  avatar_url   text default '',
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- TRIGGER: auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────
-- D2: LOST ITEMS
-- ─────────────────────────────────────────────
create table lost_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  title         text not null,
  description   text default '',
  category      text not null,
  date_lost     date not null,
  location_lost text not null,
  image_url     text default '',
  color         text default '',
  brand         text default '',
  status        text not null default 'searching'
                  check (status in ('searching', 'found', 'claimed', 'closed')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────
-- D3: FOUND ITEMS
-- ─────────────────────────────────────────────
create table found_items (
  id             uuid primary key default gen_random_uuid(),
  security_id    uuid references profiles(id) on delete set null,
  title          text not null,
  description    text default '',
  category       text not null,
  date_found     date not null,
  location_found text not null,
  image_url      text default '',
  color          text default '',
  brand          text default '',
  tracking_id    text unique not null
                   default upper(substring(gen_random_uuid()::text, 1, 8)),
  status         text not null default 'unclaimed'
                   check (status in ('unclaimed', 'pending', 'claimed')),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- D4: CLAIM REQUESTS
-- ─────────────────────────────────────────────
create table claim_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references profiles(id) on delete cascade not null,
  found_item_id     uuid references found_items(id) on delete cascade not null,
  lost_item_id      uuid references lost_items(id) on delete set null,
  proof_description text not null,
  proof_image_url   text default '',
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  verified_by       uuid references profiles(id) on delete set null,
  verified_at       timestamptz,
  rejection_reason  text default '',
  notes             text default '',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─────────────────────────────────────────────
-- D5: NOTIFICATIONS
-- ─────────────────────────────────────────────
create table notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  title           text not null,
  message         text not null,
  type            text not null
                    check (type in ('claim_approved','claim_rejected','item_found','claim_submitted','info','system')),
  is_read         boolean default false,
  related_item_id uuid,
  related_type    text default '',
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table profiles       enable row level security;
alter table lost_items     enable row level security;
alter table found_items    enable row level security;
alter table claim_requests enable row level security;
alter table notifications  enable row level security;

-- PROFILES
create policy "profiles_insert_trigger"  on profiles for insert with check (true);
create policy "profiles_select_own"      on profiles for select using (auth.uid() = id);
create policy "profiles_update_own"      on profiles for update using (auth.uid() = id);
create policy "profiles_select_admin"    on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- LOST ITEMS
create policy "lost_select_all"   on lost_items for select using (true);
create policy "lost_insert_own"   on lost_items for insert with check (auth.uid() = user_id);
create policy "lost_update_own"   on lost_items for update using (auth.uid() = user_id);
create policy "lost_delete_own"   on lost_items for delete using (auth.uid() = user_id);
create policy "lost_update_admin" on lost_items for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','security'))
);

-- FOUND ITEMS
create policy "found_select_all"      on found_items for select using (true);
create policy "found_insert_security" on found_items for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('security','admin'))
);
create policy "found_update_security" on found_items for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('security','admin'))
);

-- CLAIM REQUESTS
create policy "claims_select_own"      on claim_requests for select using (auth.uid() = user_id);
create policy "claims_insert_own"      on claim_requests for insert with check (auth.uid() = user_id);
create policy "claims_select_security" on claim_requests for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('security','admin'))
);
create policy "claims_update_security" on claim_requests for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('security','admin'))
);

-- NOTIFICATIONS
create policy "notifs_select_own" on notifications for select using (auth.uid() = user_id);
create policy "notifs_update_own" on notifications for update using (auth.uid() = user_id);
create policy "notifs_insert_any" on notifications for insert with check (true);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
create index idx_lost_items_user_id   on lost_items(user_id);
create index idx_lost_items_status    on lost_items(status);
create index idx_lost_items_category  on lost_items(category);
create index idx_found_items_tracking on found_items(tracking_id);
create index idx_found_items_status   on found_items(status);
create index idx_claims_user_id       on claim_requests(user_id);
create index idx_claims_status        on claim_requests(status);
create index idx_claims_found_item    on claim_requests(found_item_id);
create index idx_notifs_user_id       on notifications(user_id);
create index idx_notifs_is_read       on notifications(is_read);
