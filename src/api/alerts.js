// ============================================================================
// SWAP POINT: Change Sentinel alerts
//
// In-app alerts that say exactly what changed in a SAVED opportunity's deadline, fee or rules.
// Signed in with Supabase: read from the `my_alerts` view (already limited to the student's saved
// opportunities, newest first). A database trigger adds a row whenever the ingestion changes a deadline
// or fee. "Read" is kept in the `alert_reads` table. Demo mode (no Supabase keys): there are no alerts.
//
// An alert looks like:
//   { id, opportunityId, field: "deadline" | "fee" | "rules", oldValue, newValue, changedAt, read }
// oldValue / newValue are ready-to-show text.
// ============================================================================

import { supabase } from "@/lib/supabase"

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

async function currentUserId() {
  if (!isConfigured) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

// Alerts for the student's saved opportunities only, newest first.
export async function getAlerts() {
  if (!(await currentUserId())) return []

  const { data, error } = await supabase.from("my_alerts").select("*").order("changed_at", { ascending: false })
  if (error) {
    console.error("Could not load alerts:", error.message)
    return []
  }
  return data.map((row) => ({
    id: row.id,
    opportunityId: row.opportunity_id,
    field: row.field,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedAt: row.changed_at,
    read: Boolean(row.read),
  }))
}

// Remembers that these alerts were read (ignores the ones already marked).
async function saveReads(userId, alertIds) {
  if (alertIds.length === 0) return
  const rows = alertIds.map((changeId) => ({ user_id: userId, change_id: changeId }))
  const { error } = await supabase.from("alert_reads").upsert(rows, { onConflict: "user_id,change_id", ignoreDuplicates: true })
  if (error) console.error("Could not save read alerts:", error.message)
}

export async function markAlertRead(alertId) {
  const userId = await currentUserId()
  if (userId) await saveReads(userId, [alertId])
}

export async function markAllAlertsRead() {
  const userId = await currentUserId()
  if (!userId) return
  const unread = (await getAlerts()).filter((alert) => !alert.read).map((alert) => alert.id)
  await saveReads(userId, unread)
}
