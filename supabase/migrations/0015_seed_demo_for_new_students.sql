-- 0015_seed_demo_for_new_students.sql
-- Description: Gives every real student the same starting social world as the mock (src/data/mockPeople.js).
-- Reason: In the mock, every new user is already connected to u-1 ... u-8 and has 2 unanswered invitations
-- (from u-9 and u-10). With a real database each student starts with nothing, so the Connections page would be empty.
-- This function recreates that starting state for a student, and a trigger runs it for every new signup.
--
-- OPTIONAL: if you do NOT want new students to start with demo connections, skip this file, or later run:
--   drop trigger if exists seed_demo_social on public.profiles;

create or replace function public.seed_demo_social_for(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Never seed a demo student, and never seed a profile that does not exist.
  if not exists (select 1 from public.profiles where id = p_user and not is_demo) then
    return;
  end if;

  -- Already connected to u-1 ... u-8 (with the "connected since" dates from SEED_CONNECTIONS).
  insert into public.connections (requester_id, addressee_id, status, created_at, accepted_at)
  select public.demo_uid(s.n), p_user, 'accepted', s.since, s.since
  from (
    values
      (1, '2026-08-12T10:00:00+05:30'::timestamptz),
      (2, '2026-08-20T10:00:00+05:30'::timestamptz),
      (3, '2026-09-02T10:00:00+05:30'::timestamptz),
      (4, '2026-09-10T10:00:00+05:30'::timestamptz),
      (5, '2026-09-18T10:00:00+05:30'::timestamptz),
      (6, '2026-09-25T10:00:00+05:30'::timestamptz),
      (7, '2026-10-01T10:00:00+05:30'::timestamptz),
      (8, '2026-10-05T10:00:00+05:30'::timestamptz)
  ) as s(n, since)
  on conflict do nothing;

  -- Two invitations waiting: from u-9 and u-10.
  insert into public.connections (requester_id, addressee_id, status, created_at)
  values
    (public.demo_uid(9),  p_user, 'pending', '2026-10-08T17:00:00+05:30'),
    (public.demo_uid(10), p_user, 'pending', '2026-10-07T12:30:00+05:30')
  on conflict do nothing;
end;
$$;

revoke all on function public.seed_demo_social_for(uuid) from public, anon, authenticated;

create or replace function public.trg_seed_demo_social()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.is_demo then
    perform public.seed_demo_social_for(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists seed_demo_social on public.profiles;
create trigger seed_demo_social
  after insert on public.profiles
  for each row execute procedure public.trg_seed_demo_social();

-- Students who already signed in before this file ran get the same starting state now.
select public.seed_demo_social_for(id) from public.profiles where not is_demo;
