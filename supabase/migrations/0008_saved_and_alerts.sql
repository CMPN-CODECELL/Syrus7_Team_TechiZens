-- 0008_saved_and_alerts.sql
-- Description: Saved opportunities and Change Sentinel alerts (replaces src/api/saved.js and src/api/alerts.js mocks).
-- Reason: Saving an opportunity turns on monitoring. Alerts say exactly what changed in its deadline, fee or rules.
--
-- Tables:
--   saved_opportunities   (user_id, opportunity_id)      one row per saved opportunity, own rows only
--   opportunity_changes   one row per change of an opportunity (the same change is seen by everyone who saved it)
--   alert_reads           which changes a student marked as read
-- View:
--   my_alerts             = the Alert shape in CONTRIBUTING.md for the logged-in student:
--                         { id, opportunity_id, field, old_value, new_value, changed_at, read }
-- Also: a trigger that writes a "deadline" or "fee" change automatically when an opportunity row is updated.
-- ("rules" changes have no column, so they are inserted by hand or by the future ingestion job.)

-- ---- Saved opportunities ---------------------------------------------------

create table if not exists public.saved_opportunities (
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, opportunity_id)
);

alter table public.saved_opportunities enable row level security;

drop policy if exists "Students read own saved opportunities" on public.saved_opportunities;
create policy "Students read own saved opportunities"
  on public.saved_opportunities for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Students save for themselves" on public.saved_opportunities;
create policy "Students save for themselves"
  on public.saved_opportunities for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Students unsave their own" on public.saved_opportunities;
create policy "Students unsave their own"
  on public.saved_opportunities for delete to authenticated
  using (user_id = auth.uid());

-- ---- Changes and alerts ----------------------------------------------------

create table if not exists public.opportunity_changes (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  field text not null check (field in ('deadline', 'fee', 'rules')),
  old_value text not null,   -- ready-to-show text, e.g. '18 Nov 2026'
  new_value text not null,   -- ready-to-show text, e.g. '25 Nov 2026'
  changed_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_changes_opportunity on public.opportunity_changes(opportunity_id, changed_at desc);

create table if not exists public.alert_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  change_id text not null references public.opportunity_changes(id) on delete cascade,
  read_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, change_id)
);

alter table public.opportunity_changes enable row level security;
alter table public.alert_reads enable row level security;

-- A student only sees changes of opportunities they saved. Nobody can write changes from the app
-- (only the trigger below, the SQL editor, or a backend job can).
drop policy if exists "Students see changes of saved opportunities" on public.opportunity_changes;
create policy "Students see changes of saved opportunities"
  on public.opportunity_changes for select to authenticated
  using (
    exists (
      select 1 from public.saved_opportunities s
      where s.user_id = auth.uid() and s.opportunity_id = opportunity_changes.opportunity_id
    )
  );

drop policy if exists "Students read own alert reads" on public.alert_reads;
create policy "Students read own alert reads"
  on public.alert_reads for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Students mark alerts read" on public.alert_reads;
create policy "Students mark alerts read"
  on public.alert_reads for insert to authenticated
  with check (user_id = auth.uid());

-- security_invoker makes the view obey the policies above (so it only returns the student's own alerts).
create or replace view public.my_alerts with (security_invoker = true) as
select
  c.id,
  c.opportunity_id,
  c.field,
  c.old_value,
  c.new_value,
  c.changed_at,
  exists (
    select 1 from public.alert_reads r where r.change_id = c.id and r.user_id = auth.uid()
  ) as read
from public.opportunity_changes c
order by c.changed_at desc;

-- ---- Automatic change detection for deadline and fee -----------------------

create or replace function public.log_opportunity_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_fee text;
  new_fee text;
begin
  if old.deadline is distinct from new.deadline then
    insert into public.opportunity_changes (opportunity_id, field, old_value, new_value)
    values (
      new.id, 'deadline',
      coalesce(to_char(old.deadline, 'FMDD Mon YYYY'), 'Not listed'),
      coalesce(to_char(new.deadline, 'FMDD Mon YYYY'), 'Not listed')
    );
  end if;

  if old.fee is distinct from new.fee then
    old_fee := case when old.fee is null then 'Not listed' when old.fee = 0 then 'Free' else '₹' || old.fee end;
    new_fee := case when new.fee is null then 'Not listed' when new.fee = 0 then 'Free' else '₹' || new.fee end;
    insert into public.opportunity_changes (opportunity_id, field, old_value, new_value)
    values (new.id, 'fee', old_fee, new_fee);
  end if;

  return new;
end;
$$;

drop trigger if exists opportunities_log_changes on public.opportunities;
create trigger opportunities_log_changes
  after update on public.opportunities
  for each row execute procedure public.log_opportunity_changes();

-- ---- Seed: the 8 mock alerts from src/data/mockAlerts.js -------------------

insert into public.opportunity_changes (id, opportunity_id, field, old_value, new_value, changed_at)
values
  ('alert-1', 'opp-1',  'deadline', '18 Nov 2026', '25 Nov 2026', '2026-10-08T18:30:00+05:30'),
  ('alert-2', 'opp-4',  'fee',      'Free', '₹150', '2026-10-08T09:10:00+05:30'),
  ('alert-3', 'opp-3',  'rules',    'Teams of 2-3', 'Teams of 2-4', '2026-10-07T15:45:00+05:30'),
  ('alert-4', 'opp-13', 'deadline', '5 Dec 2026', '12 Dec 2026', '2026-10-06T11:00:00+05:30'),
  ('alert-5', 'opp-14', 'fee',      '₹150', '₹200', '2026-10-05T20:20:00+05:30'),
  ('alert-6', 'opp-17', 'rules',    'Open to 2nd year and above', 'Open to 3rd year and above', '2026-10-04T10:05:00+05:30'),
  ('alert-7', 'opp-7',  'deadline', '17 Nov 2026', '19 Nov 2026', '2026-10-03T14:00:00+05:30'),
  ('alert-8', 'opp-12', 'rules',    'Submit a 5-page deck', 'Submit an 8-page deck', '2026-10-02T17:30:00+05:30')
on conflict (id) do nothing;
