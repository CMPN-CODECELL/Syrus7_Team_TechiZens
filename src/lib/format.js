// Small helpers for showing dates and counts as text.

import { yearLabel } from "@/lib/scoring"

const SHORT = { day: "numeric", month: "short" }
const LONG = { day: "numeric", month: "short", year: "numeric" }

export function formatDate(isoDate, { year = false } = {}) {
  return new Date(isoDate).toLocaleDateString("en-IN", year ? LONG : SHORT)
}

// "12 Dec - 14 Dec 2026", "12 Dec 2026" (one day), or "Self-paced".
export function formatDateRange(startDate, endDate) {
  // No start date but an end date (some scraped events): show when it ends instead of "Self-paced".
  if (!startDate && endDate) return `Until ${formatDate(endDate, { year: true })}`
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

// "just now", "5 min ago", "3 h ago", "2 days ago". `now` is a timestamp in milliseconds.
export function formatTimeAgo(isoDateTime, now) {
  const minutes = Math.floor((now - new Date(isoDateTime).getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return formatDaysAgo(Math.floor(hours / 24))
}

// Up to two capital letters for a person's avatar, e.g. "Priya Nair" -> "PN".
export function personInitials(name) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// "BITS Pilani · 2nd year". Profiles may have no college yet, so empty parts are left out.
export function personDetails(person) {
  return [person.college, yearLabel(person.year)].filter(Boolean).join(" · ")
}
