// ============================================================================
// SWAP POINT: opportunities (owner: backend / Supabase teammate)
//
// Fetches opportunities from Supabase with organizer relations.
// Preserves the exact Opportunity shape documented in CONTRIBUTING.md.
// There is no mock fallback: without Supabase (or when the query fails) the list is empty.
// ============================================================================

import { supabase } from "@/lib/supabase"

const isConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Returns a list of opportunities. Always async.
export async function getOpportunities() {
  if (!isConfigured) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*, organizer:organizers(*)")

    if (error) {
      console.error("Error fetching opportunities from Supabase:", error.message)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Map database columns to the exact Opportunity data shape in CONTRIBUTING.md.
    // Missing details (fee, deadline, location, format, theme, registrationUrl) MUST be null, not "" or 0.
    // A fee of 0 means Free; an unknown fee is null.
    // Expired events are returned as-is without a "closed" field (frontend derives Closed from deadline).
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      theme: row.theme !== null && row.theme !== undefined && row.theme !== "" ? row.theme : null,
      organizer: {
        name: row.organizer?.name || "Organizer",
        type: row.organizer?.type || "Platform",
        website: row.organizer?.website || "",
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
      registrationUrl:
        row.registration_url !== null && row.registration_url !== undefined && row.registration_url !== ""
          ? row.registration_url
          : null,
      sourceUrl: row.source_url || null,
      lastVerified: row.last_verified,
      verified: Boolean(row.verified),
      warning: row.warning || null,
      hoursPerWeek: row.hours_per_week !== null && row.hours_per_week !== undefined ? row.hours_per_week : null,
    }))
  } catch (err) {
    console.error("Error in getOpportunities:", err)
    return []
  }
}
