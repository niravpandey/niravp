-- Notes live in the same table as blog posts, told apart by `kind`.
-- Run this in the Supabase SQL editor BEFORE deploying the notes code:
-- the blog queries filter on `kind`, so they fail until the column exists.

alter table public.posts
  add column if not exists kind text not null default 'post',
  add column if not exists subject text,
  add column if not exists topic text,
  add column if not exists position integer,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_kind_check') then
    alter table public.posts add constraint posts_kind_check check (kind in ('post', 'note'));
  end if;
end $$;

create index if not exists posts_kind_published_idx on public.posts (kind, published);
