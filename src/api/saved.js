// ============================================================================
// SWAP POINT: saved opportunities
//
// Which opportunities the logged-in student saved. Saved opportunities are the ones
// monitored by Change Sentinel (see alerts.js).
// Signed in with Supabase: stored in the `saved_opportunities` table (Row Level Security: a student
// only sees and changes their own rows). Demo mode (no Supabase keys): kept in this browser's localStorage.
// ============================================================================

import { supabase } from "@/lib/supabase"

const STORAGE_KEY = "nexus-saved"

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// The signed-in student's id, or null in demo mode / when nobody is signed in.
async function currentUserId() {
  if (!isConfigured) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

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

// Returns a list of opportunity ids, e.g. ["devpost-30992", "unstop-1768097"].
export async function getSavedIds() {
  const userId = await currentUserId()
  if (!userId) return read()

  const { data, error } = await supabase.from("saved_opportunities").select("opportunity_id")
  if (error) {
    console.error("Could not load saved opportunities:", error.message)
    return []
  }
  return data.map((row) => row.opportunity_id)
}

export async function saveOpportunity(opportunityId) {
  const userId = await currentUserId()
  if (!userId) {
    const ids = read()
    if (!ids.includes(opportunityId)) write([...ids, opportunityId])
    return
  }

  const { error } = await supabase
    .from("saved_opportunities")
    .upsert({ user_id: userId, opportunity_id: opportunityId }, { onConflict: "user_id,opportunity_id", ignoreDuplicates: true })
  if (error) console.error("Could not save the opportunity:", error.message)
}

export async function unsaveOpportunity(opportunityId) {
  const userId = await currentUserId()
  if (!userId) {
    write(read().filter((id) => id !== opportunityId))
    return
  }

  const { error } = await supabase
    .from("saved_opportunities")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
  if (error) console.error("Could not unsave the opportunity:", error.message)
}
