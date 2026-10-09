-- 0009_connections_and_people.sql
-- Description: Connections between students, and a safe public view of student profiles.
-- Reason: Replaces the people/connections mock (src/api/people.js): your connections, other students'
-- profile pages, "People you may know", invitations (accept / ignore) and requests (connect / withdraw).
--
-- Table connections: one row per pair of students.
--   requester_id = who asked, addressee_id = who was asked
--   status 'pending'  -> an invitation (for the addressee) / a sent request (for the requester)
--   status 'accepted' -> they are connected (accepted_at = "connected since")
-- Privacy: connecting NEVER shares contact details. profiles.email is private (see 0001/0004: a student can only
-- read their own profile row). Other students are seen through the view public_profiles, which has no email.
--
-- Mapping to src/api/people.js:
--   getConnections()            connections where status = 'accepted' and I am either side, joined to public_profiles
--   getInvitations()            connections where addressee_id = me and status = 'pending'
--   sendConnectionRequest(id)   insert (requester = me, addressee = id)
--   withdrawConnectionRequest   delete my pending row
--   acceptInvitation(id)        update status = 'accepted', accepted_at = now()   (only the addressee can)
--   ignoreInvitation(id)        delete the row
--   removeConnection(id)        delete the row (either side can)
--   getSuggestions()            public_profiles minus myself, my connections and pending rows
--   getPerson(id)               public_profiles row + my relationship + get_mutual_connections(id)

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  accepted_at timestamptz,
  check (requester_id <> addressee_id)
);

-- One row per pair, whichever side asked first (also stops "A asks B" and "B asks A" both existing).
create unique index if not exists connections_pair_unique
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists idx_connections_requester on public.connections(requester_id, status);
create index if not exists idx_connections_addressee on public.connections(addressee_id, status);

alter table public.connections enable row level security;

drop policy if exists "Students see their own connection rows" on public.connections;
create policy "Students see their own connection rows"
  on public.connections for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "Students send connection requests" on public.connections;
create policy "Students send connection requests"
  on public.connections for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending' and accepted_at is null);

-- Only the person who was asked can accept.
drop policy if exists "Addressee accepts a request" on public.connections;
create policy "Addressee accepts a request"
  on public.connections for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status = 'accepted');

-- Withdraw, ignore or remove: either side can delete the row.
drop policy if exists "Either side can delete a connection row" on public.connections;
create policy "Either side can delete a connection row"
  on public.connections for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- ---- Helper: are two students connected? (a student is always "connected" to themself) -----------------

create or replace function public.is_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select a = b or exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and ((c.requester_id = a and c.addressee_id = b) or (c.requester_id = b and c.addressee_id = a))
  )
$$;

revoke all on function public.is_connected(uuid, uuid) from public, anon;
grant execute on function public.is_connected(uuid, uuid) to authenticated;

-- ---- public_profiles: what other students may see (the Person shape in CONTRIBUTING.md) -----------------
-- No email, no budget. Shows students who finished setup, the mock students, and always yourself.
-- connection_count is the mock number for mock students, and a real count for everyone else.

create or replace view public.public_profiles as
select
  p.id,
  p.name,
  p.college,
  p.year,
  p.location,
  p.headline,
  p.about,
  p.interests,
  p.skills,
  coalesce(
    p.demo_connection_count,
    (select count(*)::integer from public.connections c
      where c.status = 'accepted' and (c.requester_id = p.id or c.addressee_id = p.id))
  ) as connection_count,
  p.is_demo
from public.profiles p
where p.is_demo or p.onboarded or p.id = auth.uid();

revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;

-- ---- Mutual connections ------------------------------------------------------------------------------
-- People connected to BOTH me and another student. (A normal query cannot do this, because a student is not
-- allowed to read connection rows between two other people.)

create or replace function public.get_mutual_connections(p_other uuid)
returns setof public.public_profiles
language sql
stable
security definer
set search_path = public
as $$
  select pp.*
  from public.public_profiles pp
  where pp.id in (
    select case when c.requester_id = auth.uid() then c.addressee_id else c.requester_id end
    from public.connections c
    where c.status = 'accepted' and auth.uid() in (c.requester_id, c.addressee_id)
    intersect
    select case when c.requester_id = p_other then c.addressee_id else c.requester_id end
    from public.connections c
    where c.status = 'accepted' and p_other in (c.requester_id, c.addressee_id)
  )
$$;

revoke all on function public.get_mutual_connections(uuid) from public, anon;
grant execute on function public.get_mutual_connections(uuid) to authenticated;
