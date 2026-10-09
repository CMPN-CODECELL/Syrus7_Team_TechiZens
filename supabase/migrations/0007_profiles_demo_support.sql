-- 0007_profiles_demo_support.sql
-- Description: Prepares the profiles table so the mock students (u-1 ... u-16) can live in Supabase.
-- Reason: The Connections feed, People pages and Squad Hub show OTHER students. The mock ones have no
-- Google login, so profiles can no longer require a row in auth.users. Real students still get their
-- profile automatically from the signup trigger created in 0001.
--
-- What changes:
--   1. profiles.id is no longer a foreign key to auth.users (so demo students can exist).
--      A new trigger deletes a student's profile when their login is deleted (replaces ON DELETE CASCADE).
--   2. New columns: college, is_demo (true for the invented mock students), demo_connection_count
--      (the "N connections" number shown for a mock student; real students get a real count).
--   3. demo_uid(n): the fixed id of mock student u-n, so seed files can refer to them.

-- 1. Allow profiles without a login.
alter table public.profiles drop constraint if exists profiles_id_fkey;

create or replace function public.handle_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_deleted_user();

-- 2. New columns.
alter table public.profiles
  add column if not exists college text,
  add column if not exists is_demo boolean not null default false,
  add column if not exists demo_connection_count integer;

-- 3. Fixed ids for the mock students: demo_uid(1) is "u-1", demo_uid(16) is "u-16".
create or replace function public.demo_uid(n integer)
returns uuid
language sql
immutable
as $$
  select ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
$$;
