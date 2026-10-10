// ============================================================================
// People and connections (Supabase: the connections table and the public_profiles view, see 0009).
//
// Your connections, other students' profiles, "People you may know", requests and invitations.
// A request becomes a connection when the OTHER student accepts it. Contact details are NOT shared
// by connecting; they only come after double opt-in in the Squad Hub.
// Without a real sign-in (the local demo login) every list is empty and actions throw.
//
// Person:      { id, name, college, year, location, headline, about, interests, skills, connectionCount }
//              (never contact details). The signed-in student has the id "me".
// Suggestion:  Person + { requestSent }         requestSent = this student already asked to connect
// Connection:  Person + { connectedAt }         connectedAt = ISO date-time the connection was made
// Invitation:  { id, person, createdAt }        someone asked to connect with this student
// SentRequest: { id, person, createdAt }        id = the other student's id (used to withdraw)
// Profile:     Person + { relationship, invitationId, connectedAt, mutualConnections }
//              relationship: "connected" | "invited" (they asked this student) | "pending" (this student asked) | "none"
//              invitationId:  set when relationship is "invited", otherwise null
//              connectedAt:   set when relationship is "connected", otherwise null
//              mutualConnections: Person[] both students are connected to
// ============================================================================

import { PERSON_COLUMNS, getUserId, isUuid, realId, requireUserId, toPerson, unwrap } from "@/api/shared"
import { supabase } from "@/lib/supabase"

const SUGGESTION_LIMIT = 300

// Every connection row the student is part of (RLS only returns their own), in any status.
async function loadMyRows() {
  return unwrap(
    await supabase.from("connections").select("id, requester_id, addressee_id, status, created_at, accepted_at")
  )
}

const otherId = (row, myId) => (row.requester_id === myId ? row.addressee_id : row.requester_id)

// Several people by id (ids that are not visible, such as students in school, are skipped).
// Used by the Squad Hub (see squads.js).
export async function getPeopleByIds(personIds) {
  const myId = await getUserId()
  if (!myId) return []
  const ids = [...new Set(personIds.map((id) => realId(id, myId)).filter(isUuid))]
  if (ids.length === 0) return []
  const rows = unwrap(await supabase.from("public_profiles").select(PERSON_COLUMNS).in("id", ids))
  return rows.map((row) => toPerson(row, myId))
}

// ---- Everything the Connections page shows, in one go -----------------------

// { connections, invitations, sent, suggestions } for the signed-in student.
// connections: most recently connected first. invitations: newest first. sent: newest first.
// suggestions: everyone else who can be asked to connect (the screen ranks them).
export async function getNetwork() {
  const myId = await getUserId()
  if (!myId) return { connections: [], invitations: [], sent: [], suggestions: [] }

  const rows = await loadMyRows()
  const relatedIds = rows.map((row) => otherId(row, myId))
  const [related, everyone] = await Promise.all([
    relatedIds.length > 0
      ? supabase.from("public_profiles").select(PERSON_COLUMNS).in("id", relatedIds).then(unwrap)
      : [],
    supabase.from("public_profiles").select(PERSON_COLUMNS).neq("id", myId).limit(SUGGESTION_LIMIT).then(unwrap),
  ])
  const people = new Map(related.map((row) => [row.id, toPerson(row, myId)]))
  const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

  const connections = rows
    .filter((row) => row.status === "accepted" && people.has(otherId(row, myId)))
    .map((row) => ({ ...people.get(otherId(row, myId)), connectedAt: row.accepted_at ?? row.created_at }))
    .sort((a, b) => new Date(b.connectedAt) - new Date(a.connectedAt))

  const invitations = rows
    .filter((row) => row.status === "pending" && row.addressee_id === myId && people.has(row.requester_id))
    .map((row) => ({ id: row.id, person: people.get(row.requester_id), createdAt: row.created_at }))
    .sort(byNewest)

  const sent = rows
    .filter((row) => row.status === "pending" && row.requester_id === myId && people.has(row.addressee_id))
    .map((row) => ({ id: row.addressee_id, person: people.get(row.addressee_id), createdAt: row.created_at }))
    .sort(byNewest)

  const hidden = new Set(
    rows.filter((row) => row.status === "accepted" || row.addressee_id === myId).map((row) => otherId(row, myId))
  )
  const sentIds = new Set(sent.map((request) => request.id))
  const suggestions = everyone
    .filter((row) => !hidden.has(row.id))
    .map((row) => ({ ...toPerson(row, myId), requestSent: sentIds.has(row.id) }))

  return { connections, invitations, sent, suggestions }
}

// ---- Connections -----------------------------------------------------------

// The student's connections, most recently connected first.
export async function getConnections() {
  return (await getNetwork()).connections
}

// Removes a connection (their posts leave the feed). They can be suggested again.
export async function removeConnection(personId) {
  const myId = await requireUserId()
  if (!isUuid(personId)) return
  unwrap(
    await supabase
      .from("connections")
      .delete()
      .or(
        `and(requester_id.eq.${myId},addressee_id.eq.${personId}),and(requester_id.eq.${personId},addressee_id.eq.${myId})`
      )
  )
}

// One person's profile page data, or null if there is no such person (or they cannot be shown).
export async function getPerson(personId) {
  const myId = await getUserId()
  if (!myId || !isUuid(personId)) return null

  const [row, rows] = await Promise.all([
    supabase.from("public_profiles").select(PERSON_COLUMNS).eq("id", personId).maybeSingle().then(unwrap),
    loadMyRows(),
  ])
  if (!row) return null

  const mine = rows.find((item) => otherId(item, myId) === personId)
  let relationship = "none"
  if (mine?.status === "accepted") relationship = "connected"
  else if (mine?.status === "pending") relationship = mine.addressee_id === myId ? "invited" : "pending"

  const mutual = unwrap(await supabase.rpc("get_mutual_connections", { p_other: personId }))

  return {
    ...toPerson(row, myId),
    relationship,
    invitationId: relationship === "invited" ? mine.id : null,
    connectedAt: relationship === "connected" ? (mine.accepted_at ?? mine.created_at) : null,
    mutualConnections: mutual.map((person) => toPerson(person, myId)),
  }
}

// ---- Suggestions and requests ----------------------------------------------

export async function getSuggestions() {
  return (await getNetwork()).suggestions
}

export async function sendConnectionRequest(personId) {
  const myId = await requireUserId()
  const { error } = await supabase.from("connections").insert({ requester_id: myId, addressee_id: personId })
  if (error && error.code !== "23505") throw new Error(error.message) // 23505: already asked, or they asked first
}

export async function withdrawConnectionRequest(personId) {
  const myId = await requireUserId()
  unwrap(
    await supabase
      .from("connections")
      .delete()
      .eq("requester_id", myId)
      .eq("addressee_id", personId)
      .eq("status", "pending")
  )
}

// ---- Invitations -----------------------------------------------------------

// Invitations this student has received and not answered yet, newest first.
export async function getInvitations() {
  return (await getNetwork()).invitations
}

// Accepting makes the sender a connection (so their posts show in the feed).
export async function acceptInvitation(invitationId) {
  const myId = await requireUserId()
  unwrap(
    await supabase
      .from("connections")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitationId)
      .eq("addressee_id", myId)
  )
}

export async function ignoreInvitation(invitationId) {
  const myId = await requireUserId()
  unwrap(await supabase.from("connections").delete().eq("id", invitationId).eq("addressee_id", myId))
}
