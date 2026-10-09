# Database (Supabase)

All SQL for the project lives in `supabase/migrations/` as **numbered files**.
This is the history of the database. If it is not in a file here, it does not exist for the team.

## Rules

1. **Every SQL change is a file.** Tables, columns, policies (RLS), functions, seed data: all of it.
   Never run SQL in the Supabase dashboard without also saving it here.
2. **Name:** a 4-digit number, then a short description.
   ```
   0001_create_profiles.sql
   0002_create_organizers.sql
   0003_create_opportunities.sql
   0004_enable_rls_policies.sql
   0005_seed_opportunities.sql
   ```
3. **One topic per file**, numbered in the order they must run.
4. **Never edit a file that has already been run.** To change something, add a new file with the next number
   (for example `0006_add_saved_opportunities.sql`).
5. **Start each file with a comment**: what it does and why.
6. **Mention the new file in your commit message** and in `docs/PROJECT_STATUS.md`.
7. Before opening a pull request, check that running all files from `0001` upward on an empty
   Supabase project works.

## Data shapes

The tables must match the shapes in [CONTRIBUTING.md](../CONTRIBUTING.md) ("Data shapes"),
because the frontend depends on them. Seed data can be taken from `src/data/mockOpportunities.js`.

## Running a file

Open the Supabase dashboard, go to **SQL Editor**, paste the file's contents and run it.
(If the team later adopts the Supabase CLI, the same files can be used with small name changes.)
