# How we work together

Two people, two lanes. Stay in your lane and we will almost never get merge conflicts.

| Lane | Owner | Files they edit |
|---|---|---|
| Frontend (screens and design) | Frontend dev | `src/pages/*`, `src/components/*`, `src/lib/scoring.js` |
| Backend (Supabase and auth) | Backend dev | `src/api/*`, `src/context/UserProvider.jsx`, database, `.env.local` |

If you need a change in the other person's files, ask them (or make a tiny change and say so in the pull request).

## The one important idea: `src/api/`

The screens never talk to Supabase directly. They call two functions:

- `src/api/auth.js`: `getCurrentUser`, `signInWithGoogle`, `signOut`, `saveUser`
- `src/api/opportunities.js`: `getOpportunities`
- `src/api/saved.js`: `getSavedIds`, `saveOpportunity`, `unsaveOpportunity`
- `src/api/alerts.js`: `getAlerts`, `markAlertRead`, `markAllAlertsRead`
- `src/api/connections.js`: `getConnectionPosts`, `toggleLike`

Today these return fake data. **Backend dev:** replace the inside of each function with the Supabase
version, but keep the **function names and the returned shapes** (below). Then the screens keep working
and the frontend dev never has to wait for you.

Install the Supabase library when you start: `npm install @supabase/supabase-js`, then create
`src/lib/supabase.js` that makes the client from `import.meta.env.VITE_SUPABASE_URL` and
`import.meta.env.VITE_SUPABASE_ANON_KEY`.

## Data shapes (the contract)

If a shape needs to change, tell the other person first, because screens depend on it.

**User** (returned by `getCurrentUser` and `signInWithGoogle`, passed to `saveUser`)

```js
{
  name: "Demo Student",
  email: "demo.student@example.com",
  onboarded: false,          // true once the 5-step setup is finished
  profile: {
    skills: ["Python"],      // list of text
    interests: ["Design"],   // list of text, from INTEREST_OPTIONS in src/data/constants.js
    isBeginner: false,
    year: 2,                 // -2 = Class 10th ... 0 = Class 12th, 1-3 = years, 4 = Final year, 5 = Graduated
    location: "Delhi",       // a city name, "" if not chosen yet
    budget: 500,             // INR per opportunity
  },
}
```

**Opportunity** (each item returned by `getOpportunities`; full examples in `src/data/mockOpportunities.js`)

```js
{
  id, title, description,
  category,                  // "courses" | "internships" | "hackathons" | "workshops" | "competitions"
  theme,
  organizer: { name, type, website, logo },   // type: College | Company | Startup | Platform. logo may be null
  format,                    // "Online" | "In-person" | "Hybrid"
  location,
  fee,                       // INR, 0 = free
  startDate, endDate,        // "YYYY-MM-DD" or null (self-paced)
  deadline,                  // "YYYY-MM-DD"
  level,                     // "Beginner" | "Intermediate" | "Advanced"
  interests, skills,         // lists of text
  teamSize,                  // { min, max } or null
  minYear,                   // number (see year above) or null
  registrationUrl, sourceUrl,
  lastVerified,              // ISO date-time
  verified,                  // false = details missing or sources conflict
  warning,                   // text explaining why not verified, or null
}
```

**Saved opportunities** (`src/api/saved.js`)

```js
getSavedIds()                    // -> ["opp-1", "opp-7"]   ids of the logged-in student's saved opportunities
saveOpportunity(opportunityId)   // -> nothing
unsaveOpportunity(opportunityId) // -> nothing
```

Saved opportunities are the ones monitored by Change Sentinel.
Suggested table: `saved_opportunities (user_id, opportunity_id)` with Row Level Security (own rows only).

**Alert** (each item returned by `getAlerts` in `src/api/alerts.js`; examples in `src/data/mockAlerts.js`)

```js
{
  id,
  opportunityId,                          // must be one of the student's saved opportunities
  field,                                  // "deadline" | "fee" | "rules"
  oldValue, newValue,                     // ready-to-show text, e.g. "18 Nov 2026" and "25 Nov 2026"
  changedAt,                              // ISO date-time
  read,                                   // true once the student has seen it
}
```

`getAlerts()` returns only alerts for the student's saved opportunities, newest first.
`markAlertRead(alertId)` and `markAllAlertsRead()` return nothing.
Real change detection (and an optional realtime listener) is backend work.

**Connection post** (each item returned by `getConnectionPosts` in `src/api/connections.js`; examples in `src/data/mockConnectionPosts.js`)

```js
{
  id,
  author: { id, name, college, year },   // year = same numbers as the profile (-2 .. 5)
  type,                                  // "saved" | "recommended" | "looking_for_team" | "update"
  text,                                  // string or null
  opportunityId,                         // the opportunity the post is about, or null
  createdAt,                             // ISO date-time
  likeCount,                             // total likes, including this student's
  likedByMe,                             // boolean
}
```

`getConnectionPosts()` returns posts from the student's connections only, newest first.
`toggleLike(postId)` likes the post, or removes the like if already liked, and returns nothing.
**Never include contact details** (email, phone, social links) in a post: contacts are only shared after double opt-in.
Suggested tables: `connections (user_id, connected_user_id)`, `posts`, `post_likes`, all with Row Level Security.

## Git workflow (the simple version)

**Current agreement (hybrid):** the frontend dev works directly on `main` in small finished steps
(`git pull` first; push only when `npm run lint` and `npm run build` pass). The backend dev works on a branch
and merges `main` into it often. Neither person merges the backend branch into `main` without telling the other.
The steps below are for working on a branch.

1. Never work directly on `main`. Make your own branch:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/your-task-name
   ```
2. Work, then check before you save:
   ```bash
   npm run lint
   npm run build
   ```
3. Save and upload your branch:
   ```bash
   git add -A
   git commit -m "Short clear message about what changed"
   git push -u origin feature/your-task-name
   ```
4. On GitHub, open a **Pull Request** into `main`. The other person looks at it and merges it.
5. Every morning, get the latest `main` into your branch so conflicts stay small:
   ```bash
   git checkout main
   git pull
   git checkout feature/your-task-name
   git merge main
   ```

Branch name ideas: `feature/supabase-auth`, `feature/supabase-opportunities`, `feature/opportunity-detail-page`.

## Database changes (SQL)

Every SQL change is saved as a **numbered file** in `supabase/migrations/` (for example `0003_create_opportunities.sql`).
Never edit a file that has already been run: add a new file with the next number.
Full rules: [supabase/README.md](supabase/README.md).

## Secrets

- Put the Supabase URL and the **anon** key in `.env.local` (copy `.env.example`). It is ignored by git.
- Never commit keys. Never put the Supabase **service role** key in this project, because the frontend is public.
- Share keys privately (a message), never in GitHub.
