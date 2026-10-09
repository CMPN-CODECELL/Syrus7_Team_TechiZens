// ============================================================================
// SWAP POINT: conversational AI search (owner: backend / Supabase teammate)
//
// Understands a plain-English request such as "online coding workshops this weekend",
// finds matching opportunities, and explains why each one is a good result.
// Right now this is a MOCK: a simple rule-based reader (src/lib/mockSearchParser.js).
// To go live, replace the body with a call to a backend function (for example a Supabase
// Edge Function) that asks an LLM. Never put an LLM API key in the frontend.
// Keep the input and the returned shape the same and the screens keep working.
//
// searchWithAI({ query, profile }) -> {
//   understood: [{ label, dropped }],     // what the AI picked out of the request, shown as chips.
//                                         // dropped = true if it had to ignore that part to find results
//   message: string or null,              // a short note for the student, e.g. what was relaxed or why nothing was found
//   results: [{ opportunityId, relevance, reason }],   // best first. reason = why this opportunity fits
// }
// `relevance` is 0-100 like everywhere else; `reason` is one short line.
// ============================================================================

import { getOpportunities } from "@/api/opportunities"
import { findMatches, parseQuery } from "@/lib/mockSearchParser"

export async function searchWithAI({ query, profile }) {
  const opportunities = await getOpportunities()
  const criteria = parseQuery(query, { profile })
  const { results, droppedKeys, keys } = findMatches(opportunities, criteria, profile)

  const understood = keys.map((key) => ({ label: criteria[key].label, dropped: droppedKeys.includes(key) }))

  let message = null
  if (keys.length === 0) {
    message = "I couldn't pick out anything to search for. Try something like \"online workshops for beginners\"."
  } else if (results.length === 0) {
    message = "Nothing matches that yet. Try fewer details."
  } else if (droppedKeys.length > 0) {
    const dropped = droppedKeys.map((key) => criteria[key].label.toLowerCase()).join(", ")
    message = `Nothing matched everything, so I ignored: ${dropped}.`
  }

  // Prices are not tracked, so a price in the request was left out of the search.
  if (criteria.priceIgnored) {
    const note = "Prices are not tracked here, so I ignored the price. Check the organizer's website for the fee."
    message = message ? `${message} ${note}` : note
  }

  return {
    understood,
    message,
    results: results.map(({ opportunity, relevance, reason }) => ({ opportunityId: opportunity.id, relevance, reason })),
  }
}
