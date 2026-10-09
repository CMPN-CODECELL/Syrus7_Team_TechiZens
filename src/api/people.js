// ============================================================================
// SWAP POINT: people and connections (owner: backend / Supabase teammate)
//
// Your connections, other students' profiles, "People you may know", requests and invitations.
// Right now this is fake: people come from src/data/mockPeople.js and the student's choices
// are kept in localStorage. To go live, replace each body with Supabase (a connections table
// with a status of pending / accepted, protected by Row Level Security). Keep names,
// inputs and returned shapes.
//
// Person:      { id, name, college, year, location, headline, about, interests, skills, connectionCount }
//              (never contact details). In the mock, people also carry connectionIds (see mockPeople.js).
// Suggestion:  Person + { requestSent }         requestSent = this student already asked to connect
// Connection:  Person + { connectedAt }         connectedAt = ISO date-time the connection was made
// Invitation:  { id, person, createdAt }        someone asked to connect with this student
// Profile:     Person + { relationship, invitationId, connectedAt, mutualConnections }
//              relationship: "connected" | "invited" (they asked this student) | "pending" (this student asked) | "none"
//              invitationId:  set when relationship is "invited", otherwise null
//              connectedAt:   set when relationship is "connected", otherwise null
//              mutualConnections: Person[] both students are connected to
//
// A request becomes a connection when the OTHER student accepts it (backend work). Contact
// details are NOT shared by connecting; they only come after double opt-in in the Squad Hub.
// ============================================================================

import { SEED_CONNECTIONS, mockInvitations, mockPeople } from "@/data/mockPeople"

const KEYS = {
  added: "nexus-connections-added", // connections made in this browser: [{ id, connectedAt }]
  removed: "nexus-connections-removed", // ids removed from the starting connections
  sent: "nexus-requests-sent",
  handled: "nexus-invitations-handled", // invitations the student accepted or ignored
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? []
  } catch {
    return []
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: choices only last for this session.
  }
}

// What the screens get for a person (without the mock-only connectionIds).
function toPerson(person) {
  // eslint-disable-next-line no-unused-vars
  const { connectionIds, ...rest } = person
  return rest
}

function findPerson(personId) {
  return mockPeople.find((person) => person.id === personId)
}

// Everyone the student is connected to, with when: the starting connections plus new ones, minus removed.
function connectionRecords() {
  const removed = read(KEYS.removed)
  return [...SEED_CONNECTIONS, ...read(KEYS.added)].filter((record) => !removed.includes(record.id))
}

function unansweredInvitations() {
  const handled = read(KEYS.handled)
  return mockInvitations.filter((invitation) => !handled.includes(invitation.id))
}

// ---- Connections -----------------------------------------------------------

// Ids of the students this student is connected to. Used by the feed (see connections.js).
// With a real backend this stays on the server; the feed query already filters by connections.
export async function getConnectedIds() {
  return connectionRecords().map((record) => record.id)
}

// The student's connections, most recently connected first.
export async function getConnections() {
  return connectionRecords()
    .map((record) => ({ ...toPerson(findPerson(record.id)), connectedAt: record.connectedAt }))
    .sort((a, b) => new Date(b.connectedAt) - new Date(a.connectedAt))
}

// Removes a connection (their posts leave the feed). They can be suggested again.
export async function removeConnection(personId) {
  write(KEYS.removed, [...read(KEYS.removed), personId])
  write(KEYS.added, read(KEYS.added).filter((record) => record.id !== personId))
}

// One person's profile page data, or null if there is no such person.
export async function getPerson(personId) {
  const person = findPerson(personId)
  if (!person) return null

  const records = connectionRecords()
  const connectedIds = records.map((record) => record.id)
  const invitation = unansweredInvitations().find((item) => item.personId === personId)

  let relationship = "none"
  if (connectedIds.includes(personId)) relationship = "connected"
  else if (invitation) relationship = "invited"
  else if (read(KEYS.sent).includes(personId)) relationship = "pending"

  return {
    ...toPerson(person),
    relationship,
    invitationId: invitation?.id ?? null,
    connectedAt: records.find((record) => record.id === personId)?.connectedAt ?? null,
    mutualConnections: person.connectionIds.filter((id) => connectedIds.includes(id)).map((id) => toPerson(findPerson(id))),
  }
}

// ---- Suggestions and requests ----------------------------------------------

// People this student is not connected to and has no unanswered invitation from,
// in no particular order (the screen ranks them by shared interests and skills).
export async function getSuggestions() {
  const connectedIds = connectionRecords().map((record) => record.id)
  const invitedIds = unansweredInvitations().map((invitation) => invitation.personId)
  const sent = read(KEYS.sent)
  return mockPeople
    .filter((person) => !connectedIds.includes(person.id) && !invitedIds.includes(person.id))
    .map((person) => ({ ...toPerson(person), requestSent: sent.includes(person.id) }))
}

export async function sendConnectionRequest(personId) {
  const sent = read(KEYS.sent)
  if (!sent.includes(personId)) write(KEYS.sent, [...sent, personId])
}

export async function withdrawConnectionRequest(personId) {
  write(KEYS.sent, read(KEYS.sent).filter((id) => id !== personId))
}

// ---- Invitations -----------------------------------------------------------

// Invitations this student has received and not answered yet, newest first.
export async function getInvitations() {
  return unansweredInvitations()
    .map((invitation) => ({
      id: invitation.id,
      person: toPerson(findPerson(invitation.personId)),
      createdAt: invitation.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Accepting makes the sender a connection (so their posts show in the feed).
export async function acceptInvitation(invitationId) {
  const invitation = mockInvitations.find((item) => item.id === invitationId)
  if (!invitation) return
  write(KEYS.removed, read(KEYS.removed).filter((id) => id !== invitation.personId))
  write(KEYS.added, [...read(KEYS.added), { id: invitation.personId, connectedAt: new Date().toISOString() }])
  write(KEYS.handled, [...read(KEYS.handled), invitationId])
}

export async function ignoreInvitation(invitationId) {
  write(KEYS.handled, [...read(KEYS.handled), invitationId])
}
