// Squad matching: how well a person or a squad fits the student (POC "Squad Hub").
// Ranked by SKILL FIT and SCHEDULE FIT. Plain functions, like scoring.js, so they can be
// replaced by backend results later.

import { getSharedWithProfile, overlap } from "@/lib/scoring"

export const HOUR_OPTIONS = [3, 6, 10, 15, 20] // weekly hours a student can choose
export const MAX_SHOWN = 5 // leaders see up to 5 candidates, seekers see the top 5 squads

const SKILL_WEIGHT = 0.6
const SCHEDULE_WEIGHT = 0.4
const NO_SKILLS_FIT = 0.5 // when nothing is said about skills, neither a match nor a miss

// 1 when both have the same weekly hours, lower the further apart they are.
export function scheduleFit(hoursA, hoursB) {
  return Math.min(hoursA, hoursB) / Math.max(hoursA, hoursB)
}

function describeSchedule(theirHours, myHours) {
  if (theirHours === myHours) return `${theirHours} hrs/week, same as you`
  return `${theirHours} hrs/week (you: ${myHours})`
}

function toScore(skillFit, schedule) {
  return Math.round(100 * (SKILL_WEIGHT * skillFit + SCHEDULE_WEIGHT * schedule))
}

// A LEADER looks at people who want a team. Best fit = covers the skills the opportunity needs
// that the leader does not have, and has similar weekly hours.
// candidates: [{ person, hoursPerWeek, ... }] -> same items plus { score, reason }, best first, up to 5.
export function rankCandidates(candidates, opportunity, profile, myHours, limit = MAX_SHOWN) {
  const missing = opportunity.skills.filter((skill) => overlap([skill], profile.skills).length === 0)
  const wanted = missing.length > 0 ? missing : opportunity.skills

  return candidates
    .map((candidate) => {
      const covers = overlap(wanted, candidate.person.skills)
      // An opportunity that names no skills is neutral (half marks), not a miss.
      const skillFit = wanted.length > 0 ? covers.length / wanted.length : NO_SKILLS_FIT
      const schedule = scheduleFit(candidate.hoursPerWeek, myHours)
      const parts = [
        covers.length > 0 ? `Covers ${covers.join(", ")}` : wanted.length === 0 ? "No specific skills needed" : "No matching skills yet",
        describeSchedule(candidate.hoursPerWeek, myHours),
      ]
      return { ...candidate, score: toScore(skillFit, schedule), reason: parts.join(" · ") }
    })
    .sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name))
    .slice(0, limit)
}

// A SOLO SEEKER looks at squads with a free spot. Best fit = the skills the squad is looking for
// are skills the student has, and similar weekly hours.
// squads: [{ lookingForSkills, hoursPerWeek, members, capacity, ... }] -> same plus { score, reason }, top 5.
export function rankSquads(squads, profile, myHours, limit = MAX_SHOWN) {
  return squads
    // Full squads have no room, unless the student is already in it.
    .filter((squad) => squad.status === "mutual" || squad.members.length < squad.capacity)
    .map((squad) => {
      const mine = overlap(squad.lookingForSkills, profile.skills)
      const skillFit = squad.lookingForSkills.length > 0 ? mine.length / squad.lookingForSkills.length : NO_SKILLS_FIT
      const schedule = scheduleFit(squad.hoursPerWeek, myHours)
      const parts = [
        mine.length > 0
          ? `You have ${mine.join(", ")}`
          : squad.lookingForSkills.length === 0
            ? "No specific skills asked for"
            : "Needs skills you don't list yet",
        describeSchedule(squad.hoursPerWeek, myHours),
      ]
      return { ...squad, score: toScore(skillFit, schedule), reason: parts.join(" · ") }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// CONNECT MODE (workshops, courses): people who share your interests and skills. No schedule needed.
// attendees: [{ person, ... }] -> same plus { score, reason }, top 5.
export function rankAttendees(attendees, profile, limit = MAX_SHOWN) {
  return attendees
    .map((attendee) => {
      const shared = getSharedWithProfile(attendee.person, profile)
      return {
        ...attendee,
        score: Math.min(100, shared.length * 25),
        reason: shared.length > 0 ? `Shared: ${shared.join(", ")}` : "Also interested in this",
      }
    })
    .sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name))
    .slice(0, limit)
}
