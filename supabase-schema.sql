-- ============================================================
-- LOST & FOUND SYSTEM — SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- D1: USER DATABASE (profiles)
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null,
  full_name    text,
  phone        text,
  role         text not null default 'user' check (role in ('user', 'security', 'admin')),
  avatar_url   text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────
-- D2: LOST ITEM DATABASE
-- ─────────────────────────────────────────────
create table if not exists lost_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  title         text not null,
  description   text,
  category      text not null,
  date_lost     date not null,
  location_lost text not null,
  image_url     text,
  color         text,
  brand         text,
  status        text not null default 'searching'
                  check (status in ('searching', 'found', 'claimed', 'closed')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────
-- D3: FOUND ITEM DATABASE
-- ─────────────────────────────────────────────
create table if not exists found_items (
  id             uuid primary key default gen_random_uuid(),
  security_id    uuid references profiles(id) on delete set null,
  title          text not null,
  description    text,
  category       text not null,
  date_found     date not null,
  location_found text not null,
  image_url      text,
  color          text,
  brand          text,
  tracking_id    text unique not null
                   default upper(substring(gen_random_uuid()::text, 1, 8)),
  status         text not null default 'unclaimed'
                   check (status in ('unclaimed', 'pending', 'claimed')),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- D4: CLAIM REQUEST DATABASE
-- ─────────────────────────────────────────────
create table if not exists claim_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade not null,
  found_item_id    uuid references found_items(id) on delete cascade not null,
  lost_item_id     uuid references lost_items(id) on delete set null,
  proof_description text not null,
  proof_image_url  text,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  verified_by      uuid references profiles(id) on delete set null,
  verified_at      timestamptz,
  rejection_reason text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────────
-- D5: NOTIFICATION DATABASE
-- ─────────────────────────────────────────────
create table if not exists notifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade not null,
  title            text not null,
  message          text not null,
  type             text not null
                     check (type in ('claim_approved','claim_rejected','item_found','claim_submitted','info','system')),
  is_read          boolean default false,
  related_item_id  uuid,
  related_type     text, -- 'lost_item' | 'found_item' | 'claim'
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table profiles enable row level security;
alter table lost_items enable row level security;
alter table found_items enable row level security;
alter table claim_requests enable row level security;
alter table notifications enable row level security;

-- Profiles: users see their own, admins see all
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Lost items: owners can CRUD their own; everyone can view
create policy "Anyone can view lost items"
  on lost_items for select using (true);
create policy "Authenticated users can insert lost items"
  on lost_items for insert with check (auth.uid() = user_id);
create policy "Owners can update their lost items"
  on lost_items for update using (auth.uid() = user_id);
create policy "Owners can delete their lost items"
  on lost_items for delete using (auth.uid() = user_id);

-- Found items: anyone can view, security/admin can insert/update
create policy "Anyone can view found items"
  on found_items for select using (true);
create policy "Security and admin can insert found items"
  on found_items for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('security','admin'))
  );
create policy "Security and admin can update found items"
  on found_items for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('security','admin'))
  );

-- Claim requests
create policy "Users can view own claims"
  on claim_requests for select using (auth.uid() = user_id);
create policy "Security/admin can view all claims"
  on claim_requests for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('security','admin'))
  );
create policy "Authenticated users can submit claims"
  on claim_requests for insert with check (auth.uid() = user_id);
create policy "Security/admin can update claims"
  on claim_requests for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('security','admin'))
  );

-- Notifications
create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = user_id);
create policy "Users can mark own notifications as read"
  on notifications for update using (auth.uid() = user_id);
create policy "Service role can insert notifications"
  on notifications for insert with check (true);

-- ─────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────
create index if not exists idx_lost_items_user_id on lost_items(user_id);
create index if not exists idx_lost_items_status on lost_items(status);
create index if not exists idx_lost_items_category on lost_items(category);
create index if not exists idx_found_items_tracking_id on found_items(tracking_id);
create index if not exists idx_found_items_status on found_items(status);
create index if not exists idx_claim_requests_user_id on claim_requests(user_id);
create index if not exists idx_claim_requests_status on claim_requests(status);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_is_read on notifications(is_read);

-- ─────────────────────────────────────────────
-- SAMPLE DATA (optional)
-- ─────────────────────────────────────────────
-- To seed an admin account, first register via the app, then run:
-- update profiles set role = 'admin' where email = 'admin@example.com';
-- update profiles set role = 'security' where email = 'security@example.com';
