-- 0017_opportunities_source.sql
-- Description: Adds a `source` column to opportunities.
-- Reason: The ingestion script (scripts/ingest) saves scraped opportunities. `source` says where a row
-- came from ('devpost', ...) so scraped rows can be told apart from the hand-written seed data (NULL).
-- Safe to run more than once.

alter table public.opportunities
  add column if not exists source text;

create index if not exists idx_opportunities_source on public.opportunities(source);

-- ROLLBACK (only if you need to undo this):
--   drop index if exists public.idx_opportunities_source;
--   alter table public.opportunities drop column if exists source;
