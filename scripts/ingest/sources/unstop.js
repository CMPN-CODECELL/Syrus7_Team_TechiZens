// Source: Unstop. Reads the public search API (unstop.com/api/public/...). Its robots.txt allows
// /api/public/ and blocks the rest of /api/, so only that path is used. Not an official, documented
// API, so it can change without notice. One request at a time, with a pause between pages.

const BASE_URL = "https://unstop.com/api/public/opportunity/search-result"
const PAUSE_MS = 1200
const PER_PAGE = 50
const USER_AGENT = "NexusIngest/0.1 (student hackathon project)"

// What we read, and the name Unstop uses for it in the URL. Jobs and scholarships are left out:
// they are not practical learning opportunities. Courses and mentorships come back empty.
const KINDS = ["hackathons", "competitions", "quizzes", "workshops", "internships"]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPage(kind, page) {
  const url = `${BASE_URL}?opportunity=${kind}&oppstatus=open&per_page=${PER_PAGE}&page=${page}`
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } })
  if (!response.ok) throw new Error(`Unstop returned ${response.status} for ${kind} page ${page}`)
  return (await response.json()).data
}

// Returns the raw items, each tagged with `_kind` (which list it came from, since Unstop calls
// internships "jobs"). `limit` caps how many are read per kind, `maxPages` caps the pages per kind.
export async function fetchUnstop({ maxPages = Infinity, limit = 60 } = {}) {
  const all = []
  const seenIds = new Set() // the same event can be listed under two kinds (e.g. hackathons and competitions)
  for (const kind of KINDS) {
    const items = []
    for (let page = 1; page <= maxPages && items.length < limit; page++) {
      let data
      try {
        data = await fetchPage(kind, page)
      } catch (err) {
        console.warn(`  ${kind} page ${page} failed (${err.message}), retrying once...`)
        await sleep(PAUSE_MS * 3)
        try {
          data = await fetchPage(kind, page)
        } catch (retryErr) {
          // Give up on the rest of this kind, keep what was read, and carry on with the next kind.
          console.warn(`  ${kind} page ${page} failed again (${retryErr.message}), skipping the rest of ${kind}.`)
          break
        }
      }
      items.push(...(data.data ?? []))
      if (page >= (data.last_page ?? 1) || (data.data ?? []).length === 0) break
      await sleep(PAUSE_MS)
    }
    const kept = items.slice(0, limit).filter((item) => !seenIds.has(item.id))
    kept.forEach((item) => seenIds.add(item.id))
    console.log(`  Unstop ${kind}: ${kept.length} read`)
    all.push(...kept.map((item) => ({ ...item, _kind: kind })))
    await sleep(PAUSE_MS)
  }
  return all
}
