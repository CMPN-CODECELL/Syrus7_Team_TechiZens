# Nexus

**Verified opportunity discovery and squad matching for college students.**
Team TechiZens · Teammate · Syrus 2026 · Problem statement PS3: *Intelligent Discovery of Practical Learning Opportunities*.

Students today search LinkedIn, event sites and college notice boards by hand, and the listings are inconsistent,
duplicated, and often miss the deadline, eligibility or location. Nexus collects opportunities from real sources,
cleans them up, shows **how trustworthy** each one is, explains **why it fits you**, and helps you **find teammates**.

> **Live site:** https://nexus-techizens.vercel.app (real Google sign-in, same live data). No install needed.
>
> **For judges:** to run it yourself, start with [Run it in 2 minutes](#run-it-in-2-minutes), then follow [A 5-minute tour](#a-5-minute-tour-what-to-click).
> The table in [POC coverage](#poc-coverage) shows what is real and what is demo data.

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
uses, so you get every feature, including your own saved items and Change Sentinel alerts.

- `.env.judges` holds the **frontend** Supabase project URL and its public key (the same values the team's own `.env.local` has).
  The anon key is public by design (it ships inside any web app's JavaScript); the database is protected by Row Level
  Security. It gives **read access to the public listings** (opportunities and organizers); everything personal needs a sign-in.
- **No Google account, or Google sign-in is refused?** Open `.env.local`, remove the `#` in front of `VITE_DEMO_LOGIN=true`,
  and restart `npm run dev`. The button then signs you in as a **Demo Student**, and the opportunities are still read live
  from our database. Everything works except **Alerts** (empty) and saved items, which stay in your browser only.
- Without `.env.local` the app starts but shows **no opportunities** (we deleted all mock listings on purpose).
- The scraper's private `service_role` key is **not** in this repository, and never should be. Judges do not need it.

Other commands: `npm run lint` · `npm run build` · `npm run ingest -- --dry-run` (fetches the live sources and prints
what it would save; saves nothing and needs no key).

---

## A 5-minute tour: what to click

1. **Onboarding (4 steps).** Pick interests (42 to choose from) and skills (about 110 quick picks). Both have a **search box**:
   type to filter, press Enter to pick a match, or **Add** your own if it is not listed. "Show all" expands the list, your year, and your **country, then city**. "Detect my location" picks the nearest listed city.
2. **Discover.** You see 400+ real opportunities ranked for you, each with:
   - a **relevance %** and a one-line reason ("Matches Web Development, Python");
   - **Eligible / Not eligible** (with the reason when not eligible);
   - a **Verified** or **Check details** badge, the deadline, and where it happens.

   Try the category cards (Hackathons, Internships, Workshops, Competitions), the filters (**Beginner-Friendly**,
   **Online**, **Sustainability & Social Impact**, plus **More filters**), **Sort by**, keyword search, and **Refresh**.
   ("Courses" is empty because we do not have a course source yet.)
3. **Conversational search.** Type a request and press Enter or **Ask AI**, for example
   *"online coding workshops this weekend"*, *"hackathons for beginners"*, *"open source internships"*,
   *"team hackathons closing soon"*. Each result says why it matches, and the page shows what the search understood.
4. **Open a card (View).** This is the **Trust Layer**: a **Source** link, **Last verified**, a red *Check these details*
   banner when details are missing or two sources disagree, an *event has ended* notice for closed events, and
   **Apply on organizer's website** (Nexus never applies for you). The fee line says *Check the organizer's website*.
5. **Save** an opportunity. Saved items are what **Change Sentinel** watches (see the note on alerts below).
6. **Squad Hub.** Pick a team event, choose **I'm leading a team** or **I'm looking for a team**, and your weekly hours.
   You get the top candidates (leader) or the best-fit squads (seeker), ranked by **skill fit and schedule fit**. Send a
   request: about 4 seconds later the demo students answer, and **only then are contact details revealed** (double
   opt-in). When a team is full, **Copy Roster** appears. Events without teams use the lightweight **Connect** mode.
7. **Connections.** A LinkedIn-style feed from your connections: post, attach an opportunity, like, comment, reply;
   *People you may know*, invitations, and student profiles. No contact details are ever shown here.
8. **Profile.** Edit your **display name**, headline, About, interests, skills and location, then press **Save changes**
   (the bar at the bottom shows whether you have unsaved changes). After saving, the feed re-ranks.

**About the alerts page.** Change Sentinel reads alerts from the database for a *signed-in Google* account (with the demo
login fallback the Alerts page is empty). When ingestion changes a listing's deadline, a database trigger writes an alert
such as *Deadline: 23 Oct 2026 → 25 Oct 2026*, which a student who saved that listing sees on the Alerts page. Alerts only
appear after a listing actually changes, so right after setup the page can be empty; we are happy to show it live.

---

## POC coverage

| POC feature | Status | Notes |
|---|---|---|
| **1. Smart ingestion** | **Real** | Devpost, Unstop, MLH, HackerEarth and Hack2skill are fetched into Supabase: title, theme, dates, deadline, format, location, team size, link. Cross-posted duplicates are merged, expired events are shown as closed, missing details are `null` and flagged. |
| **2. Trust layer** | **Real** | Source link, Last verified time, warning banners for conflicts / missing details. |
| **3. Decoupled scoring** | **Real** | Relevance (interests + skills, shown as %) and eligibility (Eligible / Not eligible with a reason) are separate. Scraped sources rarely state a minimum year, so "Not eligible" is uncommon in this data. |
| **4. Discovery feed** | **Real** feed, **mock** AI | Ranked by skills and interests; three of the four POC filters plus extras (Free/Low-Cost was removed, see below). The conversational search is a rule-based reader, not an LLM yet. |
| **6. Squad Hub** | UI and logic done, **demo people** | Ranking, opt-in, double opt-in, Copy Roster, Connect mode work. The students are invented (example.com addresses); the database tables and privacy rules exist but the screens are not wired to them yet. |
| **7. Privacy and handoff** | **Real** | Contacts only after both sides agree; Copy Roster; you apply on the organizer's site; no private LinkedIn data. |
| **8. Change Sentinel** | **Real** (needs a real login) | Save an opportunity, and a database trigger alerts you when its deadline changes. |
| **9. Connections feed** | UI done, **demo data** | Added by the product owner; not in the original POC. |

**Product-owner decisions during the build** (all recorded in `AGENTS.md`): the *Participation Cheat Sheet* was replaced by the
Connections feed; **prices were removed** because they are rarely stated on the source sites (cards show no fee, the
detail page says to check the organizer's website, and the Free/Low-Cost filter and budget question went with it);
weekly hours moved from the profile into the Squad Hub.

---

## Legal and privacy

Added 2026-10-10 (draft, **not reviewed by a lawyer**; the contact placeholders in `src/data/legal.js` must be filled in before a public launch):

- **Pages:** Privacy Policy, Terms of Use, Sources and attribution, Contact and grievances (footer on every screen and on the login page). Text lives in `src/data/legal.js`.
- **Consent and notices:** a consent line on the login page, a short cookie / browser-storage notice, a footer disclaimer, and a tooltip on what **Verified** means.
- **Students under 18:** school years (Class 10th to 12th) are treated as minors. They confirm a parent or guardian agrees during onboarding, and **Connections, Squad Hub and "Find teammates" are switched off** for them. The confirmation is a tick box: it is **not verified or stored**.
- **User rights:** **Delete my account** on the Profile page; **Report** buttons on posts, comments and profiles.
- **Database:** delete and report use `supabase/migrations/0019_account_deletion_and_reports.sql` (applied 2026-10-10).
- **Demo data** in Connections and Squad Hub is labelled as invented. The code is under the [MIT license](LICENSE).

---

## How the data gets in

```
Devpost (public JSON) ┐
                      ├─> scripts/ingest ─> clean up ─> merge duplicates ─> Supabase ─> the web app
Unstop  (public API)  ┘     (Node)         flag gaps     flag conflicts     (Postgres + RLS)
```

- Only public endpoints that the sites' `robots.txt` allow, one request at a time with a pause. No logins, no personal data.
- Missing details stay `null` and are flagged instead of being guessed. Interests and level are derived from the listing's
  own themes and title; nothing is invented.
- Run `npm run ingest` (needs a private key) or let the daily GitHub Action (`.github/workflows/ingest.yml`) do it; the
  Action activates once the repository secrets are added.
- A database trigger logs deadline changes for Change Sentinel. Details: [`scripts/ingest/README.md`](scripts/ingest/README.md).

---

## Honest limitations

- **Conversational search is rule-based** (it understands topics, formats, types, dates and places, not free-form language).
  The plan is an LLM behind a Supabase Edge Function; the API boundary is already in `src/api/search.js`.
- **Squad Hub and Connections use invented students.** Nothing there touches real people.
- **Sources are unofficial public endpoints** (Devpost's JSON, Unstop's public API) and can change. Five sources so far (HackerEarth and Hack2skill currently list only a handful of open events; MLH gives no registration deadline; Hack2skill gives no event dates, so its registration end is the deadline).
- It is live at the link at the top, and also runs locally with the steps above.
- Google sign-in only works for accounts our OAuth setup allows. The demo login avoids this.

---

## Tech

React 19 · Vite · Tailwind CSS 4 · shadcn/ui · Supabase (PostgreSQL, Row Level Security, Google OAuth) · Node scripts for
ingestion · GitHub Actions.

## Repository map

```
src/
  pages/        One file per screen (Discover, Squad Hub, Connections, Alerts, Profile, ...)
  components/   Cards, pickers, Squad Hub parts (ui/ is generated shadcn)
  api/          The only place that talks to the backend (auth, opportunities, saved, alerts, ...)
  lib/          Scoring, filters and sorting, ingestion helpers, location, search parser
  data/         Interest / skill / city lists and the demo-student data
scripts/ingest/ Scraper: sources, normalizing, duplicate merging, saving to Supabase
supabase/       SQL migrations (tables, privacy rules, triggers)
docs/           PROJECT_STATUS.md (what is done / left), SUPABASE_AUDIT.md
```

Project rules and the feature list: [AGENTS.md](AGENTS.md) · How we work: [CONTRIBUTING.md](CONTRIBUTING.md) ·
Live status: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
