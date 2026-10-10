import { useEffect, useState } from "react"
import { subscribeToChanges } from "@/api/realtime"
import { getMatches, getTeam, optIn, optOut, respondToRequest, sendRequest, withdrawRequest } from "@/api/squads"
import SquadCard from "@/components/SquadCard"
import SquadMatchRow from "@/components/SquadMatchRow"
import SquadOptIn from "@/components/SquadOptIn"
import SquadTeamBox from "@/components/SquadTeamBox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@/context/user-context"
import { formatTeamSize } from "@/lib/format"
import { MAX_SHOWN, rankAttendees, rankCandidates, rankSquads } from "@/lib/squadMatching"

const ROLE_LABELS = { leader: "Leading a team", seeker: "Looking for a team", connect: "Connecting" }

function fetchPanel(opportunityId) {
  return Promise.all([getMatches(opportunityId), getTeam(opportunityId)]).then(([matches, team]) => ({ matches, team }))
}

// The top 5, plus anything the student already acted on (so a pending request never disappears).
function topWithActive(allRanked) {
  return [...allRanked.slice(0, MAX_SHOWN), ...allRanked.slice(MAX_SHOWN).filter((item) => item.status !== "none")]
}

function SectionTitle({ children, note }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{children}</h2>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

// Everything for one opportunity in the Squad Hub: opting in, your team, and your best matches.
export default function SquadPanel({ opportunity, onOpen, onChange }) {
  const { user } = useUser()
  const { profile } = user
  const [data, setData] = useState(null) // null = still loading
  const [error, setError] = useState("")
  const isTeam = opportunity.teamSize !== null

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchPanel(opportunity.id)
        .then((result) => {
          if (!cancelled) setData(result)
        })
        .catch(() => {
          if (!cancelled) setError("Could not load this. Please try again.")
        })
    load()
    // Live updates: someone opts in, asks you, or answers your request.
    const stop = subscribeToChanges(["squad_optins", "squad_requests", "squad_members", "squads"], load)
    return () => {
      cancelled = true
      stop()
    }
  }, [opportunity.id])

  async function refresh() {
    setData(await fetchPanel(opportunity.id))
  }

  // Runs an action, then reloads. A failure (for example "This squad is already full") is shown to the student.
  async function run(action) {
    setError("")
    try {
      await action()
      await refresh()
    } catch (failure) {
      setError(failure.message || "Something went wrong. Please try again.")
      await refresh().catch(() => {})
    }
  }

  async function handleOptIn(role, hoursPerWeek) {
    await run(() => optIn({ opportunityId: opportunity.id, role, hoursPerWeek }))
    onChange()
  }

  async function handleOptOut() {
    await run(() => optOut(opportunity.id))
    onChange()
  }

  const handleSend = (targetId) => run(() => sendRequest(opportunity.id, targetId))
  const handleWithdraw = (targetId) => run(() => withdrawRequest(opportunity.id, targetId))
  const handleAccept = (requestId) => run(() => respondToRequest(requestId, true))
  const handleDecline = (requestId) => run(() => respondToRequest(requestId, false))

  const { matches, team } = data ?? {}

  return (
    <div className="space-y-4">
      {/* Which opportunity */}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium">{opportunity.title}</p>
            <p className="text-sm text-muted-foreground">
              {opportunity.organizer.name} · {isTeam ? `Teams of ${formatTeamSize(opportunity.teamSize)}` : "No teams: connect with others"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onOpen(opportunity.id)}>
            View opportunity
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {data === null ? (
        <p className="p-6 text-center text-sm text-muted-foreground">{error ? "" : "Loading..."}</p>
      ) : !matches ? (
        <SquadOptIn isTeam={isTeam} onSubmit={handleOptIn} />
      ) : (
        <>
          {/* Your choice */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{ROLE_LABELS[matches.role]}</Badge>
              {matches.hoursPerWeek && <span className="text-muted-foreground">{matches.hoursPerWeek} hrs/week</span>}
            </p>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={handleOptOut}>
              Opt out
            </Button>
          </div>

          {/* Leader: your team, then people who want a team */}
          {matches.role === "leader" && (
            <>
              {team && <SquadTeamBox opportunity={opportunity} team={team} />}
              <SectionTitle note="Ranked by skill fit and schedule fit. Invite up to fill your team.">
                Top candidates
              </SectionTitle>
              {matches.candidates.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No one has opted in for this yet. Students who look for a team for this opportunity will show up here.
                </p>
              ) : (
                topWithActive(rankCandidates(matches.candidates, opportunity, profile, matches.hoursPerWeek, Infinity)).map((item) => (
                  <SquadMatchRow
                    key={item.person.id}
                    item={item}
                    actionLabel="Invite"
                    doneLabel="Teammate"
                    disabled={team?.full}
                    onSend={handleSend}
                    onWithdraw={handleWithdraw}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))
              )}
            </>
          )}

          {/* Seeker: your squad if you joined one, then the best-fit squads */}
          {matches.role === "seeker" && (
            <>
              {team && <SquadTeamBox opportunity={opportunity} team={team} />}
              <SectionTitle note="Ranked by skill fit and schedule fit.">Best-fit squads</SectionTitle>
              {matches.squads.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No squads for this yet. Squads appear when a student opts in as a leader.
                </p>
              ) : (
                topWithActive(rankSquads(matches.squads, profile, matches.hoursPerWeek, Infinity)).map((squad) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    mySkills={profile.skills}
                    disabled={matches.squads.some(
                      (other) => (other.status === "pending" || other.status === "mutual") && other.id !== squad.id
                    )}
                    onSend={handleSend}
                    onWithdraw={handleWithdraw}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))
              )}
            </>
          )}

          {/* Connect mode: people interested in the same thing */}
          {matches.role === "connect" && (
            <>
              <SectionTitle note="People who share your interests and skills.">People to connect with</SectionTitle>
              {matches.attendees.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No one else has opted in to connect for this yet.
                </p>
              ) : (
                topWithActive(rankAttendees(matches.attendees, profile, Infinity)).map((item) => (
                  <SquadMatchRow
                    key={item.person.id}
                    item={item}
                    actionLabel="Connect"
                    doneLabel="Connected"
                    onSend={handleSend}
                    onWithdraw={handleWithdraw}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
