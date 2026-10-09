// ============================================================================
// SWAP POINT: Change Sentinel alerts (owner: backend / Supabase teammate)
//
// In-app alerts that say exactly what changed in a SAVED opportunity's deadline, fee or rules.
// Right now this is fake: alerts come from src/data/mockAlerts.js and "read" is kept in localStorage.
// To go live, replace each body with Supabase (an alerts table filled by change detection,
// optionally with a realtime listener). Keep names, inputs and returned shapes.
//
// An alert looks like:
//   { id, opportunityId, field: "deadline" | "fee" | "rules", oldValue, newValue, changedAt, read }
// oldValue / newValue are ready-to-show text.
// ============================================================================

import { mockAlerts } from "@/data/mockAlerts"
import { getSavedIds } from "@/api/saved"

const STORAGE_KEY = "nexus-alerts-read"

function readIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function writeIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable: read state only lasts for this session.
  }
}

// Alerts for the student's saved opportunities only, newest first.
export async function getAlerts() {
  const saved = await getSavedIds()
  const readAlertIds = readIds()
  return mockAlerts
    .filter((alert) => saved.includes(alert.opportunityId))
    .map((alert) => ({ ...alert, read: readAlertIds.includes(alert.id) }))
    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
}

export async function markAlertRead(alertId) {
  const ids = readIds()
  if (!ids.includes(alertId)) writeIds([...ids, alertId])
}

export async function markAllAlertsRead() {
  writeIds(mockAlerts.map((alert) => alert.id))
}
