// Source: HackerEarth. Reads the public JSON that hackerearth.com/challenges itself uses to list challenges
// (/api/community/challenges/compete/). Its robots.txt does not block /api/ (only login and *AJAX urls).
// Not an official, documented API, so it can change without notice. One request, no pages.
//
// The list mixes old and current challenges of four types (Hackathon, Competitive, College, Hiring); the
// normalizer keeps only the current, non-hiring ones.

const URL = "https://www.hackerearth.com/api/community/challenges/compete/"
const USER_AGENT = "NexusIngest/0.1 (student hackathon project)"

// Returns the raw challenge objects, exactly as HackerEarth sent them (normalizeHackerEarth.js cleans them up).
export async function fetchHackerEarth() {
  let response
  try {
    response = await fetch(URL, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } })
  } catch (err) {
    console.warn(`  HackerEarth could not be reached (${err.message}), skipping it.`)
    return []
  }
  if (!response.ok) {
    console.warn(`  HackerEarth returned ${response.status}, skipping it.`)
    return []
  }
  const data = await response.json()
  const items = data.data ?? []
  console.log(`  HackerEarth: ${items.length} challenges listed`)
  return items
}
