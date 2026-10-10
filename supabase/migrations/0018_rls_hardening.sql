-- 0018_rls_hardening.sql
-- Description: Closes two Row Level Security gaps found in the 2026-10-09 audit.
-- Reason:
--   1. profiles (0004 + 0007): the "update own profile" rule only checked the row id, so a student could set their
--      own `is_demo` flag or `demo_connection_count`. `is_demo = true` makes a profile appear in public_profiles
--      even when it is not onboarded, and `demo_connection_count` fakes the "N connections" number.
--      Real students always have is_demo = false and demo_connection_count = NULL, so the rules now require that.
--   2. connections (0009): "Addressee accepts a request" lets the addressee accept, but it did not stop them from
--      rewriting `requester_id` / `addressee_id` in the same update (a policy cannot compare old and new values).
--      A trigger now refuses any change of the two students of a connection.
-- Safe to run more than once. Checked before applying: none of the 7 real profiles has is_demo or a demo count.

-- ---- 1. Profiles: no self-service demo flags -------------------------------

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id and is_demo = false and demo_connection_count is null);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and is_demo = false and demo_connection_count is null);

-- ---- 2. Connections: the two students of a row can never change ------------

create or replace function public.connections_lock_parties()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id is distinct from old.requester_id
     or new.addressee_id is distinct from old.addressee_id then
    raise exception 'The two students of a connection cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists connections_lock_parties on public.connections;
create trigger connections_lock_parties
  before update on public.connections
  for each row execute procedure public.connections_lock_parties();

-- ROLLBACK (only if you need to undo this):
--   drop trigger if exists connections_lock_parties on public.connections;
--   drop function if exists public.connections_lock_parties();
--   -- then put the old profile rules back (0004):
--   drop policy if exists "Users can insert own profile" on public.profiles;
--   create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
--   drop policy if exists "Users can update own profile" on public.profiles;
--   create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
