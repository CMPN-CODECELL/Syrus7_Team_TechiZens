-- ============================================================================
-- PASTE-ALL: migrations 0006 to 0016 in one file (generated from supabase/migrations/, do not edit).
-- Paste this whole file into Supabase > SQL Editor > New query, and press Run.
-- Safe to run again. If 0006 already ran on your project it is harmless to include it.
-- Files included: 0006_allow_nullable_opportunity_fields.sql, 0007_profiles_demo_support.sql, 0008_saved_and_alerts.sql, 0009_connections_and_people.sql, 0010_posts_comments_likes.sql, 0011_squad_hub.sql, 0012_seed_demo_students.sql, 0013_seed_demo_posts_and_comments.sql, 0014_seed_demo_squads.sql, 0015_seed_demo_for_new_students.sql, 0016_demo_auto_answer_and_realtime.sql
-- ============================================================================

-- ############################################################################
-- FILE: 0006_allow_nullable_opportunity_fields.sql
-- ############################################################################

-- 0006_allow_nullable_opportunity_fields.sql
-- Description: Makes deadline, fee, location, format, theme, and registration_url nullable in opportunities table.
-- Reason: Implements smart ingestion requirements from CONTRIBUTING.md. Unlisted details are stored as NULL.
-- A fee of 0 means Free, while NULL means unlisted/unknown. Also seeds new opportunities opp-28 through opp-31.
-- Adds headline and about columns to profiles table to support the expanded student profile.

-- 1. Make opportunities columns nullable and remove fee default (so unlisted fee is NULL, not 0)
alter table public.opportunities
  alter column deadline drop not null,
  alter column fee drop not null,
  alter column fee drop default,
  alter column location drop not null,
  alter column format drop not null,
  alter column theme drop not null,
  alter column registration_url drop not null;

-- Update format constraint to allow null values
alter table public.opportunities drop constraint if exists opportunities_format_check;
alter table public.opportunities add constraint opportunities_format_check
  check (format is null or format in ('Online', 'In-person', 'Hybrid'));

-- 2. Add headline and about columns to profiles table
alter table public.profiles
  add column if not exists headline text not null default '',
  add column if not exists about text not null default '';

-- 3. Upsert opportunities opp-28 to opp-31 (closed and missing details examples)
insert into public.opportunities (
  id, title, description, category, theme, organizer_id, format, location,
  fee, start_date, end_date, deadline, level, interests, skills, team_size,
  hours_per_week, min_year, registration_url, source_url, last_verified, verified, warning
)
values
  (
    'opp-28',
    'API Fundamentals Workshop',
    'Send your first requests, read responses and test an API end to end.',
    'workshops',
    'APIs',
    'postman',
    'Online',
    'Online',
    0,
    '2026-10-03',
    '2026-10-03',
    '2026-09-30',
    'Beginner',
    '{"Web Development","Cloud & DevOps"}'::text[],
    '{"JavaScript","APIs"}'::text[],
    null,
    3,
    null,
    'https://postman.com',
    'https://postman.com',
    '2026-10-01T09:00:00+05:30',
    true,
    null
  ),
  (
    'opp-29',
    'Campus Data Analytics Contest',
    'Clean a real dataset and present three insights to a panel of judges.',
    'competitions',
    'Data',
    'unstop',
    'Online',
    'Online',
    100,
    '2026-10-07',
    '2026-10-08',
    '2026-10-05',
    'Intermediate',
    '{"Data Science"}'::text[],
    '{"Python","SQL"}'::text[],
    null,
    8,
    null,
    'https://unstop.com',
    'https://unstop.com',
    '2026-10-02T17:20:00+05:30',
    true,
    null
  ),
  (
    'opp-30',
    'UX Design Intern',
    'Work with the consumer app team on research, wireframes and usability tests.',
    'internships',
    'Design',
    'swiggy',
    'Hybrid',
    'Bengaluru',
    null,
    '2027-01-12',
    '2027-06-12',
    null,
    'Beginner',
    '{"Design"}'::text[],
    '{"Figma"}'::text[],
    null,
    30,
    2,
    'https://swiggy.com',
    'https://swiggy.com',
    '2026-10-07T11:45:00+05:30',
    false,
    null
  ),
  (
    'opp-31',
    'Green Campus Innovation Workshop',
    'A hands-on day on cutting waste and energy use in college buildings.',
    'workshops',
    'Sustainability',
    'iitd',
    'In-person',
    null,
    100,
    '2026-12-06',
    '2026-12-06',
    '2026-11-20',
    'Beginner',
    '{"Sustainability","Social Impact"}'::text[],
    '{}'::text[],
    null,
    4,
    null,
    null,
    'https://www.iitd.ac.in',
    '2026-10-06T14:10:00+05:30',
    false,
    null
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  theme = excluded.theme,
  organizer_id = excluded.organizer_id,
  format = excluded.format,
  location = excluded.location,
  fee = excluded.fee,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  deadline = excluded.deadline,
  level = excluded.level,
  interests = excluded.interests,
  skills = excluded.skills,
  team_size = excluded.team_size,
  hours_per_week = excluded.hours_per_week,
  min_year = excluded.min_year,
  registration_url = excluded.registration_url,
  source_url = excluded.source_url,
  last_verified = excluded.last_verified,
  verified = excluded.verified,
  warning = excluded.warning;


-- ############################################################################
-- FILE: 0007_profiles_demo_support.sql
-- ############################################################################

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


-- ############################################################################
-- FILE: 0008_saved_and_alerts.sql
-- ############################################################################

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


-- ############################################################################
-- FILE: 0009_connections_and_people.sql
-- ############################################################################

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


-- ############################################################################
-- FILE: 0010_posts_comments_likes.sql
-- ############################################################################

-- 0010_posts_comments_likes.sql
-- Description: The Connections feed: posts, likes, comments and replies.
-- Reason: Replaces the feed mock (src/api/connections.js).
--
-- Rules (enforced here, not just in the screens):
--   * A student sees posts from their accepted connections and their own (Row Level Security via is_connected).
--   * A student can only create, delete or like as themself, and can only delete their own posts and comments.
--   * Post text is up to 500 characters, comment text up to 300.
--   * No contact details live in any of these tables.
--
-- Views (the API can read these instead of doing joins; they obey the same Row Level Security):
--   feed_posts      = the Post shape in CONTRIBUTING.md (author, like_count, liked_by_me, comment_count)
--   post_comments   = the Comment shape (author, parent_id)
--
-- posts.base_like_count: likes of the invented mock posts that come from people who do not exist in the demo.
-- The shown like count is base_like_count + the real likes in post_likes. Real posts start at 0.
--
-- Mapping to src/api/connections.js:
--   getConnectionPosts()   select * from feed_posts order by created_at desc
--   createPost(...)        insert into posts (author_id = me, text, opportunity_id, type 'update')
--   deletePost(id)         delete from posts where id = ...   (its comments and likes go too)
--   toggleLike(id)         insert / delete a row in post_likes
--   getComments(postId)    select * from post_comments where post_id = ... order by created_at
--   addComment(...)        insert into comments (author_id = me, post_id, parent_id, text)
--   deleteComment(id)      delete from comments where id = ...  (its replies go too)

create table if not exists public.posts (
  id text primary key default gen_random_uuid()::text,
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'update' check (type in ('saved', 'recommended', 'looking_for_team', 'update')),
  text text check (text is null or char_length(text) <= 500),
  opportunity_id text references public.opportunities(id) on delete set null,
  base_like_count integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  check (text is not null or opportunity_id is not null)
);

create index if not exists idx_posts_author on public.posts(author_id, created_at desc);

create table if not exists public.post_likes (
  post_id text not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id text primary key default gen_random_uuid()::text,
  post_id text not null references public.posts(id) on delete cascade,
  parent_id text references public.comments(id) on delete cascade,  -- null for a comment, else the comment it replies to
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_comments_post on public.comments(post_id, created_at);

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;

-- ---- posts ----
drop policy if exists "See posts of connections and yourself" on public.posts;
create policy "See posts of connections and yourself"
  on public.posts for select to authenticated
  using (public.is_connected(auth.uid(), author_id));

drop policy if exists "Write posts as yourself" on public.posts;
create policy "Write posts as yourself"
  on public.posts for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "Delete your own posts" on public.posts;
create policy "Delete your own posts"
  on public.posts for delete to authenticated
  using (author_id = auth.uid());

-- ---- post_likes (only on posts you can see) ----
drop policy if exists "See likes on visible posts" on public.post_likes;
create policy "See likes on visible posts"
  on public.post_likes for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_likes.post_id));

drop policy if exists "Like as yourself" on public.post_likes;
create policy "Like as yourself"
  on public.post_likes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_likes.post_id));

drop policy if exists "Remove your own like" on public.post_likes;
create policy "Remove your own like"
  on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

-- ---- comments (only on posts you can see) ----
drop policy if exists "See comments on visible posts" on public.comments;
create policy "See comments on visible posts"
  on public.comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = comments.post_id));

drop policy if exists "Comment as yourself" on public.comments;
create policy "Comment as yourself"
  on public.comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.posts p where p.id = comments.post_id));

drop policy if exists "Delete your own comments" on public.comments;
create policy "Delete your own comments"
  on public.comments for delete to authenticated
  using (author_id = auth.uid());

-- ---- Views for the API ----
create or replace view public.feed_posts with (security_invoker = true) as
select
  p.id,
  p.type,
  p.text,
  p.opportunity_id,
  p.created_at,
  p.author_id,
  a.name as author_name,
  a.college as author_college,
  a.year as author_year,
  (p.base_like_count + (select count(*) from public.post_likes l where l.post_id = p.id))::integer as like_count,
  exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me,
  (select count(*) from public.comments c where c.post_id = p.id)::integer as comment_count
from public.posts p
join public.public_profiles a on a.id = p.author_id;

create or replace view public.post_comments with (security_invoker = true) as
select
  c.id,
  c.post_id,
  c.parent_id,
  c.text,
  c.created_at,
  c.author_id,
  a.name as author_name,
  a.college as author_college,
  a.year as author_year
from public.comments c
join public.public_profiles a on a.id = c.author_id;

grant select on public.feed_posts, public.post_comments to authenticated;


-- ############################################################################
-- FILE: 0011_squad_hub.sql
-- ############################################################################

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


-- ############################################################################
-- FILE: 0012_seed_demo_students.sql
-- ############################################################################

-- 0012_seed_demo_students.sql
-- Description: Seeds the 16 invented students (u-1 ... u-16) from src/data/mockPeople.js, and the connections between them.
-- Reason: The Connections feed, People pages and Squad Hub need other students to show. These are DEMO students:
-- the names and colleges are invented, they have no Google login (profiles.is_demo = true), and their emails are
-- the example.com addresses from src/data/mockSquads.js (they are only ever revealed after double opt-in).
--
-- To remove all demo data later:  delete from public.profiles where is_demo;   (everything linked to them goes too)

insert into public.profiles
  (id, email, name, onboarded, skills, interests, is_beginner, year, location, budget,
   headline, about, college, is_demo, demo_connection_count)
values
  (public.demo_uid(1),  'priya.nair@example.com', 'Priya Nair', true,
    array['Flutter','React Native'], array['Mobile Apps','Social Impact'], false, 2, 'Pilani', 500,
    'Mobile and web developer in the making',
    'Second-year student who likes shipping small apps. Looking for hackathon teammates.',
    'BITS Pilani', true, 214),
  (public.demo_uid(2),  'aarav.mehta@example.com', 'Aarav Mehta', true,
    array['Python','SQL','Statistics'], array['Data Science','AI & Machine Learning','Sustainability'], false, 3, 'Chennai', 500,
    'Data science and machine learning enthusiast',
    'Third-year student working on climate data projects. Happy to help beginners get started.',
    'IIT Madras', true, 342),
  (public.demo_uid(3),  'rohan.iyer@example.com', 'Rohan Iyer', true,
    array['Python','PyTorch'], array['AI & Machine Learning','Data Science'], false, 4, 'Tiruchirappalli', 500,
    'Final-year student exploring machine learning',
    'Finishing my last year and preparing for research internships. I share notes on the courses I complete.',
    'NIT Trichy', true, 289),
  (public.demo_uid(4),  'ananya.sharma@example.com', 'Ananya Sharma', true,
    array['Python','PyTorch','Linux'], array['AI & Machine Learning','Cybersecurity'], false, 3, 'Hyderabad', 500,
    'AI and security hobbyist',
    'Into deep learning and capture-the-flag contests. Currently looking for a team for an AI hackathon.',
    'IIIT Hyderabad', true, 301),
  (public.demo_uid(5),  'kabir.singh@example.com', 'Kabir Singh', true,
    array['HTML','CSS'], array['Web Development'], true, 1, 'Vellore', 500,
    'First-year learning web development',
    'Just started coding. Trying out one workshop every month.',
    'VIT Vellore', true, 96),
  (public.demo_uid(6),  'meera.joshi@example.com', 'Meera Joshi', true,
    array['Figma','React'], array['Design','Web Development'], false, 2, 'Pune', 500,
    'Design-minded engineering student',
    'Second-year student who enjoys design and frontend work. Preparing for my first hackathon.',
    'COEP Tech Pune', true, 158),
  (public.demo_uid(7),  'arjun.reddy@example.com', 'Arjun Reddy', true,
    array['Python','Algorithms'], array['Data Science','AI & Machine Learning'], false, 4, 'Guwahati', 500,
    'Contest programmer and data science fan',
    'Final year. I practise for contests and help juniors with problem solving.',
    'IIT Guwahati', true, 410),
  (public.demo_uid(8),  'ishita.das@example.com', 'Ishita Das', true,
    array['Arduino','Python'], array['Robotics','Sustainability'], false, 2, 'Kharagpur', 500,
    'Robotics and sustainability tinkerer',
    'Building small robots, and putting together a team for a climate hackathon.',
    'IIT Kharagpur', true, 187),
  (public.demo_uid(9),  'dev.patel@example.com', 'Dev Patel', true,
    array['JavaScript','SQL'], array['Finance','Web Development'], false, 3, 'Surathkal', 500,
    'Finance and web development',
    'Third-year student building a personal finance tracker in my spare time.',
    'NIT Karnataka', true, 175),
  (public.demo_uid(10), 'sana.khan@example.com', 'Sana Khan', true,
    array['Linux','Networking'], array['Cybersecurity'], false, 4, 'Vellore', 500,
    'Cybersecurity student',
    'Final year, preparing for security roles. I play CTFs on weekends.',
    'VIT Vellore', true, 233),
  (public.demo_uid(11), 'riya.kapoor@example.com', 'Riya Kapoor', true,
    array['Figma','React'], array['Design','Web Development'], false, 2, 'Delhi', 500,
    'Product designer and frontend learner',
    'Designing apps and learning React. Open to design sprints and small teams.',
    'IIT Delhi', true, 126),
  (public.demo_uid(12), 'karan.malhotra@example.com', 'Karan Malhotra', true,
    array['Python','Statistics'], array['AI & Machine Learning','Data Science'], false, 3, 'Pilani', 500,
    'Machine learning with a statistics focus',
    'Studying machine learning from the statistics side. Enjoy reading papers with friends.',
    'BITS Pilani', true, 204),
  (public.demo_uid(13), 'zoya.ahmed@example.com', 'Zoya Ahmed', true,
    array['Linux','Networking'], array['Cybersecurity','Cloud & DevOps'], true, 1, 'Hyderabad', 500,
    'First-year security and cloud learner',
    'Starting out with Linux and networking labs.',
    'IIIT Hyderabad', true, 72),
  (public.demo_uid(14), 'nikhil.rao@example.com', 'Nikhil Rao', true,
    array['Pitching','Excel'], array['Entrepreneurship','Finance'], false, 4, 'Vellore', 500,
    'Aspiring founder',
    'Final year, running a small startup club on campus.',
    'VIT Vellore', true, 267),
  (public.demo_uid(15), 'tara.menon@example.com', 'Tara Menon', true,
    array['Python','Design'], array['Sustainability','Social Impact'], false, 2, 'Surathkal', 500,
    'Sustainability and data',
    'Working on waste-reduction projects on campus.',
    'NIT Karnataka', true, 141),
  (public.demo_uid(16), 'vikram.choudhary@example.com', 'Vikram Choudhary', true,
    array['Docker','Linux','JavaScript'], array['Cloud & DevOps','Web Development'], false, 3, 'Pune', 500,
    'Cloud and web developer',
    'Third-year student deploying side projects to the cloud.',
    'COEP Tech Pune', true, 192)
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  onboarded = excluded.onboarded,
  skills = excluded.skills,
  interests = excluded.interests,
  is_beginner = excluded.is_beginner,
  year = excluded.year,
  location = excluded.location,
  headline = excluded.headline,
  about = excluded.about,
  college = excluded.college,
  is_demo = excluded.is_demo,
  demo_connection_count = excluded.demo_connection_count;

-- Connections between the demo students (the connectionIds lists in mockPeople.js).
-- These are what make "mutual connections" work. Each pair is stored once.
insert into public.connections (requester_id, addressee_id, status, created_at, accepted_at)
select distinct
  public.demo_uid(least(l.person, o)),
  public.demo_uid(greatest(l.person, o)),
  'accepted',
  '2026-07-01T10:00:00+05:30'::timestamptz,
  '2026-07-01T10:00:00+05:30'::timestamptz
from (
  values
    (1,  array[2, 5, 6, 11]),
    (2,  array[1, 3, 4, 7, 12, 15]),
    (3,  array[2, 4, 7, 14]),
    (4,  array[2, 3, 10, 12, 13]),
    (5,  array[1, 6, 10]),
    (6,  array[1, 5, 8, 11, 16]),
    (7,  array[2, 3, 12]),
    (8,  array[6, 13, 15]),
    (9,  array[11, 14, 16]),
    (10, array[4, 5, 13]),
    (11, array[1, 6, 9]),
    (12, array[2, 4, 7]),
    (13, array[4, 8, 10]),
    (14, array[3, 9, 16]),
    (15, array[2, 8, 16]),
    (16, array[6, 9, 14, 15])
) as l(person, others),
unnest(l.others) as o
on conflict do nothing;


-- ############################################################################
-- FILE: 0013_seed_demo_posts_and_comments.sql
-- ############################################################################

-- 0013_seed_demo_posts_and_comments.sql
-- Description: Seeds the 12 mock Connections posts and 12 mock comments (src/data/mockConnectionPosts.js, mockComments.js).
-- Reason: So the feed is not empty. The authors are the demo students from 0012.
-- Note: base_like_count holds the mock like counts (likes from people who do not exist in the demo).

insert into public.posts (id, author_id, type, text, opportunity_id, base_like_count, created_at)
values
  ('post-1',  public.demo_uid(1), 'saved', null, 'opp-4', 4, '2026-10-09T09:20:00+05:30'),
  ('post-2',  public.demo_uid(2), 'recommended', 'Great problem set if you like data. Worth a look.', 'opp-2', 12, '2026-10-08T20:05:00+05:30'),
  ('post-3',  public.demo_uid(3), 'update', 'Just wrapped up this course. The assignments were worth the time.', 'opp-22', 18, '2026-10-08T11:40:00+05:30'),
  ('post-4',  public.demo_uid(4), 'looking_for_team', 'Looking for 2 teammates, ideally someone comfortable with PyTorch.', 'opp-6', 7, '2026-10-07T18:30:00+05:30'),
  ('post-5',  public.demo_uid(5), 'saved', null, 'opp-7', 2, '2026-10-07T10:15:00+05:30'),
  ('post-6',  public.demo_uid(6), 'update', 'First hackathon coming up and I''m a little nervous. Any tips from people who have done one?', null, 23, '2026-10-06T21:00:00+05:30'),
  ('post-7',  public.demo_uid(7), 'recommended', 'Solid practice before placement season. Problems get hard fast.', 'opp-16', 9, '2026-10-06T08:45:00+05:30'),
  ('post-8',  public.demo_uid(8), 'looking_for_team', 'Our team needs a designer. Comfortable with Figma? Message me through Nexus.', 'opp-1', 11, '2026-10-05T16:10:00+05:30'),
  ('post-9',  public.demo_uid(9), 'saved', null, 'opp-3', 5, '2026-10-04T13:25:00+05:30'),
  ('post-10', public.demo_uid(10), 'update', 'Registered for the campus CTF this December. Anyone else going?', 'opp-14', 6, '2026-10-03T19:50:00+05:30'),
  ('post-11', public.demo_uid(2), 'update', 'Went to this one last week. A good first look at testing APIs.', 'opp-28', 3, '2026-10-02T18:00:00+05:30'),
  ('post-12', public.demo_uid(1), 'saved', null, 'opp-30', 1, '2026-10-02T09:30:00+05:30')
on conflict (id) do nothing;

-- Comments: a comment has parent_id null; a reply points at the comment it answers.
insert into public.comments (id, post_id, parent_id, author_id, text, created_at)
values
  ('c-1',  'post-1', null,  public.demo_uid(5), 'Is it okay for first-years?', '2026-10-09T10:05:00+05:30'),
  ('c-2',  'post-1', 'c-1', public.demo_uid(1), 'Yes, teams of 2-4 and it''s beginner level. You''d be fine.', '2026-10-09T10:30:00+05:30'),
  ('c-3',  'post-2', null,  public.demo_uid(4), 'Registered. The dataset looks interesting.', '2026-10-08T21:10:00+05:30'),
  ('c-4',  'post-2', null,  public.demo_uid(9), 'Is it solo or team?', '2026-10-08T22:00:00+05:30'),
  ('c-5',  'post-2', 'c-4', public.demo_uid(2), 'Teams of up to 3, or solo.', '2026-10-08T22:20:00+05:30'),
  ('c-6',  'post-3', null,  public.demo_uid(6), 'How many hours a week did it take?', '2026-10-08T13:00:00+05:30'),
  ('c-7',  'post-3', 'c-6', public.demo_uid(3), 'Around 5. Assignments took the most time.', '2026-10-08T14:15:00+05:30'),
  ('c-8',  'post-4', null,  public.demo_uid(7), 'Good luck finding a team!', '2026-10-07T19:00:00+05:30'),
  ('c-9',  'post-6', null,  public.demo_uid(2), 'Pick a small scope on day one. A working demo beats a big idea.', '2026-10-06T21:30:00+05:30'),
  ('c-10', 'post-6', null,  public.demo_uid(8), 'Sleep a little. Seriously.', '2026-10-06T22:10:00+05:30'),
  ('c-11', 'post-6', 'c-9', public.demo_uid(6), 'That helps a lot, thank you!', '2026-10-06T22:45:00+05:30'),
  ('c-12', 'post-8', null,  public.demo_uid(9), 'Do you have a deadline for joining the team?', '2026-10-05T17:00:00+05:30')
on conflict (id) do nothing;


-- ############################################################################
-- FILE: 0014_seed_demo_squads.sql
-- ############################################################################

-- 0014_seed_demo_squads.sql
-- Description: Seeds the Squad Hub mock data from src/data/mockSquads.js.
-- Reason: So leaders see candidates and solo seekers see squads from day one.
--   SEEKERS  -> squad_optins rows (demo students who opted in as "looking for a team", with weekly hours)
--   SQUADS   -> squads + squad_members rows (existing squads looking for members; the leader is also a member)

-- Students looking for a team (role 'seeker').
insert into public.squad_optins (user_id, opportunity_id, role, hours_per_week)
select public.demo_uid(s.person), s.opp, 'seeker', s.hours
from (
  values
    -- opp-1
    (11, 'opp-1', 6), (12, 'opp-1', 10), (15, 'opp-1', 6), (6, 'opp-1', 10), (16, 'opp-1', 15), (2, 'opp-1', 6),
    -- opp-2
    (12, 'opp-2', 10), (2, 'opp-2', 6), (7, 'opp-2', 15), (9, 'opp-2', 6), (15, 'opp-2', 6),
    -- opp-3
    (9, 'opp-3', 6), (16, 'opp-3', 10), (11, 'opp-3', 6), (14, 'opp-3', 6), (6, 'opp-3', 10),
    -- opp-4
    (1, 'opp-4', 10), (5, 'opp-4', 3), (6, 'opp-4', 6), (13, 'opp-4', 3), (11, 'opp-4', 6),
    -- opp-5
    (16, 'opp-5', 10), (9, 'opp-5', 6), (11, 'opp-5', 6), (6, 'opp-5', 6),
    -- opp-6
    (4, 'opp-6', 15), (12, 'opp-6', 10), (3, 'opp-6', 10), (7, 'opp-6', 15), (2, 'opp-6', 10),
    -- opp-12
    (14, 'opp-12', 6), (9, 'opp-12', 6), (3, 'opp-12', 10),
    -- opp-13
    (11, 'opp-13', 6), (14, 'opp-13', 10), (15, 'opp-13', 6), (8, 'opp-13', 6), (6, 'opp-13', 6),
    -- opp-14
    (10, 'opp-14', 6), (13, 'opp-14', 6), (4, 'opp-14', 10), (5, 'opp-14', 3),
    -- opp-15
    (14, 'opp-15', 6), (9, 'opp-15', 10), (12, 'opp-15', 6)
) as s(person, opp, hours)
on conflict (user_id, opportunity_id) do nothing;

-- Existing squads looking for members.
insert into public.squads (id, opportunity_id, leader_id, looking_for_skills, hours_per_week)
values
  ('s-1',  'opp-1',  public.demo_uid(8),  array['React','Design'], 10),
  ('s-2',  'opp-1',  public.demo_uid(6),  array['Python'], 10),
  ('s-3',  'opp-2',  public.demo_uid(2),  array['SQL','Statistics'], 6),
  ('s-4',  'opp-2',  public.demo_uid(7),  array['Python'], 15),
  ('s-5',  'opp-3',  public.demo_uid(9),  array['Node','JavaScript'], 6),
  ('s-6',  'opp-4',  public.demo_uid(1),  array['Flutter','React Native'], 10),
  ('s-7',  'opp-4',  public.demo_uid(6),  array['React Native'], 6),
  ('s-8',  'opp-5',  public.demo_uid(16), array['JavaScript','APIs'], 10),
  ('s-9',  'opp-6',  public.demo_uid(4),  array['PyTorch','Python'], 15),
  ('s-10', 'opp-6',  public.demo_uid(12), array['Python','Statistics'], 10),
  ('s-11', 'opp-13', public.demo_uid(15), array['Design','Pitching'], 6),
  ('s-12', 'opp-14', public.demo_uid(13), array['Linux','Networking'], 6),
  ('s-13', 'opp-15', public.demo_uid(14), array['Pitching','Analytics'], 6)
on conflict (id) do nothing;

-- Members of each squad (the first number is the leader).
insert into public.squad_members (squad_id, user_id)
select m.squad, public.demo_uid(u)
from (
  values
    ('s-1',  array[8, 15]),
    ('s-2',  array[6, 1, 16]),
    ('s-3',  array[2]),
    ('s-4',  array[7, 12]),
    ('s-5',  array[9, 14]),
    ('s-6',  array[1]),
    ('s-7',  array[6, 5, 13]),
    ('s-8',  array[16, 9]),
    ('s-9',  array[4, 3]),
    ('s-10', array[12]),
    ('s-11', array[15, 8, 11]),
    ('s-12', array[13]),
    ('s-13', array[14])
) as m(squad, members),
unnest(m.members) as u
on conflict do nothing;


-- ############################################################################
-- FILE: 0015_seed_demo_for_new_students.sql
-- ############################################################################

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


-- ############################################################################
-- FILE: 0016_demo_auto_answer_and_realtime.sql
-- ############################################################################

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


