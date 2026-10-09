// Source: Devpost. Reads the public JSON that devpost.com/hackathons itself uses.
// It is not an official, documented API, so it can change without notice. Be gentle: one request
// at a time, with a pause between pages.

const BASE_URL = "https://devpost.com/api/hackathons"
const PAUSE_MS = 1200
const USER_AGENT = "NexusIngest/0.1 (student hackathon project)"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPage(page) {
  // Only hackathons that are open now or still upcoming (ended ones are not useful to students).
  const url = `${BASE_URL}?page=${page}&status%5B%5D=upcoming&status%5B%5D=open`
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } })
  if (!response.ok) throw new Error(`Devpost returned ${response.status} for page ${page}`)
  return response.json()
}

// Returns the raw hackathon objects, exactly as Devpost sent them (normalize.js cleans them up).
export async function fetchDevpost({ maxPages = 25 } = {}) {
  const all = []
  for (let page = 1; page <= maxPages; page++) {
    let data
    try {
      data = await fetchPage(page)
    } catch (err) {
      // One retry after a longer pause, then give up on this page and keep what we have.
      console.warn(`  page ${page} failed (${err.message}), retrying once...`)
      await sleep(PAUSE_MS * 3)
      data = await fetchPage(page)
    }

    const items = data.hackathons ?? []
    if (items.length === 0) break
    all.push(...items)

    const lastPage = Math.ceil((data.meta?.total_count ?? 0) / (data.meta?.per_page || 1))
    console.log(`  Devpost page ${page}/${lastPage || "?"}: ${items.length} hackathons`)
    if (lastPage && page >= lastPage) break
    await sleep(PAUSE_MS)
  }
  return all
}
