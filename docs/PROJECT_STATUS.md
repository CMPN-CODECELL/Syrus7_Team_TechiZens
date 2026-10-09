# Nexus: Project Status

The shared memory of the project. Read this before you start, update it when you finish something.
(Works for people and for any AI tool: Claude, Antigravity or others.)

Last updated: 2026-10-09

## Team and lanes

| Lane | Owner | Files |
|---|---|---|
| Frontend (screens, design) | Frontend dev | `src/pages/*`, `src/components/*`, `src/lib/*` |
| Backend (Supabase, auth) | Backend dev | `src/api/*`, `src/context/UserProvider.jsx`, `src/lib/supabase.js`, `supabase/*`, database, `.env.local` |

Workflow and data shapes: [CONTRIBUTING.md](../CONTRIBUTING.md). Feature list (the POC): [AGENTS.md](../AGENTS.md).
SQL rules: [supabase/README.md](../supabase/README.md).

**Workflow (hybrid):**
- The frontend dev works directly on `main` in small, finished steps (only push when `npm run lint` and `npm run build` pass; always `git pull` first). A branch is used only for big or experimental features.
- The backend dev works on a branch because auth work can break login while half done. `feature/supabase-auth` (login, profile, opportunities) was merged into `main` on 2026-10-09; new backend work (saved, alerts, ...) should go on a new branch.
- **Neither person merges the backend branch into `main` without telling the other first.**
- The backend dev should run `git merge main` into their branch regularly to pick up frontend changes.

## Start here (for a new chat or a new teammate)

1. Read AGENTS.md (rules and POC), this file, CONTRIBUTING.md.
2. Frontend dev: build the next item in "Remaining (frontend)" below, in order.
3. Do not change `src/api/*` or the data shapes without telling the backend dev.
4. Before every push: `npm run lint` and `npm run build`. Update this file when you finish something.

## Where things stand (2026-10-09)

- **Every POC feature has a frontend**, running on mock data in the browser. The app is fully demo-able without a backend.
- **The backend is the main risk.** The backend dev has not finished their first piece of work (Google sign-in and profile saving).
  Because every backend call is one small file in `src/api/`, they can connect **one file at a time**; anything not connected keeps working on mock data.
  Priority for a real demo: 1) `api/auth.js` (real Google login + saved profile), 2) `api/opportunities.js` (real opportunities). The other swap points can stay mock.
- The latest commit on `main` is the source of truth; run `git log --oneline -5` to see it.

**The swap points (each is the only place that talks to a backend; all are mock today):**

| File | What it does | Mock data it uses (delete when real) |
|---|---|---|
| `api/auth.js` | login, logout, saving the profile | localStorage |
| `api/opportunities.js` | the list of opportunities | `data/mockOpportunities.js` |
| `api/saved.js` | saved opportunities | localStorage |
| `api/alerts.js` | Change Sentinel alerts | `data/mockAlerts.js` |
| `api/connections.js` | feed posts, likes, comments | `data/mockConnectionPosts.js`, `data/mockComments.js` |
| `api/people.js` | connections, profiles of others, suggestions, invitations | `data/mockPeople.js` |
| `api/squads.js` | Squad Hub opt-ins, matches, teams, requests | `data/mockSquads.js` |
| `api/search.js` | conversational AI search | `lib/mockSearchParser.js` |

**How to try the demo:** `npm install`, `npm run dev`, open http://localhost:5173, click "Sign in with Google" (demo), finish the 5-step setup.
To start fresh, clear this site's localStorage in the browser. In the demo, other students "agree" to Squad Hub requests about 4 seconds after being asked.

## Done (all on `main`)

- Login landing page with a demo "Sign in with Google" (no real auth yet)
- 5-step gamified onboarding: interests, skills (with "I'm a beginner"), studies (Class 10th to Graduated), city (dropdown + detect my location), budget
- Discover page: search, 5 category cards (Courses, Internships, Hackathons, Workshops, Competitions), the 4 POC filters, a ranked personalized feed
- Opportunity cards: organizer logo and name, relevance %, Verified / Check details badge, Eligible / Not eligible with reason, bookmark, aligned grid
- Relevance and eligibility scoring with plain-language reasons (`src/lib/scoring.js`)
- Profile page: a header with your initials, name, headline, year and city (same layout as other students' profiles), an **About you** card with an editable **headline** (up to 100 characters) and **About** (up to 300), then interests, skills, beginner toggle, year, location and budget (edits update the feed everywhere). Profiles saved before headline/About existed still work (shown as empty).
- 31 mock opportunities with real organizers (colleges, companies, startups, platforms). `opp-28` and `opp-29` are already closed; `opp-30` has no deadline or fee; `opp-31` has no location or registration link (examples for the ingestion display).
- Opportunity detail page: all POC fields, relevance + eligibility with reasons, conflict warning banner, "Last verified" (flagged as possibly out of date after 14 days), source link, "Apply on organizer's website" handoff, Save button. Back keeps the search, filters and scroll position.
- Save opportunities and Change Sentinel alerts: Alerts page with in-app alerts (deadline / fee / rules, old to new value, mark read), Saved list, unread badge in the nav. Saved opportunities are the monitored ones. The Alerts page has two tabs, **Alerts** (with an unread count) and **Saved** (with a count). Mock data through `src/api/saved.js` and `src/api/alerts.js`.
- **Connections feed** (replaces Cheat Sheets in the menu), LinkedIn-style: a timeline of posts from connections (saved an opportunity, recommends one, looking for teammates, shared an update) **plus a composer so students can write their own posts** (text up to 500 characters, optionally attaching an opportunity), **like, comment, reply** (replies sit under a comment, like LinkedIn; replying to a reply adds an @mention), and **delete your own posts and comments**. Mock data through `src/api/connections.js` (seed posts and comments in `src/data/`, your own posts and comments kept in localStorage). No contact details are shown, and the composer reminds students not to share them.
- **People you may know and invitations** (side panel on the Connections page, below the feed on phones): suggestions ranked by shared interests and skills with a **Connect** button that becomes **Pending** (click to withdraw), and **Invitations** you can **Accept** or **Ignore**. The feed only shows posts from your connections and you, so accepting an invitation makes that person's posts appear. Mock data through `src/api/people.js` (people in `src/data/mockPeople.js`; sent requests stay pending because acceptance is backend work).
- **Connections list and people's profiles** (LinkedIn-style): the Connections page has two tabs, **Feed** and **Connections**. The Connections tab lists everyone you are connected to with search, sort (recently added / name), View and Remove (with a "Remove?" confirmation). Clicking any name or avatar (in a post, a comment, the side panel, the list, or mutual connections) opens that person's **profile page**: headline, college, year, city, connection and mutual counts, About, Interests and Skills (the ones you share are filled in), Education, Mutual connections, and their Activity (their posts, **only visible if you are connected**). The profile has the right button for the relationship: Connect, Pending (withdraw), Accept / Ignore, or Connected with Remove connection. Back goes through the profiles you visited and returns to the same tab. Clicking your own name opens your Profile page. No contact details appear anywhere.
- **Squad Hub** (POC 6 and 7), replacing the placeholder. Pick an opportunity on the Squad Hub page, or press **Find teammates** / **Connect with others** on an opportunity's page. Opting in is voluntary: for team opportunities (hackathons, competitions) the student chooses **Leader** or **Solo seeker** and their **weekly hours** (3, 6, 10, 15 or 20; this is where weekly hours returned). **Leaders** see their top candidates (up to 5) and **seekers** see their top 5 best-fit squads, ranked by **skill fit** (60%) and **schedule fit** (40%) with the reason shown. **Connect mode** (workshops, courses, internships) shows the top 5 people with shared interests and skills. Asking someone is **double opt-in**: it stays **Pending** until they agree, and **contacts appear only for people who agreed with you**. Your team box shows members; when the team is **full** you get **Copy Roster** (a text roster) and **Apply on organizer's website** (Nexus never applies for you). Mock data in `src/data/mockSquads.js` through `src/api/squads.js`; in the demo, people "agree" 4 seconds after being asked, except two who never answer.
- **Conversational AI search (mock)** on the Discover page. Type a plain-English request (for example "free online coding workshops this weekend") and press Enter or **Ask AI**. A rule-based mock (`src/lib/mockSearchParser.js`, behind `src/api/search.js`) picks out cost, format, type, topic, level, dates, city, team size, eligibility and leftover keywords; shows chips for what it understood; ranks the matches and gives a one-line reason on each card. If nothing matches everything it ignores the least important parts one at a time (date first) and says so (ignored parts are struck through). Typing without Enter is still the live keyword search, and "No keyword matches" offers **Ask AI instead**. Choosing a type card or clearing returns to the normal feed.
- **Smart ingestion display** (POC 1): **Closed** events and **missing-details** flags. An opportunity is Closed when its deadline (or end date, if there is no deadline) is before today. Closed ones are **left out of the Discover feed, the AI search and the Squad Hub list**, and still open from the Saved list, posts and profile activity, where they show **Closed 30 Sep** in red; their detail page has a "This opportunity is closed" banner, a **Closed** badge and a disabled **Applications closed** button (the source link stays so a student can check if the deadline was extended). A detail the organizer never listed (deadline, fee, location, format, theme, registration link) is `null` in the data; cards and the detail page show **Not listed**, add the **Check details** flag, and the detail page says exactly what is missing. An unknown fee is never treated as free or low-cost, and gets half credit for budget in the relevance score. The logic lives in `src/lib/ingestion.js` (`isClosed`, `getMissingDetails`, `needsCheck`) and the one-line "Deadline / Closed" text in `src/components/DeadlineLine.jsx`. Duplicate merging is backend work.
- shadcn/ui set up; `src/api/` swap points; README, CONTRIBUTING, `.env.example`, SQL migrations convention, shared AI context files
- Supabase client configured (`src/lib/supabase.js`) using `@supabase/supabase-js`
- Google OAuth login and profile syncing implemented in `src/api/auth.js` and `src/context/UserProvider.jsx` (merged into `main`)
- Supabase opportunity fetching with relational organizer join implemented in `src/api/opportunities.js` (merged into `main`)
- Created SQL migrations in `supabase/migrations/`:
  - `0001_create_profiles.sql`: profiles table with automatic trigger on Google signup
  - `0002_create_organizers.sql`: organizers table
  - `0003_create_opportunities.sql`: opportunities table with category and deadline indexes
  - `0004_enable_rls_policies.sql`: Row Level Security policies (students manage own profile, public reads listings)
  - `0005_seed_opportunities.sql`: seed dataset containing initial organizers and opportunities
  - `0006_allow_nullable_opportunity_fields.sql`: nullable deadline, fee, location, format, theme, registration_url for smart ingestion; seeds opp-28 to opp-31; adds headline and about to profiles

## Remaining (frontend), in suggested order

Squad Hub and the AI search are **done on the frontend** (see Done); what is left for them is backend work (see the backend list below).
The mock AI search understands English only, and "this weekend" style dates are worked out from today's date (the mock events are
in Nov 2026 to Jan 2027, so "this weekend" finds nothing and the mock says it ignored the date; "in december" shows dates working).
Squad Hub follow-ups, not built: link "Looking for teammates" posts in Connections to the Squad Hub, show a team's progress on the
detail page, let a leader remove a teammate, let a student leave a squad.

Smart ingestion display (Closed events and missing-details flags) is **done** (see Done). Only polish is left:

### Smaller items and polish
- Your own profile still has no **college** (other students show one) and onboarding does not ask for a headline or About. Add them if wanted (changes the profile shape; talk to the backend dev first).
- Connections: more LinkedIn-style extras if wanted (comment likes, edit a post, reporting, a search for people who are not connections yet). Not built.
- Stale or conflicting information should be visible on cards too (tooltip or small note using `warning`).
- Decide how Not eligible items rank (currently ranked by relevance only, so they can appear near the top).
- Accessibility pass (keyboard focus, labels, contrast), tablet-width check.
- Remove the empty `src/App.css`; consider error handling if a logo fails (initials fallback already exists).
- Repository hygiene: a final pass on the README (add a short "what Nexus is" and a demo walkthrough) before the hackathon demo.
- Optional: React Router if deep links become necessary.

## Remaining (backend, owned by the backend dev)

- **Done (merged into `main` on 2026-10-09)**:
  - Google OAuth through Supabase; real `getCurrentUser`, `signInWithGoogle`, `signOut`, `saveUser` in `src/api/auth.js`.
  - Tables: profiles, organizers, opportunities (shapes in CONTRIBUTING.md), RLS so students see only their own profile, seed data from `src/data/mockOpportunities.js`. Migrations `0001` through `0006`.
  - Real `getOpportunities` in `src/api/opportunities.js`.
- **SQL written for every remaining swap point, NOT yet run in Supabase** (2026-10-09): migrations `0007` to `0016` create the tables, privacy rules (RLS, double opt-in `get_contact`) and mock-data seeds for saved, alerts, connections/people, posts/comments/likes and the Squad Hub. Tested on a local Postgres engine (78 checks). Full audit, table map and what each `src/api` function becomes: [SUPABASE_AUDIT.md](SUPABASE_AUDIT.md). To apply, paste `supabase/paste-all-0006-to-0016.sql` in the Supabase SQL Editor (this also runs the missing `0006`, which is why profile saving currently fails). The `src/api` files still use mock data until they are rewired.
- **Remaining swap points to connect**:
  - Tables behind `src/api/saved.js` and `src/api/alerts.js` (shapes in CONTRIBUTING.md).
  - Tables behind `src/api/connections.js`: connections, posts, likes (shape in CONTRIBUTING.md).
  - Tables behind `src/api/people.js`: connections, profiles of others, suggestions, invitations.
  - Tables behind `src/api/squads.js` (opt-ins, squads and members, requests; double opt-in: a contact must only be readable by someone the person agreed with).
  - Later: realtime alerts and squad responses, ingestion (merge duplicates, close expired), AI search function.
  - Delete mock files once real data is live.

## Open questions for the product owner

1. Should Not eligible opportunities be pushed down the feed?
2. Connections: should posts need any moderation or reporting? (Students can already post, comment, reply and connect with people.)
3. Squad Hub schedule: weekly hours (3 to 20) is used as "schedule fit" for now. Is that enough, or should students enter time slots?
4. Should the profile get a **college** field (other students show one, yours does not)?

## Decisions made (and why)

- **Participation Cheat Sheet removed** (user decision, 2026-10-09). It was POC Feature 5. The menu item is gone and nothing was built for it. **Connections feed** was added instead (a timeline of activity posts from connections). AGENTS.md is updated to match.
- **Connections and Squad Hub are separate pages.** Connections is general networking; Squad Hub is team matching around an opportunity.
- **Weekly hours removed** from onboarding, the Profile page and relevance scoring. It came back **only in the Squad Hub**, chosen when the student opts in for an opportunity (not stored on the profile).
- **Squad Hub defaults** (the user said "go with the defaults"): the student picks Leader or Solo seeker per opportunity on the Squad Hub page, and picks weekly hours (3, 6, 10, 15, 20) there too.
- **Closed is worked out by the frontend, not stored** (`isClosed` in `src/lib/ingestion.js`), so the backend only has to keep `deadline` correct. Closed events are hidden from the Discover feed rather than shown greyed out. There is no "show closed" switch (not in the POC); closed events remain reachable from Saved, posts and profiles. **Missing details are `null` in the data** (a fee of `0` means Free), which changed the Opportunity shape slightly: see CONTRIBUTING.md and **tell the backend dev**.
- **"Disqualified" is shown as "Not eligible"** (sounds better), and "Qualified" became "Eligible" to match. The reason is always shown for Not eligible.
- **Relevance is shown only as a percentage** next to the Verified badge on the card (no progress bar).
- **Ranking weights** (in `scoring.js`): interests 50, budget 20, skills 15, beginner-level fit 15. Beginners rank beginner-level opportunities higher.
- **Year values:** a number from -2 (Class 10th) to 5 (Graduated), so eligibility is a simple comparison. Graduated users count as meeting any year requirement.
- **Cards use a CSS subgrid** (5 rows) so sections line up across a row without wasting space. Do not put fixed heights back on titles.
- **Save = monitor.** Saving an opportunity is what turns on Change Sentinel alerts for it (no separate "watch" switch).
- **Detail page is a full page** with a Back button (not a side panel).
- **UI style:** minimal and not text-heavy. The user disliked "overstuffed" screens; keep copy short.
- **Mock data:** organizer names are real, but all events (titles, dates, fees, links) are invented. Not real listings. The people in Connections posts are invented too. Logos load from a public favicon service (`google.com/s2/favicons`); IIT Bombay uses the Techfest logo because the institute's crest could not be found. To use your own logo, put it in `public/logos/` and set the organizer's `logo` to `/logos/name.png`.
- **Detect my location** picks the nearest listed city from the browser's coordinates. Nothing is sent to a server.
- **Login is a demo unless Supabase keys are set.** With `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` it uses real Google sign-in and the database; without them it signs in as "Demo Student" with localStorage and mock opportunities. Everything except login, profile and opportunities is still mock.
- **All backend access goes through `src/api/*`.** Screens never import Supabase directly.
- **No router yet.** Navigation is simple state in `App.jsx`.

## Things to watch

- The Supabase **service role** key must never be in this repo or the frontend. Only the anon key goes in `.env.local`.
- `src/components/ui/*` is generated by shadcn. Add components with `npx shadcn@latest add <name>` instead of copying code in.
- After `npx shadcn@latest add <name>`, check the new file in `src/components/ui/`: the generator sometimes writes `import { cn } from "cn"` (a random npm package it also installs). Change it to `import { cn } from "@/lib/utils"` and run `npm uninstall cn`.
- Run `npm run lint` and `npm run build` before every push.
- Data shapes are a contract between the two lanes. Change them only after telling the other developer.
- Nexus never auto-applies to opportunities and never reads private LinkedIn data. Contacts are shared only after double opt-in.
