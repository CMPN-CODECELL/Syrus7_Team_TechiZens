-- 0016_demo_auto_answer_and_realtime.sql
-- Description: (1) Demo students answer Squad Hub requests by themselves. (2) Turns on Realtime for live updates.
-- Reason: (1) In the mock, other students "agree" 4 seconds after you ask them (except two who never answer).
-- Demo students have no login, so nobody can click "agree" for them; this trigger does it. It answers at once
-- (a database trigger cannot wait 4 seconds). u-10 and u-14 never answer, like in the mock.
-- (2) POC "Realtime listeners": the screens can subscribe to these tables to update live.
--
-- OPTIONAL: for a real launch, drop the auto-answer:  drop trigger if exists demo_auto_answer on public.squad_requests;

-- 1. Demo students answer requests.
create or replace function public.demo_auto_answer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where id = new.target_id and is_demo)
     and new.target_id not in (public.demo_uid(10), public.demo_uid(14)) then
    begin
      perform public.apply_squad_response(new.id, true);
    exception when others then
      null; -- for example the squad is full: the request just stays pending
    end;
  end if;
  return null;
end;
$$;

drop trigger if exists demo_auto_answer on public.squad_requests;
create trigger demo_auto_answer
  after insert on public.squad_requests
  for each row execute procedure public.demo_auto_answer();

-- 2. Realtime: let the app listen for changes on these tables (ignored if a table is already added).
do $$
declare
  t text;
begin
  foreach t in array array[
    'opportunity_changes', 'saved_opportunities', 'connections', 'posts', 'comments',
    'post_likes', 'squad_requests', 'squad_members'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then
      null; -- already added, or Realtime is not available: not a problem
    end;
  end loop;
end;
$$;
