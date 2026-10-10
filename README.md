# Nexus

**Verified opportunity discovery and squad matching for college students.**
Team TechiZens · Syrus 2026 · Problem statement PS3: *Intelligent Discovery of Practical Learning Opportunities*.

Students today search LinkedIn, event sites and college notice boards by hand, and the listings are inconsistent,
duplicated, and often miss the deadline, eligibility or location. Nexus collects opportunities from real sources,
cleans them up, shows **how trustworthy** each one is, explains **why it fits you**, and helps you **find teammates**.

> **Live site:** https://nexus-techizens.vercel.app (real Google sign-in, real data). No install needed.
>
> **For judges:** to run it yourself, start with [Run it in 2 minutes](#run-it-in-2-minutes), then follow [A 5-minute tour](#a-5-minute-tour-what-to-click).
> The table in [POC coverage](#poc-coverage) says what is real and what is not, and [Honest limitations](#honest-limitations) says what is missing.

**What is real today (2026-10-10):** 566 opportunities from 5 live sources in a Supabase database; real Google login;
relevance and eligibility scoring; a trust layer; saved items with change alerts; a Connections feed, student profiles and
a Squad Hub that run on **real students only** (no invented data anywhere); an AI search with a rule-based fallback.

---

## Run it in 2 minutes

You need [Node.js](https://nodejs.org) 20.19 or newer (we developed on 24).

```bash
git clone https://github.com/CMPN-CODECELL/Syrus7_Team_TechiZens.git
cd Syrus7_Team_TechiZens
npm install
cp .env.judges .env.local        # Windows (cmd): copy .env.judges .env.local
npm run dev
```

Open **http://localhost:5173** and click **Sign in with Google**. This is the **real Google login**, the same setup the team
uses, so you get every feature, including your own saved items, Change Sentinel alerts, Connections and the Squad Hub.

- `.env.judges` holds the **frontend** Supabase project URL and its public key (the same values the team's own `.env.local` has).
  The anon key is public by design (it ships inside any web app's JavaScript); the database is protected by Row Level
  Security. It gives **read access to the public listings** (opportunities and organizers); everything personal needs a sign-in.
- **No Google account, or Google sign-in is refused?** Open `.env.local`, remove the `#` in front of `VITE_DEMO_LOGIN=true`,
  and restart `npm run dev`. The button then signs you in as a **Demo Student**, and the opportunities are still read live
  from our database. Discover, Profile, Compare and Ask AI work. **Connections, Squad Hub and Alerts need a real Google
  account** (the demo student has no database account, so those pages show a note and empty lists), and saved items stay
  in your browser only.
- Without `.env.local` the app starts but shows **no opportunities** (we deleted all mock listings on purpose).
- The scraper's private `service_role` key is **not** in this repository, and never should be. Judges do not need it.

Other commands: `npm run lint` · `npm run build` · `npm run ingest -- --dry-run` (fetches the live sources and prints
what it would save; saves nothing and needs no key).

---

## A 5-minute tour: what to click

1. **Onboarding (4 steps).** Pick interests (42 to choose from) and skills (about 110 quick picks). Both have a **search box**:
   type to filter, press Enter to pick a match, or **Add** your own if it is not listed. "Show all" expands the list, your year, and your **country, then city**. "Detect my location" picks the nearest listed city.
2. **Discover.** You see 500+ real, open opportunities ranked for you, each with:
   - a **relevance %** and a one-line reason ("Matches Web Development, Python"), see [How relevance works](#how-relevance-works);
   - **Eligible / Not eligible** (with the reason when not eligible);
   - a **Verified** or **Check details** badge, the deadline, where it happens, and a small badge for the **source** it came from.

   Try the category cards (Hackathons, Internships, Workshops, Competitions), the filters (**Beginner-Friendly**,
   **Online / Remote**, **Free / Low-Cost**, **Sustainability & Social Impact**, plus **More filters** such as closing in 7 days, in my city, team events),
   **Sort by**, and **Refresh**. ("Courses" is empty because we do not have a course source yet.)
3. **Ask AI (the only search).** There is no separate keyword box: type a request in the search bar and press Enter or **Ask AI**, for example
   *"online coding workshops this weekend"*, *"hackathons for beginners"*, *"open source internships"*,
   *"team hackathons closing soon"*. Each result says why it matches, and the page shows what the search understood.
   A language model (through a Supabase Edge Function, so the key never reaches the browser) only turns your sentence into
   filters; the results always come from our own data, so it cannot invent opportunities. If the model is unavailable the app
   falls back to a built-in rule-based reader automatically.
4. **Open a card (View).** This is the **Trust Layer**: a **Source** link, **Last verified**, a red *Check these details*
   banner when details are missing or two sources disagree, an *event has ended* notice for closed events, and
   **Apply on organizer's website** (Nexus never applies for you).
5. **Compare hackathons.** Press the scale icon on up to 4 hackathon cards and open the comparison: deadline, format, team size,
   each scored on **interests, location, cost, level and time left to apply**, with a **Best for you** pick and the reason why.
6. **Save** an opportunity. Saved items are what **Change Sentinel** watches, and the **Alerts** page also shows **deadline
   reminders** for them (see the note on alerts below). **I participated** on a listing records it on your profile.
7. **Squad Hub.** Pick a team event, choose **I'm leading a team** or **I'm looking for a team**, and your weekly hours.
   You get the top candidates (leader) or the best-fit squads (seeker), ranked by **skill fit and schedule fit**. Send a
   request; the other student sees it and can **Accept or Decline**, and **only when both agree are contact details revealed**
   (double opt-in, enforced in the database). When a team is full, **Copy Roster** appears. Events without teams use the
   lightweight **Connect** mode. Updates arrive live, with no refresh.
8. **Connections.** Three tabs. **Feed**: posts from your connections (update, recommendation, or *looking for teammates*,
   optionally with an opportunity attached), with likes, comments and replies. **Connections**: your people, **invitations**
   waiting for you, and requests you sent. **Find people**: every other student with search and a *shared interests or
   skills* filter. Student profiles show what you have in common. No contact details are ever shown here.
9. **Profile.** Three tabs: **About you** (private, used for ranking), **Public profile** (name, headline, college, About, with a
   live preview of what others see) and **Activity** (what you took part in, your connections). Press **Save changes** and
   the feed re-ranks.

> **Trying Connections and the Squad Hub needs two students.** The database holds only real students (a handful so far),
> so the feed starts empty. To see it work, sign in with **two Google accounts** (a normal window and a private one),
> connect them, post, and start a squad for the same opportunity from both. We are also happy to demo it live.

**About the alerts page.** Change Sentinel reads alerts from the database for a *signed-in Google* account (with the demo
login fallback the Alerts page is empty). When ingestion changes a listing's deadline, a database trigger writes an alert
such as *Deadline: 23 Oct 2026 → 25 Oct 2026*, which a student who saved that listing sees on the Alerts page. Alerts only
appear after a listing actually changes, so right after setup the page can be empty; we are happy to show it live.

---

## How relevance works

Relevance and eligibility are separate (the POC's "Decoupled Scoring"). The relevance score is 10 to 100 and is computed in
the browser by plain, readable code in [`src/lib/scoring.js`](src/lib/scoring.js):

1. **Topic fit (0 to 1):** 75% how many of **your interests** the opportunity covers (two matches already fill most of it,
   matching more, up to five, adds the rest) and 25% whether it uses **skills you have**. The opportunity's topics come from its
   listed interests plus a keyword reader of its title and theme (and, for long descriptions, the description). An opportunity
   that says nothing about its topic gets a neutral score, so missing information is never punished like a mismatch.
2. **Practical fit:** for students who say they are beginners, the score is reduced when the opportunity is too advanced.
3. The card shows the percentage and a short reason, and **Best match** puts eligible opportunities first, then higher
   relevance, then the nearest deadline.

---

## POC coverage

| POC feature | Status | Notes |
|---|---|---|
| **1. Smart ingestion** | **Real** | Devpost, Unstop, MLH, HackerEarth and Hack2skill are fetched into Supabase (566 listings): title, theme, dates, deadline, format, location, team size, link. Cross-posted duplicates are merged, expired events are shown as closed, missing details are `null` and flagged. |
| **2. Trust layer** | **Real** | Source link and badge, Last verified time, warning banners for conflicts and missing details. |
| **3. Decoupled scoring** | **Real** | Relevance (interests + skills, shown as %) and eligibility (Eligible / Not eligible with a reason) are separate. Scraped sources rarely state a minimum year, so "Not eligible" is uncommon in this data. |
| **4. Discovery feed** | **Real** | Ranked by skills and interests; the four POC filters plus extras. Free / Low-Cost matches only listings that state a fee (most do not, see below). **Ask AI** uses a language model when configured, with a rule-based fallback. |
| **6. Squad Hub** | **Real** | Opt-in as leader, seeker or connect; ranking by skill and schedule fit; requests with Accept / Decline; double opt-in contact reveal; Copy Roster; live updates. Needs real students to match with. |
| **7. Privacy and handoff** | **Real** | Contacts only after both sides agree (checked in the database); Copy Roster; you apply on the organizer's site; no private LinkedIn data. |
| **8. Change Sentinel** | **Real** (needs a real login) | Save an opportunity, and a database trigger alerts you when its deadline changes. |
| **9. Connections feed** | **Real** | Added by the product owner; not in the original POC. Feed, connections, invitations, people search, profiles, live updates. |

**Product-owner decisions during the build** (all recorded in `AGENTS.md`): the *Participation Cheat Sheet* was replaced by the
Connections feed; **prices are not shown** because they are rarely stated on the source sites (cards show no fee and the
detail page says to check the organizer's website; the Free / Low-Cost filter only uses fees that a source did state);
weekly hours moved from the profile into the Squad Hub; students in school are treated as minors (below).

---

## Legal and privacy

Draft, **not reviewed by a lawyer**; the contact placeholders in `src/data/legal.js` must be filled in before a public launch:

- **Pages:** Privacy Policy, Terms of Use, Sources and attribution, Contact and grievances (footer on every screen and on the login page). Text lives in `src/data/legal.js`.
- **Consent and notices:** a consent line on the login page, a short cookie / browser-storage notice, a footer disclaimer, and a tooltip on what **Verified** means.
- **Students under 18:** school years (Class 10th to 12th) are treated as minors. They confirm a parent or guardian agrees during onboarding, and **Connections, Squad Hub and "Find teammates" are switched off** for them. They are also **hidden from every other student** at the database level (migration 0021). The confirmation is a tick box: it is **not verified or stored**.
- **User rights:** **Delete my account** on the Profile page; **Report** buttons on posts, comments and profiles (there is no moderator screen yet; reports are read in the database).
- **Real data only:** the invented demo students used during development were deleted from the database (migration `0021_remove_demo_data.sql`). Other students see only your name, college, year, city, headline, About, interests and skills, never your email.
- The code is under the [MIT license](LICENSE).

---

## How the data gets in

```
Devpost · Unstop · HackerEarth · MLH · Hack2skill   (public endpoints the sites allow)
        │
        └─> scripts/ingest ─> clean up ─> merge duplicates ─> Supabase ─> the web app
              (Node)          flag gaps    flag conflicts     (Postgres + RLS)
```

- Only public endpoints that the sites' `robots.txt` allow, one request at a time with a pause. No logins, no personal data.
  Hack2skill's `robots.txt` is read on every run and its disallowed events are skipped.
- Missing details stay `null` and are flagged instead of being guessed. Interests and level are derived from the listing's
  own themes and title; nothing is invented. Each source states what it does not give (for example MLH has no registration
  deadline, Hack2skill has no event dates, so its registration end is used as the deadline).
- Run `npm run ingest` (needs a private key) or let the daily GitHub Action (`.github/workflows/ingest.yml`) do it; the
  Action activates once the repository secrets are added (**not added yet**, so listings are refreshed by hand for now).
- A database trigger logs deadline changes for Change Sentinel. Details: [`scripts/ingest/README.md`](scripts/ingest/README.md).

---

## Honest limitations

- **Small user base.** Connections and the Squad Hub run on real students only, and there are only a handful of accounts so
  far, so the feed and squads start empty. We removed all invented data on purpose rather than fake activity.
- **Ask AI depends on a model key.** It is configured as a server-side secret and falls back to a rule-based reader (topics,
  formats, types, dates and places) if the model is unreachable or not set.
- **Data gaps.** Sources rarely state a minimum year (so eligibility is mostly "Eligible"), Devpost, MLH, HackerEarth and
  Hack2skill rows get a default level of Intermediate, and Hack2skill currently has only a few open events. A delisted
  event is never removed until its deadline passes.
- **Sources are unofficial public endpoints** (Devpost's JSON, Unstop's public API, HackerEarth's and Hack2skill's site APIs)
  and can change without notice.
- **Legal pages are a draft** with placeholders and no lawyer review; parental consent is a tick box and is not stored.
- **Deployment is manual** (Vercel CLI); the daily ingestion is set up but not switched on yet.
- Google sign-in only works for accounts our OAuth setup allows. The demo login avoids this but has no Connections, Squad Hub or Alerts.

**Not built (planned):** organizer portal (organizers submitting listings for approval), email or push reminders, a
moderation screen, data export.

---

## Tech

React 19 · Vite · Tailwind CSS 4 · shadcn/ui · Supabase (PostgreSQL, Row Level Security, Realtime, Edge Functions, Google OAuth) ·
Node scripts for ingestion · GitHub Actions · Vercel.

## Repository map

```
src/
  pages/        One file per screen (Discover, Squad Hub, Connections, Alerts, Profile, ...)
  components/   Cards, pickers, Connections and Squad Hub parts (ui/ is generated shadcn)
  api/          The only place that talks to the backend (auth, opportunities, people, connections, squads, ...)
  lib/          Scoring, filters and sorting, comparison, reminders, location, search parser
  data/         Interest / skill / city lists and the legal text
scripts/ingest/ Scraper: sources, normalizing, duplicate merging, saving to Supabase
supabase/       SQL migrations 0001-0021 (tables, privacy rules, triggers) and the ai-search Edge Function
docs/           PROJECT_STATUS.md (what is done / left), SUPABASE_AUDIT.md
```

Project rules and the feature list: [AGENTS.md](AGENTS.md) · How we work: [CONTRIBUTING.md](CONTRIBUTING.md) ·
Live status: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
