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

// ---- Relevance --------------------------------------------------------------------------------
// A 0-100 score plus a plain-language reason (POC "Decoupled Scoring": eligibility is separate).
//
// Step 1, topic fit (0 to 1): how well the opportunity matches what the student cares about.
//   interests  75%   how many of YOUR interests it covers (two or more = full marks)
//   skills     25%   whether it uses skills you have (left out when the opportunity lists none,
//                    so an opportunity with no skills is not punished for it)
// An opportunity that says nothing about its topic gets a neutral 40%: below a real partial
// match (50%), above a clear mismatch (0%).
// Step 2, practical fit: the topic score is reduced when the opportunity is over your budget
// (x0.5) or, for beginners, too advanced (Intermediate x0.85, Advanced x0.6). An unlisted fee
// changes nothing. Free or beginner-level never adds points; it only avoids a reduction.
// The result is 10 to 100, so a card never shows 0%. Weekly hours will come back with the
// team-building section.

const INTEREST_SHARE = 0.75
const SKILL_SHARE = 0.25
const UNKNOWN_TOPIC_FIT = 0.4
const MIN_SCORE = 10
const OVER_BUDGET_FACTOR = 0.5
const LEVEL_FACTOR_FOR_BEGINNERS = { Beginner: 1, Intermediate: 0.85, Advanced: 0.6 }

// Words that suggest an interest. Used only to read the title and theme of opportunities that
// do not list their interests (most scraped ones). Words of 5+ letters match as a word start
// ("robot" finds "robotics"); shorter ones must match the whole word ("ai" must not find "maintain").
const INTEREST_KEYWORDS = {
  "Web Development": ["web", "website", "frontend", "backend", "full stack", "fullstack", "react", "html", "css"],
  "AI & Machine Learning": ["ai", "ml", "artificial intelligence", "machine learning", "deep learning", "llm", "gpt", "generative", "genai", "neural", "nlp"],
  "Data Science": ["data", "analytics", "statistics", "sql", "visualization"],
  Design: ["design", "ux", "ui", "figma", "creative"],
  Cybersecurity: ["security", "cyber", "hacking", "ctf", "privacy", "encryption"],
  "Mobile Apps": ["mobile", "android", "ios", "flutter", "react native"],
  "Cloud & DevOps": ["cloud", "devops", "aws", "azure", "kubernetes", "docker", "serverless"],
  Robotics: ["robot", "robotics", "iot", "arduino", "drone", "hardware"],
  Entrepreneurship: ["startup", "entrepreneur", "venture", "pitch", "founder"],
  Finance: ["finance", "fintech", "payments", "banking", "blockchain", "crypto", "trading"],
  Sustainability: ["sustainab", "climate", "green", "energy", "environment", "waste"],
  "Social Impact": ["social", "impact", "community", "nonprofit", "education", "health", "ngo"],
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// True when `word` appears in `text` as a whole word, or (for 5+ letters) as the start of a word.
function hasWord(text, word) {
  const end = word.length >= 5 ? "" : "(?![a-z0-9])"
  return new RegExp(`(?<![a-z0-9])${escapeRegExp(word.toLowerCase())}${end}`).test(text.toLowerCase())
}

// Interests from the opportunity's own list, plus the ones its title and theme point to.
function getTopics(opportunity) {
  const text = `${opportunity.title ?? ""} ${opportunity.theme ?? ""}`
  const fromText = Object.entries(INTEREST_KEYWORDS)
    .filter(([, words]) => words.some((word) => hasWord(text, word)))
    .map(([interest]) => interest)
  return [...new Set([...(opportunity.interests ?? []), ...fromText])]
}

export function getRelevance(opportunity, profile) {
  const profileInterests = profile.interests ?? []
  const profileSkills = profile.skills ?? []
  const listedInterests = opportunity.interests ?? []
  const listedSkills = opportunity.skills ?? []

  // Interests: how many of the student's interests does the opportunity cover?
  const matchedInterests = overlap(getTopics(opportunity), profileInterests)
  const wanted = Math.min(profileInterests.length, 2)
  const topicKnown = listedInterests.length > 0 || getTopics(opportunity).length > 0
  let interestFit
  if (wanted > 0 && matchedInterests.length > 0) interestFit = Math.min(matchedInterests.length / wanted, 1)
  else if (topicKnown && wanted > 0) interestFit = 0
  else interestFit = UNKNOWN_TOPIC_FIT // topic not listed, or the student has not chosen interests yet

  // Skills: judged from the listed skills, or (when none are listed) from skill names in the title.
  let matchedSkills = overlap(listedSkills, profileSkills)
  let skillFit = null
  if (listedSkills.length > 0) {
    skillFit = Math.min(matchedSkills.length / Math.min(listedSkills.length, 2), 1)
  } else {
    matchedSkills = profileSkills.filter((skill) => hasWord(`${opportunity.title ?? ""} ${opportunity.theme ?? ""}`, skill))
    if (matchedSkills.length > 0) skillFit = 1
  }

  // Step 1: topic fit. Without a skills signal the interests count for everything.
  const topicFit = skillFit == null ? interestFit : INTEREST_SHARE * interestFit + SKILL_SHARE * skillFit

  // Step 2: practical fit. Only known facts reduce the score.
  const overBudget = opportunity.fee != null && profile.budget != null && opportunity.fee > profile.budget
  const budgetFactor = overBudget ? OVER_BUDGET_FACTOR : 1
  const levelFactor = profile.isBeginner ? (LEVEL_FACTOR_FOR_BEGINNERS[opportunity.level] ?? 1) : 1

  const raw = MIN_SCORE + (100 - MIN_SCORE) * topicFit * budgetFactor * levelFactor
  const relevance = Math.min(100, Math.max(MIN_SCORE, Math.round(raw)))

  // Short, plain reasons so cards stay uncluttered.
  const reasons = []
  const matches = [...matchedInterests, ...matchedSkills]
  if (matches.length > 0) reasons.push(`Matches ${matches.join(", ")}`)
  else if (!topicKnown) reasons.push("Topic not listed")
  else if (wanted === 0) reasons.push("Add interests to your profile for a better match")
  else reasons.push("No match with your profile")
  if (profile.isBeginner && opportunity.level === "Beginner") reasons.push("beginner-friendly")
  if (profile.isBeginner && opportunity.level === "Advanced") reasons.push("advanced level")
  if (opportunity.fee == null) reasons.push("fee not listed")
  else if (overBudget) reasons.push("above your budget")

  return { relevance, reason: reasons.join(" · ") }
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
