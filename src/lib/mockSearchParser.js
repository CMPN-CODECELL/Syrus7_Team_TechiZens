// MOCK "AI" search: a simple rule-based reader of plain-English requests such as
// "free online coding workshops this weekend". It only exists so the screens can be built
// before the real AI (an LLM running on the backend) is ready. It is used by src/api/search.js
// and can be deleted once that file calls the real thing.
//
// parseQuery(text, { profile, today }) -> criteria (what the student seems to want)
// findMatches(opportunities, criteria, profile) -> { results, droppedKeys }

import { ALL_CITIES } from "@/data/cities"
import { isClosed } from "@/lib/ingestion"
import { cityOf } from "@/lib/location"
import { getEligibility, getRelevance, getSharedWithProfile } from "@/lib/scoring"

const escape = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
// Whole-word match for any of the words (plural "s" allowed for single words).
const wordsRegex = (words) =>
  new RegExp(`\\b(?:${words.map((word) => `${escape(word)}${word.includes(" ") ? "" : "s?"}`).join("|")})\\b`)

// ---- Topic words -> interests ------------------------------------------------
const TOPICS = [
  { label: "Coding", words: ["coding", "programming", "code", "developer", "software"], interests: ["Web Development", "Mobile Apps", "Cloud & DevOps", "AI & Machine Learning", "Cybersecurity"] },
  { label: "Web", words: ["web", "website", "frontend", "front-end", "html", "css", "react", "javascript"], interests: ["Web Development"] },
  { label: "AI & ML", words: ["ai", "ml", "machine learning", "deep learning", "artificial intelligence"], interests: ["AI & Machine Learning"] },
  { label: "Data", words: ["data science", "data", "analytics", "statistics"], interests: ["Data Science"] },
  { label: "Design", words: ["design", "ui", "ux", "figma", "prototype"], interests: ["Design"] },
  { label: "Security", words: ["security", "cyber", "cybersecurity", "hacking", "ctf"], interests: ["Cybersecurity"] },
  { label: "Mobile apps", words: ["mobile", "android", "ios", "flutter", "app"], interests: ["Mobile Apps"] },
  { label: "Cloud", words: ["cloud", "devops", "docker", "aws", "kubernetes"], interests: ["Cloud & DevOps"] },
  { label: "Robotics", words: ["robot", "robotics", "arduino", "automation"], interests: ["Robotics"] },
  { label: "Startups", words: ["startup", "entrepreneur", "entrepreneurship", "pitch", "founder", "business"], interests: ["Entrepreneurship"] },
  { label: "Finance", words: ["finance", "fintech", "investing", "investment", "stocks", "banking"], interests: ["Finance"] },
  { label: "Sustainability", words: ["sustainability", "sustainable", "climate", "green", "environment", "eco"], interests: ["Sustainability"] },
  { label: "Social impact", words: ["social impact", "ngo", "community", "social"], interests: ["Social Impact"] },
]

// ---- Types of opportunity -> category ids -------------------------------------
const CATEGORY_WORDS = [
  { label: "Courses", id: "courses", words: ["course", "class", "lesson", "tutorial"] },
  { label: "Internships", id: "internships", words: ["internship", "intern"] },
  { label: "Hackathons", id: "hackathons", words: ["hackathon", "hack"] },
  { label: "Workshops", id: "workshops", words: ["workshop", "bootcamp"] },
  { label: "Competitions", id: "competitions", words: ["competition", "contest", "challenge"] },
]

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

// Words that carry no meaning for the search.
const FILLER = new Set(
  "a an the for in on at to of and or with find show me give any some that are is i we want need looking look can my please near events event opportunities opportunity things stuff best top recommended relevant good great nice friendly get something anything about around from by be it its this next ones".split(" ")
)

const pad = (n) => String(n).padStart(2, "0")
const toIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

// Reads the text and returns what the student seems to want. Each part also has a `label` for the chips.
export function parseQuery(text, { profile, today = new Date() }) {
  let rest = ` ${text.toLowerCase()} `
  const take = (regex) => {
    const match = rest.match(regex)
    if (match) rest = rest.replace(new RegExp(regex.source, "g"), " ")
    return match
  }

  const criteria = { text }
  const dow = today.getDay() // 0 = Sunday

  // Money: prices are not tracked. Price words are understood but not used to filter (the answer says so).
  const pricePhrase = take(/\b(?:under|below|less than|up to|upto|max|maximum)\s*(?:₹|rs\.?|inr)\s*\d+/)
  const priceWord = take(/\b(?:free|no fee|without fee|paid|cheap|low[- ]cost|affordable|inexpensive|budget)\b/)
  if (pricePhrase || priceWord) criteria.priceIgnored = true

  // Format
  if (take(/\b(?:online|remote|remotely|virtual|virtually|from home)\b/)) criteria.format = { value: "Online", label: "Online" }
  else if (take(/\b(?:in[- ]person|offline|on[- ]campus|on[- ]site|onsite)\b/)) criteria.format = { value: "In-person", label: "In-person" }
  else if (take(/\bhybrid\b/)) criteria.format = { value: "Hybrid", label: "Hybrid" }

  // Type of opportunity (can be several: "hackathons or workshops")
  const categories = CATEGORY_WORDS.filter((category) => take(wordsRegex(category.words)))
  if (categories.length > 0) {
    criteria.categories = { ids: categories.map((c) => c.id), label: categories.map((c) => c.label).join(" / ") }
  }

  // Level
  if (take(/\b(?:beginner[- ]friendly|beginners?|newbies?|starters?|first[- ]time|no experience|new to|novice)\b/)) criteria.level = { value: "Beginner", label: "Beginner" }
  else if (take(/\b(?:advanced|expert|experienced)\b/)) criteria.level = { value: "Advanced", label: "Advanced" }
  else if (take(/\bintermediate\b/)) criteria.level = { value: "Intermediate", label: "Intermediate" }

  // Dates
  if (take(/\b(?:this )?weekend\b|\b(?:this )?(?:saturday|sunday)\b/)) {
    const from = dow === 0 ? today : addDays(today, (6 - dow + 7) % 7)
    const to = dow === 0 ? today : addDays(from, 1)
    criteria.date = { from: toIso(from), to: toIso(to), label: "This weekend" }
  } else if (take(/\btoday\b/)) {
    criteria.date = { from: toIso(today), to: toIso(today), label: "Today" }
  } else if (take(/\btomorrow\b/)) {
    criteria.date = { from: toIso(addDays(today, 1)), to: toIso(addDays(today, 1)), label: "Tomorrow" }
  } else if (take(/\bthis week\b/)) {
    criteria.date = { from: toIso(today), to: toIso(addDays(today, (7 - dow) % 7)), label: "This week" }
  } else if (take(/\bnext week\b/)) {
    const monday = addDays(today, (1 - dow + 7) % 7 || 7)
    criteria.date = { from: toIso(monday), to: toIso(addDays(monday, 6)), label: "Next week" }
  } else if (take(/\bthis month\b/)) {
    criteria.date = { from: toIso(today), to: toIso(new Date(today.getFullYear(), today.getMonth() + 1, 0)), label: "This month" }
  } else if (take(/\bnext month\b/)) {
    const first = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    criteria.date = { from: toIso(first), to: toIso(new Date(first.getFullYear(), first.getMonth() + 1, 0)), label: "Next month" }
  } else {
    const monthIndex = MONTHS.findIndex((name) => take(new RegExp(`\\b(?:in |during )?(?:${name}|${name.slice(0, 3)})\\b`)))
    if (monthIndex >= 0) {
      const year = monthIndex >= today.getMonth() ? today.getFullYear() : today.getFullYear() + 1
      criteria.date = {
        from: toIso(new Date(year, monthIndex, 1)),
        to: toIso(new Date(year, monthIndex + 1, 0)),
        label: MONTHS[monthIndex][0].toUpperCase() + MONTHS[monthIndex].slice(1),
      }
    }
  }
  if (take(/\b(?:closing soon|deadline soon|ending soon|last date|urgent|closes soon)\b/)) {
    criteria.deadlineWithin = { days: 14, label: "Closing soon" }
  }

  // Place
  if (take(/\b(?:near me|nearby|my city|my area|around me)\b/) && cityOf(profile.location)) {
    criteria.location = { city: cityOf(profile.location), label: `Near you (${cityOf(profile.location)})` }
  } else {
    const city = ALL_CITIES.find((c) => take(new RegExp(`\\b${escape(c.name.toLowerCase())}\\b`)))
    if (city) criteria.location = { city: city.name, label: city.name }
  }

  // Team and eligibility
  if (take(/\b(?:solo|individual|alone|by myself)\b/)) criteria.team = { value: "solo", label: "Solo" }
  else if (take(/\b(?:teams?|group|with friends)\b/)) criteria.team = { value: "team", label: "Team" }
  if (take(/\b(?:eligible|can apply|i qualify|qualified|for my year)\b/)) criteria.eligibleOnly = { label: "Eligible for you" }

  // Year of study words ("for final years") are understood but not used to filter; use "eligible" for that
  take(/\b(?:(?:final|last|first|second|third|1st|2nd|3rd|4th)[- ])?years?\b/)

  // Topics
  const topics = TOPICS.filter((topic) => take(wordsRegex(topic.words)))
  if (topics.length > 0) {
    criteria.topics = {
      interests: [...new Set(topics.flatMap((t) => t.interests))],
      label: topics.map((t) => t.label).join(" / "),
    }
  }

  // Whatever is left may be a skill, a college or a company ("python", "iit madras")
  const leftover = rest
    .replace(/[^a-z0-9+#&.\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !FILLER.has(word))
  if (leftover.length > 0) criteria.keywords = { words: leftover, label: leftover.join(" ") }

  return criteria
}

// The order in which parts of a request are dropped when nothing matches all of it.
// Dates and places go first; the topic is dropped last and the type of opportunity never is.
const DROP_ORDER = ["date", "deadlineWithin", "location", "keywords", "eligibleOnly", "team", "level", "format", "topics"]

function matches(opportunity, criteria, active, profile) {
  if (active.has("format") && opportunity.format !== criteria.format.value) return false
  if (active.has("categories") && !criteria.categories.ids.includes(opportunity.category)) return false
  if (active.has("level") && opportunity.level !== criteria.level.value) return false
  if (active.has("topics") && !opportunity.interests.some((i) => criteria.topics.interests.includes(i))) return false
  if (active.has("location") && !(opportunity.location ?? "").toLowerCase().includes(criteria.location.city.toLowerCase())) return false
  if (active.has("team") && (criteria.team.value === "solo") !== (opportunity.teamSize === null)) return false
  if (active.has("eligibleOnly") && !getEligibility(opportunity, profile).qualified) return false
  if (active.has("keywords")) {
    const haystack = [opportunity.title, opportunity.organizer.name, opportunity.theme, ...opportunity.skills, ...opportunity.interests]
      .join(" ")
      .toLowerCase()
    if (!criteria.keywords.words.every((word) => haystack.includes(word))) return false
  }
  if (active.has("date")) {
    const { from, to } = criteria.date
    if (opportunity.startDate) {
      if (!(opportunity.startDate <= to && (opportunity.endDate ?? opportunity.startDate) >= from)) return false
    } else if (opportunity.deadline < from) {
      return false // self-paced, but already closed
    }
  }
  if (active.has("deadlineWithin")) {
    const limit = toIso(addDays(new Date(), criteria.deadlineWithin.days))
    if (!opportunity.deadline || opportunity.deadline > limit || opportunity.deadline < toIso(new Date())) return false
  }
  return true
}

// Finds the opportunities that fit. If none fit everything, parts of the request are dropped
// one by one (see DROP_ORDER) until something fits. Returns the ranked results and what was dropped.
export function findMatches(allOpportunities, criteria, profile) {
  const opportunities = allOpportunities.filter((o) => !isClosed(o)) // closed events are never suggested
  const keys = ["format", "categories", "level", "topics", "location", "team", "eligibleOnly", "keywords", "date", "deadlineWithin"].filter(
    (key) => criteria[key]
  )
  const active = new Set(keys)
  const droppedKeys = []
  let found = opportunities.filter((o) => matches(o, criteria, active, profile))

  for (const key of DROP_ORDER) {
    if (found.length > 0) break
    if (!active.has(key)) continue
    active.delete(key)
    droppedKeys.push(key)
    found = opportunities.filter((o) => matches(o, criteria, active, profile))
  }

  // If every part of the request had to be dropped there is nothing left to match on: no results.
  if (active.size === 0) found = []

  const labels = keys.filter((key) => active.has(key)).map((key) => criteria[key].label)
  const results = found
    .map((opportunity) => {
      const shared = getSharedWithProfile(opportunity, profile)
      return {
        opportunity,
        relevance: getRelevance(opportunity, profile).relevance,
        reason: [...labels, ...(shared.length > 0 ? [`Fits you: ${shared.join(", ")}`] : [])].join(" · "),
      }
    })
    .sort((a, b) => b.relevance - a.relevance || (a.opportunity.deadline ?? "9999").localeCompare(b.opportunity.deadline ?? "9999"))

  return { results, droppedKeys, keys }
}
