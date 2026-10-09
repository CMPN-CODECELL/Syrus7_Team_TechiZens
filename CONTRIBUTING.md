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
- `src/api/squads.js`: `getOptIns`, `optIn`, `optOut`, `getMatches`, `getTeam`, `sendRequest`, `withdrawRequest`
- `src/api/search.js`: `searchWithAI`
- `src/api/saved.js`: `getSavedIds`, `saveOpportunity`, `unsaveOpportunity`
- `src/api/alerts.js`: `getAlerts`, `markAlertRead`, `markAllAlertsRead`
- `src/api/connections.js`: `getConnectionPosts`, `createPost`, `deletePost`, `toggleLike`, `getComments`, `addComment`, `deleteComment`
- `src/api/people.js`: `getConnectedIds`, `getConnections`, `getPerson`, `removeConnection`, `getSuggestions`, `sendConnectionRequest`, `withdrawConnectionRequest`, `getInvitations`, `acceptInvitation`, `ignoreInvitation`

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
    headline: "",            // one line under the name, up to 100 characters ("" if not written yet)
    about: "",               // a short paragraph, up to 300 characters ("" if not written yet)
    skills: ["Python"],      // list of text
    interests: ["Design"],   // list of text, from INTEREST_OPTIONS in src/data/constants.js
    isBeginner: false,
    year: 2,                 // -2 = Class 10th ... 0 = Class 12th, 1-3 = years, 4 = Final year, 5 = Graduated
    location: "Delhi, India", // "City, Country", "" if not chosen yet (an old value like "Delhi" counts as India)
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
  fee,                       // INR, 0 = free, null = not listed
  startDate, endDate,        // "YYYY-MM-DD" or null (self-paced)
  deadline,                  // "YYYY-MM-DD", or null = not listed (see "Missing details" below)
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

**Missing details and Closed events (smart ingestion, POC 1).** These fields may be `null` when the organizer never
listed them: `deadline`, `fee`, `location`, `format`, `theme` and `registrationUrl`. Send `null`, not `""`, `0` or a
made-up value (`fee: 0` means **Free**, so an unknown fee must be `null`). The screens show "Not listed", add a
"Check details" flag, and list what is missing on the detail page. `startDate`/`endDate` = `null` still means
self-paced and `teamSize` = `null` still means individual; those are not "missing".

An opportunity is **Closed** when its `deadline` is before today (or, with no deadline, its `endDate`). The frontend works
this out itself (`src/lib/ingestion.js`), so the backend does **not** need a `closed` field and should keep returning
expired events. Closed ones stay out of the Discover feed and the Squad Hub list, but still open from the Saved list,
posts and profiles, with a disabled Apply button. The real AI search (`searchWithAI`) should leave closed events out too.
Merging cross-posted duplicates is a backend job; the frontend just shows one record.

**Squad Hub** (`src/api/squads.js`; examples in `src/data/mockSquads.js`). The full shapes are written at the top of that file.

```js
// The student opts in per opportunity. role = "leader" | "seeker" | "connect". hoursPerWeek is 3, 6, 10, 15 or 20 (null for connect).
optIn({ opportunityId, role, hoursPerWeek })     optOut(opportunityId)     getOptIns()   // [{ opportunityId, role, hoursPerWeek }]

getMatches(opportunityId)    // null if not opted in, otherwise one of:
//   { role: "leader",  hoursPerWeek, candidates: [{ person, hoursPerWeek, status, contact }] }
//   { role: "seeker",  hoursPerWeek, squads: [{ id, leader, members, capacity, lookingForSkills, hoursPerWeek, status, contact }] }
//   { role: "connect", hoursPerWeek, attendees: [{ person, status, contact }] }
getTeam(opportunityId)       // { members: [{ person, isMe, contact }], capacity, full }, or null (connect mode / no squad yet)

sendRequest(opportunityId, targetId)       // leader invites a candidate; seeker asks to join a squad (targetId = the squad's leader); connect mode asks to connect
withdrawRequest(opportunityId, targetId)
```

`status` is `"none" | "pending" | "mutual"`. **Double opt-in is the privacy rule:** `contact` must be `null` until the status is
`"mutual"` (both students agreed), and only the people who agreed with the student get a contact. A seeker can only have one
open request per opportunity. `capacity` is the opportunity's maximum team size. Return raw data: the screen does the ranking
(skill fit and schedule fit, in `src/lib/squadMatching.js`). The mock makes the other student "agree" 4 seconds after being asked
(except a few who never answer); a real backend should let the other student answer whenever they choose, ideally with a realtime listener.
Suggested tables: `squad_optins`, `squads` and `squad_members`, `squad_requests`, with Row Level Security.

**AI search** (`src/api/search.js`)

```js
searchWithAI({ query, profile })     // async. query = the student's plain-English request; profile = the profile shape above
// returns:
{
  understood: [{ label, dropped }],  // what the AI picked out of the request, shown as chips ("Free", "Online", "This weekend").
                                     // dropped = true if it had to ignore that part to find any results
  message,                           // a short note (what was ignored, or why nothing was found), or null
  results: [{ opportunityId, relevance, reason }],   // best first. relevance 0-100. reason = one short line on why it fits
}
```

Right now this is a rule-based mock (`src/lib/mockSearchParser.js`). The real version should call a backend function
(for example a Supabase Edge Function) that asks an LLM to turn the request into filters or a ranked list, then fills in
the same shape. The LLM key must stay on the server, never in the frontend. Delete `mockSearchParser.js` when that is live.
Example request: "free online coding workshops this weekend". If nothing matches everything, the AI should drop the least
important parts one at a time (dates first) and say so in `message`, as the mock does.

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
  commentCount,                          // comments and replies on this post
}
```

`author.college` can be `null` (profiles have no college field yet). In the mock the logged-in student's author id is `"me"`;
with a real backend, the screens need to know which posts and comments are the logged-in student's own (to show Delete),
so either keep returning a stable marker or tell the frontend dev what to compare against.

**Comment** (each item returned by `getComments`; examples in `src/data/mockComments.js`)

```js
{
  id,
  postId,
  parentId,                              // null for a comment, or the id of the comment it replies to
  author: { id, name, college, year },
  text,
  createdAt,                             // ISO date-time
}
```

Replies sit one level under a comment, like LinkedIn: replying to a reply uses the same `parentId` as that reply.

Functions (all async):

```js
getConnectionPosts()                          // posts from the student's connections plus their own, newest first
createPost({ text, opportunityId })           // opportunityId may be null; returns the new post (type "update")
deletePost(postId)                            // own posts only; also removes its comments
toggleLike(postId)                            // likes, or removes the like if already liked
getComments(postId)                           // all comments and replies on a post, oldest first
addComment({ postId, parentId, text })        // parentId null for a comment; returns the new comment
deleteComment(commentId)                      // own comments only; also removes its replies
```

**Never include contact details** (email, phone, social links) in a post or comment: contacts are only shared after double opt-in.
Limits used by the screens: post text up to 500 characters, comment text up to 300 (enforce them on the server too).
Suggested tables: `connections (user_id, connected_user_id)`, `posts`, `post_likes`, `comments`, all with Row Level Security
(read posts from connections and yourself; delete only your own).

**People and connection requests** (`src/api/people.js`; examples in `src/data/mockPeople.js`)

```js
// Person (never include contact details)
{
  id, name,
  college, year, location,            // year = profile numbers (-2 .. 5); location is "City, Country"
  headline,                           // one line, e.g. "Data science and machine learning enthusiast"
  about,                              // a short paragraph
  interests, skills,                  // lists of text
  connectionCount,                    // shown as "N connections"
}

// Suggestion = Person + a flag
{ ...person, requestSent }            // true if this student already asked to connect

// Connection = Person + when
{ ...person, connectedAt }            // ISO date-time

// Invitation = someone asked to connect with this student
{ id, person, createdAt }

// Profile = what getPerson returns for a profile page
{
  ...person,
  relationship,                       // "connected" | "invited" (they asked this student) | "pending" (this student asked) | "none"
  invitationId,                       // set when relationship is "invited", otherwise null
  connectedAt,                        // set when relationship is "connected", otherwise null
  mutualConnections,                  // list of Person that both students are connected to
}
```

Functions (all async):

```js
getConnectedIds()                    // ids of the students this student is connected to
getConnections()                     // the student's connections (Connection[]), most recently connected first
getPerson(personId)                  // a Profile, or null if there is no such person
removeConnection(personId)           // removes a connection (their posts leave the feed)
getSuggestions()                     // people who are not connected and have not invited this student (the screen ranks them)
sendConnectionRequest(personId)      // creates a pending request
withdrawConnectionRequest(personId)  // cancels it
getInvitations()                     // unanswered invitations received, newest first
acceptInvitation(invitationId)       // makes the sender a connection (their posts then appear in the feed)
ignoreInvitation(invitationId)       // declines it
```

The profile page shows someone's activity (their posts) only if the student is connected to them. It gets this from
`getConnectionPosts()`, which already only returns posts from connections, so the backend does not need an extra function.
The student's own profile is the existing Profile page. It now has an editable `headline` and `about` (see the User shape above),
so the real backend should store them with the rest of the profile and return them from `getCurrentUser`. Other students
see them through `getPerson`. A profile saved before these fields existed may not have them: treat a missing value as `""`.

A request becomes a connection only when the OTHER student accepts it (backend work; in the mock, sent requests just stay pending).
Connecting does NOT share contact details. Those only come after double opt-in in the Squad Hub.
`getConnectionPosts()` must only return posts from the student's connections and the student's own.
Suggested table: `connections (user_id, other_user_id, status)` with status `pending` or `accepted`, with Row Level Security.

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
