create table if not exists public.pte_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  class_type text not null check (class_type in ('one-on-one', 'group')),
  class_label text not null,
  focus_areas text[] not null default '{}',
  score_goal text not null default 'not-sure-yet',
  availability text[] not null default '{}',
  availability_next_two_weeks text[] not null default '{}',
  followed_up boolean not null default false,
  next_follow_up_at timestamptz,
  first_session_booked boolean not null default false,
  first_session_at timestamptz,
  payment_received boolean not null default false,
  notes text not null default ''
);

alter table public.pte_leads
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists availability_next_two_weeks text[] not null default '{}';

create index if not exists pte_leads_created_at_idx on public.pte_leads (created_at desc);
create index if not exists pte_leads_class_type_idx on public.pte_leads (class_type);
create index if not exists pte_leads_score_goal_idx on public.pte_leads (score_goal);
create index if not exists pte_leads_next_follow_up_at_idx on public.pte_leads (next_follow_up_at)
where next_follow_up_at is not null;

create table if not exists public.pte_invoices (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.pte_leads(id) on delete cascade,
  invoice_number text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  paid_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  class_type text not null check (class_type in ('one-on-one', 'group')),
  class_label text not null,
  class_count integer not null check (class_count between 1 and 100),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_amount numeric(10, 2) generated always as (class_count * unit_price) stored,
  currency text not null default 'AUD' check (currency = 'AUD'),
  due_date date,
  service_date date,
  notes text not null default '',
  emailed_to text,
  pdf_storage_path text,
  pdf_generated_at timestamptz
);

alter table public.pte_invoices
  add column if not exists pdf_storage_path text,
  add column if not exists pdf_generated_at timestamptz;

create index if not exists pte_invoices_lead_id_idx on public.pte_invoices (lead_id);
create index if not exists pte_invoices_created_at_idx on public.pte_invoices (created_at desc);
create index if not exists pte_invoices_status_idx on public.pte_invoices (status);

create table if not exists public.pte_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_email text,
  action text not null,
  entity_type text not null check (entity_type in ('lead', 'invoice', 'statement', 'booking', 'testimonial')),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists pte_admin_audit_logs_created_at_idx on public.pte_admin_audit_logs (created_at desc);
create index if not exists pte_admin_audit_logs_entity_idx on public.pte_admin_audit_logs (entity_type, entity_id);

alter table public.pte_admin_audit_logs
  drop constraint if exists pte_admin_audit_logs_entity_type_check;

alter table public.pte_admin_audit_logs
  add constraint pte_admin_audit_logs_entity_type_check
  check (entity_type in ('lead', 'invoice', 'statement', 'booking', 'booking_request', 'testimonial', 'calendar'));

create table if not exists public.pte_financial_year_statements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_email text,
  financial_year_start integer not null check (financial_year_start between 2020 and 2100),
  financial_year_end integer generated always as (financial_year_start + 1) stored,
  invoice_count integer not null check (invoice_count >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  pdf_storage_path text not null
);

create index if not exists pte_financial_year_statements_created_at_idx on public.pte_financial_year_statements (created_at desc);
create index if not exists pte_financial_year_statements_year_idx on public.pte_financial_year_statements (financial_year_start);

insert into storage.buckets (id, name, public)
values ('pte-pdfs', 'pte-pdfs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('student-image-bucket', 'student-image-bucket', true)
on conflict (id) do nothing;

create table if not exists public.pte_bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.pte_leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_at timestamptz not null,
  duration_minutes integer not null default 90 check (duration_minutes between 30 and 240),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'removed')),
  confirmation_token uuid not null default gen_random_uuid(),
  confirmation_sent_at timestamptz,
  cancellation_sent_at timestamptz,
  interaction_rating integer check (interaction_rating is null or interaction_rating between 1 and 5),
  interaction_notes text not null default '',
  interaction_rated_at timestamptz,
  notes text not null default ''
);

alter table public.pte_bookings
  add column if not exists cancellation_sent_at timestamptz,
  add column if not exists interaction_rating integer,
  add column if not exists interaction_notes text not null default '',
  add column if not exists interaction_rated_at timestamptz,
  add column if not exists meeting_url text,
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_event_link text;

alter table public.pte_bookings
  drop constraint if exists pte_bookings_status_check;

alter table public.pte_bookings
  add constraint pte_bookings_status_check
  check (status in ('confirmed', 'cancelled', 'removed'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_bookings'::regclass and conname = 'pte_bookings_interaction_rating_range'
  ) then
    alter table public.pte_bookings
      add constraint pte_bookings_interaction_rating_range
      check (interaction_rating is null or interaction_rating between 1 and 5);
  end if;
end $$;

create index if not exists pte_bookings_lead_id_idx on public.pte_bookings (lead_id);
create index if not exists pte_bookings_booking_at_idx on public.pte_bookings (booking_at);
create unique index if not exists pte_bookings_confirmation_token_idx on public.pte_bookings (confirmation_token);

create table if not exists public.pte_booking_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.pte_leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  requested_start_at timestamptz not null,
  duration_minutes integer not null default 90 check (duration_minutes between 30 and 240),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  student_note text not null default '',
  admin_note text not null default '',
  approved_booking_id uuid references public.pte_bookings(id) on delete set null,
  notified_at timestamptz,
  resolved_at timestamptz
);

alter table public.pte_booking_requests
  add column if not exists admin_note text not null default '',
  add column if not exists approved_booking_id uuid references public.pte_bookings(id) on delete set null,
  add column if not exists notified_at timestamptz,
  add column if not exists resolved_at timestamptz;

create index if not exists pte_booking_requests_lead_id_idx on public.pte_booking_requests (lead_id);
create index if not exists pte_booking_requests_status_idx on public.pte_booking_requests (status, requested_start_at);

create table if not exists public.pte_testimonials (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.pte_leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_name text not null,
  testimonial_text text not null,
  rating integer not null check (rating between 1 and 5),
  image_storage_path text,
  is_featured boolean not null default true,
  display_order integer not null default 0
);

create index if not exists pte_testimonials_featured_idx on public.pte_testimonials (is_featured, display_order, created_at desc);

create or replace function public.set_pte_leads_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pte_leads_updated_at on public.pte_leads;
create trigger set_pte_leads_updated_at
before update on public.pte_leads
for each row
execute function public.set_pte_leads_updated_at();

drop trigger if exists set_pte_invoices_updated_at on public.pte_invoices;
create trigger set_pte_invoices_updated_at
before update on public.pte_invoices
for each row
execute function public.set_pte_leads_updated_at();

drop trigger if exists set_pte_bookings_updated_at on public.pte_bookings;
create trigger set_pte_bookings_updated_at
before update on public.pte_bookings
for each row
execute function public.set_pte_leads_updated_at();

drop trigger if exists set_pte_testimonials_updated_at on public.pte_testimonials;
create trigger set_pte_testimonials_updated_at
before update on public.pte_testimonials
for each row
execute function public.set_pte_leads_updated_at();

drop trigger if exists set_pte_booking_requests_updated_at on public.pte_booking_requests;
create trigger set_pte_booking_requests_updated_at
before update on public.pte_booking_requests
for each row
execute function public.set_pte_leads_updated_at();

alter table public.pte_leads enable row level security;
alter table public.pte_leads force row level security;
alter table public.pte_invoices enable row level security;
alter table public.pte_invoices force row level security;
alter table public.pte_bookings enable row level security;
alter table public.pte_bookings force row level security;
alter table public.pte_testimonials enable row level security;
alter table public.pte_testimonials force row level security;
alter table public.pte_booking_requests enable row level security;
alter table public.pte_booking_requests force row level security;
alter table public.pte_admin_audit_logs enable row level security;
alter table public.pte_admin_audit_logs force row level security;
alter table public.pte_financial_year_statements enable row level security;
alter table public.pte_financial_year_statements force row level security;

revoke all on public.pte_leads from anon, authenticated;
revoke all on public.pte_invoices from anon, authenticated;
revoke all on public.pte_bookings from anon, authenticated;
revoke all on public.pte_testimonials from anon, authenticated;
revoke all on public.pte_booking_requests from anon, authenticated;
revoke all on public.pte_admin_audit_logs from anon, authenticated;
revoke all on public.pte_financial_year_statements from anon, authenticated;
revoke all on function public.set_pte_leads_updated_at() from public;

create or replace function public.pte_availability_is_valid(slots text[])
returns boolean
language sql
immutable
strict
as $$
  select cardinality(slots) > 0
    and coalesce(
      (
        select bool_and(value ~ '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)-((08|09|1[0-9]|20):(00|30))$')
        from unnest(slots) as slot(value)
      ),
      false
    );
$$;

revoke all on function public.pte_availability_is_valid(text[]) from public;

create or replace function public.pte_dated_availability_is_valid(slots text[])
returns boolean
language sql
immutable
strict
as $$
  select cardinality(slots) = 0
    or coalesce(
      (
        select bool_and(value ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}-((08|09|1[0-9]|20):(00|30))$')
        from unnest(slots) as slot(value)
      ),
      false
    );
$$;

revoke all on function public.pte_dated_availability_is_valid(text[]) from public;

alter table public.pte_leads
  drop constraint if exists pte_leads_availability_values;

update public.pte_leads
set availability = coalesce(
  nullif(
    array(
      select distinct mapped.value
      from unnest(availability) as slot(value)
      cross join lateral (
        select case
          when slot.value ~ '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)-((08|09|1[0-9]|20):(00|30))$'
            then slot.value
          when slot.value ~ '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)-morning$'
            then split_part(slot.value, '-', 1) || '-09:00'
          when slot.value ~ '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)-afternoon$'
            then split_part(slot.value, '-', 1) || '-13:00'
          when slot.value ~ '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)-evening$'
            then split_part(slot.value, '-', 1) || '-18:00'
          else null
        end as value
      ) as mapped
      where mapped.value is not null
    ),
    '{}'::text[]
  ),
  array['monday-08:00']::text[]
)
where not public.pte_availability_is_valid(availability);

alter table public.pte_leads
  add constraint pte_leads_availability_values
  check (
    cardinality(availability) between 1 and 182
    and public.pte_availability_is_valid(availability)
  );

alter table public.pte_leads
  drop constraint if exists pte_leads_availability_next_two_weeks_values;

alter table public.pte_leads
  add constraint pte_leads_availability_next_two_weeks_values
  check (
    cardinality(availability_next_two_weeks) between 0 and 364
    and public.pte_dated_availability_is_valid(availability_next_two_weeks)
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_first_name_length'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_first_name_length
      check (char_length(trim(first_name)) between 1 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_last_name_length'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_last_name_length
      check (char_length(trim(last_name)) between 1 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_email_format'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_email_format
      check (
        email = lower(email)
        and char_length(email) between 3 and 254
        and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_phone_length'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_phone_length
      check (phone is null or char_length(phone) <= 40);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_class_label_length'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_class_label_length
      check (char_length(class_label) between 1 and 160);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_focus_areas_values'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_focus_areas_values
      check (
        cardinality(focus_areas) between 1 and 5
        and focus_areas <@ array[
          'speaking',
          'writing',
          'reading',
          'listening',
          'not-sure'
        ]::text[]
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_score_goal_value'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_score_goal_value
      check (
        score_goal = 'not-sure-yet'
        or (
          score_goal ~ '^[0-9]+$'
          and score_goal::integer between 10 and 90
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_booking_consistency'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_booking_consistency
      check (first_session_booked or first_session_at is null);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_follow_up_consistency'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_follow_up_consistency
      check (next_follow_up_at is null or next_follow_up_at >= created_at);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_leads'::regclass and conname = 'pte_leads_notes_length'
  ) then
    alter table public.pte_leads
      add constraint pte_leads_notes_length
      check (char_length(notes) <= 4000);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_invoices'::regclass and conname = 'pte_invoices_invoice_number_length'
  ) then
    alter table public.pte_invoices
      add constraint pte_invoices_invoice_number_length
      check (char_length(invoice_number) between 6 and 40);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_invoices'::regclass and conname = 'pte_invoices_class_label_length'
  ) then
    alter table public.pte_invoices
      add constraint pte_invoices_class_label_length
      check (char_length(class_label) between 1 and 160);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_invoices'::regclass and conname = 'pte_invoices_emailed_to_format'
  ) then
    alter table public.pte_invoices
      add constraint pte_invoices_emailed_to_format
      check (
        emailed_to is null
        or (
          emailed_to = lower(emailed_to)
          and char_length(emailed_to) between 3 and 254
          and emailed_to ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_invoices'::regclass and conname = 'pte_invoices_sent_consistency'
  ) then
    alter table public.pte_invoices
      add constraint pte_invoices_sent_consistency
      check (
        (status = 'draft' and sent_at is null)
        or (status in ('sent', 'paid', 'void'))
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_invoices'::regclass and conname = 'pte_invoices_paid_consistency'
  ) then
    alter table public.pte_invoices
      add constraint pte_invoices_paid_consistency
      check (
        (status = 'paid' and paid_at is not null)
        or (status <> 'paid' and paid_at is null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_invoices'::regclass and conname = 'pte_invoices_notes_length'
  ) then
    alter table public.pte_invoices
      add constraint pte_invoices_notes_length
      check (char_length(notes) <= 2000);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_invoices'::regclass and conname = 'pte_invoices_pdf_path_length'
  ) then
    alter table public.pte_invoices
      add constraint pte_invoices_pdf_path_length
      check (pdf_storage_path is null or char_length(pdf_storage_path) between 8 and 500);
  end if;

  if not exists (
    select 1 from pg_constraint where conrelid = 'public.pte_admin_audit_logs'::regclass and conname = 'pte_admin_audit_logs_action_length'
  ) then
    alter table public.pte_admin_audit_logs
      add constraint pte_admin_audit_logs_action_length
      check (char_length(action) between 3 and 120);
  end if;
end $$;

-- App code uses the service role key for PTE lead and invoice operations.
-- No anon/authenticated policies are defined here, so browser clients cannot
-- access customer data directly through the public anon key.
