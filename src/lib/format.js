// Small helpers for showing dates and counts as text.

const SHORT = { day: "numeric", month: "short" }
const LONG = { day: "numeric", month: "short", year: "numeric" }

export function formatDate(isoDate, { year = false } = {}) {
  return new Date(isoDate).toLocaleDateString("en-IN", year ? LONG : SHORT)
}

// "12 Dec - 14 Dec 2026", "12 Dec 2026" (one day), or "Self-paced".
export function formatDateRange(startDate, endDate) {
  if (!startDate) return "Self-paced"
  if (!endDate || endDate === startDate) return formatDate(startDate, { year: true })
  return `${formatDate(startDate)} - ${formatDate(endDate, { year: true })}`
}

export function formatTeamSize(teamSize) {
  if (!teamSize) return "Individual"
  if (teamSize.min === teamSize.max) return `${teamSize.max} members`
  return `${teamSize.min}-${teamSize.max} members`
}

// How many whole days ago a date-time was.
export function daysSince(isoDateTime, now) {
  return Math.floor((now - new Date(isoDateTime).getTime()) / 86400000)
}

export function formatDaysAgo(days) {
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

// Details not re-checked for this many days are shown as possibly out of date.
export const STALE_AFTER_DAYS = 14
