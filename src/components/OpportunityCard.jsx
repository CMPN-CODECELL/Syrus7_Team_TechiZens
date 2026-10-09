import { CircleCheck, CircleX, ShieldCheck, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import OrganizerLogo from "@/components/OrganizerLogo"
import { CATEGORIES } from "@/data/constants"
import { formatDate } from "@/lib/format"
import { costLabel } from "@/lib/scoring"
import { cn } from "@/lib/utils"

// One small labelled value in the facts row.
function Fact({ label, value }) {
  return (
    <div className="px-3 py-3 first:pl-5 last:pr-5">
      <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  )
}

// Shows one opportunity. `relevance`, `reason` and `eligibility` come from scoring.js
// so this component does not care where the numbers come from.
// The card has 5 rows (top, title, facts, notes, footer). It uses a CSS subgrid so each row
// lines up with the same row in neighbouring cards. See the grid in DiscoverPage.
export default function OpportunityCard({ opportunity, relevance, reason, eligibility, onOpen }) {
  const categoryLabel = CATEGORIES.find((c) => c.id === opportunity.category)?.singular

  return (
    <Card className="row-span-5 mb-4 grid grid-cols-[minmax(0,1fr)] grid-rows-subgrid gap-0 py-0">
      {/* Top: organizer, relevance, trust */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <OrganizerLogo name={opportunity.organizer.name} logo={opportunity.organizer.logo} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium" title={opportunity.organizer.name}>
              {opportunity.organizer.name}
            </p>
            <p className="text-xs text-muted-foreground">{categoryLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="outline" title="Relevance to you" className="tabular-nums">
            {relevance}%
          </Badge>
          {opportunity.verified ? (
            <Badge variant="secondary">
              <ShieldCheck data-icon="inline-start" /> Verified
            </Badge>
          ) : (
            <Badge variant="destructive">
              <TriangleAlert data-icon="inline-start" /> Check details
            </Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="line-clamp-2 px-5 pt-3 pb-4 text-lg leading-snug font-semibold">
        {opportunity.title}
      </h3>

      {/* Facts: three equal columns */}
      <div className="grid grid-cols-3 divide-x border-y">
        <Fact label="Deadline" value={formatDate(opportunity.deadline)} />
        <Fact label="Where" value={opportunity.location} />
        <Fact label="Fee" value={costLabel(opportunity.fee)} />
      </div>

      {/* Why it matches; a not-eligible reason is added only when needed */}
      <div className="space-y-0.5 px-5 pt-4 text-xs leading-4">
        <p className="line-clamp-2 text-muted-foreground">{reason}</p>
        {!eligibility.qualified && <p className="text-destructive">{eligibility.reason}</p>}
      </div>

      {/* Eligibility status and action share one row */}
      <div className="flex items-center gap-2 px-5 pt-3 pb-5">
        <span
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium",
            eligibility.qualified ? "text-foreground" : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {eligibility.qualified ? (
            <>
              <CircleCheck className="size-3.5" /> Eligible
            </>
          ) : (
            <>
              <CircleX className="size-3.5" /> Not eligible
            </>
          )}
        </span>
        <Button className="flex-1" variant="outline" onClick={() => onOpen(opportunity.id)}>
          View
        </Button>
      </div>
    </Card>
  )
}
