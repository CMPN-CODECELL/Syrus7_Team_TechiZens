import { useEffect, useMemo, useState } from "react"
import { getAlerts, markAlertRead, markAllAlertsRead } from "@/api/alerts"
import { getOpportunities } from "@/api/opportunities"
import { getSavedIds, saveOpportunity, unsaveOpportunity } from "@/api/saved"
import { useUser } from "@/context/user-context"
import { getReminders } from "@/lib/reminders"
import { SavedContext } from "./saved-context"

// Which reminders the student dismissed, kept in this browser (a reminder has no database row: it is worked out
// from the saved list and the deadlines). Starts with "nexus-" so "Delete my account" clears it.
const readKey = (userKey) => `nexus-reminders-read:${userKey}`

function loadReadReminders(userKey) {
  try {
    return JSON.parse(localStorage.getItem(readKey(userKey))) ?? []
  } catch {
    return []
  }
}

function saveReadReminders(userKey, keys) {
  try {
    localStorage.setItem(readKey(userKey), JSON.stringify(keys))
  } catch {
    // Storage unavailable: a dismissed reminder comes back after a reload.
  }
}

// Shares the saved opportunities and their alerts with every screen
// (card bookmark, detail page, Alerts page, unread badge in the header).
// All real work happens in src/api/saved.js and src/api/alerts.js.
export function SavedProvider({ children }) {
  const { user } = useUser()
  const userKey = user?.email ?? null
  const [savedIds, setSavedIds] = useState([])
  const [alerts, setAlerts] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [readReminders, setReadReminders] = useState([])

  // Load when someone logs in (and again if a different person logs in).
  useEffect(() => {
    if (!userKey) return
    let cancelled = false
    Promise.all([getSavedIds(), getAlerts(), getOpportunities()]).then(([ids, loadedAlerts, loadedOpportunities]) => {
      if (cancelled) return
      setSavedIds(ids)
      setAlerts(loadedAlerts)
      setOpportunities(loadedOpportunities)
      setReadReminders(loadReadReminders(userKey))
    })
    return () => {
      cancelled = true
    }
  }, [userKey])

  // Save or unsave. The screen updates at once; alerts are reloaded because they
  // only exist for saved opportunities.
  async function toggleSave(opportunityId) {
    const isSaved = savedIds.includes(opportunityId)
    setSavedIds(isSaved ? savedIds.filter((id) => id !== opportunityId) : [...savedIds, opportunityId])
    await (isSaved ? unsaveOpportunity(opportunityId) : saveOpportunity(opportunityId))
    setAlerts(await getAlerts())
  }

  async function markRead(alertId) {
    setAlerts((current) => current.map((a) => (a.id === alertId ? { ...a, read: true } : a)))
    await markAlertRead(alertId)
  }

  async function markAllRead() {
    setAlerts((current) => current.map((a) => ({ ...a, read: true })))
    markAllRemindersRead()
    await markAllAlertsRead()
  }

  // Deadline reminders: saved opportunities that close within a week, until the student dismisses them.
  const reminders = useMemo(
    () => getReminders(opportunities, savedIds).map((reminder) => ({ ...reminder, read: readReminders.includes(reminder.key) })),
    [opportunities, savedIds, readReminders]
  )

  function markReminderRead(key) {
    const next = [...new Set([...readReminders, key])]
    setReadReminders(next)
    saveReadReminders(userKey, next)
  }

  function markAllRemindersRead() {
    const next = [...new Set([...readReminders, ...reminders.map((r) => r.key)])]
    setReadReminders(next)
    saveReadReminders(userKey, next)
  }

  const unreadCount = alerts.filter((a) => !a.read).length + reminders.filter((r) => !r.read).length

  return (
    <SavedContext.Provider value={{ savedIds, alerts, reminders, unreadCount, toggleSave, markRead, markAllRead, markReminderRead }}>
      {children}
    </SavedContext.Provider>
  )
}
