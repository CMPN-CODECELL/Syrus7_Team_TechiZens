// Turns one raw Unstop item into rows for our database. Same rules as the Devpost version:
// a detail Unstop did not give is `null`, never "" or 0.

import { cleanText, findMissingDetails, guessOrganizerType, slug } from "./normalize.js"
import { inferInterests } from "./interests.js"

// Unstop list -> our categories. Quizzes are competitions.
const CATEGORY = {
  hackathons: "hackathons",
  competitions: "competitions",
  quizzes: "competitions",
  workshops: "workshops",
  internships: "internships",
}
const CATEGORY_LABEL = {
  hackathons: "Hackathon",
  competitions: "Competition",
  workshops: "Workshop",
  internships: "Internship",
}

const FORMAT = { online: "Online", offline: "In-person", hybrid: "Hybrid" }

// "2026-10-12T23:59:00+05:30" -> "2026-10-12" (the date as written in Indian time).
const dateOnly = (text) => (/^\d{4}-\d{2}-\d{2}/.test(text ?? "") ? text.slice(0, 10) : null)

// Unstop descriptions are HTML. Keep plain text, at most ~300 characters, cut at a word.
function toPlainText(html, maxLength = 300) {
  const text = (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*About the (Competition|Hackathon|Workshop|Internship|Event|Opportunity|Quiz|Challenge)\s*:?/i, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "..."
}

function guessLevel(title) {
  if (/\b(beginner|basic|basics|fundamental|fundamentals|intro|introduction|starter|foundation)\b/i.test(title)) return "Beginner"
  if (/\b(advanced|expert|masterclass)\b/i.test(title)) return "Advanced"
  return "Intermediate" // no signal; the column is required
}

// Returns { opportunity, organizer } or null when the item should be skipped.
export function normalizeUnstop(raw, now = new Date()) {
  const category = CATEGORY[raw._kind]
  if (!category) return null
  if (raw.visibility && raw.visibility !== "public") return null
  if (raw.status && raw.status !== "LIVE") return null

  const title = cleanText(raw.title)
  if (!title) return null

  const regn = raw.regnRequirements ?? {}
  const address = raw.address_with_country_logo ?? null

  // Organizer
  const org = raw.organisation ?? {}
  const organizerName = cleanText(org.name) || "Unstop"
  const organizer = {
    id: `unstop-org-${org.id ?? (slug(organizerName) || "unknown")}`,
    name: organizerName,
    type: guessOrganizerType(organizerName),
    website: org.public_url ? `https://unstop.com/${org.public_url}` : "https://unstop.com",
    logo: org.logoUrl2 || org.logoUrl || raw.logoUrl2 || null,
  }

  // Format and location
  const format = FORMAT[raw.region] ?? null
  const place = cleanText([address?.city, address?.state].filter(Boolean).join(", ")) || cleanText(address?.address)
  const location = format === "Online" ? "Online" : place || null

  // Skills, workfunctions (Unstop's own topic tags) and the interests they point to.
  const skills = [...new Map((raw.required_skills ?? []).map((s) => cleanText(s.skill_name || s.skill)).filter(Boolean).map((s) => [s.toLowerCase(), s])).values()].slice(0, 6)
  const workfunctions = (raw.workfunction ?? []).map((w) => cleanText(w.name)).filter(Boolean)
  const interests = inferInterests(`${title} ${workfunctions.join(" ")} ${skills.join(" ")}`)

  // Team size: only a real team (max above 1) is stored; null means individual.
  const maxTeam = Number(regn.max_team_size) || 1
  const team_size = maxTeam > 1 ? { min: Number(regn.min_team_size) || 1, max: maxTeam } : null

  const url = raw.seo_url || (raw.public_url ? `https://unstop.com/${raw.public_url}` : null)
  const description =
    toPlainText(raw.details) ||
    `${CATEGORY_LABEL[category]} hosted by ${organizerName} on Unstop.`

  const opportunity = {
    id: `unstop-${raw.id}`,
    title,
    description,
    category,
    theme: workfunctions[0] ?? null,
    organizer_id: organizer.id,
    format,
    location,
    // isPaid only says whether there is a fee, not how much: free is 0, paid stays unknown.
    fee: raw.isPaid === false ? 0 : null,
    start_date: null, // Unstop's list has the registration window and the end, not the event start
    end_date: dateOnly(raw.end_date),
    deadline: dateOnly(regn.end_regn_dt),
    level: guessLevel(title),
    interests,
    skills,
    team_size,
    hours_per_week: null,
    min_year: null,
    registration_url: url,
    source_url: url || "https://unstop.com",
    last_verified: now.toISOString(),
    warning: null,
    source: "unstop",
  }

  opportunity.verified = findMissingDetails(opportunity).length === 0
  return { opportunity, organizer }
}
