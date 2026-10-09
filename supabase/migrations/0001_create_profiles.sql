-- 0001_create_profiles.sql
-- Description: Creates the student profiles table and trigger for new Google OAuth signups.
-- Reason: Stores user preferences (interests, skills, beginner status, year of study, location, budget)
-- and onboarding completion state. Matches the User shape in CONTRIBUTING.md.

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null default '',
  name text not null default '',
  onboarded boolean not null default false,
  skills text[] not null default '{}'::text[],
  interests text[] not null default '{}'::text[],
  is_beginner boolean not null default false,
  year integer not null default 2,
  location text not null default '',
  budget integer not null default 500,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Trigger function: Automatically create a profiles row whenever a user signs up via Supabase Auth (e.g. Google OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    onboarded,
    skills,
    interests,
    is_beginner,
    year,
    location,
    budget
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    false,
    '{}'::text[],
    '{}'::text[],
    false,
    2,
    '',
    500
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
