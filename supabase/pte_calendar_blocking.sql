create table if not exists public.pte_google_calendar_connection (
  id text primary key default 'default' check (id = 'default'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  connected_email text,
  refresh_token text,
  granted_scopes text[] not null default '{}',
  calendar_ids jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text
);

create table if not exists public.pte_google_calendar_block_cache (
  id text primary key default 'default' check (id = 'default'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  window_start timestamptz not null,
  window_end timestamptz not null,
  time_zone text not null default 'Australia/Melbourne',
  busy_ranges jsonb not null default '[]'::jsonb,
  blocked_slots jsonb not null default '[]'::jsonb,
  calendar_errors jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

drop trigger if exists set_pte_google_calendar_connection_updated_at on public.pte_google_calendar_connection;
create trigger set_pte_google_calendar_connection_updated_at
before update on public.pte_google_calendar_connection
for each row
execute function public.set_pte_leads_updated_at();

drop trigger if exists set_pte_google_calendar_block_cache_updated_at on public.pte_google_calendar_block_cache;
create trigger set_pte_google_calendar_block_cache_updated_at
before update on public.pte_google_calendar_block_cache
for each row
execute function public.set_pte_leads_updated_at();

alter table public.pte_admin_audit_logs
  drop constraint if exists pte_admin_audit_logs_entity_type_check;

alter table public.pte_admin_audit_logs
  add constraint pte_admin_audit_logs_entity_type_check
  check (entity_type in ('lead', 'invoice', 'statement', 'booking', 'testimonial', 'calendar'));

alter table public.pte_google_calendar_connection enable row level security;
alter table public.pte_google_calendar_connection force row level security;
alter table public.pte_google_calendar_block_cache enable row level security;
alter table public.pte_google_calendar_block_cache force row level security;

revoke all on public.pte_google_calendar_connection from anon, authenticated;
revoke all on public.pte_google_calendar_block_cache from anon, authenticated;
