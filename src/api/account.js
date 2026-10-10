// ============================================================================
// SWAP POINT: deleting the account (owner: backend / Supabase teammate)
//
// "Delete my account" on the Profile page. Signed in with Supabase it calls the database function
// `delete_my_account()` (migration 0019), which deletes the student's login; the profile and everything
// linked to it go with it. Demo mode: only this browser's saved data is cleared.
//
// deleteMyAccount() -> true when the account (or the demo data) is gone, false when it could not be deleted.
// The caller signs the student out afterwards.
// ============================================================================

import { supabase } from "@/lib/supabase"

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Everything Nexus keeps in this browser starts with "nexus-". The cookie-notice flag is kept so it does not nag again.
function clearBrowserData() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("nexus-") && key !== "nexus-notice-dismissed")
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

export async function deleteMyAccount() {
  if (isConfigured) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      const { error } = await supabase.rpc("delete_my_account")
      if (error) {
        console.error("Could not delete the account:", error.message)
        return false
      }
    }
  }

  clearBrowserData()
  return true
}
