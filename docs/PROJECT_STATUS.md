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
- The backend dev works on a branch (`feature/supabase-auth`) because auth work can break login while half done.
- **Neither person merges the backend branch into `main` without telling the other first.**
- The backend dev should run `git merge main` into their branch regularly to pick up frontend changes.

## Start here (for a new chat or a new teammate)

1. Read AGENTS.md (rules and POC), this file, CONTRIBUTING.md.
2. Frontend dev: build the next item in "Remaining (frontend)" below, in order.
3. Do not change `src/api/*` or the data shapes without telling the backend dev.
4. Before every push: `npm run lint` and `npm run build`. Update this file when you finish something.

## Done (all on `main`)

- Login landing page with a demo "Sign in with Google" (no real auth yet)
- 5-step gamified onboarding: interests, skills (with "I'm a beginner"), studies (Class 10th to Graduated), city (dropdown + detect my location), budget
- Discover page: search, 5 category cards (Courses, Internships, Hackathons, Workshops, Competitions), the 4 POC filters, a ranked personalized feed
- Opportunity cards: organizer logo and name, relevance %, Verified / Check details badge, Eligible / Not eligible with reason, bookmark, aligned grid
- Relevance and eligibility scoring with plain-language reasons (`src/lib/scoring.js`)
- Profile page: interests, skills, beginner toggle, year, location, budget (edits update the feed everywhere)
- 27 mock opportunities with real organizers (colleges, companies, startups, platforms)
- Opportunity detail page: all POC fields, relevance + eligibility with reasons, conflict warning banner, "Last verified" (flagged as possibly out of date after 14 days), source link, "Apply on organizer's website" handoff, Save button. Back keeps the search, filters and scroll position.
- Save opportunities and Change Sentinel alerts: Alerts page with in-app alerts (deadline / fee / rules, old to new value, mark read), Saved list, unread badge in the nav. Saved opportunities are the monitored ones. The Alerts page has two tabs, **Alerts** (with an unread count) and **Saved** (with a count). Mock data through `src/api/saved.js` and `src/api/alerts.js`.
- **Connections feed** (new, replaces Cheat Sheets in the menu): a LinkedIn-style timeline of activity posts from connections (saved an opportunity, recommends one, looking for teammates, shared an update), with an embedded opportunity link and a Like button. Mock data through `src/api/connections.js`. No contact details are shown.
- shadcn/ui set up; `src/api/` swap points; README, CONTRIBUTING, `.env.example`, SQL migrations convention, shared AI context files

## Remaining (frontend), in suggested order

### 1. Squad Hub (POC 6 and 7), currently a placeholder page
- Student opts in voluntarily. Two modes: **leader** sees the top 3-5 opted-in candidates; **solo seeker** sees the top 5 best-fit squads.
- Ranking by **skill fit** and **schedule fit**. This is where **weekly hours returns** (removed from onboarding on purpose).
- Lightweight **Connect** mode for workshops.
- **Privacy:** contact details revealed only after **double opt-in** (both sides agree).
- When a team is full: **Copy Roster** button. Then apply on the organizer's website (no auto-apply, no private LinkedIn data).
- Needs mock candidates/squads and new data shapes (agree with the backend dev first).
- Squad Hub and Connections are separate pages (decision). "Looking for teammates" posts in Connections can link to Squad Hub later.

### 2. Conversational AI search (POC 4)
- Today: disabled "Ask AI" button; search is keyword-only.
- Frontend mock: a simple rule-based parser for queries like "free online coding workshops this weekend"
  (free, online, workshops, interest "coding", date "this weekend"), with each result explaining its relevance.
- Real LLM search is backend work (edge function). Never put an LLM API key in the frontend.

### 3. Smart ingestion display (POC 1)
- Expired events shown as **Closed** (deadline in the past) and kept out of the main feed.
- **Missing details flagged** (e.g. no deadline or fee) on cards and the detail page.
- Duplicate merging is a backend job.

### 4. Smaller items and polish
- Connections: optional "Share an update" box so the student can post (needs an api function and shape).
- Stale or conflicting information should be visible on cards too (tooltip or small note using `warning`).
- Decide how Not eligible items rank (currently ranked by relevance only, so they can appear near the top).
- Accessibility pass (keyboard focus, labels, contrast), tablet-width check.
- Remove the empty `src/App.css`; consider error handling if a logo fails (initials fallback already exists).
- Optional: React Router if deep links become necessary.

## Remaining (backend, owned by the backend dev)

- Google OAuth through Supabase; real `getCurrentUser`, `signInWithGoogle`, `signOut`, `saveUser` in `src/api/auth.js`.
- Tables: profiles, organizers, opportunities (shapes in CONTRIBUTING.md), RLS so students see only their own profile, seed from `src/data/mockOpportunities.js`. All SQL as numbered files in `supabase/migrations/`.
- Real `getOpportunities` in `src/api/opportunities.js`.
- Tables behind `src/api/saved.js` and `src/api/alerts.js` (shapes in CONTRIBUTING.md).
- Tables behind `src/api/connections.js`: connections, posts, likes (shape in CONTRIBUTING.md).
- Later: realtime alerts, squads with double opt-in, ingestion (merge duplicates, close expired), AI search function.
- Delete the mock files once real data is live: `mockOpportunities.js`, `mockAlerts.js`, `mockConnectionPosts.js`.

## Open questions for the product owner

1. Squad Hub: how does a student choose leader vs solo seeker, and where is schedule fit entered (weekly hours? time slots?)?
2. Should Not eligible opportunities be pushed down the feed?
3. Connections: should students be able to post their own updates, or only read their connections' activity?

## Decisions made (and why)

- **Participation Cheat Sheet removed** (user decision, 2026-10-09). It was POC Feature 5. The menu item is gone and nothing was built for it. **Connections feed** was added instead (a timeline of activity posts from connections). AGENTS.md is updated to match.
- **Connections and Squad Hub are separate pages.** Connections is general networking; Squad Hub is team matching around an opportunity.
- **Weekly hours removed** from onboarding, the Profile page and relevance scoring. It will come back in the team-building (Squad Hub) section. Opportunities still carry `hoursPerWeek` for that.
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
- **Login is a demo.** It signs in as "Demo Student" and stores the profile in localStorage until Supabase is connected.
- **All backend access goes through `src/api/*`.** Screens never import Supabase directly.
- **No router yet.** Navigation is simple state in `App.jsx`.

## Things to watch

- The Supabase **service role** key must never be in this repo or the frontend. Only the anon key goes in `.env.local`.
- `src/components/ui/*` is generated by shadcn. Add components with `npx shadcn@latest add <name>` instead of copying code in.
- After `npx shadcn@latest add <name>`, check the new file in `src/components/ui/`: the generator sometimes writes `import { cn } from "cn"` (a random npm package it also installs). Change it to `import { cn } from "@/lib/utils"` and run `npm uninstall cn`.
- Run `npm run lint` and `npm run build` before every push.
- Data shapes are a contract between the two lanes. Change them only after telling the other developer.
- Nexus never auto-applies to opportunities and never reads private LinkedIn data. Contacts are shared only after double opt-in.
