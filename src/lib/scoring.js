// Relevance and eligibility are separate (POC "Decoupled Scoring").
// These are plain functions so they can later be replaced by backend results.

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

// Compares names loosely, so "React.js", "react" and "React" match, and so do "C Programming Language" and "C".
function nameKey(name) {
  return name
    .toLowerCase()
    .replace(/\.js\b/g, "")
    .replace(/\b(programming language|programming|language)\b/g, "")
    .replace(/[^a-z0-9+#]/g, "")
}

// Items of `a` that also appear in `b` (ignoring upper/lower case and small differences in spelling).
export function overlap(a, b) {
  const keysB = b.map(nameKey)
  return a.filter((item) => keysB.includes(nameKey(item)))
}

// ---- Relevance --------------------------------------------------------------------------------
// A 0-100 score plus a plain-language reason (POC "Decoupled Scoring": eligibility is separate).
//
// Step 1, topic fit (0 to 1): how well the opportunity matches what the student cares about.
//   interests  75%   how many of YOUR interests it covers (two or more = full marks)
//   skills     25%   whether it uses skills you have (left out when the opportunity lists none,
//                    so an opportunity with no skills is not punished for it)
// (Two matches fill 85% of that; matching more of your interests, up to 5, adds the last 15%.)
// An opportunity that says nothing about its topic gets a neutral 40%: below a real partial
// match (50%), above a clear mismatch (0%).
// Step 2, practical fit: for beginners the topic score is reduced when the opportunity is too
// advanced (Intermediate x0.85, Advanced x0.6). Beginner-level never adds points; it only avoids
// a reduction. Prices are not tracked, so the fee plays no part.
// The result is 10 to 100, so a card never shows 0%. Weekly hours will come back with the
// team-building section.

const INTEREST_SHARE = 0.75
const SKILL_SHARE = 0.25
const UNKNOWN_TOPIC_FIT = 0.4
const DEPTH_SHARE = 0.15 // part of the interest score that rewards matching more than two interests
const DEPTH_CAP = 5
const MIN_SCORE = 10
const LEVEL_FACTOR_FOR_BEGINNERS = { Beginner: 1, Intermediate: 0.85, Advanced: 0.6 }

// Words that suggest an interest. Used only to read the title and theme of opportunities that
// do not list their interests (most scraped ones). Words of 5+ letters match as a word start
// ("robot" finds "robotics"); shorter ones must match the whole word ("ai" must not find "maintain").
export const INTEREST_KEYWORDS = {
  "Web Development": ["web", "website", "frontend", "backend", "full stack", "fullstack", "react", "html", "css"],
  "AI & Machine Learning": ["ai", "ml", "artificial intelligence", "machine learning", "deep learning", "llm", "gpt", "generative", "genai", "neural", "nlp"],
  "Data Science": ["data", "analytics", "statistics", "sql", "visualization"],
  Design: ["design", "ux", "ui", "figma"],
  Cybersecurity: ["security", "cyber", "hacking", "ctf", "privacy", "encryption"],
  "Mobile Apps": ["mobile", "android", "ios", "flutter", "react native"],
  "Cloud & DevOps": ["cloud", "devops", "aws", "azure", "kubernetes", "docker", "serverless"],
  Robotics: ["robot", "robotics", "iot", "arduino", "drone", "hardware"],
  Entrepreneurship: ["startup", "entrepreneur", "venture", "pitch", "founder"],
  Finance: ["finance", "fintech", "payments", "banking", "blockchain", "crypto", "trading"],
  Sustainability: ["sustainab", "climate", "green", "energy", "environment", "waste"],
  "Social Impact": ["social", "impact", "community", "nonprofit", "education", "health", "ngo"],
  "Game Development": ["game", "games", "gaming", "unity", "unreal", "esports"],
  "AR/VR": ["ar", "vr", "xr", "augmented reality", "virtual reality", "mixed reality", "metaverse"],
  "Blockchain & Web3": ["blockchain", "web3", "crypto", "ethereum", "solidity", "smart contract", "nft", "defi"],
  "Internet of Things": ["iot", "internet of things", "smart home", "sensor", "sensors"],
  "Embedded Systems": ["embedded", "firmware", "microcontroller", "arduino", "raspberry pi", "esp32", "stm32"],
  Electronics: ["electronics", "circuit", "circuits", "pcb", "vlsi", "semiconductor", "electrical"],
  "Computer Networks": ["ccna", "cisco", "telecom", "5g", "wireless", "computer network", "routing"],
  "Quantum Computing": ["quantum", "qubit"],
  "Data Structures & Algorithms": ["data structures", "algorithm", "dsa", "leetcode"],
  "Competitive Programming": ["competitive programming", "codeforces", "codechef", "icpc", "hackerrank", "coding contest"],
  "Open Source": ["open source", "opensource", "github", "gsoc", "hacktoberfest", "outreachy"],
  "Automation & Low-Code": ["automation", "low code", "low-code", "no code", "no-code", "rpa", "workflow"],
  Mathematics: ["mathematics", "maths", "math", "olympiad", "algebra", "calculus", "geometry"],
  "Research & Academia": ["research", "paper", "journal", "thesis", "phd", "academic", "symposium"],
  "Product Management": ["product manager", "product management", "product strategy", "roadmap"],
  "Management & Consulting": ["consulting", "consultant", "case study", "case competition", "business strategy", "human resources", "mba", "hr"],
  "Digital Marketing": ["marketing", "seo", "branding", "advertising", "growth hacking"],
  "E-commerce": ["ecommerce", "e-commerce", "retail", "marketplace", "shopify", "supply chain", "logistics"],
  "Content Writing": ["content writing", "copywriting", "writing", "blog", "blogging", "journalism", "storytelling", "poetry"],
  "Public Speaking": ["public speaking", "debate", "mun", "model united nations", "elocution", "oratory", "toastmasters"],
  "Photography & Video": ["photography", "photo", "video", "videography", "filmmaking", "film", "cinematography"],
  "Music & Art": ["music", "arts", "painting", "drawing", "sketching", "dance", "singing", "theatre", "theater"],
  "Sports & Fitness": ["sports", "sport", "fitness", "cricket", "football", "chess", "athletics", "marathon", "yoga", "badminton"],
  "Healthcare & Biotech": ["health", "healthcare", "medical", "medicine", "biotech", "biotechnology", "pharma", "clinical", "bioinformatics"],
  Education: ["education", "edtech", "teaching", "tutoring", "pedagogy"],
  "Agriculture & FoodTech": ["agriculture", "agri", "farming", "farmer", "foodtech", "crop", "dairy"],
  "Electric Vehicles & Energy": ["electric vehicle", "ev", "battery", "batteries", "solar", "renewable", "hydrogen"],
  "Mechanical Engineering": ["mechanical", "cad", "solidworks", "autocad", "manufacturing", "3d printing", "thermodynamics", "automotive"],
  "Space & Aerospace": ["aerospace", "satellite", "rocket", "astronomy", "isro", "nasa", "astrophysics", "spacecraft"],
  "Law & Policy": ["law", "legal", "policy", "policies", "governance", "civics", "parliament", "moot court"],
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Each keyword's pattern is built once and reused (building ~300 patterns per opportunity made searching slow).
const wordPatterns = new Map()

// True when `word` appears in `text` as a whole word, or (for 5+ letters) as the start of a word.
export function hasWord(text, word) {
  let pattern = wordPatterns.get(word)
  if (!pattern) {
    const end = word.length >= 5 ? "" : "(?![a-z0-9])"
    pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(word.toLowerCase())}${end}`)
    wordPatterns.set(word, pattern)
  }
  return pattern.test(text.toLowerCase())
}

// Topics already worked out, per opportunity object (a new object after a reload gets a fresh entry).
const topicsCache = new WeakMap()

// Only a real write-up is worth reading. Short descriptions ("Hackathon hosted by X on Devpost") are
// boilerplate, and words like "community" in them would point to the wrong topic.
const MIN_DESCRIPTION_LENGTH = 150

// Interests from the opportunity's own list, plus the ones its title and theme point to.
// When none of that gives a topic, a long description is read as a last resort.
export function getTopics(opportunity) {
  const cached = topicsCache.get(opportunity)
  if (cached) return cached
  const topicsIn = (text) =>
    Object.entries(INTEREST_KEYWORDS)
      .filter(([, words]) => words.some((word) => hasWord(text, word)))
      .map(([interest]) => interest)
  let fromText = topicsIn(`${opportunity.title ?? ""} ${opportunity.theme ?? ""}`)
  const description = opportunity.description ?? ""
  if (fromText.length === 0 && (opportunity.interests ?? []).length === 0 && description.length >= MIN_DESCRIPTION_LENGTH) {
    fromText = topicsIn(description)
  }
  const topics = [...new Set([...(opportunity.interests ?? []), ...fromText])]
  topicsCache.set(opportunity, topics)
  return topics
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
  if (wanted > 0 && matchedInterests.length > 0) {
    // Two matches already fill most of the score; extra matches add a little, so a wider overlap still ranks higher.
    const base = Math.min(matchedInterests.length / wanted, 1)
    const depth = Math.min(matchedInterests.length / Math.min(profileInterests.length, DEPTH_CAP), 1)
    interestFit = (1 - DEPTH_SHARE) * base + DEPTH_SHARE * depth
  }
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
  const levelFactor = profile.isBeginner ? (LEVEL_FACTOR_FOR_BEGINNERS[opportunity.level] ?? 1) : 1

  const raw = MIN_SCORE + (100 - MIN_SCORE) * topicFit * levelFactor
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

export function isSustainability(opportunity) {
  return opportunity.interests.some(
    (interest) => interest === "Sustainability" || interest === "Social Impact"
  )
}

// What a person has in common with the student: shared interests and shared skills.
export function getSharedWithProfile(person, profile) {
  return [...overlap(person.interests, profile.interests), ...overlap(person.skills, profile.skills)]
}
