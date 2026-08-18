alter table public.pte_bookings
  add column if not exists cancellation_sent_at timestamptz,
  add column if not exists interaction_rating integer,
  add column if not exists interaction_notes text not null default '',
  add column if not exists interaction_rated_at timestamptz;

alter table public.pte_bookings
  drop constraint if exists pte_bookings_status_check;

alter table public.pte_bookings
  add constraint pte_bookings_status_check
  check (status in ('confirmed', 'cancelled', 'removed'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.pte_bookings'::regclass
      and conname = 'pte_bookings_interaction_rating_range'
  ) then
    alter table public.pte_bookings
      add constraint pte_bookings_interaction_rating_range
      check (interaction_rating is null or interaction_rating between 1 and 5);
  end if;
end $$;
