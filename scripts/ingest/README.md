# Ingestion script (Smart Ingestion, POC 1)

Fetches real opportunities from the web, cleans them up and saves them to Supabase. The app does not change:
it keeps reading the `opportunities` table through `src/api/opportunities.js`.

```
Devpost (public JSON) -> normalize.js -> dedupe.js -> save.js -> Supabase -> the app
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
```

Running it again is safe: rows are updated, not duplicated (`id` is `devpost-<Devpost id>`).

## What it does

| File | Job |
|---|---|
| `sources/devpost.js` | Reads `devpost.com/api/hackathons` (open + upcoming), one page at a time with a pause |
| `normalize.js` | Raw Devpost item -> `organizers` + `opportunities` rows |
| `dedupe.js` | Merges the same event listed twice; flags a deadline conflict (Trust Layer warning) |
| `save.js` | Upserts rows; if a deadline or fee changed, adds a row to `opportunity_changes` (Change Sentinel) |
| `index.js` | Runs the steps in order and prints a summary |

## Rules it follows

- A detail Devpost does not give is `null`, never `""` or `0`. The app then shows "Not listed" and "Check details".
  Exception (product owner decision, 2026-10-09): Devpost gives no entry fee, so `fee` is set to 0 (Free) for Devpost rows.
- Invite-only hackathons are skipped.
- Interests come from Devpost themes (mapping in `normalize.js`); `level` is Beginner only if the theme "Beginner Friendly"
  is present, otherwise Intermediate. Skills are left empty (Devpost does not list them).
- "Closed" is not stored: the app works it out from the deadline.
- Devpost's JSON is not an official API and can change. If the script breaks, check `sources/devpost.js` first.

## Adding another source

Write `sources/<name>.js` (fetch) and a normalize function that returns `{ opportunity, organizer }`, then add it to
`SOURCES` in `index.js`. Use an id prefix like `unstop-<id>` so rows never collide. Duplicates across sources are merged
by `dedupe.js`.
