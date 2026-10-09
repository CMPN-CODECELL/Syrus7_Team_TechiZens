-- 0011_squad_hub.sql
-- Description: Squad Hub: opt-ins, squads, members and requests, with the double opt-in contact rule.
-- Reason: Replaces the Squad Hub mock (src/api/squads.js).
--
-- Tables:
--   squad_optins      a student's voluntary choice per opportunity: role leader / seeker / connect, weekly hours
--   squads            a team being built for an opportunity (one per leader per opportunity)
--   squad_members     who is in a squad (the leader is a member)
--   squad_requests    "I would like to team up / connect with you"; becomes 'accepted' only when the OTHER student agrees
--
-- PRIVACY (POC 7): contacts are revealed only after double opt-in.
--   * profiles.email is private (only the owner can read the row).
--   * get_contact(other, opportunity) returns another student's email ONLY if there is an ACCEPTED request between
--     the two of them for that opportunity. Otherwise it returns null. This is the only way to read someone's contact.
--   * Nexus never applies to an opportunity for anyone.
--
-- Mapping to src/api/squads.js:
--   getOptIns()               select from squad_optins where user_id = me
--   optIn(...) / optOut(...)  upsert / delete in squad_optins (a leader opt-in automatically creates their squad)
--   getMatches(opp), leader   squad_optins where role = 'seeker' for that opportunity, joined to public_profiles
--   getMatches(opp), seeker   squads (+ squad_members) for that opportunity, joined to public_profiles
--   getMatches(opp), connect  public_profiles with a shared interest (same as the mock; no table needed)
--   status per person         from squad_requests: none / pending / accepted (the screens call accepted "mutual")
--   contact per person        select get_contact(person_id, opportunity_id)
--   sendRequest / withdraw    insert / delete in squad_requests (requester = me)
--   the OTHER student agrees  select respond_to_squad_request(request_id, true)   (false = decline)
-- A declined request should look "pending" to the requester (do not tell them); only 'accepted' matters.
--
-- Ranking (skill fit and schedule fit) stays in the screen (src/lib/squadMatching.js): return raw data.

-- ---- Opt-ins ---------------------------------------------------------------

create table if not exists public.squad_optins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  role text not null check (role in ('leader', 'seeker', 'connect')),
  hours_per_week integer check (hours_per_week is null or hours_per_week in (3, 6, 10, 15, 20)),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, opportunity_id),
  check ((role = 'connect') = (hours_per_week is null))  -- connect has no hours; leader and seeker must have them
);

create index if not exists idx_optins_opportunity on public.squad_optins(opportunity_id, role);

-- ---- Squads and members ----------------------------------------------------

create table if not exists public.squads (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  leader_id uuid not null references public.profiles(id) on delete cascade,
  looking_for_skills text[] not null default '{}'::text[],
  hours_per_week integer check (hours_per_week is null or hours_per_week in (3, 6, 10, 15, 20)),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (opportunity_id, leader_id)
);

create table if not exists public.squad_members (
  squad_id text not null references public.squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc'::text, now()),
  primary key (squad_id, user_id)
);

-- ---- Requests (the double opt-in) ------------------------------------------

create table if not exists public.squad_requests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  responded_at timestamptz,
  unique (opportunity_id, requester_id, target_id),
  check (requester_id <> target_id)
);

create index if not exists idx_requests_target on public.squad_requests(target_id, status);

-- ---- Helper (avoids a policy that reads its own table) ---------------------

create or replace function public.has_opted_in(p_opportunity text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.squad_optins
    where user_id = auth.uid() and opportunity_id = p_opportunity
  )
$$;

revoke all on function public.has_opted_in(text) from public, anon;
grant execute on function public.has_opted_in(text) to authenticated;

-- ---- Row Level Security ----------------------------------------------------

alter table public.squad_optins enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.squad_requests enable row level security;

-- You see your own opt-ins, and the opt-ins of others only for opportunities YOU also opted in to (voluntary matching).
drop policy if exists "See own and fellow opt-ins" on public.squad_optins;
create policy "See own and fellow opt-ins"
  on public.squad_optins for select to authenticated
  using (user_id = auth.uid() or public.has_opted_in(opportunity_id));

drop policy if exists "Opt in as yourself" on public.squad_optins;
create policy "Opt in as yourself"
  on public.squad_optins for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Change your own opt-in" on public.squad_optins;
create policy "Change your own opt-in"
  on public.squad_optins for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Opt out" on public.squad_optins;
create policy "Opt out"
  on public.squad_optins for delete to authenticated
  using (user_id = auth.uid());

-- Squads are visible to students who opted in to that opportunity (and to their own leader).
drop policy if exists "See squads of opportunities you opted in to" on public.squads;
create policy "See squads of opportunities you opted in to"
  on public.squads for select to authenticated
  using (leader_id = auth.uid() or public.has_opted_in(opportunity_id));

drop policy if exists "Leaders edit their squad" on public.squads;
create policy "Leaders edit their squad"
  on public.squads for update to authenticated
  using (leader_id = auth.uid()) with check (leader_id = auth.uid());

drop policy if exists "Leaders delete their squad" on public.squads;
create policy "Leaders delete their squad"
  on public.squads for delete to authenticated
  using (leader_id = auth.uid());

-- Members are visible when the squad is visible. Joining happens only through respond_to_squad_request().
drop policy if exists "See members of visible squads" on public.squad_members;
create policy "See members of visible squads"
  on public.squad_members for select to authenticated
  using (exists (select 1 from public.squads s where s.id = squad_members.squad_id));

drop policy if exists "Leave a squad" on public.squad_members;
create policy "Leave a squad"
  on public.squad_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.squads s where s.id = squad_members.squad_id and s.leader_id = auth.uid())
  );

-- Requests: only the two people involved can see one. You can only ask as yourself, for an opportunity you opted in to.
drop policy if exists "See requests you sent or received" on public.squad_requests;
create policy "See requests you sent or received"
  on public.squad_requests for select to authenticated
  using (auth.uid() in (requester_id, target_id));

drop policy if exists "Send a request as yourself" on public.squad_requests;
create policy "Send a request as yourself"
  on public.squad_requests for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'pending'
    and public.has_opted_in(opportunity_id)
  );

drop policy if exists "Withdraw your own pending request" on public.squad_requests;
create policy "Withdraw your own pending request"
  on public.squad_requests for delete to authenticated
  using (requester_id = auth.uid() and status = 'pending');

-- (There is no update policy: a request is answered only through respond_to_squad_request() below.)

-- ---- A leader's opt-in creates their squad ---------------------------------

create or replace function public.create_squad_for_leader()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_squad_id text;
begin
  if new.role = 'leader' then
    insert into public.squads (opportunity_id, leader_id, hours_per_week)
    values (new.opportunity_id, new.user_id, new.hours_per_week)
    on conflict (opportunity_id, leader_id) do update set hours_per_week = excluded.hours_per_week
    returning id into new_squad_id;

    insert into public.squad_members (squad_id, user_id)
    values (new_squad_id, new.user_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists optin_creates_squad on public.squad_optins;
create trigger optin_creates_squad
  after insert or update on public.squad_optins
  for each row execute procedure public.create_squad_for_leader();

-- ---- Answering a request ---------------------------------------------------
-- apply_squad_response: the shared logic (not callable from the app).
-- respond_to_squad_request: what the app calls; only the person who was asked may answer.
-- When a request is accepted and one side leads a squad, the other side joins it (if there is room).

create or replace function public.apply_squad_response(p_request uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.squad_requests;
  v_squad_id text;
  v_joiner uuid;
  v_capacity integer;
  v_count integer;
begin
  select * into r from public.squad_requests where id = p_request and status = 'pending';
  if not found then
    raise exception 'Request not found or already answered';
  end if;

  if not p_accept then
    update public.squad_requests set status = 'declined', responded_at = now() where id = p_request;
    return 'declined';
  end if;

  -- A seeker asked a leader, or a leader invited a candidate: find the squad and who is joining it.
  select id into v_squad_id from public.squads
   where opportunity_id = r.opportunity_id and leader_id = r.target_id;
  if found then
    v_joiner := r.requester_id;
  else
    select id into v_squad_id from public.squads
     where opportunity_id = r.opportunity_id and leader_id = r.requester_id;
    if found then
      v_joiner := r.target_id;
    end if;
  end if;

  if v_squad_id is not null then
    select coalesce((o.team_size ->> 'max')::integer, 1) into v_capacity
      from public.opportunities o where o.id = r.opportunity_id;
    select count(*) into v_count from public.squad_members where squad_id = v_squad_id;

    if not exists (select 1 from public.squad_members where squad_id = v_squad_id and user_id = v_joiner) then
      if v_count >= v_capacity then
        raise exception 'This squad is already full';
      end if;
      insert into public.squad_members (squad_id, user_id) values (v_squad_id, v_joiner);
    end if;
  end if;

  update public.squad_requests set status = 'accepted', responded_at = now() where id = p_request;
  return 'accepted';
end;
$$;

revoke all on function public.apply_squad_response(uuid, boolean) from public, anon, authenticated;

create or replace function public.respond_to_squad_request(p_request uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.squad_requests
    where id = p_request and target_id = auth.uid() and status = 'pending'
  ) then
    raise exception 'Request not found, not for you, or already answered';
  end if;
  return public.apply_squad_response(p_request, p_accept);
end;
$$;

revoke all on function public.respond_to_squad_request(uuid, boolean) from public, anon;
grant execute on function public.respond_to_squad_request(uuid, boolean) to authenticated;

-- ---- The double opt-in contact reveal --------------------------------------
-- Returns the other student's email only when BOTH agreed (an accepted request between you two for this opportunity).

create or replace function public.get_contact(p_other uuid, p_opportunity text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.email
  from public.profiles p
  where p.id = p_other
    and auth.uid() is not null
    and exists (
      select 1 from public.squad_requests r
      where r.opportunity_id = p_opportunity
        and r.status = 'accepted'
        and ((r.requester_id = auth.uid() and r.target_id = p_other)
          or (r.target_id = auth.uid() and r.requester_id = p_other))
    )
$$;

revoke all on function public.get_contact(uuid, text) from public, anon;
grant execute on function public.get_contact(uuid, text) to authenticated;
