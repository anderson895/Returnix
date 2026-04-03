-- Migration: Add error_logs table
-- Run this in your Supabase SQL editor

create table if not exists public.error_logs (
  id            uuid primary key default gen_random_uuid(),
  message       text not null,
  stack         text,
  route         text,
  action        text,
  user_id       uuid references public.profiles(id) on delete set null,
  user_email    text,
  user_role     text,
  severity      text not null default 'error' check (severity in ('error', 'warning', 'info')),
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

-- Only admins can read logs
alter table public.error_logs enable row level security;

create policy "Admins can view error logs"
  on public.error_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Service role inserts logs (no RLS bypass needed for service role)
create policy "Service role can insert logs"
  on public.error_logs for insert
  with check (true);

-- Index for faster queries
create index if not exists error_logs_severity_idx on public.error_logs(severity);
create index if not exists error_logs_created_at_idx on public.error_logs(created_at desc);
