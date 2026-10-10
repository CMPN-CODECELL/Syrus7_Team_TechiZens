// Source: Major League Hacking (MLH), the collegiate hackathon league. Reads the season schedule pages
// (mlh.io/seasons/<year>/events). Each page carries its event list as JSON inside the HTML (an Inertia.js
// <script data-page="app"> block), so no HTML scraping rules are needed. mlh.io/robots.txt allows these pages.
// Not an official, documented API, so it can change without notice. Two requests, with a pause.

const USER_AGENT = "NexusIngest/0.1 (student hackathon project)"
const PAUSE_MS = 1200
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchSeason(year) {
  const url = `https://mlh.io/seasons/${year}/events`
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } })
  if (!response.ok) throw new Error(`MLH returned ${response.status} for season ${year}`)
  const html = await response.text()
  const match = html.match(/<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) throw new Error(`MLH season ${year}: the page data was not found (the site may have changed)`)
  const props = JSON.parse(match[1]).props
  return (props.upcomingEvents ?? []).map((event) => ({ ...event, _season: year }))
}

// Returns the raw upcoming events of the current and the next season (a season starts in the autumn,
// so in October both are in use). An event listed twice is kept once.
export async function fetchMlh({ now = new Date() } = {}) {
  const year = now.getFullYear()
  const byId = new Map()
  for (const season of [year, year + 1]) {
    try {
      for (const event of await fetchSeason(season)) byId.set(event.id, event)
    } catch (err) {
      console.warn(`  MLH season ${season}: ${err.message}, skipping it.`)
    }
    await sleep(PAUSE_MS)
  }
  console.log(`  MLH: ${byId.size} upcoming hackathons`)
  return [...byId.values()]
}
