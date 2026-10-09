// Relevance and eligibility are separate (POC "Decoupled Scoring").
// These are plain functions so they can later be replaced by backend results.

export const LOW_COST_LIMIT = 500 // INR

export const YEAR_OPTIONS = [
  { value: 1, label: "1st year" },
  { value: 2, label: "2nd year" },
  { value: 3, label: "3rd year" },
  { value: 4, label: "Final year" },
]

export function yearLabel(year) {
  return YEAR_OPTIONS.find((option) => option.value === year)?.label ?? "unknown year"
}

function overlap(a, b) {
  const lowerB = b.map((item) => item.toLowerCase())
  return a.filter((item) => lowerB.includes(item.toLowerCase()))
}

// Relevance: a 0-100 score plus a plain-language reason.
// Ranked by skills, interests, weekly bandwidth and budget.
export function getRelevance(opportunity, profile) {
  const matchedInterests = overlap(opportunity.interests, profile.interests)
  const matchedSkills = overlap(opportunity.skills, profile.skills)

  const interestFit = matchedInterests.length / Math.min(opportunity.interests.length, 2)
  const skillFit = matchedSkills.length / Math.max(opportunity.skills.length, 1)
  const budgetFit = opportunity.fee <= profile.budget ? 1 : 0
  const hoursFit = opportunity.hoursPerWeek <= profile.hoursPerWeek ? 1 : 0

  const score =
    50 * Math.min(interestFit, 1) + 20 * Math.min(skillFit, 1) + 15 * budgetFit + 15 * hoursFit

  // Short, plain reasons so cards stay uncluttered.
  const reasons = []
  const matches = [...matchedInterests, ...matchedSkills]
  if (matches.length > 0) reasons.push(`Matches ${matches.join(", ")}`)
  else reasons.push("No match with your profile")
  if (budgetFit === 0) reasons.push("above your budget")
  if (hoursFit === 0) reasons.push("needs more hours")

  return { relevance: Math.round(score), reason: reasons.join(" · ") }
}

// Eligibility: Qualified or Disqualified, always with a reason when disqualified.
export function getEligibility(opportunity, profile) {
  if (opportunity.minYear && profile.year < opportunity.minYear) {
    return {
      qualified: false,
      reason: `Requires ${yearLabel(opportunity.minYear).toLowerCase()} standing; your profile says ${yearLabel(profile.year).toLowerCase()}.`,
    }
  }
  return { qualified: true, reason: "" }
}

export function isLowCost(opportunity) {
  return opportunity.fee <= LOW_COST_LIMIT
}

export function isSustainability(opportunity) {
  return opportunity.interests.some(
    (interest) => interest === "Sustainability" || interest === "Social Impact"
  )
}

export function costLabel(fee) {
  if (fee === 0) return "Free"
  return `₹${fee}`
}
