// ============================================================================
// SWAP POINT: connecting with people (owner: backend / Supabase teammate)
//
// "People you may know", connection requests and invitations.
// Right now this is fake: people come from src/data/mockPeople.js and the student's choices
// are kept in localStorage. To go live, replace each body with Supabase (a connections table
// with a status of pending / accepted, protected by Row Level Security). Keep names,
// inputs and returned shapes.
//
// Person:      { id, name, college, year, interests, skills }   (never contact details)
// Suggestion:  Person + { requestSent }                          requestSent = this student already asked to connect
// Invitation:  { id, person, createdAt }                         someone asked to connect with this student
//
// A request becomes a connection when the OTHER student accepts it (backend work). Contact
// details are NOT shared by connecting; they only come after double opt-in in the Squad Hub.
// ============================================================================

import { SEED_CONNECTED_IDS, mockInvitations, mockPeople } from "@/data/mockPeople"

const KEYS = {
  accepted: "nexus-connected",
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

// Ids of the students this student is connected to. Used by the feed (see connections.js).
// With a real backend this stays on the server; the feed query already filters by connections.
export async function getConnectedIds() {
  return [...SEED_CONNECTED_IDS, ...read(KEYS.accepted)]
}

// People this student is not connected to and has no pending invitation from,
// in no particular order (the screen ranks them by shared interests and skills).
export async function getSuggestions() {
  const connected = await getConnectedIds()
  const invitedIds = mockInvitations.map((invitation) => invitation.personId)
  const sent = read(KEYS.sent)
  return mockPeople
    .filter((person) => !connected.includes(person.id) && !invitedIds.includes(person.id))
    .map((person) => ({ ...person, requestSent: sent.includes(person.id) }))
}

export async function sendConnectionRequest(personId) {
  const sent = read(KEYS.sent)
  if (!sent.includes(personId)) write(KEYS.sent, [...sent, personId])
}

export async function withdrawConnectionRequest(personId) {
  write(KEYS.sent, read(KEYS.sent).filter((id) => id !== personId))
}

// Invitations this student has received and not answered yet, newest first.
export async function getInvitations() {
  const handled = read(KEYS.handled)
  return mockInvitations
    .filter((invitation) => !handled.includes(invitation.id))
    .map((invitation) => ({
      id: invitation.id,
      person: mockPeople.find((person) => person.id === invitation.personId),
      createdAt: invitation.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Accepting makes the sender a connection (so their posts show in the feed).
export async function acceptInvitation(invitationId) {
  const invitation = mockInvitations.find((item) => item.id === invitationId)
  if (!invitation) return
  write(KEYS.accepted, [...read(KEYS.accepted), invitation.personId])
  write(KEYS.handled, [...read(KEYS.handled), invitationId])
}

export async function ignoreInvitation(invitationId) {
  write(KEYS.handled, [...read(KEYS.handled), invitationId])
}
