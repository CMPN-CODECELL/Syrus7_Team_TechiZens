// ============================================================================
// SWAP POINT: Squad Hub (owner: backend / Supabase teammate)
//
// Voluntary peer matching for an opportunity:
//   - LEADER   a student putting a team together: sees candidates who want a team.
//   - SEEKER   a solo student: sees existing squads with a free spot.
//   - CONNECT  lightweight mode for opportunities without teams (workshops, courses, internships):
//              sees other students interested in the same thing.
// Contacts are revealed ONLY after double opt-in: both students must agree. Until then `contact` is null.
// Nexus never applies to an opportunity for anyone, and never reads private LinkedIn data.
//
// Right now this is fake: data from src/data/mockSquads.js, the student's choices kept in
// localStorage, and in the demo the other student "agrees" a few seconds after being contacted
// (see MOCK_RESPONSE_DELAY_MS). To go live, replace each body with Supabase (opt-ins, requests and
// squads tables with Row Level Security; a person's contact must only be readable by someone they
// are mutual with). Ranking happens on the screen (src/lib/squadMatching.js), so return raw data.
//
// Shapes
//   OptIn:     { opportunityId, role: "leader" | "seeker" | "connect", hoursPerWeek }   hoursPerWeek is 3, 6, 10, 15 or 20 (null for connect)
//   status:    "none" | "pending" | "mutual"     pending = this student asked, the other has not agreed yet
//   Person:    as in people.js (never contact details). The student themself appears as { id: "me", name, college: null, year }
//   Candidate: { person, hoursPerWeek, status, contact }      leaders see these (contact is a string once status is "mutual", else null)
//   Squad:     { id, leader: Person, members: Person[], capacity, lookingForSkills, hoursPerWeek, status, contact }
//              members includes the leader (and the student once status is "mutual"); capacity = the opportunity's max team size;
//              status/contact are about the LEADER
//   Attendee:  { person, status, contact }                     connect mode
//   Matches:   { role, hoursPerWeek, candidates } | { role, hoursPerWeek, squads } | { role, hoursPerWeek, attendees }
//   Team:      { members: [{ person, isMe, contact }], capacity, full }   the student's team so far (leaders and seekers only)
// ============================================================================

import { getCurrentUser } from "@/api/auth"
import { getOpportunities } from "@/api/opportunities"
import { getPeopleByIds } from "@/api/people"
import { mockPeople } from "@/data/mockPeople"
import { CONTACTS, DECLINERS, MOCK_RESPONSE_DELAY_MS, SEEKERS, SQUADS } from "@/data/mockSquads"
import { overlap } from "@/lib/scoring"

const KEYS = {
  optIns: "nexus-squad-optins",
  requests: "nexus-squad-requests", // [{ opportunityId, targetId, at }]
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

// Demo only: a request becomes mutual a few seconds later, unless the person never answers.
function statusOf(opportunityId, targetId) {
  const request = read(KEYS.requests).find((r) => r.opportunityId === opportunityId && r.targetId === targetId)
  if (!request) return "none"
  const answered = Date.now() - request.at >= MOCK_RESPONSE_DELAY_MS
  return answered && !DECLINERS.includes(targetId) ? "mutual" : "pending"
}

// The contact is only handed out once both sides agreed.
function contactIf(status, personId) {
  return status === "mutual" ? CONTACTS[personId] ?? null : null
}

async function mePerson() {
  const user = await getCurrentUser()
  return { id: "me", name: user?.name ?? "You", college: null, year: user?.profile?.year ?? 2 }
}

async function findOpportunity(opportunityId) {
  return (await getOpportunities()).find((o) => o.id === opportunityId)
}

// ---- Opting in -------------------------------------------------------------

export async function getOptIns() {
  return read(KEYS.optIns)
}

// Saves the student's choice for one opportunity (replaces an earlier choice for it).
export async function optIn({ opportunityId, role, hoursPerWeek }) {
  const others = read(KEYS.optIns).filter((item) => item.opportunityId !== opportunityId)
  write(KEYS.optIns, [...others, { opportunityId, role, hoursPerWeek: role === "connect" ? null : hoursPerWeek }])
  write(KEYS.requests, read(KEYS.requests).filter((r) => r.opportunityId !== opportunityId))
}

// Leaves the Squad Hub for this opportunity (and cancels the student's requests for it).
export async function optOut(opportunityId) {
  write(KEYS.optIns, read(KEYS.optIns).filter((item) => item.opportunityId !== opportunityId))
  write(KEYS.requests, read(KEYS.requests).filter((r) => r.opportunityId !== opportunityId))
}

// ---- Matches ---------------------------------------------------------------

// Who the student can team up with for this opportunity, or null if they have not opted in.
export async function getMatches(opportunityId) {
  const choice = read(KEYS.optIns).find((item) => item.opportunityId === opportunityId)
  if (!choice) return null
  const opportunity = await findOpportunity(opportunityId)
  const base = { role: choice.role, hoursPerWeek: choice.hoursPerWeek }

  if (choice.role === "leader") {
    const seekers = SEEKERS[opportunityId] ?? []
    const people = await getPeopleByIds(seekers.map((s) => s.personId))
    return {
      ...base,
      candidates: seekers.map((seeker, index) => {
        const status = statusOf(opportunityId, seeker.personId)
        return { person: people[index], hoursPerWeek: seeker.hoursPerWeek, status, contact: contactIf(status, seeker.personId) }
      }),
    }
  }

  if (choice.role === "seeker") {
    const me = await mePerson()
    const squads = SQUADS.filter((squad) => squad.opportunityId === opportunityId)
    const squadsWithPeople = await Promise.all(
      squads.map(async (squad) => {
        const members = await getPeopleByIds(squad.memberIds)
        const status = statusOf(opportunityId, squad.leaderId)
        return {
          id: squad.id,
          leader: members.find((m) => m.id === squad.leaderId),
          members: status === "mutual" ? [...members, me] : members,
          capacity: opportunity.teamSize.max,
          lookingForSkills: squad.lookingForSkills,
          hoursPerWeek: squad.hoursPerWeek,
          status,
          contact: contactIf(status, squad.leaderId),
        }
      })
    )
    return { ...base, squads: squadsWithPeople }
  }

  // Connect mode: everyone with a shared interest.
  const everyone = await getPeopleByIds(mockPeople.map((p) => p.id))
  return {
    ...base,
    attendees: everyone
      .filter((person) => overlap(person.interests, opportunity.interests).length > 0)
      .map((person) => {
        const status = statusOf(opportunityId, person.id)
        return { person, status, contact: contactIf(status, person.id) }
      }),
  }
}

// The student's team so far, or null for connect mode / not opted in / not in a squad yet.
export async function getTeam(opportunityId) {
  const choice = read(KEYS.optIns).find((item) => item.opportunityId === opportunityId)
  if (!choice || choice.role === "connect") return null
  const opportunity = await findOpportunity(opportunityId)
  const capacity = opportunity.teamSize.max
  const me = await mePerson()

  if (choice.role === "leader") {
    const agreed = (SEEKERS[opportunityId] ?? []).filter((s) => statusOf(opportunityId, s.personId) === "mutual")
    const people = await getPeopleByIds(agreed.map((s) => s.personId))
    const members = [
      { person: me, isMe: true, contact: null },
      ...people.map((person) => ({ person, isMe: false, contact: CONTACTS[person.id] ?? null })),
    ].slice(0, capacity)
    return { members, capacity, full: members.length >= capacity }
  }

  // Seeker: the squad whose leader agreed.
  const squad = SQUADS.filter((s) => s.opportunityId === opportunityId).find(
    (s) => statusOf(opportunityId, s.leaderId) === "mutual"
  )
  if (!squad) return null
  const people = await getPeopleByIds(squad.memberIds)
  const members = [
    ...people.map((person) => ({
      person,
      isMe: false,
      // Only the leader agreed with this student, so only the leader's contact is shared.
      contact: person.id === squad.leaderId ? CONTACTS[person.id] ?? null : null,
    })),
    { person: me, isMe: true, contact: null },
  ]
  return { members, capacity, full: members.length >= capacity }
}

// ---- Asking and withdrawing ------------------------------------------------

// A leader invites a candidate, a seeker asks to join a squad (targetId = the squad's leader),
// or a student asks to connect (connect mode). A seeker can only have one open request per opportunity.
export async function sendRequest(opportunityId, targetId) {
  const choice = read(KEYS.optIns).find((item) => item.opportunityId === opportunityId)
  const requests = read(KEYS.requests).filter(
    (r) => !(r.opportunityId === opportunityId && (choice?.role === "seeker" || r.targetId === targetId))
  )
  write(KEYS.requests, [...requests, { opportunityId, targetId, at: Date.now() }])
}

export async function withdrawRequest(opportunityId, targetId) {
  write(KEYS.requests, read(KEYS.requests).filter((r) => !(r.opportunityId === opportunityId && r.targetId === targetId)))
}
