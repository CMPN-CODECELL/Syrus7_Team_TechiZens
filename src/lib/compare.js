// "Compare hackathons": scores several opportunities for THIS student on five things and names the best pick.
// Plain functions, no backend. Every number comes with a short plain-language note, so the result is explainable.
//
//   interests  40%   how well it matches the student's interests and skills (same score as the Discover card)
//   location   20%   online, in the student's city, hybrid, or somewhere else
//   cost       15%   free, a known fee, or not listed (an unknown fee is neutral, never "free")
//   level      10%   fits the student's level (beginners prefer beginner-friendly events)
//   time       15%   enough days left to apply
// A closed opportunity scores 0 and a "Not eligible" one is capped, so neither can be the best pick.

import { isClosed, todayIso } from "@/lib/ingestion"
import { parseLocation } from "@/lib/location"
import { daysBetween } from "@/lib/reminders"
import { getEligibility, getRelevance } from "@/lib/scoring"

export const MAX_COMPARE = 4
export const LOW_COST_MAX = 500 // rupees, for the Free / Low-Cost filter

export const CRITERIA = [
  { id: "interests", label: "Interests", weight: 40 },
  { id: "location", label: "Location", weight: 20 },
  { id: "cost", label: "Cost", weight: 15 },
  { id: "level", label: "Level", weight: 10 },
  { id: "time", label: "Time to apply", weight: 15 },
]

function locationFit(opportunity, profile) {
  if (opportunity.format === "Online") return { score: 100, note: "Online, no travel" }
  const place = (opportunity.location ?? "").trim()
  if (!place) return { score: 40, note: "Location not listed" }
  const city = parseLocation(profile.location).city
  if (city && place.toLowerCase().includes(city.toLowerCase())) return { score: 100, note: `In your city (${city})` }
  if (opportunity.format === "Hybrid") return { score: 70, note: `Hybrid, ${place}` }
  return { score: 30, note: `In person, ${place}` }
}

function costFit(opportunity) {
  const fee = opportunity.fee
  if (fee === null || fee === undefined) return { score: 50, note: "Fee not listed" }
  if (fee === 0) return { score: 100, note: "Free (as listed)" }
  if (fee <= LOW_COST_MAX) return { score: 70, note: `Low cost (₹${fee})` }
  return { score: 30, note: `Costs ₹${fee}` }
}

function levelFit(opportunity, profile) {
  const level = opportunity.level ?? "Intermediate"
  if (profile.isBeginner) {
    if (level === "Beginner") return { score: 100, note: "Beginner-friendly" }
    if (level === "Intermediate") return { score: 60, note: "Intermediate level" }
    return { score: 20, note: "Advanced level" }
  }
  if (level === "Beginner") return { score: 60, note: "Beginner level" }
  return { score: 90, note: `${level} level` }
}

function timeFit(opportunity, today) {
  if (!opportunity.deadline) return { score: 50, note: "Deadline not listed" }
  const days = daysBetween(today, opportunity.deadline)
  if (days < 0) return { score: 0, note: "Closed" }
  if (days <= 1) return { score: 40, note: days === 0 ? "Closes today" : "Closes tomorrow" }
  if (days < 7) return { score: 75, note: `${days} days left` }
  return { score: 100, note: `${days} days left` }
}

// Scores one opportunity. Returns { opportunity, total, criteria, eligible, closed }.
export function scoreForCompare(opportunity, profile, today = todayIso()) {
  const { relevance, reason } = getRelevance(opportunity, profile)
  const eligibility = getEligibility(opportunity, profile)
  const closed = isClosed(opportunity, today)

  const criteria = {
    interests: { score: relevance, note: reason.split(" · ")[0] },
    location: locationFit(opportunity, profile),
    cost: costFit(opportunity),
    level: levelFit(opportunity, profile),
    time: timeFit(opportunity, today),
  }

  const weighted = CRITERIA.reduce((sum, { id, weight }) => sum + criteria[id].score * weight, 0) / 100
  let total = Math.round(weighted)
  if (!eligibility.qualified) total = Math.min(total, 20)
  if (closed) total = 0

  return { opportunity, total, criteria, eligible: eligibility.qualified, eligibilityReason: eligibility.reason, closed }
}

// Compares a list. `bestId` is the best eligible, open opportunity (or null when there is none), and `verdict`
// is one plain sentence saying why.
export function compareOpportunities(opportunities, profile, today = todayIso()) {
  const rows = opportunities.map((opportunity) => scoreForCompare(opportunity, profile, today))
  const candidates = rows.filter((row) => row.eligible && !row.closed).sort((a, b) => b.total - a.total)
  const best = candidates[0] ?? null

  let verdict = "None of these can be recommended: they are closed or you are not eligible."
  if (best) {
    const strongest = CRITERIA.map(({ id, label }) => ({ label, ...best.criteria[id] }))
      .filter((item) => item.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.note.toLowerCase())
    const why = strongest.length > 0 ? `: ${strongest.join(", ")}` : ""
    const second = candidates[1]
    const margin = second ? ` (${best.total} vs ${second.total} for the next best)` : ""
    verdict = `${best.opportunity.title} fits you best${why}${margin}.`
  }
  return { rows, bestId: best?.opportunity.id ?? null, verdict }
}
