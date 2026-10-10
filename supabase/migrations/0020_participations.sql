-- 0020_participations.sql
-- Description: Events and hackathons a student took part in (shown on their Profile, "Activity" tab).
-- Reason: Students want a record of what they have done. It is self-declared (not verified), so the app says so.
-- A row can point at a Nexus listing (opportunity_id) or be typed in by hand for an event that is not listed
-- (most past events are not). The title is always stored, so the record survives when a listing is removed.
-- Private: a student sees and changes only their own rows.
-- Safe to run more than once.

create table if not exists public.participations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id text references public.opportunities(id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  organizer text check (organizer is null or char_length(organizer) <= 80),
  category text not null check (category in ('hackathons', 'competitions', 'workshops', 'internships', 'courses', 'other')),
  result text not null default 'participated' check (result in ('participated', 'finalist', 'winner')),
  event_date date,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_participations_user on public.participations(user_id, created_at desc);
-- A listing can be marked as participated only once per student.
create unique index if not exists participations_one_per_listing
  on public.participations (user_id, opportunity_id) where opportunity_id is not null;

alter table public.participations enable row level security;

drop policy if exists "Students read their own participations" on public.participations;
create policy "Students read their own participations"
  on public.participations for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Students add their own participations" on public.participations;
create policy "Students add their own participations"
  on public.participations for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Students change their own participations" on public.participations;
create policy "Students change their own participations"
  on public.participations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Students delete their own participations" on public.participations;
create policy "Students delete their own participations"
  on public.participations for delete to authenticated
  using (user_id = auth.uid());

-- ROLLBACK (only if you need to undo this):
--   drop table if exists public.participations;
