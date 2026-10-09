import { CircleCheck, CircleX, ShieldCheck, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CATEGORIES } from "@/data/opportunities"
import { costLabel } from "@/lib/scoring"

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

// Shows one opportunity. `relevance`, `reason` and `eligibility` come from scoring.js
// so this component does not care where the numbers come from.
export default function OpportunityCard({ opportunity, relevance, reason, eligibility }) {
  const categoryLabel = CATEGORIES.find((c) => c.id === opportunity.category)?.label

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">{categoryLabel}</span>
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
        <CardTitle className="mt-1 text-base leading-snug">{opportunity.title}</CardTitle>
        <CardDescription>
          {formatDate(opportunity.deadline)} · {opportunity.location} · {costLabel(opportunity.fee)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${relevance}%` }} />
            </div>
            <span className="text-sm font-semibold tabular-nums">{relevance}%</span>
          </div>
          <p className="text-xs text-muted-foreground">{reason}</p>
        </div>

        {eligibility.qualified ? (
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <CircleCheck className="size-3.5" /> Qualified
          </p>
        ) : (
          <div className="text-xs">
            <p className="flex items-center gap-1.5 font-medium text-destructive">
              <CircleX className="size-3.5" /> Disqualified
            </p>
            <p className="mt-0.5 text-muted-foreground">{eligibility.reason}</p>
          </div>
        )}

        <Button className="mt-auto w-full" variant="outline">
          View
        </Button>
      </CardContent>
    </Card>
  )
}
