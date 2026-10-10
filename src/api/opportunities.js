// ============================================================================
// SWAP POINT: opportunities (owner: backend / Supabase teammate)
//
// Fetches opportunities from Supabase with organizer relations.
// Preserves the exact Opportunity shape documented in CONTRIBUTING.md.
// There is no mock fallback: without Supabase (or when the query fails) the list is empty.
// ============================================================================

import { supabase } from "@/lib/supabase"
import { safeHttpUrl } from "@/lib/url"

const isConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Supabase returns at most 1000 rows per request, so the table is read in pages of this size.
const PAGE_SIZE = 1000
// Most screens ask for the list; sharing one download for a short while saves a full table read per screen.
const CACHE_MS = 60_000

let cache = null // { at: timestamp, promise }

async function fetchAllRows() {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    // A stable order is needed, otherwise pages could overlap or skip rows.
    const { data, error } = await supabase
      .from("opportunities")
      .select("*, organizer:organizers(*)")
      .order("id")
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...data)
    if (data.length < PAGE_SIZE) return rows
  }
}

// Some scraped organizers have no real name ("n/a", "localhost-nyc"). Show the platform it came from instead.
const JUNK_ORGANIZER = /^(n\/?a|none|null|undefined|unknown|tests?|localhost.*|[-.\s]*)$/i
const PLATFORM_NAMES = { devpost: "Devpost", unstop: "Unstop" }

function organizerName(row) {
  const name = (row.organizer?.name ?? "").trim()
  if (name && !JUNK_ORGANIZER.test(name)) return name
  return PLATFORM_NAMES[row.source] ?? "Organizer"
}

function toOpportunities(rows) {
  // Map database columns to the exact Opportunity data shape in CONTRIBUTING.md.
  // Missing details (fee, deadline, location, format, theme, registrationUrl) MUST be null, not "" or 0.
  // A fee of 0 means Free; an unknown fee is null.
  // Expired events are returned as-is without a "closed" field (frontend derives Closed from deadline).
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    theme: row.theme !== null && row.theme !== undefined && row.theme !== "" ? row.theme : null,
    organizer: {
      name: organizerName(row),
      type: row.organizer?.type || "Platform",
      website: safeHttpUrl(row.organizer?.website) || "",
      logo: row.organizer?.logo || null,
    },
    format: row.format !== null && row.format !== undefined && row.format !== "" ? row.format : null,
    location: row.location !== null && row.location !== undefined && row.location !== "" ? row.location : null,
    fee: row.fee !== null && row.fee !== undefined ? row.fee : null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    deadline: row.deadline || null,
    level: row.level,
    interests: row.interests || [],
    skills: row.skills || [],
    teamSize: row.team_size || null,
    minYear: row.min_year !== null && row.min_year !== undefined ? row.min_year : null,
    registrationUrl: safeHttpUrl(row.registration_url),
    sourceUrl: safeHttpUrl(row.source_url),
    source: row.source || null, // "devpost" | "unstop" | ... (see src/lib/sources.js)
    lastVerified: row.last_verified,
    verified: Boolean(row.verified),
    warning: row.warning || null,
    hoursPerWeek: row.hours_per_week !== null && row.hours_per_week !== undefined ? row.hours_per_week : null,
  }))
}

// Returns a list of opportunities. Always async. { force: true } skips the short-lived cache (Refresh button).
export async function getOpportunities({ force = false } = {}) {
  if (!isConfigured) {
    return []
  }

  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.promise
  }

  const promise = fetchAllRows()
    .then(toOpportunities)
    .catch((err) => {
      console.error("Error fetching opportunities from Supabase:", err.message)
      if (cache?.promise === promise) cache = null // never keep a failed load
      return []
    })
  cache = { at: Date.now(), promise }
  return promise
}
