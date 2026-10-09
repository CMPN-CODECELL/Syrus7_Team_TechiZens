// Smart ingestion, as the student sees it (POC 1): which opportunities are Closed and which
// details are missing. The ingestion itself (merging duplicates, closing expired events) is backend
// work; these helpers only read whatever data comes back, so they keep working when it is real.

const pad = (n) => String(n).padStart(2, "0")

// Today as "YYYY-MM-DD" in the student's own time zone. Dates in the data are in the same format,
// so they can be compared as plain text.
export function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Closed = the deadline has passed. If there is no deadline, the end date is used instead.
// An opportunity whose deadline is today is still open.
export function isClosed(opportunity, today = todayIso()) {
  const lastDay = opportunity.deadline ?? opportunity.endDate
  return Boolean(lastDay) && lastDay < today
}

// The details a student needs that can come back empty. A missing start date or team size is not
// listed here on purpose: they mean "self-paced" and "individual".
const REQUIRED_DETAILS = [
  { key: "deadline", label: "deadline" },
  { key: "fee", label: "fee" },
  { key: "location", label: "location" },
  { key: "format", label: "format" },
  { key: "theme", label: "theme" },
  { key: "registrationUrl", label: "registration link" },
]

// Names of the required details that are empty, e.g. ["deadline", "fee"]. Note: a fee of 0 is "Free", not missing.
export function getMissingDetails(opportunity) {
  return REQUIRED_DETAILS.filter(({ key }) => opportunity[key] == null || opportunity[key] === "").map(
    ({ label }) => label
  )
}

// True when the student should double-check this opportunity: sources conflict (verified is false)
// or something is missing.
export function needsCheck(opportunity) {
  return !opportunity.verified || getMissingDetails(opportunity).length > 0
}
