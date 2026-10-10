// ============================================================================
// Squad Hub (Supabase: squad_optins, squads, squad_members and squad_requests, see 0011).
//
// Voluntary peer matching for an opportunity:
//   - LEADER   a student putting a team together: sees candidates who want a team.
//   - SEEKER   a solo student: sees existing squads with a free spot.
//   - CONNECT  lightweight mode for opportunities without teams (workshops, courses, internships):
//              sees other students who opted in to connect.
// Contacts are revealed ONLY after double opt-in: both students must agree (get_contact in the database
// checks it). Until then `contact` is null. Nexus never applies to an opportunity for anyone, and never
// reads private LinkedIn data. Students only see each other's opt-ins for opportunities they opted in to.
// Without a real sign-in (the local demo login) nothing is shown and actions throw.
// Ranking happens on the screen (src/lib/squadMatching.js), so this returns raw data.
//
// Shapes
//   OptIn:     { opportunityId, role: "leader" | "seeker" | "connect", hoursPerWeek }   hoursPerWeek is 3, 6, 10, 15 or 20 (null for connect)
//   status:    "none" | "pending" | "incoming" | "mutual"
//              pending = this student asked, the other has not agreed yet (also shown after a decline, on purpose)
//              incoming = the other student asked this student, who can accept or decline (requestId is set)
//   Person:    as in people.js (never contact details). The student themself has the id "me".
//   Candidate: { person, hoursPerWeek, status, requestId, contact }   leaders see these (contact is a string once status is "mutual", else null)
//   Squad:     { id, leader: Person, members: Person[], capacity, lookingForSkills, hoursPerWeek, status, requestId, contact }
//              members includes the leader (and the student once status is "mutual"); capacity = the opportunity's max team size;
//              status/requestId/contact are about the LEADER
//   Attendee:  { person, status, requestId, contact }                connect mode
//   Matches:   { role, hoursPerWeek, candidates } | { role, hoursPerWeek, squads } | { role, hoursPerWeek, attendees }
//   Team:      { members: [{ person, isMe, contact }], capacity, full }   the student's team so far (leaders and seekers only)
// ============================================================================

import { getCurrentUser } from "@/api/auth"
import { getOpportunities } from "@/api/opportunities"
import { getPeopleByIds } from "@/api/people"
import { getUserId, realId, requireUserId, unwrap } from "@/api/shared"
import { overlap } from "@/lib/scoring"
import { supabase } from "@/lib/supabase"

const MAX_SKILLS_ASKED = 6

async function findOpportunity(opportunityId) {
  return (await getOpportunities()).find((o) => o.id === opportunityId)
}

async function myOptIn(myId, opportunityId) {
  return unwrap(
    await supabase
      .from("squad_optins")
      .select("role, hours_per_week")
      .eq("user_id", myId)
      .eq("opportunity_id", opportunityId)
      .maybeSingle()
  )
}

// All requests for this opportunity that involve the student (RLS only returns those).
async function loadRequests(opportunityId) {
  return unwrap(
    await supabase.from("squad_requests").select("id, requester_id, target_id, status").eq("opportunity_id", opportunityId)
  )
}

// How the student and one other person stand for this opportunity, looking at requests in both directions.
function standing(requests, myId, otherId) {
  const between = requests.filter(
    (r) => (r.requester_id === myId && r.target_id === otherId) || (r.requester_id === otherId && r.target_id === myId)
  )
  const accepted = between.find((r) => r.status === "accepted")
  if (accepted) return { status: "mutual", requestId: accepted.id }
  const incoming = between.find((r) => r.target_id === myId && r.status === "pending")
  if (incoming) return { status: "incoming", requestId: incoming.id }
  if (between.some((r) => r.requester_id === myId)) return { status: "pending", requestId: null }
  return { status: "none", requestId: null }
}

// The other student's contact, or null unless both agreed (the database decides, not this code).
async function contactFor(status, otherId, opportunityId) {
  if (status !== "mutual") return null
  const { data } = await supabase.rpc("get_contact", { p_other: otherId, p_opportunity: opportunityId })
  return data ?? null
}

// ---- Opting in -------------------------------------------------------------

export async function getOptIns() {
  const myId = await getUserId()
  if (!myId) return []
  const rows = unwrap(await supabase.from("squad_optins").select("opportunity_id, role, hours_per_week").eq("user_id", myId))
  return rows.map((row) => ({ opportunityId: row.opportunity_id, role: row.role, hoursPerWeek: row.hours_per_week }))
}

// Takes the student out of any squad for this opportunity (their own squad is deleted, which removes its members).
async function leaveEverything(myId, opportunityId) {
  unwrap(
    await supabase
      .from("squad_requests")
      .delete()
      .eq("opportunity_id", opportunityId)
      .eq("requester_id", myId)
      .eq("status", "pending")
  )
  const squads = unwrap(await supabase.from("squads").select("id, leader_id").eq("opportunity_id", opportunityId))
  const mine = squads.filter((squad) => squad.leader_id === myId).map((squad) => squad.id)
  if (mine.length > 0) unwrap(await supabase.from("squads").delete().in("id", mine))
  const joined = squads.filter((squad) => squad.leader_id !== myId).map((squad) => squad.id)
  if (joined.length > 0) unwrap(await supabase.from("squad_members").delete().in("squad_id", joined).eq("user_id", myId))
}

// Saves the student's choice for one opportunity (replaces an earlier choice for it).
// Changing the role starts fresh: open requests are cancelled and the student leaves their squad.
export async function optIn({ opportunityId, role, hoursPerWeek }) {
  const myId = await requireUserId()
  const previous = await myOptIn(myId, opportunityId)
  if (previous && previous.role !== role) await leaveEverything(myId, opportunityId)

  unwrap(
    await supabase.from("squad_optins").upsert(
      { user_id: myId, opportunity_id: opportunityId, role, hours_per_week: role === "connect" ? null : hoursPerWeek },
      { onConflict: "user_id,opportunity_id" }
    )
  )

  // A leader's squad is created by the database. Tell others which skills it still needs:
  // the skills the opportunity asks for that the leader does not have.
  if (role === "leader") {
    const [opportunity, user] = await Promise.all([findOpportunity(opportunityId), getCurrentUser()])
    const have = user?.profile?.skills ?? []
    const missing = (opportunity?.skills ?? []).filter((skill) => overlap([skill], have).length === 0)
    unwrap(
      await supabase
        .from("squads")
        .update({ looking_for_skills: missing.slice(0, MAX_SKILLS_ASKED) })
        .eq("opportunity_id", opportunityId)
        .eq("leader_id", myId)
    )
  }
}

// Leaves the Squad Hub for this opportunity (cancels the student's requests and takes them out of their squad).
export async function optOut(opportunityId) {
  const myId = await requireUserId()
  await leaveEverything(myId, opportunityId)
  unwrap(await supabase.from("squad_optins").delete().eq("user_id", myId).eq("opportunity_id", opportunityId))
}

// ---- Matches ---------------------------------------------------------------

// Who the student can team up with for this opportunity, or null if they have not opted in.
export async function getMatches(opportunityId) {
  const myId = await getUserId()
  if (!myId) return null
  const mine = await myOptIn(myId, opportunityId)
  if (!mine) return null
  const opportunity = await findOpportunity(opportunityId)
  if (!opportunity) return null // the opportunity is no longer listed
  const base = { role: mine.role, hoursPerWeek: mine.hours_per_week }
  const requests = await loadRequests(opportunityId)

  if (mine.role === "leader") {
    const seekers = unwrap(
      await supabase
        .from("squad_optins")
        .select("user_id, hours_per_week")
        .eq("opportunity_id", opportunityId)
        .eq("role", "seeker")
    )
    const people = await getPeopleByIds(seekers.map((s) => s.user_id))
    const candidates = await Promise.all(
      seekers.map(async (seeker) => {
        const person = people.find((p) => realId(p.id, myId) === seeker.user_id)
        if (!person) return null // not shown (for example a student in school)
        const { status, requestId } = standing(requests, myId, seeker.user_id)
        return {
          person,
          hoursPerWeek: seeker.hours_per_week,
          status,
          requestId,
          contact: await contactFor(status, seeker.user_id, opportunityId),
        }
      })
    )
    return { ...base, candidates: candidates.filter(Boolean) }
  }

  if (mine.role === "seeker") {
    const rows = unwrap(
      await supabase
        .from("squads")
        .select("id, leader_id, looking_for_skills, hours_per_week, squad_members(user_id)")
        .eq("opportunity_id", opportunityId)
    )
    const people = await getPeopleByIds(rows.flatMap((row) => [row.leader_id, ...row.squad_members.map((m) => m.user_id)]))
    const personOf = (userId) => people.find((p) => realId(p.id, myId) === userId)
    const squads = await Promise.all(
      rows.map(async (row) => {
        const leader = personOf(row.leader_id)
        if (!leader) return null
        const { status, requestId } = standing(requests, myId, row.leader_id)
        return {
          id: row.id,
          leader,
          members: row.squad_members.map((m) => personOf(m.user_id)).filter(Boolean),
          capacity: opportunity.teamSize?.max ?? 2,
          lookingForSkills: row.looking_for_skills ?? [],
          hoursPerWeek: row.hours_per_week,
          status,
          requestId,
          contact: await contactFor(status, row.leader_id, opportunityId),
        }
      })
    )
    return { ...base, squads: squads.filter(Boolean) }
  }

  // Connect mode: everyone else who opted in to connect for this opportunity.
  const others = unwrap(
    await supabase
      .from("squad_optins")
      .select("user_id")
      .eq("opportunity_id", opportunityId)
      .eq("role", "connect")
      .neq("user_id", myId)
  )
  const people = await getPeopleByIds(others.map((o) => o.user_id))
  const attendees = await Promise.all(
    people.map(async (person) => {
      const { status, requestId } = standing(requests, myId, person.id)
      return { person, status, requestId, contact: await contactFor(status, person.id, opportunityId) }
    })
  )
  return { ...base, attendees }
}

// The id of the squad the student leads, or the one they joined (null if none).
async function findMySquadId(myId, role, opportunityId) {
  if (role === "leader") {
    const squad = unwrap(
      await supabase.from("squads").select("id").eq("opportunity_id", opportunityId).eq("leader_id", myId).maybeSingle()
    )
    return squad?.id ?? null
  }
  const joined = unwrap(
    await supabase
      .from("squad_members")
      .select("squad_id, squads!inner(opportunity_id)")
      .eq("user_id", myId)
      .eq("squads.opportunity_id", opportunityId)
  )
  return joined[0]?.squad_id ?? null
}

// The student's team so far, or null for connect mode / not opted in / not in a squad yet.
export async function getTeam(opportunityId) {
  const myId = await getUserId()
  if (!myId) return null
  const mine = await myOptIn(myId, opportunityId)
  if (!mine || mine.role === "connect") return null
  const opportunity = await findOpportunity(opportunityId)
  if (!opportunity) return null
  const capacity = opportunity.teamSize?.max ?? 2

  const squadId = await findMySquadId(myId, mine.role, opportunityId)
  if (!squadId) return null

  const memberRows = unwrap(
    await supabase.from("squad_members").select("user_id, joined_at").eq("squad_id", squadId).order("joined_at", { ascending: true })
  )
  const people = await getPeopleByIds(memberRows.map((m) => m.user_id))
  const members = await Promise.all(
    memberRows.map(async (row) => {
      const person = people.find((p) => realId(p.id, myId) === row.user_id)
      if (!person) return null
      const isMe = row.user_id === myId
      // Only people who agreed with this student have a contact (the database checks).
      return { person, isMe, contact: isMe ? null : await contactFor("mutual", row.user_id, opportunityId) }
    })
  )
  const shown = members.filter(Boolean)
  return { members: shown, capacity, full: shown.length >= capacity }
}

// ---- Asking, answering and withdrawing -------------------------------------

// A leader invites a candidate, a seeker asks to join a squad (targetId = the squad's leader),
// or a student asks to connect (connect mode). A seeker can only have one open request per opportunity.
export async function sendRequest(opportunityId, targetId) {
  const myId = await requireUserId()
  const mine = await myOptIn(myId, opportunityId)
  if (mine?.role === "seeker") {
    unwrap(
      await supabase
        .from("squad_requests")
        .delete()
        .eq("opportunity_id", opportunityId)
        .eq("requester_id", myId)
        .eq("status", "pending")
    )
  }
  const { error } = await supabase
    .from("squad_requests")
    .insert({ opportunity_id: opportunityId, requester_id: myId, target_id: targetId })
  if (error && error.code !== "23505") throw new Error(error.message) // 23505: already asked
}

export async function withdrawRequest(opportunityId, targetId) {
  const myId = await requireUserId()
  unwrap(
    await supabase
      .from("squad_requests")
      .delete()
      .eq("opportunity_id", opportunityId)
      .eq("requester_id", myId)
      .eq("target_id", targetId)
      .eq("status", "pending")
  )
}

// The student answers a request somebody sent them. Accepting shares both contacts (and, in a squad,
// adds the member). Throws with a plain message if the squad is already full.
export async function respondToRequest(requestId, accept) {
  await requireUserId()
  unwrap(await supabase.rpc("respond_to_squad_request", { p_request: requestId, p_accept: accept }))
}
