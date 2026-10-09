// MOCK data for the Squad Hub. The people are invented (ids match mockPeople.js).
// Only used by src/api/squads.js while there is no backend. Delete once it is live.
//
// The demo candidates and squads are GENERATED for any opportunity (so they work for real, scraped
// opportunities too): the invented students who fit the opportunity best (shared interests and skills)
// become its candidates and squad members. The same opportunity always gets the same demo people.

import { mockPeople } from "@/data/mockPeople"
import { getTopics, overlap } from "@/lib/scoring"

// In the demo, a person you contact answers "yes" this many milliseconds later (unless they are in DECLINERS).
// A real backend works differently: the other student answers whenever they choose.
export const MOCK_RESPONSE_DELAY_MS = 4000
export const DECLINERS = ["u-10", "u-14"]

// Contact details. They are only handed out by the api AFTER both sides agreed (double opt-in).
// All addresses are invented and use example.com.
export const CONTACTS = {
  "u-1": "priya.nair@example.com",
  "u-2": "aarav.mehta@example.com",
  "u-3": "rohan.iyer@example.com",
  "u-4": "ananya.sharma@example.com",
  "u-5": "kabir.singh@example.com",
  "u-6": "meera.joshi@example.com",
  "u-7": "arjun.reddy@example.com",
  "u-8": "ishita.das@example.com",
  "u-9": "dev.patel@example.com",
  "u-10": "sana.khan@example.com",
  "u-11": "riya.kapoor@example.com",
  "u-12": "karan.malhotra@example.com",
  "u-13": "zoya.ahmed@example.com",
  "u-14": "nikhil.rao@example.com",
  "u-15": "tara.menon@example.com",
  "u-16": "vikram.choudhary@example.com",
}

const SEEKER_HOURS = [3, 6, 10, 15]
const SQUAD_HOURS = [6, 10, 15]

// A small repeatable number from a text, so the same opportunity always gets the same demo people.
function hashOf(text) {
  let hash = 0
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

// The demo students, best fit for this opportunity first (shared interests count double, then shared skills).
function rankedPeople(opportunity) {
  const topics = getTopics(opportunity)
  return mockPeople
    .map((person) => ({
      person,
      fit: overlap(person.interests, topics).length * 2 + overlap(person.skills, opportunity.skills ?? []).length,
      tiebreak: hashOf(`${opportunity.id}|${person.id}`),
    }))
    .sort((a, b) => b.fit - a.fit || a.tiebreak - b.tiebreak)
    .map((item) => item.person)
}

// Students who opted in as "looking for a team" for this opportunity, with their weekly hours.
export function getSeekers(opportunity) {
  return rankedPeople(opportunity)
    .slice(0, 6)
    .map((person) => ({
      personId: person.id,
      hoursPerWeek: SEEKER_HOURS[hashOf(`${opportunity.id}|h|${person.id}`) % SEEKER_HOURS.length],
    }))
}

// Existing squads looking for members. Capacity is the opportunity's maximum team size, and each
// demo squad has at least one free spot. memberIds includes the leader.
export function getSquads(opportunity) {
  const capacity = opportunity.teamSize?.max ?? 0
  if (capacity < 2) return []
  const pool = rankedPeople(opportunity).slice(5) // different people than the candidates above
  const extraMembers = Math.min(capacity - 2, 2)

  return [0, 1].map((index) => {
    const start = index * (1 + extraMembers)
    const members = pool.slice(start, start + 1 + extraMembers)
    const leader = members[0]
    const wanted = (opportunity.skills ?? []).filter((skill) => !leader.skills.includes(skill)).slice(0, 2)
    return {
      id: `s-${opportunity.id}-${index + 1}`,
      opportunityId: opportunity.id,
      leaderId: leader.id,
      memberIds: members.map((person) => person.id),
      lookingForSkills: wanted.length > 0 ? wanted : (opportunity.skills ?? []).slice(0, 2),
      hoursPerWeek: SQUAD_HOURS[hashOf(`${opportunity.id}|s|${index}`) % SQUAD_HOURS.length],
    }
  })
}
