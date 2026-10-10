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
import { CATEGORIES, INTEREST_OPTIONS } from "@/data/constants"
import { criteriaFromAi } from "@/lib/aiCriteria"
import { supabase } from "@/lib/supabase"
import { findMatches, parseQuery } from "@/lib/mockSearchParser"

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Asks the `ai-search` Edge Function (supabase/functions/ai-search) to read the request. Returns criteria, or null
// when the AI is not available (not signed in, no API key on the server, an error, a slow answer): the caller then
// uses the rule-based reader, so search always works.
async function readWithAi(query, profile) {
  if (!isConfigured) return null
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return null // demo mode: nobody is signed in, so the function would refuse

    const call = supabase.functions.invoke("ai-search", {
      body: {
        query,
        today: new Date().toLocaleDateString("en-CA"),
        interests: INTEREST_OPTIONS,
        categories: CATEGORIES.map((c) => c.id),
      },
    })
    const timeout = new Promise((resolve) => setTimeout(() => resolve({ error: new Error("timeout") }), 8000))
    const { data, error } = await Promise.race([call, timeout])
    if (error || !data?.criteria) return null
    return criteriaFromAi(data.criteria, { text: query, profile })
  } catch {
    return null
  }
}

export async function searchWithAI({ query, profile }) {
  const opportunities = await getOpportunities()
  const aiCriteria = await readWithAi(query, profile)
  const criteria = aiCriteria ?? parseQuery(query, { profile })
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
    engine: aiCriteria ? "ai" : "rules", // which reader understood the request (shown on the search panel)
    message,
    results: results.map(({ opportunity, relevance, reason }) => ({ opportunityId: opportunity.id, relevance, reason })),
  }
}
