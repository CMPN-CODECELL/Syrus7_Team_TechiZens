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
