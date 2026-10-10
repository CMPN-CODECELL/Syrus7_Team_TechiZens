-- 0021_remove_demo_data.sql
-- Description: Removes the invented demo students and everything that existed only to support them.
-- Reason: The app no longer uses mock data. Connections, the feed and the Squad Hub now show real students only.
--
-- What it does:
--   1. Drops the trigger that gave every new student 8 fake connections and 2 fake invitations (0015).
--   2. Drops the trigger that made demo students answer Squad Hub requests by themselves (0016).
--   3. Deletes the 16 demo profiles. ON DELETE CASCADE removes their connections, posts, comments, likes,
--      squads, opt-ins and requests. (Checked before writing this: all 99 connections, all 8 posts and all
--      10 comments belong to or involve demo students; no real student's own content is touched.)
--   4. public_profiles: no demo special cases, and students in school (Class 10th to 12th, year <= 0) are no
--      longer listed to other students. They are under 18 and the social features are off for them (see
--      src/lib/age.js). A student can always see their own row.
--
-- Not reversible (the seed files 0012 to 0016 stay in the repo if you ever need the demo data again).
-- Safe to run more than once.

drop trigger if exists seed_demo_social on public.profiles;
drop trigger if exists demo_auto_answer on public.squad_requests;
drop function if exists public.trg_seed_demo_social();
drop function if exists public.seed_demo_social_for(uuid);
drop function if exists public.demo_auto_answer();

delete from public.profiles where is_demo;

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
  (select count(*)::integer from public.connections c
    where c.status = 'accepted' and (c.requester_id = p.id or c.addressee_id = p.id)) as connection_count,
  p.is_demo
from public.profiles p
where (p.onboarded and p.year > 0) or p.id = auth.uid();
