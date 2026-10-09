# Nexus

Nexus is a verified opportunity discovery and squad-matching platform for college students.
Built by Team TechiZens for Syrus 2026 (PS3: Intelligent Discovery of Practical Learning Opportunities).

Project rules and the feature list (the POC) are in [AGENTS.md](AGENTS.md).
How we work together is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Run it

You need [Node.js](https://nodejs.org) installed.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

Other commands:

| Command | What it does |
|---|---|
| `npm run lint` | Checks the code for mistakes |
| `npm run build` | Makes the production build |

Right now there is no backend. Login is a demo ("Sign in with Google" signs you in as a demo student)
and the opportunities are fake, so everything runs locally.

## Tech

React, Vite, Tailwind CSS 4, shadcn/ui. Planned backend: Supabase (PostgreSQL, Google OAuth).

## Folder map

```
src/
  api/          The ONLY place that talks to a backend (the backend teammate edits these)
    auth.js           login, logout, saving the profile
    opportunities.js  loading opportunities
  components/   Reusable UI pieces (cards, header, pickers)
    ui/               shadcn components (generated, avoid editing)
  context/      Shares "who is logged in" with every screen (useUser)
  data/
    constants.js      Fixed lists (categories, interests, empty profile)
    cities.js         Indian cities for the location picker
    mockOpportunities.js  Fake opportunities, deleted once Supabase is live
  lib/          Plain helper functions
    scoring.js        Relevance and eligibility calculation
  pages/        One file per screen (Login, Onboarding, Discover, Profile, ...)
```
