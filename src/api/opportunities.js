// ============================================================================
// SWAP POINT: opportunities (owner: backend / Supabase teammate)
//
// The whole app gets opportunities through this one function.
// Right now it returns fake data. To go live, replace the body with a Supabase
// query that returns the SAME shape (see "Data shapes" in CONTRIBUTING.md).
// The screens do not need to change.
// ============================================================================

import { mockOpportunities } from "@/data/mockOpportunities"

// Returns a list of opportunities. Always async, because a real backend is async.
export async function getOpportunities() {
  // TODO (Supabase): const { data, error } = await supabase.from("opportunities").select("*, organizer:organizers(*)")
  return mockOpportunities
}
