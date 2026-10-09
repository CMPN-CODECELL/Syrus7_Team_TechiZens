-- ============================================================================
-- ROLLBACK of migrations 0007 to 0016 (the "everything in Supabase" SQL).
-- Paste into Supabase > SQL Editor and Run. It puts the database back to how it was after 0006:
-- login, profiles (with headline/About) and opportunities keep working.
-- WARNING: it deletes the tables created by 0008-0014 and everything stored in them
-- (saved items, alerts, posts, comments, connections, squads) and all demo students.
-- Safe to run twice. It does NOT touch 0001 to 0006.
-- ============================================================================

-- Triggers
drop trigger if exists demo_auto_answer on public.squad_requests;
drop trigger if exists seed_demo_social on public.profiles;
drop trigger if exists optin_creates_squad on public.squad_optins;
drop trigger if exists opportunities_log_changes on public.opportunities;
drop trigger if exists on_auth_user_deleted on auth.users;

-- Views
drop view if exists public.feed_posts;
drop view if exists public.post_comments;
drop view if exists public.my_alerts;

-- The mutual-connections function uses the public_profiles type, so it goes first
drop function if exists public.get_mutual_connections(uuid);
drop view if exists public.public_profiles;

-- Tables created by 0008 to 0011 (children first)
drop table if exists public.squad_requests cascade;
drop table if exists public.squad_members cascade;
drop table if exists public.squads cascade;
drop table if exists public.squad_optins cascade;
drop table if exists public.post_likes cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.connections cascade;
drop table if exists public.alert_reads cascade;
drop table if exists public.opportunity_changes cascade;
drop table if exists public.saved_opportunities cascade;

-- Functions (after the tables, because table policies use some of them)
drop function if exists public.demo_auto_answer();
drop function if exists public.trg_seed_demo_social();
drop function if exists public.seed_demo_social_for(uuid);
drop function if exists public.respond_to_squad_request(uuid, boolean);
drop function if exists public.apply_squad_response(uuid, boolean);
drop function if exists public.get_contact(uuid, text);
drop function if exists public.create_squad_for_leader();
drop function if exists public.has_opted_in(text);
drop function if exists public.is_connected(uuid, uuid);
drop function if exists public.log_opportunity_changes();
drop function if exists public.handle_deleted_user();

-- Back to how profiles was after 0006: no demo students, columns removed, link to the login restored.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_demo') then
    delete from public.profiles where is_demo;
  end if;
end;
$$;
delete from public.profiles where id not in (select id from auth.users);
alter table public.profiles
  drop column if exists college,
  drop column if exists is_demo,
  drop column if exists demo_connection_count;
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

drop function if exists public.demo_uid(integer);
