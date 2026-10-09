# Ingestion script (Smart Ingestion, POC 1)

Fetches real opportunities from the web, cleans them up and saves them to Supabase. The app does not change:
it keeps reading the `opportunities` table through `src/api/opportunities.js`.

```
Devpost + Unstop (public JSON) -> normalize -> dedupe.js -> save.js -> Supabase -> the app
```

## One-time setup

1. Run `supabase/migrations/0017_opportunities_source.sql` in the Supabase SQL editor.
2. Copy `.env.example` to `.env` (in this folder) and paste the `service_role` key
   (Supabase dashboard -> Project Settings -> API). The project URL is taken from `.env.local`.
   `.env` is ignored by git. **Never put this key in the app or in a commit.**

## Run it

```bash
npm run ingest -- --dry-run    # fetch + clean up, print a summary, save nothing
npm run ingest -- --pages=2    # quick test: only the first 2 pages
npm run ingest                 # fetch and save everything
npm run ingest -- --limit=100  # Unstop: up to 100 per type instead of the default 60
```

Running it again is safe: rows are updated, not duplicated (`id` is `devpost-<Devpost id>`).

## Automatic daily run (GitHub Actions)

`.github/workflows/ingest.yml` runs `npm run ingest` every day at 00:30 UTC (6:00 am India time). To turn it on, add two
secrets in the GitHub repo (Settings -> Secrets and variables -> Actions -> New repository secret):

- `SUPABASE_URL`: your project URL (same value as `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`: the service_role key

Until both exist the job skips itself (no failure). You can also run it any time from the Actions tab -> Daily ingestion ->
Run workflow. Add the secrets in **one** repo only, or it runs twice. Scheduled runs only start from the default branch, and
GitHub pauses them after 60 days without repository activity.
## What it does

| File | Job |
|---|---|
| `sources/devpost.js` | Reads `devpost.com/api/hackathons` (open + upcoming), one page at a time with a pause |
| `sources/unstop.js` | Reads Unstop's public search API (`/api/public/`, allowed by its robots.txt): hackathons, competitions, quizzes, workshops, internships (60 each by default) |
| `normalize.js` | Raw Devpost item -> `organizers` + `opportunities` rows (also shared helpers) |
| `normalizeUnstop.js` | Same for Unstop. Registration end = deadline; `isPaid` false = free, paid = fee unknown (null); team size, skills, city and logo come from Unstop |
| `interests.js` | Picks app interests from text, using the same keyword list as the relevance score |
| `dedupe.js` | Merges the same event listed twice; flags a deadline conflict (Trust Layer warning) |
| `save.js` | Upserts rows; if a deadline or fee changed, adds a row to `opportunity_changes` (Change Sentinel) |
| `index.js` | Runs the steps in order and prints a summary |

## Rules it follows

- A detail Devpost does not give is `null`, never `""` or `0`. The app then shows "Not listed" and "Check details".
  Exception (product owner decision, 2026-10-09): Devpost gives no entry fee, so `fee` is set to 0 (Free) for Devpost rows.
- Invite-only Devpost hackathons are skipped. Unstop jobs and scholarships are not read (not learning opportunities).
- Unstop does not give the event start date, only the registration window and an end date. `start_date` stays null and the app
  shows "Until <end date>". Level is guessed from the title (beginner/basic/intro, advanced) and is Intermediate otherwise.
- Duplicates: same title + same kind + compatible start month. Within one source the organizer must match too (two companies can
  post an "HR Internship"). The same Unstop event listed under two kinds is read once.
- Interests come from Devpost themes (mapping in `normalize.js`); `level` is Beginner only if the theme "Beginner Friendly"
  is present, otherwise Intermediate. Skills are left empty (Devpost does not list them).
- "Closed" is not stored: the app works it out from the deadline.
- Devpost's JSON is not an official API and can change. If the script breaks, check `sources/devpost.js` first.

## Adding another source

Write `sources/<name>.js` (fetch) and a normalize function that returns `{ opportunity, organizer }`, then add it to
`SOURCES` in `index.js`. Use an id prefix like `unstop-<id>` so rows never collide. Duplicates across sources are merged
by `dedupe.js`.
