// Filters and sort options for the Discover feed. Plain functions, so they are easy to test.

import { LOW_COST_MAX } from "@/lib/compare"
import { isoDaysFromToday, needsCheck, todayIso } from "@/lib/ingestion"
import { cityOf } from "@/lib/location"
import { isSustainability } from "@/lib/scoring"

// The POC filters (the Free / Low-Cost one was removed by the product owner on 2026-10-09: prices are not tracked). Each test gets the opportunity and the student's profile.
export const FILTERS = [
  { id: "beginner", label: "Beginner-Friendly", test: (o) => o.level === "Beginner" },
  { id: "online", label: "Online / Remote", test: (o) => o.format === "Online" },
  // Only listings that state a fee can match: an unlisted fee is unknown, not free.
  { id: "lowcost", label: "Free / Low-Cost", test: (o) => o.fee !== null && o.fee !== undefined && o.fee <= LOW_COST_MAX },
  { id: "sustainability", label: "Sustainability & Social Impact", test: isSustainability },
]

// Extra filters (added at the product owner's request on 2026-10-09), behind "More filters".
export const MORE_FILTERS = [
  {
    id: "closingSoon",
    label: "Closing in 7 days",
    test: (o) => Boolean(o.deadline) && o.deadline >= todayIso() && o.deadline <= isoDaysFromToday(7),
  },
  { id: "inPerson", label: "In-person or hybrid", test: (o) => o.format === "In-person" || o.format === "Hybrid" },
  {
    id: "myCity",
    label: "In my city",
    test: (o, profile) =>
      Boolean(cityOf(profile.location)) && (o.location ?? "").toLowerCase().includes(cityOf(profile.location).toLowerCase()),
  },
  { id: "team", label: "Team events", test: (o) => o.teamSize != null },
  { id: "verified", label: "Verified only", test: (o) => !needsCheck(o) },
]
export const ALL_FILTERS = [...FILTERS, ...MORE_FILTERS]

// Sort options. Best match puts eligible ones first. Ties fall back to best match, then the nearest deadline. Missing values go last.
const byDeadline = (a, b) => (a.opportunity.deadline ?? "9999").localeCompare(b.opportunity.deadline ?? "9999")
const byRelevance = (a, b) => b.relevance - a.relevance
// Ones the student can enter come before ones they cannot (only when the listing states a requirement).
const byEligible = (a, b) => Number(b.eligibility?.qualified ?? true) - Number(a.eligibility?.qualified ?? true)
export const SORTS = [
  { id: "match", label: "Best match", compare: (a, b) => byEligible(a, b) || byRelevance(a, b) || byDeadline(a, b) },
  { id: "soonest", label: "Deadline: soonest", compare: (a, b) => byDeadline(a, b) || byRelevance(a, b) },
  {
    id: "latest",
    label: "Deadline: latest",
    compare: (a, b) =>
      (b.opportunity.deadline ?? "").localeCompare(a.opportunity.deadline ?? "") || byRelevance(a, b),
  },
]
