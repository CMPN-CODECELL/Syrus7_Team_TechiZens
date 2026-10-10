// ============================================================================
// SWAP POINT: reporting content (owner: backend / Supabase teammate)
//
// A student can report a post, a comment or a profile. Signed in with Supabase the report is saved in the
// `content_reports` table (migration 0019); the grievance officer reads it in the Supabase dashboard.
// Demo mode (no session): the report is kept in this browser only, and the screen says so.
//
// reportContent({ contentType, contentId, reason, note }) -> { ok: boolean, local: boolean }
//   contentType: "post" | "comment" | "profile"
// ============================================================================

import { supabase } from "@/lib/supabase"

const STORAGE_KEY = "nexus-reports"

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// The reasons a student can pick. The database accepts exactly these (see 0019_account_deletion_and_reports.sql).
export const REPORT_REASONS = [
  "Spam or scam",
  "Harassment or hate",
  "Inappropriate content",
  "Pretending to be someone",
  "Shares personal details",
  "Something else",
]

export async function reportContent({ contentType, contentId, reason, note }) {
  const cleanNote = (note ?? "").trim().slice(0, 500)

  if (isConfigured) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      const { error } = await supabase.from("content_reports").insert({
        reporter_id: session.user.id,
        content_type: contentType,
        content_id: String(contentId),
        reason,
        note: cleanNote || null,
      })
      if (error) {
        console.error("Could not send the report:", error.message)
        return { ok: false, local: false }
      }
      return { ok: true, local: false }
    }
  }

  // Demo mode: nobody reads this, so the screen tells the student it stayed in the browser.
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved, { contentType, contentId, reason, note: cleanNote, at: Date.now() }]))
  } catch {
    // Storage unavailable: nothing more to do.
  }
  return { ok: true, local: true }
}
