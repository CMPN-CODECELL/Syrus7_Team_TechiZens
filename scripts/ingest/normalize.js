// Turns one raw Devpost hackathon into rows for our database (the `organizers` and
// `opportunities` tables). Rule from CONTRIBUTING.md: a detail the organizer did not list is
// `null`, never "" or 0 (fee: 0 means Free, so an unknown fee must stay null).

import { inferInterests } from "./interests.js"

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 }

const pad = (n) => String(n).padStart(2, "0")
const toIso = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`

// Devpost writes the dates in a few shapes:
//   "Oct 01 - 10, 2026"            "Aug 31 - Oct 23, 2026"
//   "Jul 16, 2026 - Jan 15, 2027"  "Oct 09, 2026" (a single day)
// Returns { startDate, endDate } as "YYYY-MM-DD", or null when the text is not understood.
export function parseDateRange(text) {
  if (!text) return null
  const [left, right] = text.split(" - ").map((part) => part.trim())

  const endMatch = (right ?? left).match(/^(?:([A-Za-z]{3}) )?(\d{1,2}), (\d{4})$/)
  const startMatch = left.match(/^([A-Za-z]{3}) (\d{1,2})(?:, (\d{4}))?$/)
  if (!endMatch) return null

  const endYear = Number(endMatch[3])
  const endDay = Number(endMatch[2])

  // A single day ("Oct 09, 2026"): the left side is the whole date.
  if (right === undefined) {
    const month = MONTHS[left.slice(0, 3)]
    if (!month) return null
    const day = toIso(endYear, month, endDay)
    return { startDate: day, endDate: day }
  }

  if (!startMatch) return null
  const startMonth = MONTHS[startMatch[1]]
  const endMonth = endMatch[1] ? MONTHS[endMatch[1]] : startMonth
  if (!startMonth || !endMonth) return null

  // "Dec 28 - Jan 03, 2027": the start is in the year before the end.
  const startYear = startMatch[3] ? Number(startMatch[3]) : startMonth > endMonth ? endYear - 1 : endYear
  return {
    startDate: toIso(startYear, startMonth, Number(startMatch[2])),
    endDate: toIso(endYear, endMonth, endDay),
  }
}

// Devpost themes -> the interest names the app uses (INTEREST_OPTIONS in src/data/constants.js).
// Themes with no clear match are left out rather than guessed. Each theme can give several interests.
const THEME_TO_INTEREST = {
  "Machine Learning/AI": ["AI & Machine Learning"],
  Web: ["Web Development"],
  Mobile: ["Mobile Apps"],
  Cybersecurity: ["Cybersecurity"],
  DevOps: ["Cloud & DevOps"],
  Serverless: ["Cloud & DevOps"],
  IoT: ["Internet of Things", "Robotics"],
  Databases: ["Data Science"],
  Fintech: ["Finance"],
  Blockchain: ["Blockchain & Web3", "Finance"],
  "Social Good": ["Social Impact"],
  Health: ["Healthcare & Biotech", "Social Impact"],
  Education: ["Education", "Social Impact"],
  Design: ["Design"],
  "Music/Art": ["Music & Art", "Design"],
  "E-commerce/Retail": ["E-commerce", "Entrepreneurship"],
  Quantum: ["Quantum Computing"],
  "AR/VR": ["AR/VR"],
  Gaming: ["Game Development"],
  "Low/No Code": ["Automation & Low-Code"],
  "Robotic Process Automation": ["Automation & Low-Code"],
}

// Theme names that say nothing about the topic. They are not used as the card's theme.
const GENERIC_THEMES = new Set(["Beginner Friendly", "Open Ended"])

export function guessOrganizerType(name) {
  if (/univers|college|institute|school|polytechnic|academy|\biit\b|\bnit\b/i.test(name)) return "College"
  if (/devpost|\bmlh\b|major league hacking|hackerearth|hack2skill|unstop|devfolio/i.test(name)) return "Platform"
  return "Company"
}

export const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const cleanText = (text) => (text ? text.replace(/\s+/g, " ").replace(/[,\s]+$/, "").trim() : "")

// Returns { opportunity, organizer } or null when the hackathon should be skipped.
// `now` is passed in so the result is the same for every item of one run.
export function normalizeDevpost(raw, now = new Date()) {
  // Invite-only events cannot be joined by students, so they would only be noise.
  if (raw.invite_only) return null

  const dates = parseDateRange(raw.submission_period_dates)

  const organizerName = cleanText(raw.organization_name) || "Devpost"
  const organizer = {
    id: `devpost-org-${slug(organizerName) || "unknown"}`,
    name: organizerName,
    type: guessOrganizerType(organizerName),
    // Devpost does not give the organizer's own website, so the platform is used. No logo for the same reason
    // (a favicon would show the Devpost logo for every organizer).
    website: "https://devpost.com",
    logo: null,
  }

  const themeNames = (raw.themes ?? []).map((theme) => theme.name)
  const topicTheme = themeNames.find((name) => !GENERIC_THEMES.has(name)) ?? themeNames[0] ?? null
  // Interests from the Devpost themes, plus any the title and themes point to (shared keyword list).
  const interests = [
    ...new Set([...themeNames.flatMap((name) => THEME_TO_INTEREST[name] ?? []), ...inferInterests(`${raw.title} ${themeNames.join(" ")}`)]),
  ]

  // Format and location: a "globe" icon means online. Devpost does not tell hybrid apart,
  // so it is only guessed when the place itself says "+ Online".
  const place = cleanText(raw.displayed_location?.location)
  const isOnline = raw.displayed_location?.icon === "globe"
  let format = "In-person"
  if (isOnline) format = "Online"
  else if (/online/i.test(place)) format = "Hybrid"
  const location = isOnline ? "Online" : place || null

  // The description is built only from facts Devpost gave us (nothing invented).
  const parts = [
    `${format === "Online" ? "Online hackathon" : "Hackathon"} hosted by ${organizerName} on Devpost.`,
    raw.prizes_counts?.cash > 0 && raw.prize_amount
      ? `Prizes worth ${raw.prize_amount.replace(/<[^>]+>/g, "")}.`
      : null,
    raw.registrations_count ? `${raw.registrations_count.toLocaleString("en-US")} people have registered.` : null,
  ]

  const opportunity = {
    id: `devpost-${raw.id}`,
    title: cleanText(raw.title),
    description: parts.filter(Boolean).join(" "),
    category: "hackathons",
    theme: topicTheme,
    organizer_id: organizer.id,
    format,
    location,
    // Devpost does not list an entry fee; Free (0) is stored. The app does not show or check prices (removed 2026-10-09).
    fee: 0,
    start_date: dates?.startDate ?? null,
    end_date: dates?.endDate ?? null,
    deadline: dates?.endDate ?? null, // the last day of the submission period
    // "Beginner Friendly" is a Devpost theme; without it we assume Intermediate (the column is required).
    level: themeNames.includes("Beginner Friendly") ? "Beginner" : "Intermediate",
    interests,
    skills: [],
    team_size: null,
    hours_per_week: null,
    min_year: null,
    registration_url: raw.url || null,
    source_url: raw.url || `https://devpost.com/hackathons`,
    last_verified: now.toISOString(),
    warning: null, // only used when two sources disagree (see dedupe.js)
    source: "devpost",
  }

  opportunity.verified = findMissingDetails(opportunity).length === 0
  return { opportunity, organizer }
}

// The same list the app checks in src/lib/ingestion.js (deadline, location, format, theme, link). The fee is not checked: prices are not shown.
export function findMissingDetails(row) {
  const required = ["deadline", "location", "format", "theme", "registration_url"]
  return required.filter((key) => row[key] == null || row[key] === "")
}
