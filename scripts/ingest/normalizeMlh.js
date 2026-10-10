// Turns one raw MLH event into rows for our database. Same rules as the other sources:
// a detail MLH did not give is `null`, never "" or 0.

import { cleanText, findMissingDetails } from "./normalize.js"
import { inferInterests } from "./interests.js"

const FORMAT = { physical: "In-person", digital: "Online", online: "Online", hybrid: "Hybrid", hybrid_physical: "Hybrid", hybrid_digital: "Hybrid" }

const countryName = (() => {
  try {
    const names = new Intl.DisplayNames(["en"], { type: "region" })
    return (code) => (code ? names.of(code) : null)
  } catch {
    return (code) => code ?? null
  }
})()

const dateOnly = (text) => (/^\d{4}-\d{2}-\d{2}/.test(text ?? "") ? text.slice(0, 10) : null)

// "Chapel Hill, North Carolina" + "US" -> "Chapel Hill, North Carolina, United States".
function placeOf(raw) {
  const address = raw.venueAddress ?? {}
  const city = cleanText(address.city)
  const state = cleanText(address.state)
  const country = countryName(address.country)
  const parts = [city, state && state !== city ? state : null, country].filter(Boolean)
  if (parts.length > 0) return parts.join(", ")
  return cleanText(raw.location) || null
}

// Returns { opportunity, organizer } or null when the event should be skipped.
export function normalizeMlh(raw, now = new Date()) {
  const title = cleanText(raw.name)
  if (!title || !raw.slug) return null

  const endDate = dateOnly(raw.endsAt)
  if (!endDate || endDate < now.toISOString().slice(0, 10)) return null // already over

  // MLH lists the league's events, not who runs each one, so the organizer is MLH itself.
  const organizer = {
    id: "mlh-org-major-league-hacking",
    name: "Major League Hacking",
    type: "Platform",
    website: "https://mlh.io",
    logo: null,
  }

  const format = FORMAT[raw.formatType] ?? null
  const place = placeOf(raw)
  const focus = (raw.customFields?.hackathon_focus ?? []).map(cleanText).filter(Boolean)
  const interests = inferInterests(`${title} ${focus.join(" ")}`)
  const url = raw.websiteUrl || `https://mlh.io/seasons/${raw._season}/events`

  const opportunity = {
    id: `mlh-${raw.slug}`,
    title,
    description: `${format === "Online" ? "Online hackathon" : "Hackathon"}${place && format !== "Online" ? ` in ${place}` : ""}, part of the Major League Hacking ${raw._season} season.`,
    category: "hackathons",
    theme: focus[0] ?? interests[0] ?? null,
    organizer_id: organizer.id,
    format,
    location: format === "Online" ? "Online" : place,
    fee: null, // not listed
    start_date: dateOnly(raw.startsAt),
    end_date: endDate,
    // MLH gives the event dates but no registration deadline. It is left empty (and flagged) rather than guessed.
    deadline: null,
    level: "Intermediate", // no signal; the column is required
    interests,
    skills: [],
    team_size: null,
    hours_per_week: null,
    min_year: null,
    registration_url: url,
    source_url: `https://mlh.io/seasons/${raw._season}/events`,
    last_verified: now.toISOString(),
    warning: null,
    source: "mlh",
  }

  opportunity.verified = findMissingDetails(opportunity).length === 0
  return { opportunity, organizer }
}
