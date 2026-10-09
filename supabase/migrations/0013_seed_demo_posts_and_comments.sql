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
