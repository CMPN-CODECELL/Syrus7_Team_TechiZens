-- 0003_create_opportunities.sql
-- Description: Creates the opportunities table.
-- Reason: Stores listings for practical learning opportunities (courses, internships, hackathons, workshops, competitions).
-- Matches the Opportunity data shape in CONTRIBUTING.md.

create table if not exists public.opportunities (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('courses', 'internships', 'hackathons', 'workshops', 'competitions')),
  theme text not null,
  organizer_id text not null references public.organizers(id) on delete cascade,
  format text not null check (format in ('Online', 'In-person', 'Hybrid')),
  location text not null,
  fee integer not null default 0,
  start_date date,
  end_date date,
  deadline date not null,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  interests text[] not null default '{}'::text[],
  skills text[] not null default '{}'::text[],
  team_size jsonb,
  hours_per_week integer,
  min_year integer,
  registration_url text not null,
  source_url text not null,
  last_verified timestamptz not null default timezone('utc'::text, now()),
  verified boolean not null default true,
  warning text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Index frequently filtered and searched columns
create index if not exists idx_opportunities_category on public.opportunities(category);
create index if not exists idx_opportunities_deadline on public.opportunities(deadline);
