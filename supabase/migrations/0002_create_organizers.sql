-- 0002_create_organizers.sql
-- Description: Creates the organizers table.
-- Reason: Organizers (Colleges, Companies, Startups, Platforms) host opportunities.
-- Matches the organizer data shape: { name, type, website, logo }.

create table if not exists public.organizers (
  id text primary key,
  name text not null,
  type text not null check (type in ('College', 'Company', 'Startup', 'Platform')),
  website text not null,
  logo text,
  created_at timestamptz not null default timezone('utc'::text, now())
);
