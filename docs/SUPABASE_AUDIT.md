# Supabase audit: moving every mock into the database

Written 2026-10-09. Question: can all the data that is mock and running locally live in Supabase? **Yes.**
This file lists what is mock, where each piece goes, the SQL that creates it, and what is NOT SQL.

## 1. What is real and what is mock today

| Part | Where it lives today | Real? |
|---|---|---|
| Google login, profile (incl. headline/About) | Supabase (`auth.js`) | Real, but profile saving fails until migration `0006` is run (the `headline` column is missing) |
| Opportunities and organizers | Supabase (`opportunities.js`), falls back to mock if the call fails or returns nothing | Real for 0001 to 0005; `opp-28` to `opp-31` need `0006` |
| Saved opportunities | browser localStorage (`nexus-saved`) | Mock |
| Change Sentinel alerts | `mockAlerts.js` + localStorage (`nexus-alerts-read`) | Mock |
| Connections feed: posts, likes, comments | `mockConnectionPosts.js`, `mockComments.js` + localStorage (`nexus-my-posts`, `nexus-my-comments`, `nexus-liked-posts`) | Mock |
| People, connections, invitations, requests | `mockPeople.js` + localStorage (`nexus-connections-added/removed`, `nexus-requests-sent`, `nexus-invitations-handled`) | Mock |
| Squad Hub | `mockSquads.js` + localStorage (`nexus-squad-optins`, `nexus-squad-requests`) | Mock |
| Conversational AI search | `lib/mockSearchParser.js` (rule-based) | Mock, **not a SQL job** (see section 5) |

Static lists that stay in the code and are NOT data to move: `data/cities.js`, `data/constants.js` (interest options, limits).

## 2. Mock data to table (all seeded by the new migrations)

| Mock file | Rows | Goes to | Seed file |
|---|---|---|---|
| `mockOpportunities.js` | 31 opportunities, 27 organizers | `opportunities`, `organizers` | `0005`, `0006` (already written) |
| `mockPeople.js` `mockPeople` | 16 students | `profiles` (`is_demo = true`) | `0012` |
| `mockPeople.js` `connectionIds` | 29 student-to-student links | `connections` | `0012` |
| `mockPeople.js` `SEED_CONNECTIONS`, `mockInvitations` | 8 connections + 2 invitations for the logged-in student | `connections`, created per student by `seed_demo_social_for()` | `0015` |
| `mockConnectionPosts.js` | 12 posts | `posts` | `0013` |
| `mockComments.js` | 12 comments and replies | `comments` | `0013` |
| `mockAlerts.js` | 8 alerts | `opportunity_changes` | `0008` |
| `mockSquads.js` `SEEKERS` | 45 "looking for a team" opt-ins | `squad_optins` | `0014` |
| `mockSquads.js` `SQUADS` | 13 squads, 24 members | `squads`, `squad_members` | `0014` |
| `mockSquads.js` `CONTACTS` | 16 example.com emails | `profiles.email` of the demo students | `0012` |
| `mockSquads.js` `DECLINERS`, `MOCK_RESPONSE_DELAY_MS` | demo behaviour | trigger `demo_auto_answer` | `0016` |

## 3. New tables and who can see what (Row Level Security is on for all of them)

| Table / view | Purpose | Visible to |
|---|---|---|
| `saved_opportunities` | what a student saved (turns on monitoring) | the student only |
| `opportunity_changes` | one row per deadline / fee / rules change | students who saved that opportunity |
| `alert_reads` | which alerts a student has read | the student only |
| `my_alerts` (view) | the Alert shape: `{ id, opportunity_id, field, old_value, new_value, changed_at, read }` | the student only |
| `connections` | pending requests and accepted connections | the two students involved |
| `public_profiles` (view) | the Person shape, **no email, no budget** | any signed-in student |
| `posts`, `post_likes`, `comments` | the Connections feed | the student and their accepted connections |
| `feed_posts`, `post_comments` (views) | Post and Comment shapes with author, `like_count`, `liked_by_me`, `comment_count` | same as above |
| `squad_optins` | a student's voluntary choice per opportunity | the student, plus others who opted in to the same opportunity |
| `squads`, `squad_members` | teams being built | students who opted in to that opportunity |
| `squad_requests` | the double opt-in | the two students involved |

Functions the app can call (`supabase.rpc(...)`):
`get_mutual_connections(other_id)`, `get_contact(other_id, opportunity_id)`, `respond_to_squad_request(request_id, accept)`.
Triggers: deadline / fee changes become alerts automatically; a leader's opt-in creates their squad; a new student gets the
starting connections and invitations; demo students answer Squad Hub requests.

**Privacy (POC 7) is enforced in the database, not only in the screens:**
- `profiles.email` can only be read by its owner. Other students are read through `public_profiles`, which has no email.
- `get_contact()` returns someone's email only if an **accepted** request exists between the two students for that
  opportunity. This is the only way to read a contact, so a bug in a screen cannot leak one.
- Connecting never shares contact details. Nexus never applies for anyone and never reads private LinkedIn data.

## 4. What each `src/api` function becomes

Names and returned shapes in `CONTRIBUTING.md` do not change. The backend dev rewrites only the inside of each function.

| File | Function | Supabase |
|---|---|---|
| `saved.js` | `getSavedIds` / `saveOpportunity` / `unsaveOpportunity` | `saved_opportunities` select / insert / delete |
| `alerts.js` | `getAlerts` | `select * from my_alerts` (already only the student's saved ones, newest first) |
| | `markAlertRead(id)` | insert into `alert_reads` |
| | `markAllAlertsRead()` | insert into `alert_reads` for every id in `my_alerts` |
| `connections.js` | `getConnectionPosts` | `select * from feed_posts order by created_at desc` |
| | `createPost` / `deletePost` | insert into / delete from `posts` (`author_id` = the student) |
| | `toggleLike` | insert or delete in `post_likes` |
| | `getComments(postId)` | `select * from post_comments where post_id = ... order by created_at` |
| | `addComment` / `deleteComment` | insert into / delete from `comments` |
| `people.js` | `getConnections` / `getConnectedIds` | `connections` where `status = 'accepted'`, joined to `public_profiles` |
| | `getInvitations` | `connections` where `addressee_id = me` and `status = 'pending'` |
| | `getSuggestions` | `public_profiles` minus me, my connections and pending rows |
| | `getPerson(id)` | `public_profiles` + my relationship from `connections` + `rpc('get_mutual_connections')` |
| | `sendConnectionRequest` / `withdrawConnectionRequest` | insert / delete a pending `connections` row |
| | `acceptInvitation` | update `status = 'accepted'`, `accepted_at = now()` |
| | `ignoreInvitation` / `removeConnection` | delete the row |
| `squads.js` | `getOptIns` / `optIn` / `optOut` | `squad_optins` select / upsert / delete |
| | `getMatches` | leader: `squad_optins` with `role = 'seeker'`; seeker: `squads` + `squad_members`; connect: `public_profiles` with a shared interest (as in the mock) |
| | `getTeam` | `squads` + `squad_members` for the student |
| | `sendRequest` / `withdrawRequest` | insert / delete in `squad_requests` |
| | contact in every result | `rpc('get_contact', ...)`, null until accepted |
| | status `"mutual"` | `squad_requests.status = 'accepted'`; show `declined` as `"pending"` (do not tell the requester) |

Two things the screens need from the backend dev:
- **Who is "me"?** The mock uses the author id `"me"`. In the database it is the student's auth id (`auth.uid()`). The screens
  compare `author.id` with the current user to show Delete; return the real ids and add the user id to the User shape (or return an `isMe` flag).
- **Ids are text or uuid.** Post, comment, squad and alert ids are text; student ids are uuid strings. The screens treat all ids as opaque strings, so this is fine.

## 5. What is NOT SQL

1. **The `src/api/*.js` rewrite.** Running the SQL creates the data; the app keeps showing mock data until the six files above are
   rewired (this is the backend dev's lane). The SQL was written so each rewrite is one or two queries.
2. **Conversational AI search.** Needs an LLM behind a Supabase Edge Function (the key must stay on the server). The SQL side only
   needs `opportunities`, which exists. Until then the rule-based mock keeps working.
3. **Ingestion** (merging cross-posted duplicates, closing expired events). A backend job; the app already works out "Closed" from the deadline.
4. **Google sign-in settings** in the Supabase dashboard and Google Cloud (provider on, redirect URL `http://localhost:5173` allowed).

## 6. Decisions and trade-offs

- **Demo students are real profile rows (`is_demo = true`) with no login.** To allow that, `0007` removes the foreign key from
  `profiles.id` to `auth.users` and adds a trigger that deletes a profile when its login is deleted (same effect as before for real students).
  Remove all demo data any time with `delete from public.profiles where is_demo;`.
- **Every real student starts with the mock's starting world** (8 connections, 2 invitations) through a trigger. This is optional:
  `drop trigger seed_demo_social on public.profiles;` (see `0015`).
- **Demo students answer requests instantly**, not after 4 seconds (a trigger cannot wait). `u-10` and `u-14` never answer, like the mock.
  Optional: `drop trigger demo_auto_answer on public.squad_requests;` (see `0016`).
- **Like counts on the invented posts** are stored in `posts.base_like_count` (the mock numbers, from people who do not exist);
  real likes are added on top.
- **"N connections" on a profile** is the mock number for demo students and a real count for everyone else.
- **Realtime** is switched on for the tables where live updates matter (`0016`); the screens do not subscribe yet.
- Supabase's dashboard may show a "Security Definer View" notice for `public_profiles`. That is intentional: it is how other students are
  shown without exposing emails.

## 7. Problems found in the current backend code (separate from the new SQL)

1. `auth.js` saves `headline` and `about`, but the live database has no such columns until `0006` runs, so **every profile save fails and
   setup repeats**. Fix: run `0006`.
2. `opportunities.js` silently falls back to mock data when the database call fails or returns nothing, which can hide a broken connection.
   Consider showing an error in development.
3. `UserProvider.jsx` calls Supabase again inside the `onAuthStateChange` callback. Supabase warns this can occasionally hang; if login ever
   freezes, wrap that call in `setTimeout(..., 0)`.
4. `getCurrentUser` inserts a default profile if none exists. The signup trigger already does this, so it is a harmless duplicate.

## 8. How to apply it

1. Open Supabase, then **SQL Editor**, then **New query**.
2. Paste **`supabase/paste-all-0006-to-0016.sql`** (everything in one go) and press **Run**. It is safe to run again.
   Or run the numbered files in `supabase/migrations/` one by one, in order, starting at `0006` (0001 to 0005 are already applied).
3. Check: `select count(*) from profiles where is_demo;` returns 16, and `select count(*) from posts;` returns 12.
4. **To undo it:** paste `supabase/rollback-0007-to-0016.sql`. It returns the database to how it was after `0006` (login, profiles and opportunities keep working) and deletes the new tables and demo students. Tested: run twice, state identical to before.
5. **To use the offline mock app at any time:** rename `.env.local` (for example to `.env.local.off`) and restart `npm run dev`. With no Supabase keys the app runs entirely on the built-in mock data.
6. Then the backend dev rewires the `src/api` files one at a time (section 4). Anything not rewired keeps working on mock data.

All 16 migrations were tested together on a real Postgres engine (PGlite) with a stand-in for Supabase's auth: 78 checks passed,
including row-level security (a student cannot read another's email, requests or saved list), the double opt-in contact rule, squad
capacity, change alerts, and running the files twice.
