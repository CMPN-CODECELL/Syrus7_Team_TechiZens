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
