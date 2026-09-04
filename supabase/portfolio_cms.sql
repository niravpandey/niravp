-- Portfolio CMS setup. Run this once in the Supabase SQL editor.
-- It is safe to run again: existing projects and skills are left in place.

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  key text primary key,
  value integer not null
);

insert into public.site_settings (key, value)
values ('home_blog_limit', 4)
on conflict (key) do nothing;

create table if not exists public.author_profile (
  id integer primary key default 1 check (id = 1),
  bio text not null,
  headshot_path text not null default 'headshot.png',
  updated_at timestamptz not null default now()
);

insert into public.author_profile (id, bio, headshot_path)
values (
  1,
  'This article was written by Nirav Pandey. He is a third year undergraduate studying Data Science.',
  'headshot.png'
)
on conflict (id) do nothing;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  org text not null default '',
  description text not null default '',
  tags text[] not null default '{}',
  link text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.projects add column if not exists image_path text;
alter table public.projects add column if not exists image_alt text not null default '';

create table if not exists public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.skill_categories(id) on delete cascade,
  name text not null,
  icon_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.project_skills (
  project_id uuid not null references public.projects(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, skill_id)
);

create index if not exists skills_category_order_idx
  on public.skills(category_id, sort_order, name);
create index if not exists project_skills_skill_idx
  on public.project_skills(skill_id);

grant select on public.projects, public.skill_categories, public.skills, public.project_skills
  to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.author_profile to anon, authenticated;
grant insert, update, delete on public.projects, public.skill_categories, public.skills, public.project_skills
  to authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant insert, update, delete on public.author_profile to authenticated;

alter table public.projects enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.project_skills enable row level security;
alter table public.site_settings enable row level security;
alter table public.author_profile enable row level security;

drop policy if exists "site settings are public" on public.site_settings;
create policy "site settings are public" on public.site_settings
  for select using (true);
drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings" on public.site_settings
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "author profile is public" on public.author_profile;
create policy "author profile is public" on public.author_profile
  for select using (true);
drop policy if exists "admins manage author profile" on public.author_profile;
create policy "admins manage author profile" on public.author_profile
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "portfolio projects are public" on public.projects;
create policy "portfolio projects are public" on public.projects
  for select using (true);
drop policy if exists "skill categories are public" on public.skill_categories;
create policy "skill categories are public" on public.skill_categories
  for select using (true);
drop policy if exists "skills are public" on public.skills;
create policy "skills are public" on public.skills
  for select using (true);
drop policy if exists "project skills are public" on public.project_skills;
create policy "project skills are public" on public.project_skills
  for select using (true);

drop policy if exists "admins manage portfolio projects" on public.projects;
create policy "admins manage portfolio projects" on public.projects
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "admins manage skill categories" on public.skill_categories;
create policy "admins manage skill categories" on public.skill_categories
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "admins manage skills" on public.skills;
create policy "admins manage skills" on public.skills
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "admins manage project skills" on public.project_skills;
create policy "admins manage project skills" on public.project_skills
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- One public bucket, separated into skill-icons/ and project-images/ by the CMS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'Assets',
  'Assets',
  true,
  2097152,
  array['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "portfolio assets are public" on storage.objects;
create policy "portfolio assets are public" on storage.objects
  for select using (bucket_id = 'Assets');
drop policy if exists "admins upload portfolio assets" on storage.objects;
create policy "admins upload portfolio assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'Assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
drop policy if exists "admins update portfolio assets" on storage.objects;
create policy "admins update portfolio assets" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'Assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'Assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
drop policy if exists "admins delete portfolio assets" on storage.objects;
create policy "admins delete portfolio assets" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'Assets'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Promote a user for the RLS policies above, then ask them to sign out and in again:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'you@example.com';
