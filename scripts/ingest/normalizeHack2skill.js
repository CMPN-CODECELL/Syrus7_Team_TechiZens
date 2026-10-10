// Turns one raw Hack2skill event into rows for our database. Same rules as the other sources:
// a detail Hack2skill did not give is `null`, never "" or 0.
//
// The public list gives the title, mode (virtual / in person / hybrid), ticket type, team size and the registration
// window, but no description, organizer, topic or event dates, so those stay empty rather than guessed.

import { ALL_CITIES } from "../../src/data/cities.js"
import { cleanText, findMissingDetails, guessOrganizerType } from "./normalize.js"
import { inferInterests } from "./interests.js"

const SITE = "https://hack2skill.com"
const MODE = { VIRTUAL: "Online", IN_PERSON: "In-person", HYBRID: "Hybrid" }

// Times are UTC ("2026-10-11T18:29:00.000Z"). Dates are stored as Indian dates, like the other sources.
function istDate(text) {
  if (!text) return null
  const time = Date.parse(text)
  if (Number.isNaN(time)) return null
  return new Date(time + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// What kind of opportunity this is, from the title (Hack2skill does not say).
function guessCategory(title) {
  if (/hackathon|\bhack\b|hackfest|buildathon|\w+thon\b/i.test(title)) return "hackathons"
  if (/\b(wars|cup|challenge|contest|pitch|league|championship)\b|promptwars|pitchfest/i.test(title)) return "competitions"
  if (/bootcamp|workshop|masterclass|training|academy|build with|pop-?up|summit|meetup|session/i.test(title)) return "workshops"
  return "competitions" // anything else Hack2skill runs is a contest of some kind
}

function guessLevel(title) {
  if (/\b(beginner|basic|basics|fundamental|fundamentals|intro|introduction|starter|foundation)\b/i.test(title)) return "Beginner"
  if (/\b(advanced|expert|masterclass)\b/i.test(title)) return "Advanced"
  return "Intermediate" // no signal; the column is required
}

// A city named in the title ("Build with Gemini - Hyderabad"), only for events that are not online.
function cityInTitle(title) {
  const lower = title.toLowerCase()
  const city = ALL_CITIES.find((c) => c.country === "India" && new RegExp(`\\b${c.name.toLowerCase()}\\b`).test(lower))
  return city ? `${city.name}, India` : null
}

const CATEGORY_LABEL = { hackathons: "Hackathon", workshops: "Workshop", competitions: "Competition" }

// Returns { opportunity, organizer } or null when the event should be skipped.
export function normalizeHack2skill(raw, now = new Date()) {
  const title = cleanText(raw.title)
  if (!title || !raw.eventUrl || raw.status !== "APPROVED") return null

  // Only events that can still be registered for. The registration end is the deadline.
  const deadline = istDate(raw.registrationEnd)
  const today = now.toISOString().slice(0, 10)
  if (!deadline || deadline < today) return null

  const organizerName = "Hack2skill"
  const organizer = {
    id: "hack2skill-org-hack2skill",
    name: organizerName,
    type: guessOrganizerType(organizerName),
    website: SITE,
    logo: null, // the listing's picture is the event's banner, not the organizer's logo
  }

  const category = guessCategory(title)
  const format = MODE[raw.tags?.mode?.value] ?? null
  const location = format === "Online" ? "Online" : format ? cityInTitle(title) : null

  // Only a real team (max above 1) is stored; null means individual (same rule as Unstop).
  const teamTag = raw.tags?.teamSize
  const maxTeam = Number(teamTag?.max) || 1
  const team_size = maxTeam > 1 ? { min: Number(teamTag.min) || 1, max: maxTeam } : null

  const url = raw.customEventUrl || `${SITE}/event/${raw.eventUrl}`
  const interests = inferInterests(title)

  const opportunity = {
    id: `hack2skill-${raw.eventUrl}`,
    title,
    description: `${CATEGORY_LABEL[category]} on Hack2skill.`,
    category,
    theme: interests[0] ?? null, // Hack2skill gives no topic, so only a topic found in the title is used
    organizer_id: organizer.id,
    format,
    location,
    fee: raw.tags?.ticket?.value === "FREE" ? 0 : null, // a paid ticket's price is not listed
    start_date: null, // the list has the registration window, not the event's own dates
    end_date: deadline,
    deadline,
    level: guessLevel(title),
    interests,
    skills: [],
    team_size,
    hours_per_week: null,
    min_year: null,
    registration_url: url,
    source_url: url,
    last_verified: now.toISOString(),
    warning: null,
    source: "hack2skill",
  }

  opportunity.verified = findMissingDetails(opportunity).length === 0
  return { opportunity, organizer }
}
