import { useEffect, useState } from "react"
import { getAlerts, markAlertRead, markAllAlertsRead } from "@/api/alerts"
import { getSavedIds, saveOpportunity, unsaveOpportunity } from "@/api/saved"
import { useUser } from "@/context/user-context"
import { SavedContext } from "./saved-context"

// Shares the saved opportunities and their alerts with every screen
// (card bookmark, detail page, Alerts page, unread badge in the header).
// All real work happens in src/api/saved.js and src/api/alerts.js.
export function SavedProvider({ children }) {
  const { user } = useUser()
  const userKey = user?.email ?? null
  const [savedIds, setSavedIds] = useState([])
  const [alerts, setAlerts] = useState([])

  // Load when someone logs in (and again if a different person logs in).
  useEffect(() => {
    if (!userKey) return
    let cancelled = false
    Promise.all([getSavedIds(), getAlerts()]).then(([ids, loadedAlerts]) => {
      if (cancelled) return
      setSavedIds(ids)
      setAlerts(loadedAlerts)
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
    await markAllAlertsRead()
  }

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <SavedContext.Provider value={{ savedIds, alerts, unreadCount, toggleSave, markRead, markAllRead }}>
      {children}
    </SavedContext.Provider>
  )
}
