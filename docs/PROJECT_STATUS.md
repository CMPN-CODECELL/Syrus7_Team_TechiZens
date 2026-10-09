# Nexus: Project Status

The shared memory of the project. Read this before you start, update it when you finish something.
(Works for people and for any AI tool: Claude, Antigravity or others.)

Last updated: 2026-10-09

## Team and lanes

| Lane | Owner | Files |
|---|---|---|
| Frontend (screens, design) | Frontend dev | `src/pages/*`, `src/components/*`, `src/lib/scoring.js` |
| Backend (Supabase, auth) | Backend dev | `src/api/*`, `src/context/UserProvider.jsx`, `src/lib/supabase.js`, `supabase/*`, database, `.env.local` |

Workflow and data shapes: [CONTRIBUTING.md](../CONTRIBUTING.md). Feature list (the POC): [AGENTS.md](../AGENTS.md).
SQL rules: [supabase/README.md](../supabase/README.md).

Frontend progress: the detail page is built on branch `feature/opportunity-detail-page` (open a PR when ready).
The backend dev has started on branch `feature/supabase-auth` (their own computer). The frontend dev is about to
start on `feature/opportunity-detail-page`. Nobody works directly on `main`; changes come in through Pull Requests.

## Start here (for a new chat or a new teammate)

1. Read AGENTS.md (rules and POC), this file, CONTRIBUTING.md.
2. Frontend dev: create a branch, then build the next item in "Remaining (frontend)" below, in order.
3. Do not change `src/api/*` or the data shapes without telling the backend dev.
4. Before every PR: `npm run lint` and `npm run build`. Update this file in the same PR.

## Done

- Login landing page with a demo "Sign in with Google" (no real auth yet)
- 5-step gamified onboarding: interests, skills (with "I'm a beginner"), studies (Class 10th to Graduated), city (dropdown + detect my location), budget
- Discover page: search, 5 category cards (Courses, Internships, Hackathons, Workshops, Competitions), the 4 POC filters, a ranked personalized feed
- Opportunity cards: organizer logo and name, relevance %, Verified / Check details badge, Eligible / Not eligible with reason, aligned grid
- Relevance and eligibility scoring with plain-language reasons (`src/lib/scoring.js`)
- Profile page: interests, skills, beginner toggle, year, location, budget (edits update the feed everywhere)
- 27 mock opportunities with real organizers (colleges, companies, startups, platforms)
- Opportunity detail page (branch feature/opportunity-detail-page): all POC fields, relevance + eligibility with reasons, conflict warning banner, "Last verified" (flagged as possibly out of date after 14 days), source link, "Apply on organizer's website" handoff. Back keeps the search, filters and scroll position.
- shadcn/ui set up; `src/api/` swap points; README, CONTRIBUTING, `.env.example`, SQL migrations convention, shared AI context files

## Remaining (frontend), in suggested order

### 1. Opportunity detail page (DONE except Save and Cheat sheet, which come with items 2 and 3)
Opens from the card's "View" button (currently does nothing). No router exists, so keep it simple: store the selected
opportunity id in state in `App.jsx` and add a Back button.
- Shows all POC fields: title, organizer, theme, description, format, location, fee, start/end dates, deadline, team size, level.
- **Trust layer (POC 2):** source link (`sourceUrl`), "Last verified" (`lastVerified`, shown as a date and flagged if old),
  warning banner when `verified` is false using the `warning` text. Data already has all three.
- Relevance % with the reason, and Eligible / Not eligible with the reason.
- **Handoff (POC 7):** an "Apply on organizer's website" button to `registrationUrl`. Nexus never applies for the student.
- Save / Watch button (feeds item 2).
- Cheat sheet section (item 3).

### 2. Saved opportunities and Change Sentinel (POC 8)
- Save / unsave an opportunity; show saved ones somewhere (Alerts page or a Saved tab).
- Alerts page (currently "Coming soon"): in-app alerts that say exactly what changed in **deadline, fee or rules**
  (old value to new value, when). Use mock alerts for now. Unread badge on the Alerts nav item.
- Needs new data shapes (agree with backend dev first): saved ids on the user, and an alert object
  `{ id, opportunityId, field: "deadline" | "fee" | "rules", oldValue, newValue, changedAt, read }`.
- Real change detection and realtime listeners are backend work.

### 3. Participation Cheat Sheet (POC 5)
Per opportunity: **prerequisites/setup**, **key milestones**, **deliverable checklist**.
- Needs a new field on the opportunity shape, e.g. `cheatSheet: { prerequisites: [], milestones: [{ label, date }], deliverables: [] }`
  (agree with backend dev first; add to mock data).
- The "Cheat Sheets" nav page is a placeholder. OPEN QUESTION: should it list cheat sheets for saved opportunities, or all?

### 4. Squad Hub (POC 6 and 7)
- Student opts in voluntarily. Two modes: **leader** sees the top 3-5 opted-in candidates; **solo seeker** sees the top 5 best-fit squads.
- Ranking by **skill fit** and **schedule fit**. This is where **weekly hours returns** (removed from onboarding on purpose).
- Lightweight **Connect** mode for workshops.
- **Privacy:** contact details revealed only after **double opt-in** (both sides agree).
- When a team is full: **Copy Roster** button. Then apply on the organizer's website (no auto-apply, no private LinkedIn data).
- Needs mock candidates/squads and new data shapes; real matching and connections are backend work.

### 5. Conversational AI search (POC 4)
- Today: disabled "Ask AI" button; search is keyword-only.
- Frontend mock: a simple rule-based parser for queries like "free online coding workshops this weekend"
  (free, online, workshops, interest "coding", date "this weekend"), with each result explaining its relevance.
- Real LLM search is backend work (edge function). Never put an LLM API key in the frontend.

### 6. Smart ingestion display (POC 1)
- Expired events shown as **Closed** (deadline in the past) and kept out of the main feed.
- **Missing details flagged** (e.g. no deadline or fee) on cards and the detail page.
- Duplicate merging is a backend job.

### 7. Smaller items and polish
- Stale or conflicting information should be visible on cards too (tooltip or small note using `warning`).
- Decide how Not eligible items rank (currently ranked by relevance only, so they can appear near the top).
- Accessibility pass (keyboard focus, labels, contrast), tablet-width check.
- Remove the empty `src/App.css`; consider error handling if a logo fails (initials fallback already exists).
- Optional: React Router if deep links become necessary.

## Remaining (backend, owned by the backend dev)

- Google OAuth through Supabase; real `getCurrentUser`, `signInWithGoogle`, `signOut`, `saveUser` in `src/api/auth.js`.
- Tables: profiles, organizers, opportunities (shapes in CONTRIBUTING.md), RLS so students see only their own profile, seed from `src/data/mockOpportunities.js`. All SQL as numbered files in `supabase/migrations/`.
- Real `getOpportunities` in `src/api/opportunities.js`.
- Later: saved opportunities, alerts and realtime, squads/connections with double opt-in, ingestion (merge duplicates, close expired), AI search function.
- Delete `src/data/mockOpportunities.js` once real data is live.

## Open questions for the product owner

1. What should the "Cheat Sheets" nav page show (saved only, or all opportunities)?
2. Squad Hub: how does a student choose leader vs solo seeker, and where is schedule fit entered (weekly hours? time slots?)?
3. Should Not eligible opportunities be pushed down the feed?
4. Detail page: full page (with Back button) or a side panel? Default plan: full page.

## Decisions made (and why)

- **Weekly hours removed** from onboarding, the Profile page and relevance scoring. It will come back in the team-building (Squad Hub) section. Opportunities still carry `hoursPerWeek` for that.
- **"Disqualified" is shown as "Not eligible"** (sounds better), and "Qualified" became "Eligible" to match. The reason is always shown for Not eligible.
- **Relevance is shown only as a percentage** next to the Verified badge on the card (no progress bar).
- **Ranking weights** (in `scoring.js`): interests 50, budget 20, skills 15, beginner-level fit 15. Beginners rank beginner-level opportunities higher.
- **Year values:** a number from -2 (Class 10th) to 5 (Graduated), so eligibility is a simple comparison. Graduated users count as meeting any year requirement.
- **Cards use a CSS subgrid** (5 rows) so sections line up across a row without wasting space. Do not put fixed heights back on titles.
- **UI style:** minimal and not text-heavy. The user disliked "overstuffed" screens; keep copy short.
- **Mock data:** organizer names are real, but all events (titles, dates, fees, links) are invented. Not real listings. Logos load from a public favicon service (`google.com/s2/favicons`); IIT Bombay uses the Techfest logo because the institute's crest could not be found. To use your own logo, put it in `public/logos/` and set the organizer's `logo` to `/logos/name.png`.
- **Detect my location** picks the nearest listed city from the browser's coordinates. Nothing is sent to a server.
- **Login is a demo.** It signs in as "Demo Student" and stores the profile in localStorage until Supabase is connected.
- **All backend access goes through `src/api/*`.** Screens never import Supabase directly.
- **No router yet.** Navigation is simple state in `App.jsx`.

## Things to watch

- The Supabase **service role** key must never be in this repo or the frontend. Only the anon key goes in `.env.local`.
- `src/components/ui/*` is generated by shadcn. Add components with `npx shadcn@latest add <name>` instead of copying code in.
- Run `npm run lint` and `npm run build` before every pull request.
- Data shapes are a contract between the two lanes. Change them only after telling the other developer.
