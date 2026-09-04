-- Experience section. Run after portfolio_cms.sql.

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  organization text not null default '',
  date_range text not null default '',
  description text not null default '',
  logo_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists experiences_order_idx
  on public.experiences(sort_order, created_at desc);

grant select on public.experiences to anon, authenticated;
grant insert, update, delete on public.experiences to authenticated;

alter table public.experiences enable row level security;

drop policy if exists "experiences are public" on public.experiences;
create policy "experiences are public" on public.experiences
  for select using (true);

drop policy if exists "admins manage experiences" on public.experiences;
create policy "admins manage experiences" on public.experiences
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
