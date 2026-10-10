-- 0019_account_deletion_and_reports.sql
-- Description: Lets a student delete their own account, and report posts, comments and profiles.
-- Reason: Legal pages (Privacy Policy, Terms of Use). Deleting data on request and a way to report content.
-- NOT run yet. Until it is, the "Delete my account" and "Report" buttons show a message that they could not finish.
-- Safe to run more than once.
--
-- delete_my_account()   deletes the signed-in student's login. The trigger from 0007 (on_auth_user_deleted) then
--                       deletes their profile, and the ON DELETE CASCADE rules remove everything linked to it
--                       (saved opportunities, alert reads, connections, ...).
-- content_reports       one row per report. Students can add and read their OWN reports only; the grievance
--                       officer reads all of them in the Supabase dashboard (service role).

-- ---- Delete my account -----------------------------------------------------

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---- Reports ---------------------------------------------------------------

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  -- If the reporter deletes their account the report stays (so abuse can still be dealt with), without their id.
  reporter_id uuid references public.profiles(id) on delete set null,
  content_type text not null check (content_type in ('post', 'comment', 'profile')),
  content_id text not null,
  reason text not null check (reason in (
    'Spam or scam',
    'Harassment or hate',
    'Inappropriate content',
    'Pretending to be someone',
    'Shares personal details',
    'Something else'
  )),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_content_reports_status on public.content_reports(status, created_at desc);

alter table public.content_reports enable row level security;

drop policy if exists "Students send reports as themselves" on public.content_reports;
create policy "Students send reports as themselves"
  on public.content_reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');

drop policy if exists "Students read their own reports" on public.content_reports;
create policy "Students read their own reports"
  on public.content_reports for select to authenticated
  using (reporter_id = auth.uid());

-- ROLLBACK (only if you need to undo this):
--   drop table if exists public.content_reports;
--   drop function if exists public.delete_my_account();
