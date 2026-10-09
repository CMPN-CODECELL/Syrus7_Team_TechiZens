import { useEffect, useRef, useState } from "react"
import { getMatches, getTeam, optIn, optOut, sendRequest, withdrawRequest } from "@/api/squads"
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

// In the demo the other student agrees a few seconds after being asked, so look again then.
// A real backend would push the change instead (realtime listener).
const DEMO_RECHECK_MS = 4500

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
  const timer = useRef(null)
  const isTeam = opportunity.teamSize !== null

  useEffect(() => {
    let cancelled = false
    fetchPanel(opportunity.id).then((result) => {
      if (!cancelled) setData(result)
    })
    return () => {
      cancelled = true
      clearTimeout(timer.current)
    }
  }, [opportunity.id])

  async function refresh() {
    setData(await fetchPanel(opportunity.id))
  }

  async function handleOptIn(role, hoursPerWeek) {
    await optIn({ opportunityId: opportunity.id, role, hoursPerWeek })
    await refresh()
    onChange()
  }

  async function handleOptOut() {
    await optOut(opportunity.id)
    clearTimeout(timer.current)
    await refresh()
    onChange()
  }

  async function handleSend(targetId) {
    await sendRequest(opportunity.id, targetId)
    await refresh()
    clearTimeout(timer.current)
    timer.current = setTimeout(refresh, DEMO_RECHECK_MS)
  }

  async function handleWithdraw(targetId) {
    await withdrawRequest(opportunity.id, targetId)
    await refresh()
  }

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

      {data === null ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Loading...</p>
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
                  No one has opted in for this yet.
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
                  No squads for this yet.
                </p>
              ) : (
                topWithActive(rankSquads(matches.squads, profile, matches.hoursPerWeek, Infinity)).map((squad) => (
                  <SquadCard
                    key={squad.id}
                    squad={squad}
                    mySkills={profile.skills}
                    disabled={matches.squads.some((other) => other.status !== "none" && other.id !== squad.id)}
                    onSend={handleSend}
                    onWithdraw={handleWithdraw}
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
                  No one has opted in for this yet.
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
