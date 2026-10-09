# AGENTS.md

## Project Overview

Project Name: Nexus

Nexus is a verified opportunity discovery and squad-matching platform for college students.

The project is being developed for the Syrus 2026 hackathon by Team TechiZens.

The frontend is being developed before the backend is ready. Until the backend is available, the frontend should use mock/static data while keeping the structure ready for later backend integration.

---

## Source of Truth

The uploaded Nexus POC is the primary source of truth for the project's features and functionality.

DO NOT add, remove, replace, or change any feature described in the POC unless the user explicitly asks for that change.

Do not invent additional product features.

Do not remove features simply because they are difficult to implement on the frontend.

If something is unclear, ask the user instead of making a product decision independently.

---

## Problem Statement

PS3: Intelligent Discovery of Practical Learning Opportunities.

Students currently manually search platforms such as LinkedIn, event platforms, and college notice boards. Listings can be inconsistent, duplicated, and may omit eligibility, deadlines, or location.

Nexus is intended to reduce opportunity fatigue and help students discover relevant practical learning opportunities.

---

## Core Product

Nexus helps students:

1. Discover practical learning opportunities.
2. Evaluate opportunities using relevance and eligibility.
3. Understand why an opportunity is recommended.
4. See trustworthy and verified opportunity information.
5. Find and connect with suitable peers/squads.

---

## POC Features

The frontend must represent the following POC features.

### 1. Smart Ingestion

Opportunity information includes:

- Title
- Theme
- Dates
- Deadlines
- Format
- Location
- Fees
- Team limits
- Registration link

Cross-posted duplicates are merged.

Expired events are closed.

Missing details are flagged.

Note: The actual ingestion/backend pipeline will be implemented separately. The frontend should display the resulting data.

---

### 2. Trust Layer

Opportunity cards must support:

- Warning banners when sources conflict.
- Source link.
- "Last Verified" timestamp.

The interface should make stale or conflicting information visible to students.

---

### 3. Decoupled Scoring

Relevance and eligibility are separate concepts.

Relevance:

- Displayed as a score/percentage.
- Explains why the opportunity is relevant.

Eligibility:

- Qualified
- Disqualified

If a student is disqualified, the frontend must show the reason.

Example:

"Requires final-year standing; your profile says 2nd year."

Do not invent or hide eligibility information.

---

### 4. Discovery Feed

The discovery feed is ranked using:

- Skills
- Interests
- Weekly bandwidth
- Budget

The feed must support these POC filters:

- Beginner-Friendly
- Online
- Free/Low-Cost
- Sustainability & Social Impact

The interface must also support conversational AI search.

Example:

"free online coding workshops this weekend"

Each result should explain its relevance.

---

### 5. Participation Cheat Sheet

Each opportunity must have an accessible summary containing:

- Prerequisites/setup
- Key milestones
- Deliverable checklist

---

### 6. Squad Hub

Squad Hub supports voluntary peer matching.

Leaders can see:

- Top 3-5 opted-in candidates.

Solo seekers can see:

- Top 5 best-fit squads.

Matching is ranked using:

- Skill fit
- Schedule fit

Squad Hub also supports a lightweight "Connect" mode for workshops.

---

### 7. Privacy and Handoff

Contacts are revealed only after double opt-in.

When a team is full, users can use:

- Copy Roster

Users apply on the organizer's website.

Nexus does NOT automatically apply to opportunities.

Nexus does NOT access private LinkedIn information.

---

### 8. Change Sentinel

Saved opportunities can be monitored for changes.

The interface must support in-app alerts explaining exactly what changed in:

- Deadlines
- Fees
- Rules

---

## Student Profile

The POC describes a short student profile containing:

- Skills
- Interests
- Year
- Location
- Weekly hours
- Budget

The frontend should use these fields when representing the student's profile and opportunity matching.

Note (user decision): Weekly hours is NOT collected in onboarding or used in relevance scoring for now.
It will return in the team-building (Squad Hub) section.

---

## Frontend Technology

The POC specifies:

- React
- Vite
- Tailwind CSS

The current project uses:

- React
- Vite
- JavaScript
- ESLint
- Tailwind CSS 4
- shadcn/ui components (in `src/components/ui`, generated; avoid hand-editing)

Backend technology from the POC:

- Supabase
- PostgreSQL
- Google OAuth
- Realtime listeners

The backend is NOT ready yet.

Do not implement backend-dependent functionality as if a real backend already exists.

Use mock/static data for frontend development where necessary.

---

## Current Development Stage

The live status (what is built, what is left, and the decisions made so far) is in
`docs/PROJECT_STATUS.md`. Read it before starting work and update it when you finish something.

Summary:

- Frontend runs locally with mock data (login is a demo, opportunities are fake).
- Built: login page, 5-step onboarding, Discover feed with category cards and filters,
  opportunity cards with organizer logos, Profile page with editable interests.
- Placeholder pages only: Cheat Sheets, Squad Hub, Alerts (Change Sentinel).
- Backend (Supabase and Google OAuth) is being built by a teammate behind `src/api/`.
- Two people work in parallel: one on the frontend, one on Supabase and auth.
  See `CONTRIBUTING.md` for the file ownership split and git workflow.

---

## Git Rules

Before major changes:

1. Check `git status`.
2. Make changes.
3. Test the frontend.
4. Review the changes.
5. Commit with a clear message.
6. Push to GitHub.

Do not commit `node_modules`.

Do not expose secrets, API keys, credentials, or private configuration files.

---

## Development Rules

Keep the frontend:

- Simple
- Minimalist
- Clean
- Responsive
- Easy to understand
- Beginner-friendly to maintain

Do not unnecessarily over-engineer the frontend.

Prefer simple React components and clear folder structures.

Do not introduce unnecessary libraries unless they are actually required.

---

## Design Rules

The visual design should remain minimalist and professional.

Do not add decorative UI that does not serve a POC feature.

Do not change the functionality of the POC to make the design easier.

Design decisions should support clarity and usability.

The interface should work on desktop and mobile.

---

## Backend Integration Rule

The frontend is being built before the backend.

Mock data should be structured in a way that can later be replaced with API/Supabase data without rebuilding the entire UI.

Do not tightly couple components to mock data.

Keep data structures clear and reusable.

All backend access goes through `src/api/auth.js` and `src/api/opportunities.js`. Screens and components must never import Supabase directly. The data shapes are documented in `CONTRIBUTING.md`; do not change them without telling the team.

---

## AI Development Rule

AI-assisted development is allowed for implementation.

However:

- Do not invent features.
- Do not silently change requirements.
- Do not remove POC functionality.
- Do not rewrite working code unnecessarily.
- Explain important architectural changes to the user.
- When requirements are ambiguous, ask the user.

The user is a beginner, so instructions and changes should be explained clearly and simply.

---

## Keeping context up to date

These files are the shared memory of the project. Any person or AI tool (Claude, Antigravity, others) must
keep them current:

- `docs/PROJECT_STATUS.md`: update the done/left lists and add important decisions.
- `CONTRIBUTING.md`: update the data shapes if they change (and tell the other developer).
- This file: only change it when project rules change.

---

## Important Instruction

The POC is the source of truth.

When implementing the Nexus frontend, always compare the implementation against the POC features before deciding that the frontend is complete.