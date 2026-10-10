// Nexus ingestion: fetch opportunities from the web, clean them up, and save them to Supabase.
//
//   npm run ingest -- --dry-run     fetch and clean up, print a summary, save nothing
//   npm run ingest                  fetch, clean up and save to Supabase
//   npm run ingest -- --pages=2     only read the first 2 pages of each source (quick test)
//   npm run ingest -- --limit=100   Unstop: read up to 100 opportunities per type (default 60)
//
// Needs scripts/ingest/.env with SUPABASE_SERVICE_ROLE_KEY (see .env.example) when saving.

import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { fetchDevpost } from "./sources/devpost.js"
import { fetchUnstop } from "./sources/unstop.js"
import { fetchHackerEarth } from "./sources/hackerearth.js"
import { fetchMlh } from "./sources/mlh.js"
import { normalizeDevpost, findMissingDetails } from "./normalize.js"
import { normalizeUnstop } from "./normalizeUnstop.js"
import { normalizeHackerEarth } from "./normalizeHackerEarth.js"
import { normalizeMlh } from "./normalizeMlh.js"
import { mergeDuplicates } from "./dedupe.js"
import { saveAll } from "./save.js"

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const pagesArg = args.find((arg) => arg.startsWith("--pages="))
const maxPages = pagesArg ? Number(pagesArg.split("=")[1]) : undefined
const limitArg = args.find((arg) => arg.startsWith("--limit="))
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined

// Load scripts/ingest/.env, then fall back to the app's .env.local for the project URL.
// (loadEnvFile never overrides a variable that is already set.)
for (const file of [join(here, ".env"), join(here, "..", "..", ".env.local")]) {
  if (existsSync(file)) process.loadEnvFile(file)
}

// Add new sources here: { name, fetch, normalize }.
const SOURCES = [
  { name: "Devpost", fetch: fetchDevpost, normalize: normalizeDevpost },
  { name: "Unstop", fetch: fetchUnstop, normalize: normalizeUnstop },
  { name: "HackerEarth", fetch: fetchHackerEarth, normalize: normalizeHackerEarth },
  { name: "MLH", fetch: fetchMlh, normalize: normalizeMlh },
]

async function main() {
  const now = new Date()
  const items = []

  for (const source of SOURCES) {
    console.log(`Fetching ${source.name}...`)
    const raw = await source.fetch({ maxPages, limit })
    let skipped = 0
    for (const entry of raw) {
      const item = source.normalize(entry, now)
      if (item) items.push(item)
      else skipped++
    }
    console.log(`  ${raw.length} fetched, ${skipped} skipped (invite-only or not usable)`)
  }

  const { items: finalItems, merged, pairs } = mergeDuplicates(items)
  const rows = finalItems.map((item) => item.opportunity)

  const missingCounts = {}
  for (const row of rows) {
    for (const key of findMissingDetails(row)) missingCounts[key] = (missingCounts[key] ?? 0) + 1
  }
  console.log("\nSummary")
  console.log(`  opportunities:        ${rows.length} (${merged} duplicates merged)`)
  for (const pair of pairs) console.log(`    merged ${pair}`)
  console.log(`  flagged "check":      ${rows.filter((row) => !row.verified).length}`)
  console.log(`  missing details:      ${JSON.stringify(missingCounts)}`)

  if (dryRun) {
    console.log("\nDry run: nothing was saved. First two opportunities:\n")
    console.log(JSON.stringify(rows.slice(0, 2), null, 2))
    return
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (and the project URL). See scripts/ingest/.env.example.")
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const result = await saveAll(supabase, finalItems)
  console.log(
    `\nSaved: ${result.created} new, ${result.updated} updated, ${result.changed} with a new deadline or fee (alerts are logged by the database), ${result.organizers} organizers.`
  )
}

main().catch((err) => {
  console.error(`\nIngestion failed: ${err.message}`)
  process.exit(1)
})
