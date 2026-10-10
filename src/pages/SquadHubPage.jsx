import { useEffect, useState } from "react"
import { isDemoLogin } from "@/api/auth"
import { getOpportunities } from "@/api/opportunities"
import { getOptIns } from "@/api/squads"
import SquadPanel from "@/components/SquadPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isClosed } from "@/lib/ingestion"

const ROLE_LABELS = { leader: "Leader", seeker: "Seeker", connect: "Connect" }

// Find teammates for team opportunities, or connect with others for the rest.
// `selectedId` and `onSelect` live in App.jsx so Back from a profile returns to the same opportunity.
export default function SquadHubPage({ selectedId, onSelect, onOpen }) {
  const [opportunities, setOpportunities] = useState(null) // null = still loading
  const [optIns, setOptIns] = useState([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    Promise.all([getOpportunities(), getOptIns()])
      .then(([loadedOpportunities, loadedOptIns]) => {
        setOpportunities(loadedOpportunities)
        setOptIns(loadedOptIns)
      })
      .catch(() => setLoadError(true))
  }, [])

  async function reloadOptIns() {
    setOptIns(await getOptIns())
  }

  if (loadError) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Could not load the Squad Hub. Please try again.</p>
  }
  if (opportunities === null) return <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>

  const selected = opportunities.find((o) => o.id === selectedId)
  // Closed opportunities are not offered, except one that is already selected (for example from "Your squads").
  const choices = opportunities.filter((o) => !isClosed(o) || o.id === selectedId)
  const teamOpportunities = choices.filter((o) => o.teamSize !== null)
  const otherOpportunities = choices.filter((o) => o.teamSize === null)
  const mine = optIns.map((item) => ({ ...item, opportunity: opportunities.find((o) => o.id === item.opportunityId) })).filter((item) => item.opportunity)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Squad Hub</h1>
      {isDemoLogin ? (
        <p className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          This is the local demo login, so there are no other students. Sign in with Google to use the Squad Hub.
        </p>
      ) : (
        <p className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          You only see students who opted in for the same opportunity. Contact details are shared only after both of you agree.
        </p>
      )}

      {/* Where you already opted in */}
      {mine.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Your squads</p>
          <div className="flex flex-wrap gap-2">
            {mine.map(({ opportunityId, role, opportunity }) => (
              <Button
                key={opportunityId}
                size="sm"
                variant={opportunityId === selectedId ? "default" : "outline"}
                onClick={() => onSelect(opportunityId)}
              >
                {opportunity.title}
                <Badge variant="secondary" className="ml-1">
                  {ROLE_LABELS[role]}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Pick an opportunity */}
      <div className="space-y-2">
        <label htmlFor="squad-opportunity" className="text-sm font-medium">
          Find teammates for
        </label>
        <select
          id="squad-opportunity"
          value={selected ? selected.id : ""}
          onChange={(event) => onSelect(event.target.value || null)}
          className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Choose an opportunity</option>
          <optgroup label="Team up (hackathons, competitions)">
            {teamOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} · {o.organizer.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Connect (workshops, courses, internships)">
            {otherOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} · {o.organizer.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {selected ? (
        <SquadPanel key={selected.id} opportunity={selected} onOpen={onOpen} onChange={reloadOptIns} />
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Pick an opportunity to find teammates or connect with people.
        </p>
      )}
    </div>
  )
}
