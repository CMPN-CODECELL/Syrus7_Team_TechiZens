// Relevance and eligibility are separate (POC "Decoupled Scoring").
// These are plain functions so they can later be replaced by backend results.

export const LOW_COST_LIMIT = 500 // INR

// Values are ordered so that a higher number means further along (used for eligibility).
export const YEAR_OPTIONS = [
  { value: -2, label: "Class 10th" },
  { value: -1, label: "Class 11th" },
  { value: 0, label: "Class 12th" },
  { value: 1, label: "1st year" },
  { value: 2, label: "2nd year" },
  { value: 3, label: "3rd year" },
  { value: 4, label: "Final year" },
  { value: 5, label: "Graduated" },
]

export function yearLabel(year) {
  return YEAR_OPTIONS.find((option) => option.value === year)?.label ?? "unknown year"
}

// Items of `a` that also appear in `b` (ignoring upper/lower case).
export function overlap(a, b) {
  const lowerB = b.map((item) => item.toLowerCase())
  return a.filter((item) => lowerB.includes(item.toLowerCase()))
}

// Relevance: a 0-100 score plus a plain-language reason.
// Ranked by interests, skills, budget and (for beginners) level.
// Weekly hours will come back with the team-building section.
export function getRelevance(opportunity, profile) {
  const matchedInterests = overlap(opportunity.interests, profile.interests)
  const matchedSkills = overlap(opportunity.skills, profile.skills)

  const interestFit = matchedInterests.length / Math.min(opportunity.interests.length, 2)
  const skillFit = matchedSkills.length / Math.max(opportunity.skills.length, 1)
  // A fee that is not listed gets half credit: we cannot say it fits the budget, or that it does not.
  const feeUnknown = opportunity.fee == null
  const budgetFit = feeUnknown ? 0.5 : opportunity.fee <= profile.budget ? 1 : 0
  // Beginners prefer beginner-level opportunities; everyone else is neutral.
  const levelFit = !profile.isBeginner ? 1 : { Beginner: 1, Intermediate: 0.5, Advanced: 0 }[opportunity.level]

  const score =
    50 * Math.min(interestFit, 1) +
    15 * Math.min(skillFit, 1) +
    20 * budgetFit +
    15 * levelFit

  // Short, plain reasons so cards stay uncluttered.
  const reasons = []
  const matches = [...matchedInterests, ...matchedSkills]
  if (matches.length > 0) reasons.push(`Matches ${matches.join(", ")}`)
  else reasons.push("No match with your profile")
  if (profile.isBeginner && opportunity.level === "Beginner") reasons.push("beginner-friendly")
  if (profile.isBeginner && opportunity.level === "Advanced") reasons.push("advanced level")
  if (feeUnknown) reasons.push("fee not listed")
  else if (budgetFit === 0) reasons.push("above your budget")

  return { relevance: Math.round(score), reason: reasons.join(" · ") }
}

// Eligibility: Eligible or Not eligible, always with a reason when not eligible.
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
  return opportunity.fee != null && opportunity.fee <= LOW_COST_LIMIT
}

export function isSustainability(opportunity) {
  return opportunity.interests.some(
    (interest) => interest === "Sustainability" || interest === "Social Impact"
  )
}

// "Free" or "₹300". Returns null when the fee is not listed (the screens show "Not listed").
export function costLabel(fee) {
  if (fee == null) return null
  if (fee === 0) return "Free"
  return `₹${fee}`
}

// What a person has in common with the student: shared interests and shared skills.
export function getSharedWithProfile(person, profile) {
  return [...overlap(person.interests, profile.interests), ...overlap(person.skills, profile.skills)]
}
