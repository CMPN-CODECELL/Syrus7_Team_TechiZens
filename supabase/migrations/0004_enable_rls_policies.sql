-- 0004_enable_rls_policies.sql
-- Description: Enables Row Level Security (RLS) on profiles, organizers, and opportunities.
-- Reason: Restricts students so each student can only read and update their own profile,
-- while allowing public discovery of verified opportunities and organizers.

-- 1. Profiles Table Policies
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- 2. Organizers Table Policies (public read)
alter table public.organizers enable row level security;

drop policy if exists "Organizers are readable by all authenticated and anonymous users" on public.organizers;
create policy "Organizers are readable by all authenticated and anonymous users"
  on public.organizers
  for select
  to public
  using (true);

-- 3. Opportunities Table Policies (public read)
alter table public.opportunities enable row level security;

drop policy if exists "Opportunities are readable by all authenticated and anonymous users" on public.opportunities;
create policy "Opportunities are readable by all authenticated and anonymous users"
  on public.opportunities
  for select
  to public
  using (true);
