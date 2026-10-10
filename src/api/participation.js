// ============================================================================
// SWAP POINT: events and hackathons the student took part in (owner: backend / Supabase teammate)
//
// Shown on the Profile page, "Activity" tab. It is SELF-DECLARED: Nexus does not verify it, and the screens say so.
// Signed in with Supabase: stored in the `participations` table (migration 0020, a student sees and changes only
// their own rows). Demo mode (no session): kept in this browser's localStorage.
//
// A Participation looks like:
//   { id, opportunityId (or null), title, organizer (or null), category, result, eventDate ("YYYY-MM-DD" or null) }
//   category: "hackathons" | "competitions" | "workshops" | "internships" | "courses" | "other"
//   result:   "participated" | "finalist" | "winner"
// ============================================================================

import { supabase } from "@/lib/supabase"

const STORAGE_KEY = "nexus-participations"

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export const PARTICIPATION_CATEGORIES = [
  { id: "hackathons", label: "Hackathon" },
  { id: "competitions", label: "Competition" },
  { id: "workshops", label: "Workshop" },
  { id: "internships", label: "Internship" },
  { id: "courses", label: "Course" },
  { id: "other", label: "Other" },
]

export const PARTICIPATION_RESULTS = [
  { id: "participated", label: "Participated" },
  { id: "finalist", label: "Finalist" },
  { id: "winner", label: "Winner" },
]

async function currentUserId() {
  if (!isConfigured) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function writeLocal(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage unavailable: the list only lasts for this session.
  }
}

const toItem = (row) => ({
  id: row.id,
  opportunityId: row.opportunity_id ?? null,
  title: row.title,
  organizer: row.organizer ?? null,
  category: row.category,
  result: row.result,
  eventDate: row.event_date ?? null,
})

// Newest event first (events without a date go last).
const byDateDesc = (a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? "")

export async function getParticipations() {
  const userId = await currentUserId()
  if (!userId) return readLocal().sort(byDateDesc)

  const { data, error } = await supabase.from("participations").select("*")
  if (error) {
    console.error("Could not load participations:", error.message)
    return []
  }
  return data.map(toItem).sort(byDateDesc)
}

// Adds one. Returns { ok: true, item } or { ok: false } (for example when the same listing was already added).
export async function addParticipation({ opportunityId = null, title, organizer = null, category, result = "participated", eventDate = null }) {
  const cleanTitle = (title ?? "").trim()
  if (cleanTitle.length < 2) return { ok: false }
  const fields = {
    opportunity_id: opportunityId,
    title: cleanTitle.slice(0, 120),
    organizer: (organizer ?? "").trim().slice(0, 80) || null,
    category,
    result,
    event_date: eventDate || null,
  }

  const userId = await currentUserId()
  if (!userId) {
    const items = readLocal()
    if (opportunityId && items.some((item) => item.opportunityId === opportunityId)) return { ok: false }
    const item = toItem({ id: `local-${Date.now()}`, ...fields })
    writeLocal([...items, item])
    return { ok: true, item }
  }

  const { data, error } = await supabase.from("participations").insert({ user_id: userId, ...fields }).select().single()
  if (error) {
    console.error("Could not add the participation:", error.message)
    return { ok: false }
  }
  return { ok: true, item: toItem(data) }
}

export async function removeParticipation(id) {
  const userId = await currentUserId()
  if (!userId) {
    writeLocal(readLocal().filter((item) => item.id !== id))
    return true
  }
  const { error } = await supabase.from("participations").delete().eq("id", id).eq("user_id", userId)
  if (error) console.error("Could not remove the participation:", error.message)
  return !error
}
