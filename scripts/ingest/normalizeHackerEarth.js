// Turns one raw HackerEarth challenge into rows for our database. Same rules as the other sources:
// a detail HackerEarth did not give is `null`, never "" or 0.

import { cleanText, findMissingDetails, guessOrganizerType, slug } from "./normalize.js"
import { inferInterests } from "./interests.js"

const BASE = "https://www.hackerearth.com"

// HackerEarth times are UTC without a zone ("2026-11-13T18:29:00"). Dates are stored as Indian dates,
// like the Unstop rows, so a deadline of 23:59 IST stays on the same day.
function istDate(text) {
  if (!text) return null
  const time = Date.parse(`${text}Z`)
  if (Number.isNaN(time)) return null
  return new Date(time + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function guessLevel(title) {
  if (/\b(beginner|basic|basics|fundamental|fundamentals|intro|introduction|starter|foundation)\b/i.test(title)) return "Beginner"
  if (/\b(advanced|expert|masterclass)\b/i.test(title)) return "Advanced"
  return "Intermediate" // no signal; the column is required
}

// Returns { opportunity, organizer } or null when the challenge should be skipped.
export function normalizeHackerEarth(raw, now = new Date()) {
  // Hiring challenges are job screening, not practical learning (same rule as Unstop's jobs).
  if (raw.type === "Hiring") return null

  const title = cleanText(raw.title)
  if (!title || !raw.url) return null

  // Only challenges that have not ended yet.
  const endDate = istDate(raw.end)
  const today = now.toISOString().slice(0, 10)
  if (!endDate || endDate < today) return null

  // "Competitive" is HackerEarth's word for coding contests, but some are hackathons by title.
  const category = raw.type === "Hackathon" || /hackathon|hack\b/i.test(title) ? "hackathons" : "competitions"

  const organizerName = cleanText(raw.company_name) || "HackerEarth"
  const organizer = {
    id: `hackerearth-org-${slug(organizerName) || "unknown"}`,
    name: organizerName,
    type: guessOrganizerType(organizerName),
    website: BASE,
    logo: raw.image_url || null,
  }

  const url = raw.url.startsWith("http") ? raw.url : `${BASE}${raw.url}`
  const interests = inferInterests(`${title} ${organizerName}`)

  const opportunity = {
    id: `hackerearth-${raw.slug || slug(title)}`,
    title,
    description: `${category === "hackathons" ? "Hackathon" : "Coding challenge"} hosted by ${organizerName} on HackerEarth.`,
    category,
    theme: interests[0] ?? null, // HackerEarth gives no topic, so only a topic found in the title is used
    organizer_id: organizer.id,
    // HackerEarth challenges run on its own platform, so they are online. Its list does not say so
    // explicitly; this is the one assumption made for this source.
    format: "Online",
    location: "Online",
    fee: null, // not listed
    start_date: istDate(raw.start),
    end_date: endDate,
    deadline: endDate, // the challenge's last day
    level: guessLevel(title),
    interests,
    skills: [],
    team_size: null,
    hours_per_week: null,
    min_year: null,
    registration_url: url,
    source_url: url,
    last_verified: now.toISOString(),
    warning: null,
    source: "hackerearth",
  }

  opportunity.verified = findMissingDetails(opportunity).length === 0
  return { opportunity, organizer }
}
