// Merges cross-posted duplicates (POC "Smart Ingestion"): the same event listed twice, on one
// source or on several. Two items count as the same event when their titles match once case,
// punctuation and spacing are ignored, they are the same kind of opportunity, and their start
// months do not contradict each other (a missing start date, as on Unstop, does not count as a
// contradiction). Within one source the organizer must match too.

import { findMissingDetails } from "./normalize.js"

const titleKey = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "")
const startMonth = (opportunity) => (opportunity.start_date ?? "").slice(0, 7)

function sameEvent(a, b) {
  const monthA = startMonth(a)
  const monthB = startMonth(b)
  if (monthA && monthB && monthA !== monthB) return false
  // Generic titles ("HR Internship") are common: on one source, two organizers means two events.
  if (a.source === b.source && a.organizer_id !== b.organizer_id) return false
  return a.category === b.category
}

// Combines two records of the same event: the first one wins, gaps are filled from the second.
// If both have a deadline and they differ, the sources conflict: the record is flagged (Trust Layer).
function merge(first, second) {
  const merged = { ...first }
  for (const key of Object.keys(second)) {
    if (merged[key] == null || merged[key] === "") merged[key] = second[key]
  }
  merged.interests = [...new Set([...first.interests, ...second.interests])]
  merged.skills = [...new Set([...first.skills, ...second.skills])]

  if (first.deadline && second.deadline && first.deadline !== second.deadline) {
    merged.warning = `Sources disagree on the deadline (${first.deadline} vs ${second.deadline}). Check the organizer's page.`
  }
  merged.verified = findMissingDetails(merged).length === 0 && !merged.warning
  return merged
}

// `items` is a list of { opportunity, organizer }. Returns the list with duplicates merged,
// plus how many were merged and which ones.
export function mergeDuplicates(items) {
  const byTitle = new Map() // title key -> the kept items with that title
  let merged = 0
  const pairs = [] // what was merged, for the log
  for (const item of items) {
    const key = titleKey(item.opportunity.title)
    const kept = byTitle.get(key) ?? []
    const existing = kept.find((other) => sameEvent(other.opportunity, item.opportunity))
    if (existing) {
      pairs.push(`${existing.opportunity.id} + ${item.opportunity.id}: ${item.opportunity.title}`)
      existing.opportunity = merge(existing.opportunity, item.opportunity)
      merged++
    } else {
      kept.push({ ...item })
      byTitle.set(key, kept)
    }
  }
  return { items: [...byTitle.values()].flat(), merged, pairs }
}
