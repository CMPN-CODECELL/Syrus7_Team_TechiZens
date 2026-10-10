// Turns the filters the AI returned (see supabase/functions/ai-search) into the same "criteria" object the
// rule-based parser makes (src/lib/mockSearchParser.js), so one matcher serves both. Everything is checked
// against our own lists, so a wrong or invented value from the model can never reach the matcher.

import { CATEGORIES, INTEREST_OPTIONS } from "@/data/constants"
import { cityOf } from "@/lib/location"

const FORMATS = ["Online", "In-person", "Hybrid"]
const LEVELS = ["Beginner", "Intermediate", "Advanced"]
const ISO = /^\d{4}-\d{2}-\d{2}$/

const pretty = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })

export function criteriaFromAi(raw, { text, profile }) {
  if (!raw || typeof raw !== "object") return null
  const criteria = { text }

  if (FORMATS.includes(raw.format)) criteria.format = { value: raw.format, label: raw.format }

  const categoryIds = (Array.isArray(raw.categories) ? raw.categories : []).filter((id) => CATEGORIES.some((c) => c.id === id))
  if (categoryIds.length > 0) {
    criteria.categories = {
      ids: categoryIds,
      label: categoryIds.map((id) => CATEGORIES.find((c) => c.id === id).label).join(" / "),
    }
  }

  if (LEVELS.includes(raw.level)) criteria.level = { value: raw.level, label: raw.level }

  const topics = (Array.isArray(raw.topics) ? raw.topics : []).filter((name) => INTEREST_OPTIONS.includes(name))
  if (topics.length > 0) criteria.topics = { interests: topics, label: topics.join(" / ") }

  if (typeof raw.city === "string" && raw.city.trim()) {
    const near = /near me|my city|nearby/i.test(raw.city)
    const city = near ? cityOf(profile.location) : raw.city.trim()
    if (city) criteria.location = { city, label: near ? `Near you (${city})` : city }
  }

  if (raw.team === "solo" || raw.team === "team") criteria.team = { value: raw.team, label: raw.team === "solo" ? "Solo" : "Team" }
  if (raw.eligibleOnly === true) criteria.eligibleOnly = { label: "Eligible for you" }
  if (raw.lowCost === true) criteria.lowCost = { label: "Free / low-cost" }

  if (ISO.test(raw.dateFrom ?? "") && ISO.test(raw.dateTo ?? "") && raw.dateFrom <= raw.dateTo) {
    const label = raw.dateFrom === raw.dateTo ? pretty(raw.dateFrom) : `${pretty(raw.dateFrom)} - ${pretty(raw.dateTo)}`
    criteria.date = { from: raw.dateFrom, to: raw.dateTo, label }
  }
  if (Number.isFinite(raw.deadlineWithinDays) && raw.deadlineWithinDays > 0) {
    const days = Math.min(Math.round(raw.deadlineWithinDays), 90)
    criteria.deadlineWithin = { days, label: days <= 14 ? "Closing soon" : `Closing within ${days} days` }
  }

  const words = (Array.isArray(raw.keywords) ? raw.keywords : [])
    .map((word) => String(word).toLowerCase().trim())
    .filter((word) => word.length >= 2 && word.length <= 30)
    .slice(0, 4)
  if (words.length > 0) criteria.keywords = { words, label: words.join(" ") }

  // Nothing usable came back: let the rule-based reader try instead.
  const meaningful = ["format", "categories", "level", "topics", "location", "team", "eligibleOnly", "lowCost", "date", "deadlineWithin", "keywords"]
  return meaningful.some((key) => criteria[key]) ? criteria : null
}
