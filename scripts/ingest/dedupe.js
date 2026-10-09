// Merges cross-posted duplicates (POC "Smart Ingestion"): the same event listed twice, on one
// source or on several. Two items count as the same event when their titles match once case,
// punctuation and spacing are ignored, and they start in the same month.

import { findMissingDetails } from "./normalize.js"

const titleKey = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "")

function duplicateKey(opportunity) {
  return `${titleKey(opportunity.title)}|${(opportunity.start_date ?? "").slice(0, 7)}`
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
// plus how many were merged.
export function mergeDuplicates(items) {
  const byKey = new Map()
  let merged = 0
  for (const item of items) {
    const key = duplicateKey(item.opportunity)
    const existing = byKey.get(key)
    if (existing) {
      existing.opportunity = merge(existing.opportunity, item.opportunity)
      merged++
    } else {
      byKey.set(key, { ...item })
    }
  }
  return { items: [...byKey.values()], merged }
}
