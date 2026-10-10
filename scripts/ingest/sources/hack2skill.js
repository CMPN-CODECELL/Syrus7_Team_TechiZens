// Source: Hack2skill (hack2skill.com), an India-focused platform for hackathons, bootcamps and challenges, many run
// with Google. Its pages are an empty shell that loads its data from the site's own public API, so this reads the
// same public event list the site's "events" page uses (/api/v1/innovator/public/event/list, no login needed).
// One request for the list. Not an official, documented API, so it can change without notice.
//
// robots.txt is respected: it is read on every run, and an event whose page (/event/<slug>) is disallowed there
// is left out. (Hack2skill disallows a long list of test, internal and campus-chapter events.)

const SITE = "https://hack2skill.com"
const LIST_URL = `${SITE}/api/v1/innovator/public/event/list`
const USER_AGENT = "NexusIngest/0.1 (student hackathon project)"

// The path prefixes the site's robots.txt disallows for every crawler ("User-agent: *"). Empty if it cannot be read
// (then nothing is blocked by this check, but the list itself only holds public events).
async function fetchDisallowedPaths() {
  try {
    const response = await fetch(`${SITE}/robots.txt`, { headers: { "User-Agent": USER_AGENT } })
    if (!response.ok) return []
    const lines = (await response.text()).split(/\r?\n/)
    const paths = []
    let applies = false
    for (const line of lines) {
      const [field, ...rest] = line.split(":")
      const value = rest.join(":").trim()
      if (/^user-agent$/i.test(field.trim())) applies = value === "*"
      else if (applies && /^disallow$/i.test(field.trim()) && value) paths.push(value)
    }
    return paths
  } catch {
    return []
  }
}

// Returns the raw event objects, exactly as Hack2skill sent them (normalizeHack2skill.js cleans them up).
export async function fetchHack2skill() {
  let response
  try {
    response = await fetch(LIST_URL, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } })
  } catch (err) {
    console.warn(`  Hack2skill could not be reached (${err.message}), skipping it.`)
    return []
  }
  if (!response.ok) {
    console.warn(`  Hack2skill returned ${response.status}, skipping it.`)
    return []
  }
  const data = (await response.json())?.data ?? {}
  const listed = [...(data.flagshipEvents ?? []), ...(data.communityEvents ?? [])]

  const disallowed = await fetchDisallowedPaths()
  const allowed = listed.filter((event) => {
    const path = `/event/${event.eventUrl}`
    return event.eventUrl && !disallowed.some((rule) => path.startsWith(rule))
  })
  console.log(`  Hack2skill: ${listed.length} events listed, ${listed.length - allowed.length} left out by robots.txt`)
  return allowed
}
