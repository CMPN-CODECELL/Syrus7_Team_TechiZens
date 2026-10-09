-- 0014_seed_demo_squads.sql
-- Description: Seeds the Squad Hub mock data from src/data/mockSquads.js.
-- Reason: So leaders see candidates and solo seekers see squads from day one.
--   SEEKERS  -> squad_optins rows (demo students who opted in as "looking for a team", with weekly hours)
--   SQUADS   -> squads + squad_members rows (existing squads looking for members; the leader is also a member)

-- Students looking for a team (role 'seeker').
insert into public.squad_optins (user_id, opportunity_id, role, hours_per_week)
select public.demo_uid(s.person), s.opp, 'seeker', s.hours
from (
  values
    -- opp-1
    (11, 'opp-1', 6), (12, 'opp-1', 10), (15, 'opp-1', 6), (6, 'opp-1', 10), (16, 'opp-1', 15), (2, 'opp-1', 6),
    -- opp-2
    (12, 'opp-2', 10), (2, 'opp-2', 6), (7, 'opp-2', 15), (9, 'opp-2', 6), (15, 'opp-2', 6),
    -- opp-3
    (9, 'opp-3', 6), (16, 'opp-3', 10), (11, 'opp-3', 6), (14, 'opp-3', 6), (6, 'opp-3', 10),
    -- opp-4
    (1, 'opp-4', 10), (5, 'opp-4', 3), (6, 'opp-4', 6), (13, 'opp-4', 3), (11, 'opp-4', 6),
    -- opp-5
    (16, 'opp-5', 10), (9, 'opp-5', 6), (11, 'opp-5', 6), (6, 'opp-5', 6),
    -- opp-6
    (4, 'opp-6', 15), (12, 'opp-6', 10), (3, 'opp-6', 10), (7, 'opp-6', 15), (2, 'opp-6', 10),
    -- opp-12
    (14, 'opp-12', 6), (9, 'opp-12', 6), (3, 'opp-12', 10),
    -- opp-13
    (11, 'opp-13', 6), (14, 'opp-13', 10), (15, 'opp-13', 6), (8, 'opp-13', 6), (6, 'opp-13', 6),
    -- opp-14
    (10, 'opp-14', 6), (13, 'opp-14', 6), (4, 'opp-14', 10), (5, 'opp-14', 3),
    -- opp-15
    (14, 'opp-15', 6), (9, 'opp-15', 10), (12, 'opp-15', 6)
) as s(person, opp, hours)
on conflict (user_id, opportunity_id) do nothing;

-- Existing squads looking for members.
insert into public.squads (id, opportunity_id, leader_id, looking_for_skills, hours_per_week)
values
  ('s-1',  'opp-1',  public.demo_uid(8),  array['React','Design'], 10),
  ('s-2',  'opp-1',  public.demo_uid(6),  array['Python'], 10),
  ('s-3',  'opp-2',  public.demo_uid(2),  array['SQL','Statistics'], 6),
  ('s-4',  'opp-2',  public.demo_uid(7),  array['Python'], 15),
  ('s-5',  'opp-3',  public.demo_uid(9),  array['Node','JavaScript'], 6),
  ('s-6',  'opp-4',  public.demo_uid(1),  array['Flutter','React Native'], 10),
  ('s-7',  'opp-4',  public.demo_uid(6),  array['React Native'], 6),
  ('s-8',  'opp-5',  public.demo_uid(16), array['JavaScript','APIs'], 10),
  ('s-9',  'opp-6',  public.demo_uid(4),  array['PyTorch','Python'], 15),
  ('s-10', 'opp-6',  public.demo_uid(12), array['Python','Statistics'], 10),
  ('s-11', 'opp-13', public.demo_uid(15), array['Design','Pitching'], 6),
  ('s-12', 'opp-14', public.demo_uid(13), array['Linux','Networking'], 6),
  ('s-13', 'opp-15', public.demo_uid(14), array['Pitching','Analytics'], 6)
on conflict (id) do nothing;

-- Members of each squad (the first number is the leader).
insert into public.squad_members (squad_id, user_id)
select m.squad, public.demo_uid(u)
from (
  values
    ('s-1',  array[8, 15]),
    ('s-2',  array[6, 1, 16]),
    ('s-3',  array[2]),
    ('s-4',  array[7, 12]),
    ('s-5',  array[9, 14]),
    ('s-6',  array[1]),
    ('s-7',  array[6, 5, 13]),
    ('s-8',  array[16, 9]),
    ('s-9',  array[4, 3]),
    ('s-10', array[12]),
    ('s-11', array[15, 8, 11]),
    ('s-12', array[13]),
    ('s-13', array[14])
) as m(squad, members),
unnest(m.members) as u
on conflict do nothing;
