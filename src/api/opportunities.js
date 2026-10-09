// ============================================================================
// SWAP POINT: opportunities (owner: backend / Supabase teammate)
//
// Fetches opportunities from Supabase with organizer relations.
// Preserves the exact Opportunity shape documented in CONTRIBUTING.md.
// ============================================================================

import { mockOpportunities } from "@/data/mockOpportunities"
import { supabase } from "@/lib/supabase"

const isConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Returns a list of opportunities. Always async.
export async function getOpportunities() {
  if (!isConfigured) {
    return mockOpportunities
  }

  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*, organizer:organizers(*)")

    if (error) {
      console.error("Error fetching opportunities from Supabase:", error.message)
      return mockOpportunities
    }

    if (!data || data.length === 0) {
      return mockOpportunities
    }

    // Map database snake_case columns to camelCase Opportunity data shape
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      theme: row.theme,
      organizer: {
        name: row.organizer?.name || "Organizer",
        type: row.organizer?.type || "Platform",
        website: row.organizer?.website || "",
        logo: row.organizer?.logo || null,
      },
      format: row.format,
      location: row.location,
      fee: row.fee,
      startDate: row.start_date,
      endDate: row.end_date,
      deadline: row.deadline,
      level: row.level,
      interests: row.interests || [],
      skills: row.skills || [],
      teamSize: row.team_size,
      minYear: row.min_year,
      registrationUrl: row.registration_url,
      sourceUrl: row.source_url,
      lastVerified: row.last_verified,
      verified: Boolean(row.verified),
      warning: row.warning,
      hoursPerWeek: row.hours_per_week,
    }))
  } catch (err) {
    console.error("Error in getOpportunities:", err)
    return mockOpportunities
  }
}
