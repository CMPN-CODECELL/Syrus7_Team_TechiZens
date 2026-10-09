// Writes the ingested data to Supabase and records what changed (Change Sentinel).
// Uses the service-role key, so it must only ever run on your computer or a server, never in the app.

const CHUNK = 100

function chunks(list, size = CHUNK) {
  const result = []
  for (let i = 0; i < list.length; i += size) result.push(list.slice(i, i + size))
  return result
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// "2026-11-25" -> "25 Nov 2026" (the same style the alerts in the app show).
function dateLabel(iso) {
  if (!iso) return "Not listed"
  const [year, month, day] = iso.split("-").map(Number)
  return `${day} ${SHORT_MONTHS[month - 1]} ${year}`
}

function feeLabel(fee) {
  if (fee == null) return "Not listed"
  return fee === 0 ? "Free" : `₹${fee}`
}

// Compares what is stored with what we just scraped. Only deadline and fee can be compared
// automatically ("rules" changes have no column, so they are not detected here).
function findChanges(existing, scraped) {
  const changes = []
  if ((existing.deadline ?? null) !== (scraped.deadline ?? null)) {
    changes.push({
      opportunity_id: scraped.id,
      field: "deadline",
      old_value: dateLabel(existing.deadline),
      new_value: dateLabel(scraped.deadline),
    })
  }
  if ((existing.fee ?? null) !== (scraped.fee ?? null)) {
    changes.push({
      opportunity_id: scraped.id,
      field: "fee",
      old_value: feeLabel(existing.fee),
      new_value: feeLabel(scraped.fee),
    })
  }
  return changes
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

  // 2. What is stored today, to spot changes.
  const existingById = new Map()
  for (const part of chunks(opportunities.map((row) => row.id))) {
    const { data, error } = await supabase.from("opportunities").select("id, deadline, fee").in("id", part)
    check(error, "reading existing opportunities")
    for (const row of data) existingById.set(row.id, row)
  }

  const changes = opportunities.flatMap((row) => {
    const existing = existingById.get(row.id)
    return existing ? findChanges(existing, row) : []
  })

  // 3. Save the opportunities (new ones are inserted, known ones are updated and re-verified).
  for (const part of chunks(opportunities)) {
    const { error } = await supabase.from("opportunities").upsert(part, { onConflict: "id" })
    check(error, "saving opportunities")
  }

  // 4. Record the changes, so students who saved the opportunity get an alert.
  for (const part of chunks(changes)) {
    const { error } = await supabase.from("opportunity_changes").insert(part)
    check(error, "saving changes")
  }

  return {
    organizers: organizers.length,
    created: opportunities.length - existingById.size,
    updated: existingById.size,
    changes: changes.length,
  }
}
