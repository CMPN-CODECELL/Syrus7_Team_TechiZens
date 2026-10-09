# Nexus: Project Status

The shared memory of the project. Read this before you start, update it when you finish something.
(Works for people and for any AI tool: Claude, Antigravity or others.)

Last updated: 2026-10-09

## Team and lanes

| Lane | Owner | Files |
|---|---|---|
| Frontend (screens, design) | Frontend dev | `src/pages/*`, `src/components/*`, `src/lib/scoring.js` |
| Backend (Supabase, auth) | Backend dev | `src/api/*`, `src/context/UserProvider.jsx`, database, `.env.local` |

Workflow and data shapes: see [CONTRIBUTING.md](../CONTRIBUTING.md). Feature list (the POC): see [AGENTS.md](../AGENTS.md).

## Done

- Login landing page with a demo "Sign in with Google" (no real auth yet)
- 5-step gamified onboarding: interests, skills (with "I'm a beginner"), studies (Class 10th to Graduated), city (dropdown + detect my location), budget
- Discover page: search, 5 category cards (Courses, Internships, Hackathons, Workshops, Competitions), the 4 POC filters, a ranked personalized feed
- Opportunity cards: organizer logo and name, relevance %, Verified / Check details badge, Eligible / Not eligible with reason, aligned grid
- Relevance and eligibility scoring with plain-language reasons (`src/lib/scoring.js`)
- Profile page: interests, skills, beginner toggle, year, location, budget (edits update the feed everywhere)
- 27 mock opportunities with real organizers (colleges, companies, startups, platforms)
- shadcn/ui set up; `src/api/` swap points created; README, CONTRIBUTING, `.env.example`
- Supabase client configured (`src/lib/supabase.js`) using `@supabase/supabase-js`
- Google OAuth login and profile syncing implemented in `src/api/auth.js` and `src/context/UserProvider.jsx`
- Supabase opportunity fetching with relational organizer join implemented in `src/api/opportunities.js`
- Created SQL migrations in `supabase/migrations/`:
  - `0001_create_profiles.sql`: profiles table with automatic trigger on Google signup
  - `0002_create_organizers.sql`: organizers table
  - `0003_create_opportunities.sql`: opportunities table with category and deadline indexes
  - `0004_enable_rls_policies.sql`: Row Level Security policies (students manage own profile, public reads listings)
  - `0005_seed_opportunities.sql`: seed dataset containing 27 organizers and 27 opportunities from `mockOpportunities.js`

## Left to do (compare with the POC in AGENTS.md)

| POC feature | State |
|---|---|
| Conversational AI search | Only a disabled "Ask AI" button. Search is keyword-only. |
| Trust layer | Verified badge exists. Missing: source link, "Last Verified" display, conflict warning banner (data already has `sourceUrl`, `lastVerified`, `warning`). |
| Participation Cheat Sheet | Placeholder page. Needs prerequisites/setup, milestones, deliverable checklist per opportunity. |
| Squad Hub | Placeholder page. Needs top 3-5 candidates for leaders, top 5 squads for solo seekers, skill + schedule fit, Connect mode for workshops. |
| Privacy and handoff | Not built. Needs double opt-in before contacts are revealed, Copy Roster, link out to organizer site. Nexus never auto-applies. |
| Change Sentinel | Placeholder page. Needs saving opportunities and in-app alerts for deadline, fee and rule changes. |
| Opportunity detail page | The "View" button does nothing yet. Needs all POC fields (theme, dates, format, team size, registration link). Suggested next task. |
| Smart ingestion | Backend job: merging cross-posted duplicates, closing expired events. |
| Real auth and data | Supabase integration and SQL migrations ready on `feature/supabase-auth`. Complete end-to-end Google OAuth testing with project credentials. |

## Decisions made (and why)

- **Weekly hours removed** from onboarding, the Profile page and relevance scoring. It will come back in the team-building (Squad Hub) section. Opportunities still carry `hoursPerWeek` for that.
- **"Disqualified" is shown as "Not eligible"** (sounds better), and "Qualified" became "Eligible" to match. The reason is always shown for Not eligible.
- **Relevance is shown only as a percentage** next to the Verified badge on the card (no progress bar).
- **Ranking weights** (in `scoring.js`): interests 50, budget 20, skills 15, beginner-level fit 15. Beginners rank beginner-level opportunities higher.
- **Year values:** a number from -2 (Class 10th) to 5 (Graduated), so eligibility is a simple comparison. Graduated users count as meeting any year requirement.
- **Cards use a CSS subgrid** (5 rows) so sections line up across a row without wasting space. Do not put fixed heights back on titles.
- **Mock data:** organizer names are real, but all events (titles, dates, fees, links) are invented. Not real listings. Logos load from a public favicon service (`google.com/s2/favicons`); IIT Bombay uses the Techfest logo because the institute's crest could not be found. To use your own logo, put it in `public/logos/` and set the organizer's `logo` to `/logos/name.png`.
- **Detect my location** picks the nearest listed city from the browser's coordinates. Nothing is sent to a server.
- **Login is a demo.** It signs in as "Demo Student" and stores the profile in localStorage until Supabase is connected.
- **No router yet.** Navigation is simple state in `App.jsx`. Add a router only if it becomes necessary.

## Things to watch

- The Supabase **service role** key must never be in this repo or the frontend. Only the anon key goes in `.env.local`.
- `src/components/ui/*` is generated by shadcn. Add components with `npx shadcn@latest add <name>` instead of copying code in.
- Run `npm run lint` and `npm run build` before every pull request.
