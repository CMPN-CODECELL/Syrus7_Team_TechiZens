// Writes the ingested data to Supabase.
// Uses the service-role key, so it must only ever run on your computer or a server, never in the app.
//
// Change Sentinel: the database itself records a deadline or fee change in `opportunity_changes`
// whenever an opportunity row is updated (trigger `opportunities_log_changes`, migration 0008).
// This script must NOT insert those rows too, or every alert would appear twice.

const CHUNK = 100

function chunks(list, size = CHUNK) {
  const result = []
  for (let i = 0; i < list.length; i += size) result.push(list.slice(i, i + size))
  return result
}

function check(error, what) {
  if (error) throw new Error(`${what}: ${error.message}`)
}

// `items` is a list of { opportunity, organizer }. Returns counts for the summary.
export async function saveAll(supabase, items) {
  const organizers = [...new Map(items.map((item) => [item.organizer.id, item.organizer])).values()]
  const opportunities = items.map((item) => item.opportunity)

  // 1. Organizers first, because every opportunity points at one.
  for (const part of chunks(organizers)) {
    const { error } = await supabase.from("organizers").upsert(part, { onConflict: "id" })
    check(error, "saving organizers")
  }

  // 2. What is stored today, only to count how many deadlines or fees are about to change.
  const existingById = new Map()
  for (const part of chunks(opportunities.map((row) => row.id))) {
    const { data, error } = await supabase.from("opportunities").select("id, deadline, fee").in("id", part)
    check(error, "reading existing opportunities")
    for (const row of data) existingById.set(row.id, row)
  }
  const changed = opportunities.filter((row) => {
    const existing = existingById.get(row.id)
    return existing && ((existing.deadline ?? null) !== (row.deadline ?? null) || (existing.fee ?? null) !== (row.fee ?? null))
  }).length

  // 3. Save the opportunities (new ones are inserted, known ones are updated and re-verified).
  for (const part of chunks(opportunities)) {
    const { error } = await supabase.from("opportunities").upsert(part, { onConflict: "id" })
    check(error, "saving opportunities")
  }

  return {
    organizers: organizers.length,
    created: opportunities.length - existingById.size,
    updated: existingById.size,
    changed,
  }
}
