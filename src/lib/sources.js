// The websites listings are collected from (see scripts/ingest). `opportunity.source` holds the key.
// The icon is the site's own favicon, loaded from Google's favicon service in the student's browser.
export const SOURCES = {
  devpost: { name: "Devpost", domain: "devpost.com" },
  unstop: { name: "Unstop", domain: "unstop.com" },
  hackerearth: { name: "HackerEarth", domain: "hackerearth.com" },
  mlh: { name: "Major League Hacking", domain: "mlh.io" },
  hack2skill: { name: "Hack2skill", domain: "hack2skill.com" },
}

// { name, domain, icon } for an opportunity's source, or null when it has none (or an unknown one).
export function sourceInfo(opportunity) {
  const source = SOURCES[opportunity?.source]
  if (!source) return null
  return { ...source, icon: `https://www.google.com/s2/favicons?domain=${source.domain}&sz=64` }
}
