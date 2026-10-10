// Deadline reminders for SAVED opportunities (POC "Change Sentinel" companion). Plain functions, no backend:
// a reminder is worked out from the saved list and each opportunity's deadline.

import { isClosed, todayIso } from "@/lib/ingestion"

// Reminders start this many days before the deadline.
export const REMINDER_WINDOW_DAYS = 7

// Whole days from `from` to `to`, both "YYYY-MM-DD" (so 0 = the same day, 1 = tomorrow).
export function daysBetween(from, to) {
  const toTime = (iso) => {
    const [year, month, day] = iso.split("-").map(Number)
    return Date.UTC(year, month - 1, day)
  }
  return Math.round((toTime(to) - toTime(from)) / 86400000)
}

// The three steps a reminder goes through. Moving to a closer step shows the reminder again,
// even if the student dismissed the earlier one.
function tierOf(daysLeft) {
  if (daysLeft <= 1) return 1
  if (daysLeft <= 3) return 3
  return REMINDER_WINDOW_DAYS
}

// "Closes today", "Closes tomorrow", "Closes in 3 days".
export function reminderText(daysLeft) {
  if (daysLeft <= 0) return "Closes today"
  if (daysLeft === 1) return "Closes tomorrow"
  return `Closes in ${daysLeft} days`
}

// Reminders for the saved opportunities whose deadline is within the window, closest first.
// Each is { key, opportunityId, deadline, daysLeft }. `key` changes when the deadline or the step changes,
// which is what "dismissed" is remembered by.
export function getReminders(opportunities, savedIds, today = todayIso()) {
  const saved = new Set(savedIds)
  return opportunities
    .filter((opportunity) => saved.has(opportunity.id) && opportunity.deadline && !isClosed(opportunity, today))
    .map((opportunity) => ({
      opportunityId: opportunity.id,
      deadline: opportunity.deadline,
      daysLeft: daysBetween(today, opportunity.deadline),
    }))
    .filter((reminder) => reminder.daysLeft >= 0 && reminder.daysLeft <= REMINDER_WINDOW_DAYS)
    .map((reminder) => ({ ...reminder, key: `${reminder.opportunityId}|${reminder.deadline}|${tierOf(reminder.daysLeft)}` }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
}
