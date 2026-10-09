// ============================================================================
// SWAP POINT: saved opportunities (owner: backend / Supabase teammate)
//
// Which opportunities the logged-in student saved. Saved opportunities are the ones
// monitored by Change Sentinel (see alerts.js).
// Right now this is fake: ids kept in this browser's localStorage.
// To go live, replace each body with Supabase (e.g. a saved_opportunities table with
// user_id + opportunity_id, protected by Row Level Security). Keep names and return values.
// ============================================================================

const STORAGE_KEY = "nexus-saved"

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function write(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable: saving only lasts for this session.
  }
}

// Returns a list of opportunity ids, e.g. ["opp-1", "opp-7"].
export async function getSavedIds() {
  return read()
}

export async function saveOpportunity(opportunityId) {
  const ids = read()
  if (!ids.includes(opportunityId)) write([...ids, opportunityId])
}

export async function unsaveOpportunity(opportunityId) {
  write(read().filter((id) => id !== opportunityId))
}
